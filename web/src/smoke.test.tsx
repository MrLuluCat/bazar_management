import { render, screen } from '@testing-library/react'
import App from './App'

test('renders wordmark', () => {
  render(<App />)
  expect(screen.getByText('Bazar')).toBeInTheDocument()
})
