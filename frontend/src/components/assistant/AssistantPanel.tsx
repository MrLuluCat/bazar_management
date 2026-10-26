import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ImagePlus, RefreshCw, Send, Square, X } from 'lucide-react'
import { useOnline } from '../../hooks/useOnline'
import { Button } from '../ui/Button'
import { Sheet } from '../ui/Sheet'
import { compressImage } from './compressImage'
import { ProposalCard } from './ProposalCard'
import { assistant, useAssistant } from './store'

const SUGGESTIONS = ['Sabtu ini ada event apa?', 'Bulan ini masih kurang bayar berapa?', 'Catat event dari foto poster ini']

export function AssistantPanel() {
  const { open, bubbles, pending } = useAssistant()
  const online = useOnline()
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [photoError, setPhotoError] = useState('')
  const end = useRef<HTMLDivElement>(null)
  const file = useRef<HTMLInputElement>(null)

  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [bubbles.length, pending, open])

  const submit = (e?: FormEvent) => {
    e?.preventDefault()
    if (pending || !online || (!text.trim() && !images.length)) return
    assistant.send(text.trim(), images)
    setText('')
    setImages([])
  }

  const addPhotos = async (files: FileList | null) => {
    setPhotoError('')
    const list = [...(files ?? [])].slice(0, 3 - images.length)
    try {
      const out = await Promise.all(list.map((f) => compressImage(f)))
      setImages((cur) => [...cur, ...out].slice(0, 3))
    } catch {
      setPhotoError('Foto tidak bisa dibaca. Pakai JPEG atau PNG.')
    }
    if (file.current) file.current.value = ''
  }

  const composer = (
    <form onSubmit={submit} className="flex flex-col gap-2">
      {images.length > 0 && (
        <ul className="flex gap-2" aria-label="Foto terlampir">
          {images.map((src, i) => (
            <li key={i} className="relative">
              <img src={src} alt={`Foto ${i + 1}`} className="h-16 w-16 rounded-md border border-line object-cover" />
              <button
                type="button"
                aria-label={`Hapus foto ${i + 1}`}
                onClick={() => setImages((cur) => cur.filter((_, j) => j !== i))}
                className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-line-strong bg-surface"
              >
                <X size={14} strokeWidth={2} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {photoError && (
        <p role="alert" className="text-xs text-unpaid">
          {photoError}
        </p>
      )}
      <div className="flex items-end gap-2">
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => void addPhotos(e.target.files)} />
        <Button aria-label="Lampirkan foto" title="Lampirkan foto (maks. 3)" disabled={!online || pending || images.length >= 3} onClick={() => file.current?.click()} className="shrink-0 px-3">
          <ImagePlus size={20} strokeWidth={1.5} aria-hidden />
        </Button>
        <label htmlFor="assistant-input" className="sr-only">
          Pesan untuk asisten
        </label>
        <textarea
          id="assistant-input"
          rows={1}
          value={text}
          disabled={!online}
          placeholder={online ? 'Tulis pesan…' : 'Butuh koneksi internet'}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault()
              submit()
            }
          }}
          className="max-h-32 min-h-[44px] w-full resize-none rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-muted focus-visible:border-accent disabled:opacity-50"
          data-autofocus
        />
        {pending ? (
          <Button aria-label="Hentikan" title="Hentikan" onClick={assistant.stop} className="shrink-0 px-3">
            <Square size={18} strokeWidth={1.5} aria-hidden />
          </Button>
        ) : (
          <Button type="submit" variant="primary" aria-label="Kirim" title="Kirim" disabled={!online || (!text.trim() && !images.length)} className="shrink-0 px-3">
            <Send size={18} strokeWidth={1.5} aria-hidden />
          </Button>
        )}
      </div>
    </form>
  )

  return (
    <Sheet open={open} onClose={assistant.hide} title="Asisten" footer={composer}>
      <div className="flex flex-col gap-4 pb-2" aria-live="polite">
        {bubbles.length === 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">
              Tanya soal agenda dan pembayaran, atau kirim foto poster, chat panitia, dan bukti transfer. Asisten menyiapkan usulan; kamu yang menyimpan.
            </p>
            <div className="flex flex-col items-start gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!online}
                  onClick={() => (s.includes('foto') ? (setText(s), file.current?.click()) : assistant.send(s, []))}
                  className="min-h-[44px] rounded-md border border-line-strong bg-surface px-3 text-left text-sm hover:bg-accent-wash disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {bubbles.map((b) =>
          b.role === 'user' ? (
            <div key={b.id} className="ml-auto flex max-w-[85%] flex-col items-end gap-2">
              {b.images.length > 0 && (
                <div className="flex gap-2">
                  {b.images.map((src, i) => (
                    <img key={i} src={src} alt={`Foto ${i + 1}`} className="h-20 w-20 rounded-md border border-line object-cover" />
                  ))}
                </div>
              )}
              {b.text && <p className="whitespace-pre-wrap break-words rounded-md bg-accent px-3 py-2 text-sm text-accent-ink">{b.text}</p>}
            </div>
          ) : b.role === 'assistant' ? (
            <div key={b.id} className="flex flex-col gap-3">
              <p className="max-w-[92%] whitespace-pre-wrap text-sm">{b.text}</p>
              {b.proposals.map((p) => (
                <ProposalCard key={p.id} p={p} bubbleId={b.id} state={b.states[p.id]} />
              ))}
            </div>
          ) : (
            <div key={b.id} role="alert" className="flex flex-col items-start gap-2 text-sm text-unpaid">
              <p>{b.text}</p>
              {b.retry && (
                <Button onClick={assistant.retry}>
                  <RefreshCw size={16} strokeWidth={1.5} aria-hidden />
                  Coba lagi
                </Button>
              )}
            </div>
          ),
        )}

        {pending && (
          <p className="text-sm text-muted" role="status">
            Menyiapkan jawaban…
          </p>
        )}
        <div ref={end} />
      </div>
    </Sheet>
  )
}
