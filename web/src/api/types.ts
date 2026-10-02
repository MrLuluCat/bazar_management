export type Id = string

export type WorkspaceRecord = { id: Id; name: string }

export type ContactRecord = {
  id: Id
  workspace: Id
  name: string
  phone: string
  organization: string
  notes: string
}

export type EventStatus = 'active' | 'cancelled'

export type EventRecord = {
  id: Id
  workspace: Id
  title: string
  date: string
  start_time: string
  end_time: string
  location: string
  contact: Id
  total_cost: number
  status: EventStatus
  notes: string
  series_id: string
  expand?: { contact?: ContactRecord }
}

export type PaymentRecord = {
  id: Id
  event: Id
  amount: number
  paid_at: string
  note: string
  proof: string
}
