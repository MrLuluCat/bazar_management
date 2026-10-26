import { getView, setView } from './viewPref'

afterEach(() => localStorage.clear())

test('defaults to agenda and remembers the choice', () => {
  expect(getView()).toBe('agenda')
  setView('kalender')
  expect(getView()).toBe('kalender')
})

test('survives blocked storage', () => {
  const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked')
  })
  expect(getView()).toBe('agenda')
  spy.mockRestore()
})
