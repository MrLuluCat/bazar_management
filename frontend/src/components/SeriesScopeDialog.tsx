import { Button } from './ui/Button'
import { Sheet } from './ui/Sheet'

export type SeriesScope = 'this' | 'following'

type Props = {
  open: boolean
  onClose: () => void
  /** e.g. "Ubah event berulang" / "Hapus event berulang" */
  title: string
  message?: string
  danger?: boolean
  onChoose: (scope: SeriesScope) => void
}

export function SeriesScopeDialog({ open, onClose, title, message, danger, onChoose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={title} variant="center">
      <div className="flex flex-col gap-2">
        {message && <p className="pb-1 text-sm">{message}</p>}
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => onChoose('this')}>
          Hanya event ini
        </Button>
        <Button variant={danger ? 'danger' : 'secondary'} onClick={() => onChoose('following')}>
          Ini &amp; seterusnya
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
      </div>
    </Sheet>
  )
}
