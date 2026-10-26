import { Button } from './Button'
import { Sheet } from './Sheet'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  /** Names the object being acted on, e.g. "Hapus 'CFD South City' 12 Okt?" */
  message?: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
}

export function Dialog({ open, onClose, title, message, confirmLabel, cancelLabel = 'Batal', danger, loading, onConfirm }: Props) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      variant="center"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {message && <p className="text-sm">{message}</p>}
    </Sheet>
  )
}
