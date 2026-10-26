/// <reference path="../pb_data/types.d.ts" />
// AI assistant API. Config comes from env (INFERHUB_*); the key never leaves the server.

routerAdd(
  'GET',
  '/api/ai/status',
  (e) => {
    return e.json(200, { enabled: require(`${__hooks}/lib/ai.js`).enabled() })
  },
  $apis.requireAuth('users'),
)

routerAdd(
  'POST',
  '/api/ai/assistant',
  (e) => {
    const AI = require(`${__hooks}/lib/ai.js`)
    const result = AI.assist(e.app, e.auth.id, e.requestInfo().body)
    e.app.logger().info('ai: assistant', 'user', e.auth.id, 'steps', result.steps.length, 'proposals', result.proposals.length, 'model', result.model)
    return e.json(200, result)
  },
  $apis.requireAuth('users'),
  $apis.bodyLimit(16 << 20),
)
