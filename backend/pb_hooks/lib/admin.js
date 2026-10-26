// Shared helpers for admin.pb.js. Each hook handler runs in its own VM, so handlers `require` this file.

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const SETUP_TTL_MS = 24 * 60 * 60 * 1000
const PRE_BACKUPS_KEEP = 10

function fail(status, message) {
  return new ApiError(status, message, {})
}

function body(e) {
  return e.requestInfo().body || {}
}

function groupEmail(slug) {
  return `lapak-${slug}@bazar.local`
}

function validSlug(slug) {
  return typeof slug === 'string' && slug.length >= 3 && slug.length <= 40 && SLUG_RE.test(slug)
}

function checkPasscode(passcode) {
  if (typeof passcode !== 'string' || passcode.length < 6) throw fail(400, 'Kode akses minimal 6 karakter.')
}

/** The group user (owner membership) of a workspace, or null. */
function ownerOf(app, wsId) {
  const m = app.findRecordsByFilter('memberships', 'workspace = {:ws} && role = "owner"', '', 1, 0, { ws: wsId })
  return m.length ? app.findRecordById('users', m[0].getString('user')) : null
}

function lapakJson(app, ws) {
  const id = ws.id
  return {
    id,
    name: ws.getString('name'),
    slug: ws.getString('slug'),
    created: ws.getString('created'),
    events: app.countRecords('events', $dbx.hashExp({ workspace: id })),
    contacts: app.countRecords('contacts', $dbx.hashExp({ workspace: id })),
  }
}

function findLapak(app, id) {
  try {
    return app.findRecordById('workspaces', id)
  } catch (_) {
    throw fail(404, 'Lapak tidak ditemukan.')
  }
}

function requireConfirm(e, expected) {
  if (body(e).confirm !== expected) throw fail(403, 'Konfirmasi tidak cocok.')
}

/** Backup before a destructive action; keeps only the newest PRE_BACKUPS_KEEP `pre-*` files. */
function backupBefore(app, action) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*$/, '').replace('T', '-').toLowerCase()
  const name = `pre-${action}-${stamp}.zip`
  app.createBackup(new Context(), name)

  const fsys = app.newBackupsFilesystem()
  try {
    const pre = fsys
      .list('')
      .filter((f) => f.key.startsWith('pre-'))
      .sort((a, b) => (a.key < b.key ? 1 : -1))
    for (const f of pre.slice(PRE_BACKUPS_KEEP)) fsys.delete(f.key)
  } finally {
    fsys.close()
  }
  return name
}

function audit(e, action, detail) {
  const who = e.auth ? e.auth.getString('email') : 'anon'
  e.app.logger().info('admin: ' + action, 'admin', who, 'detail', detail || '')
}

/** Ensure a fresh setup token exists while there is no admin. Logs the setup link. */
function ensureSetupToken(app) {
  if (app.countRecords('admins') > 0) return
  const col = app.findCollectionByNameOrId('admin_setup')
  for (const r of app.findAllRecords('admin_setup')) app.delete(r)
  const token = $security.randomString(40)
  const rec = new Record(col)
  rec.set('token_hash', $security.sha256(token))
  rec.set('expires', new Date(Date.now() + SETUP_TTL_MS).toISOString())
  app.save(rec)
  const base = app.settings().meta.appURL || 'http://127.0.0.1:8090'
  const url = `${base.replace(/\/$/, '')}/admin/setup?token=${token}`
  console.log('\n==> Belum ada admin. Buka link ini untuk membuat akun admin (berlaku 24 jam, sekali pakai):\n    ' + url + '\n')
}

module.exports = {
  fail,
  body,
  groupEmail,
  validSlug,
  checkPasscode,
  ownerOf,
  lapakJson,
  findLapak,
  requireConfirm,
  backupBefore,
  audit,
  ensureSetupToken,
}
