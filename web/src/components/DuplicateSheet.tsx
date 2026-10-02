import { useEffect, useState } from 'react'
import { Button } from './ui/Button'
import { MultiDatePicker } from './ui/MultiDatePicker'
import { Sheet } from './ui/Sheet'

type Props = {
  open: boolean
  onClose: () => void
  /** 'YYYY-MM' the picker opens on. */
  initialMonth: string
  onSubmit: (dates: string[]) => Promise<void>
}

export function DuplicateSheet({ open, onClose, initialMonth, onSubmit }: Props) {
  const [dates, setDates] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (open) setDates([])
  }, [open])

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Duplikat ke tanggal"
      footer={
        <Button
          variant="primary"
          className="w-full"
          loading={saving}
          disabled={dates.length === 0}
          onClick={async () => {
            setSaving(true)
            try {
              await onSubmit(dates)
            } finally {
              setSaving(false)
            }
          }}
        >
          Simpan
        </Button>
      }
    >
      <p className="pb-2 text-sm text-muted">Judul, lokasi, kontak, jam dan biaya disalin. Pembayaran tidak disalin.</p>
      <MultiDatePicker value={dates} onChange={setDates} initialMonth={initialMonth} />
    </Sheet>
  )
}
