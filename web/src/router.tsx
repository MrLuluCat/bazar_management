import { createBrowserRouter } from 'react-router'
import { AppShell } from './components/AppShell'
import Agenda from './routes/Agenda'
import DesignSandbox from './routes/DesignSandbox'
import Placeholder from './routes/Placeholder'
import Settings from './routes/Settings'
import Unlock from './routes/Unlock'

export const router = createBrowserRouter([
  { path: '/unlock', element: <Unlock /> },
  ...(import.meta.env.DEV ? [{ path: '/_sandbox', element: <DesignSandbox /> }] : []),
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Agenda /> },
      { path: '/event/:id', element: <Placeholder title="Event" /> },
      { path: '/contacts', element: <Placeholder title="Kontak" /> },
      { path: '/contacts/:id', element: <Placeholder title="Kontak" /> },
      { path: '/settings', element: <Settings /> },
    ],
  },
])
