/// <reference path="../pb_data/types.d.ts" />
// App settings: rate limit on auth, daily backup. See PRD §4, §8, F1.
migrate(
  (app) => {
    const settings = app.settings()
    settings.meta.appName = 'Bazar Manager'

    settings.rateLimits.enabled = true
    settings.rateLimits.rules = [
      { label: '*:auth', audience: '', duration: 60, maxRequests: 5 },
      { label: '/api/', audience: '', duration: 10, maxRequests: 300 },
    ]

    // 02:00 WIB = 19:00 UTC (server cron runs in UTC).
    settings.backups.cron = '0 19 * * *'
    settings.backups.cronMaxKeep = 7

    app.save(settings)
  },
  () => {},
)
