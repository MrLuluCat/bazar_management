import DesignSandbox from './routes/DesignSandbox'

export default function App() {
  if (location.pathname === '/_sandbox') return <DesignSandbox />
  return <h1>Bazar</h1>
}
