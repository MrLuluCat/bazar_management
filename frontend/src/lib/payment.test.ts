import { monthSummary, paid, paymentStatus, remaining } from './payment'

const p = (...a: number[]) => a.map((amount) => ({ amount }))

test('paid sums amounts', () => expect(paid(p(10, 20))).toBe(30))

test('remaining never negative', () => {
  expect(remaining(100, p(30))).toBe(70)
  expect(remaining(100, p(150))).toBe(0)
})

test('paymentStatus', () => {
  expect(paymentStatus(0, p()).status).toBe('gratis')
  expect(paymentStatus(100, p()).status).toBe('belum')
  expect(paymentStatus(100, p(40)).status).toBe('dp')
  expect(paymentStatus(100, p(40, 60)).status).toBe('lunas')
  expect(paymentStatus(1000, p(1500))).toEqual({ status: 'lunas', overpaid: 500 })
  expect(paymentStatus(1000, p(1000)).overpaid).toBe(0)
})

test('status recomputes when total_cost changes after overpay', () => {
  expect(paymentStatus(1000, p(1500)).status).toBe('lunas')
  expect(paymentStatus(2000, p(1500)).status).toBe('dp')
})

test('monthSummary excludes cancelled events', () => {
  const events = [
    { status: 'active', total_cost: 100, payments: p(40) },
    { status: 'active', total_cost: 50, payments: p(50) },
    { status: 'cancelled', total_cost: 999, payments: p() },
  ]
  expect(monthSummary(events)).toEqual({ count: 2, totalCost: 150, totalRemaining: 60 })
})
