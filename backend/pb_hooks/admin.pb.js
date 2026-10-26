/// <reference path="../pb_data/types.d.ts" />
// Admin panel API. See docs/superpowers/specs/2026-10-26-admin-panel-design.md.
// Every handler requires lib/admin.js itself: hook handlers run in isolated VMs.

// Migrations run after bootstrap, so the setup token is created once the web server starts.
onBootstrap((e) => {
  e.next()
  e.app.onServe().bindFunc((se) => {
    require(`${__hooks}/lib/admin.js`).ensureSetupToken(se.app)
    return se.next()
  })
})

// ---- public ----

routerAdd('GET', '/api/lapak/{slug}', (e) => {
  const L = require(`${__hooks}/lib/admin.js`)
  const slug = e.request.pathValue('slug')
  if (!L.validSlug(slug)) throw L.fail(404, 'Lapak tidak ditemukan.')
  let ws
  try {
    ws = e.app.findFirstRecordByData('workspaces', 'slug', slug)
  } catch (_) {
    throw L.fail(404, 'Lapak tidak ditemukan.')
  }
  const user = L.ownerOf(e.app, ws.id)
  if (!user) throw L.fail(404, 'Lapak tidak ditemukan.')
  return e.json(200, { name: ws.getString('name'), slug, email: user.email() })
})

routerAdd('GET', '/api/admin/setup', (e) => {
  return e.json(200, { needed: e.app.countRecords('admins') === 0 })
})

routerAdd('POST', '/api/admin/setup', (e) => {
  const L = require(`${__hooks}/lib/admin.js`)
  const { token, email, password } = L.body(e)
  if (e.app.countRecords('admins') > 0) throw L.fail(403, 'Admin sudah dibuat. Silakan masuk.')
  const rows = e.app.findAllRecords('admin_setup')
  const row = rows[0]
  const ok =
    row &&
    typeof token === 'string' &&
    $security.equal($security.sha256(token), row.getString('token_hash')) &&
    new Date(row.getString('expires')).getTime() > Date.now()
  if (!ok) throw L.fail(403, 'Link setup tidak valid atau kedaluwarsa. Restart server untuk link baru.')
  if (typeof password !== 'string' || password.length < 12) throw L.fail(400, 'Password minimal 12 karakter.')

  e.app.runInTransaction((tx) => {
    const admin = new Record(tx.findCollectionByNameOrId('admins'))
    admin.setEmail(String(email || '').trim().toLowerCase())
    admin.setPassword(password)
    admin.setVerified(true)
    tx.save(admin)
    for (const r of tx.findAllRecords('admin_setup')) tx.delete(r)
  })
  L.audit(e, 'setup', email)
  return e.json(201, { ok: true })
})

// ---- admin only ----

routerAdd(
  'GET',
  '/api/admin/lapak',
  (e) => {
    const L = require(`${__hooks}/lib/admin.js`)
    const items = e.app.findRecordsByFilter('workspaces', '', 'name', 0, 0).map((ws) => L.lapakJson(e.app, ws))
    return e.json(200, { items })
  },
  $apis.requireAuth('admins'),
)

routerAdd(
  'POST',
  '/api/admin/lapak',
  (e) => {
    const L = require(`${__hooks}/lib/admin.js`)
    const b = L.body(e)
    const name = String(b.name || '').trim()
    const slug = String(b.slug || '').trim()
    if (!name) throw L.fail(400, 'Nama lapak wajib diisi.')
    if (!L.validSlug(slug)) throw L.fail(400, 'Link hanya huruf kecil, angka dan tanda minus (3–40 karakter).')
    L.checkPasscode(b.passcode)
    try {
      e.app.findFirstRecordByData('workspaces', 'slug', slug)
      throw L.fail(400, 'Link sudah dipakai lapak lain.')
    } catch (err) {
      if (err instanceof ApiError) throw err
    }

    let ws
    e.app.runInTransaction((tx) => {
      ws = new Record(tx.findCollectionByNameOrId('workspaces'))
      ws.set('name', name)
      ws.set('slug', slug)
      tx.save(ws)

      const user = new Record(tx.findCollectionByNameOrId('users'))
      user.setEmail(L.groupEmail(slug))
      user.setPassword(b.passcode)
      user.setVerified(true)
      user.set('name', name)
      tx.save(user)

      const m = new Record(tx.findCollectionByNameOrId('memberships'))
      m.set('workspace', ws.id)
      m.set('user', user.id)
      m.set('role', 'owner')
      tx.save(m)
    })
    L.audit(e, 'lapak.create', slug)
    return e.json(201, L.lapakJson(e.app, ws))
  },
  $apis.requireAuth('admins'),
)

routerAdd(
  'PATCH',
  '/api/admin/lapak/{id}',
  (e) => {
    const L = require(`${__hooks}/lib/admin.js`)
    const ws = L.findLapak(e.app, e.request.pathValue('id'))
    const name = String(L.body(e).name || '').trim()
    if (!name) throw L.fail(400, 'Nama lapak wajib diisi.')
    ws.set('name', name)
    e.app.save(ws)
    L.audit(e, 'lapak.rename', ws.getString('slug'))
    return e.json(200, L.lapakJson(e.app, ws))
  },
  $apis.requireAuth('admins'),
)

routerAdd(
  'POST',
  '/api/admin/lapak/{id}/passcode',
  (e) => {
    const L = require(`${__hooks}/lib/admin.js`)
    const ws = L.findLapak(e.app, e.request.pathValue('id'))
    const passcode = L.body(e).passcode
    L.checkPasscode(passcode)
    const user = L.ownerOf(e.app, ws.id)
    if (!user) throw L.fail(404, 'User lapak tidak ditemukan.')
    user.setPassword(passcode) // also rotates tokenKey: every device of this lapak is signed out
    e.app.save(user)
    L.audit(e, 'lapak.passcode', ws.getString('slug'))
    return e.json(200, { ok: true })
  },
  $apis.requireAuth('admins'),
)

routerAdd(
  'POST',
  '/api/admin/lapak/{id}/clear',
  (e) => {
    const L = require(`${__hooks}/lib/admin.js`)
    const ws = L.findLapak(e.app, e.request.pathValue('id'))
    L.requireConfirm(e, ws.getString('slug'))
    const backup = L.backupBefore(e.app, 'clear')
    e.app.runInTransaction((tx) => {
      // Payments cascade from events.
      for (const r of tx.findRecordsByFilter('events', 'workspace = {:ws}', '', 0, 0, { ws: ws.id })) tx.delete(r)
      for (const r of tx.findRecordsByFilter('contacts', 'workspace = {:ws}', '', 0, 0, { ws: ws.id })) tx.delete(r)
    })
    L.audit(e, 'lapak.clear', ws.getString('slug'))
    return e.json(200, { ...L.lapakJson(e.app, ws), backup })
  },
  $apis.requireAuth('admins'),
)

routerAdd(
  'DELETE',
  '/api/admin/lapak/{id}',
  (e) => {
    const L = require(`${__hooks}/lib/admin.js`)
    const ws = L.findLapak(e.app, e.request.pathValue('id'))
    const slug = ws.getString('slug')
    L.requireConfirm(e, slug)
    const backup = L.backupBefore(e.app, 'delete')
    e.app.runInTransaction((tx) => {
      const members = tx.findRecordsByFilter('memberships', 'workspace = {:ws}', '', 0, 0, { ws: ws.id })
      const userIds = members.map((m) => m.getString('user'))
      for (const r of tx.findRecordsByFilter('events', 'workspace = {:ws}', '', 0, 0, { ws: ws.id })) tx.delete(r)
      tx.delete(tx.findRecordById('workspaces', ws.id)) // cascades memberships + contacts
      for (const id of userIds) {
        const stillMember = tx.countRecords('memberships', $dbx.hashExp({ user: id }))
        if (!stillMember) tx.delete(tx.findRecordById('users', id))
      }
    })
    L.audit(e, 'lapak.delete', slug)
    return e.json(200, { ok: true, backup })
  },
  $apis.requireAuth('admins'),
)

routerAdd(
  'GET',
  '/api/admin/backups',
  (e) => {
    const fsys = e.app.newBackupsFilesystem()
    try {
      const items = fsys
        .list('')
        .map((f) => ({ name: f.key, size: f.size, modified: new Date(f.modTime.unixMilli()).toISOString() }))
        .sort((a, b) => (a.modified < b.modified ? 1 : -1))
      return e.json(200, { items, canRestore: $os.getenv('OS') !== 'Windows_NT' })
    } finally {
      fsys.close()
    }
  },
  $apis.requireAuth('admins'),
)

routerAdd(
  'POST',
  '/api/admin/backups',
  (e) => {
    const L = require(`${__hooks}/lib/admin.js`)
    const name = L.backupBefore(e.app, 'manual')
    L.audit(e, 'backup.create', name)
    return e.json(201, { name })
  },
  $apis.requireAuth('admins'),
)

routerAdd(
  'POST',
  '/api/admin/backups/{name}/restore',
  (e) => {
    const L = require(`${__hooks}/lib/admin.js`)
    const name = e.request.pathValue('name')
    if (!/^[a-z0-9_@.-]+\.zip$/i.test(name)) throw L.fail(400, 'Nama backup tidak valid.')
    L.requireConfirm(e, 'pulihkan')
    if ($os.getenv('OS') === 'Windows_NT') throw L.fail(400, 'Pulihkan backup hanya bisa di server Linux (VPS).')
    const fsys = e.app.newBackupsFilesystem()
    let exists = false
    try {
      exists = fsys.exists(name)
    } finally {
      fsys.close()
    }
    if (!exists) throw L.fail(404, 'Backup tidak ditemukan.')
    L.backupBefore(e.app, 'restore')
    L.audit(e, 'backup.restore', name)
    // On success PocketBase restarts the process, so the client may get no response: it polls /api/health.
    e.app.restoreBackup(new Context(), name)
    return e.json(202, { ok: true })
  },
  $apis.requireAuth('admins'),
)

