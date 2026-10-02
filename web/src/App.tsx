import { useEffect, useState } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { RouterProvider } from 'react-router'
import { MAX_AGE, persister, queryClient } from './lib/queryClient'
import { refreshAuth } from './lib/pb'
import { applyTheme, getTheme } from './lib/theme'
import { router } from './router'

export default function App() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    applyTheme(getTheme())
    void refreshAuth().finally(() => setReady(true))
  }, [])
  if (!ready) return <h1 className="sr-only">Bazar</h1>
  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: MAX_AGE, buster: __APP_VERSION__ }}>
      <RouterProvider router={router} />
    </PersistQueryClientProvider>
  )
}
