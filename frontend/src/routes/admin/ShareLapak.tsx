import { Copy, ExternalLink, MessageCircle } from 'lucide-react'
import { buttonClass, Button } from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { lapakUrl } from '../../lib/lapak'
import { copyText, shareText } from './api'

/** Link (and, right after creating or changing it, the passcode) with copy + WhatsApp share. */
export function ShareLapak({ name, slug, passcode }: { name: string; slug: string; passcode?: string }) {
  const url = lapakUrl(slug)
  const text = shareText(name, url, passcode)
  return (
    <div className="flex flex-col gap-3">
      <dl className="divide-y divide-line rounded-md border border-line-strong bg-surface">
        <div className="flex flex-col gap-0.5 px-3 py-2.5">
          <dt className="text-xs text-muted">Link lapak</dt>
          <dd className="num break-all text-sm">{url}</dd>
        </div>
        {passcode && (
          <div className="flex flex-col gap-0.5 px-3 py-2.5">
            <dt className="text-xs text-muted">Kode akses</dt>
            <dd className="num text-base font-semibold tracking-wide">{passcode}</dd>
          </div>
        )}
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={async () => toast.show((await copyText(text)) ? (passcode ? 'Link dan kode disalin' : 'Link disalin') : 'Gagal menyalin. Salin manual.')}
        >
          <Copy size={18} strokeWidth={1.5} aria-hidden />
          {passcode ? 'Salin link & kode' : 'Salin link'}
        </Button>
        <a className={buttonClass('secondary')} href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
          <MessageCircle size={18} strokeWidth={1.5} aria-hidden />
          Kirim lewat WhatsApp
        </a>
        <a className={buttonClass('ghost')} href={url} target="_blank" rel="noreferrer">
          <ExternalLink size={18} strokeWidth={1.5} aria-hidden />
          Buka
        </a>
      </div>
    </div>
  )
}
