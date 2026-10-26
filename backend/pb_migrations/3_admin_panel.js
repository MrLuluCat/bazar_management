/// <reference path="../pb_data/types.d.ts" />
// Admin panel: workspaces.slug (link per lapak), `admins` auth collection, one-time setup token.
// See docs/superpowers/specs/2026-10-26-admin-panel-design.md.

const SLUG_PATTERN = '^[a-z0-9]+(-[a-z0-9]+)*$'

function slugify(name) {
  const s = String(name || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
  return s.length >= 3 ? s : 'lapak'
}

migrate(
  (app) => {
    // 1. workspaces.slug: add optional, backfill, then make required + unique.
    const workspaces = app.findCollectionByNameOrId('workspaces')
    workspaces.fields.add(new TextField({ name: 'slug', min: 3, max: 40, pattern: SLUG_PATTERN }))
    app.save(workspaces)

    const used = {}
    for (const ws of app.findAllRecords('workspaces')) {
      const base = slugify(ws.getString('name'))
      let slug = base
      for (let i = 2; used[slug]; i++) slug = `${base.slice(0, 36)}-${i}`
      used[slug] = true
      ws.set('slug', slug)
      app.save(ws)
    }

    workspaces.fields.getByName('slug').required = true
    workspaces.addIndex('idx_workspaces_slug', true, 'slug', '')
    app.save(workspaces)

    // 2. admins: panel accounts. Only the setup route and other admins (via hooks) create them.
    const admins = new Collection({
      type: 'auth',
      name: 'admins',
      listRule: 'id = @request.auth.id',
      viewRule: 'id = @request.auth.id',
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    admins.fields.getByName('password').min = 12
    admins.authToken.duration = 8 * 60 * 60
    admins.passwordAuth.enabled = true
    admins.passwordAuth.identityFields = ['email']
    admins.oauth2.enabled = false
    admins.otp.enabled = false
    admins.mfa.enabled = false
    app.save(admins)

    // 3. One-time setup token (hash only). No API access at all.
    const setup = new Collection({
      type: 'base',
      name: 'admin_setup',
      fields: [
        { type: 'text', name: 'token_hash', required: true },
        { type: 'text', name: 'expires', required: true },
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    app.save(setup)

    // 4. Rate limits for the new public/admin routes.
    const settings = app.settings()
    settings.rateLimits.rules = [
      ...settings.rateLimits.rules.filter((r) => !r.label.startsWith('/api/admin/') && !r.label.startsWith('GET /api/lapak/')),
      { label: '/api/admin/', audience: '', duration: 60, maxRequests: 30 },
      { label: 'GET /api/lapak/', audience: '', duration: 60, maxRequests: 20 },
    ]
    app.save(settings)
  },
  (app) => {
    for (const name of ['admin_setup', 'admins']) {
      app.delete(app.findCollectionByNameOrId(name))
    }
    const workspaces = app.findCollectionByNameOrId('workspaces')
    workspaces.removeIndex('idx_workspaces_slug')
    workspaces.fields.removeByName('slug')
    app.save(workspaces)
  },
)
