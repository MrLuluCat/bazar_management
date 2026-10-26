import { Link } from 'react-router'
import { MessageCircle, Phone } from 'lucide-react'
import type { ContactRecord } from '../api/types'
import { formatPhone, telLink, waLink } from '../lib/phone'
import { buttonClass } from './ui/Button'

/** Contact summary with one-tap WhatsApp / call. `link` makes the name open the contact page. */
export function ContactCard({ contact, link }: { contact: ContactRecord; link?: boolean }) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line p-3">
      <div className="min-w-0">
        {link ? (
          <Link to={`/contacts/${contact.id}`} className="text-base font-semibold text-ink">
            {contact.name}
          </Link>
        ) : (
          <p className="text-base font-semibold">{contact.name}</p>
        )}
        {contact.organization && <p className="text-sm text-muted">{contact.organization}</p>}
        <p className="num text-sm">{formatPhone(contact.phone)}</p>
      </div>
      <div className="flex gap-2">
        <a href={waLink(contact.phone)} target="_blank" rel="noopener noreferrer" className={buttonClass('primary', 'flex-1')}>
          <MessageCircle size={18} strokeWidth={1.5} aria-hidden />
          WhatsApp
        </a>
        <a href={telLink(contact.phone)} className={buttonClass('secondary', 'flex-1')}>
          <Phone size={18} strokeWidth={1.5} aria-hidden />
          Telepon
        </a>
      </div>
    </div>
  )
}
