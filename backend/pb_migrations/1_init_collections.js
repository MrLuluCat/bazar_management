/// <reference path="../pb_data/types.d.ts" />
// Schema + API rules for Bazar Manager. See PRD §4.

// M(ws): caller is a member of workspace expression `ws`.
const M = (ws) =>
  `@request.auth.id != "" && @collection.memberships.workspace ?= ${ws} && @collection.memberships.user ?= @request.auth.id`

const WS_UNCHANGED = '(@request.body.workspace:isset = false || @request.body.workspace = workspace)'

migrate(
  (app) => {
    // users: no signup, self only.
    const users = app.findCollectionByNameOrId('users')
    users.listRule = 'id = @request.auth.id'
    users.viewRule = 'id = @request.auth.id'
    users.createRule = null
    users.updateRule = 'id = @request.auth.id'
    users.deleteRule = null
    app.save(users)

    const stamps = [
      { type: 'autodate', name: 'created', onCreate: true },
      { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
    ]

    const workspaces = new Collection({
      type: 'base',
      name: 'workspaces',
      fields: [{ type: 'text', name: 'name', required: true }, ...stamps],
      // Member rules reference `memberships`, which does not exist yet: set below.
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    app.save(workspaces)

    const wsRel = { type: 'relation', name: 'workspace', required: true, collectionId: workspaces.id, cascadeDelete: true, maxSelect: 1 }

    const memberships = new Collection({
      type: 'base',
      name: 'memberships',
      fields: [
        wsRel,
        { type: 'relation', name: 'user', required: true, collectionId: users.id, cascadeDelete: true, maxSelect: 1 },
        { type: 'select', name: 'role', required: true, maxSelect: 1, values: ['owner', 'member'] },
        ...stamps,
      ],
      indexes: ['CREATE UNIQUE INDEX idx_memberships_ws_user ON memberships (workspace, user)'],
      listRule: '@request.auth.id != "" && user = @request.auth.id',
      viewRule: '@request.auth.id != "" && user = @request.auth.id',
      createRule: null,
      updateRule: null,
      deleteRule: null,
    })
    app.save(memberships)

    workspaces.listRule = M('id')
    workspaces.viewRule = M('id')
    workspaces.updateRule = M('id')
    app.save(workspaces)

    const contacts = new Collection({
      type: 'base',
      name: 'contacts',
      fields: [
        wsRel,
        { type: 'text', name: 'name', required: true },
        { type: 'text', name: 'phone', required: true, pattern: '^62\\d{8,13}$' },
        { type: 'text', name: 'organization' },
        { type: 'text', name: 'notes' },
        ...stamps,
      ],
      indexes: ['CREATE INDEX idx_contacts_ws_name ON contacts (workspace, name)'],
      listRule: M('workspace'),
      viewRule: M('workspace'),
      createRule: M('@request.body.workspace'),
      updateRule: M('workspace') + ' && ' + WS_UNCHANGED,
      deleteRule: M('workspace'),
    })
    app.save(contacts)

    const events = new Collection({
      type: 'base',
      name: 'events',
      fields: [
        wsRel,
        { type: 'text', name: 'title', required: true },
        { type: 'text', name: 'date', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        { type: 'text', name: 'start_time', pattern: '^\\d{2}:\\d{2}$' },
        { type: 'text', name: 'end_time', pattern: '^\\d{2}:\\d{2}$' },
        { type: 'text', name: 'location', required: true },
        { type: 'relation', name: 'contact', collectionId: contacts.id, cascadeDelete: false, maxSelect: 1 },
        // PocketBase treats 0 as blank, so `required` would reject free events: optional with min 0.
        { type: 'number', name: 'total_cost', min: 0, onlyInt: true },
        { type: 'select', name: 'status', required: true, maxSelect: 1, values: ['active', 'cancelled'] },
        { type: 'text', name: 'notes' },
        { type: 'text', name: 'series_id' },
        ...stamps,
      ],
      indexes: [
        'CREATE INDEX idx_events_ws_date ON events (workspace, date)',
        'CREATE INDEX idx_events_series ON events (series_id)',
      ],
      listRule: M('workspace'),
      viewRule: M('workspace'),
      createRule: M('@request.body.workspace'),
      updateRule: M('workspace') + ' && ' + WS_UNCHANGED,
      deleteRule: M('workspace'),
    })
    app.save(events)

    const payments = new Collection({
      type: 'base',
      name: 'payments',
      fields: [
        { type: 'relation', name: 'event', required: true, collectionId: events.id, cascadeDelete: true, maxSelect: 1 },
        { type: 'number', name: 'amount', required: true, min: 1, onlyInt: true },
        { type: 'text', name: 'paid_at', required: true, pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        { type: 'text', name: 'note' },
        {
          type: 'file',
          name: 'proof',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'],
          thumbs: ['400x0'],
        },
        ...stamps,
      ],
      indexes: ['CREATE INDEX idx_payments_event ON payments (event)'],
      listRule: M('event.workspace'),
      viewRule: M('event.workspace'),
      createRule: M('@request.body.event.workspace'),
      updateRule: M('event.workspace') + ' && (@request.body.event:isset = false || @request.body.event = event)',
      deleteRule: M('event.workspace'),
    })
    app.save(payments)
  },
  (app) => {
    for (const name of ['payments', 'events', 'contacts', 'memberships', 'workspaces']) {
      app.delete(app.findCollectionByNameOrId(name))
    }
  },
)
