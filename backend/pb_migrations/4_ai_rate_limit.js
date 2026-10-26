/// <reference path="../pb_data/types.d.ts" />
// AI assistant: 20 requests a minute per client (each can call InferHub several times).
migrate(
  (app) => {
    const settings = app.settings()
    settings.rateLimits.rules = [
      ...settings.rateLimits.rules.filter((r) => r.label !== '/api/ai/'),
      { label: '/api/ai/', audience: '', duration: 60, maxRequests: 20 },
    ]
    app.save(settings)
  },
  () => {},
)
