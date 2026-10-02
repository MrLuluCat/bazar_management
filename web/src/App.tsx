import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { queryClient } from './lib/queryClient'
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
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
