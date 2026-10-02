import { paymentStatus } from '../lib/payment'
import { Badge } from './ui/Badge'

type Props = { total: number; payments: { amount: number }[]; cancelled?: boolean }

export function StatusBadge({ total, payments, cancelled }: Props) {
  if (cancelled) return <Badge kind="batal" />
  return <Badge kind={paymentStatus(total, payments).status} />
}
