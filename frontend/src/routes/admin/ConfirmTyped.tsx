import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Field } from '../../components/ui/Field'
import { Input } from '../../components/ui/Input'
import { Sheet } from '../../components/ui/Sheet'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  /** What happens, in one or two plain sentences. */
  message: string
  /** The exact word the admin must type. */
  word: string
  confirmLabel: string
  loading?: boolean
  error?: string
  onConfirm: () => void
}

/** Destructive confirmation: the action stays disabled until `word` is typed exactly. */
export function ConfirmTyped({ open, onClose, title, message, word, confirmLabel, loading, error, onConfirm }: Props) {
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (open) setTyped('')
  }, [open])
  const match = typed.trim() === word

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      variant="center"
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Batal</Button>
          <Button variant="danger" disabled={!match} disabledReason={`Ketik ${word} dulu`} loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (match && !loading) onConfirm()
        }}
      >
        <p className="text-sm">{message}</p>
        <p className="text-sm text-muted">Backup otomatis dibuat sebelum ini dijalankan.</p>
        <Field label={`Ketik ${word} untuk melanjutkan`} error={error}>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} data-autofocus />
        </Field>
      </form>
    </Sheet>
  )
}
