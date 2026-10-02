import { createBrowserRouter } from 'react-router'
import { AppShell } from './components/AppShell'
import Agenda from './routes/Agenda'
import Unlock from './routes/Unlock'

// Everything but the home route loads on demand to keep the initial bundle small.
const lazyRoute = (load: () => Promise<{ default: React.ComponentType }>) => ({
  lazy: async () => ({ Component: (await load()).default }),
})

export const router = createBrowserRouter([
  { path: '/unlock', element: <Unlock /> },
  ...(import.meta.env.DEV ? [{ path: '/_sandbox', ...lazyRoute(() => import('./routes/DesignSandbox')) }] : []),
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Agenda /> },
      { path: '/event/:id', ...lazyRoute(() => import('./routes/EventDetail')) },
      { path: '/contacts', ...lazyRoute(() => import('./routes/Contacts')) },
      { path: '/contacts/:id', ...lazyRoute(() => import('./routes/ContactDetail')) },
      { path: '/settings', ...lazyRoute(() => import('./routes/Settings')) },
    ],
  },
])
