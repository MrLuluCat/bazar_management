import { useLocation, useNavigate } from 'react-router'
import { useContact, useCreateContact, useUpdateContact, type ContactInput } from '../api/contacts'
import { useWorkspace } from '../api/workspace'
import { useOverlay } from '../hooks/useOverlay'
import { ContactForm } from './ContactForm'
import { toast } from './ui/Toast'

/** Mounted in AppShell: ?new=contact or ?editContact=:id. */
export function ContactFormHost() {
  const { params, close } = useOverlay()
  const navigate = useNavigate()
  const location = useLocation()
  const ws = useWorkspace()
  const create = useCreateContact(ws.data?.id)
  const update = useUpdateContact()
  const editId = params.get('editContact')
  const isNew = params.get('new') === 'contact'
  const editing = useContact(editId ?? undefined)
  const open = isNew || (!!editId && !!editing.data)

  const initial: ContactInput | undefined = editing.data
    ? { name: editing.data.name, phone: editing.data.phone, organization: editing.data.organization, notes: editing.data.notes }
    : undefined

  const done = (key: string) => {
    const p = new URLSearchParams(location.search)
    p.delete(key)
    navigate({ pathname: location.pathname, search: p.toString() }, { replace: true })
  }

  const submit = async (values: ContactInput) => {
    try {
      if (editId) {
        await update.mutateAsync({ id: editId, patch: values })
        toast.show('Kontak disimpan')
        done('editContact')
      } else {
        await create.mutateAsync(values)
        toast.show('Kontak ditambahkan')
        done('new')
      }
    } catch {
      toast.show('Gagal menyimpan. Coba lagi.')
    }
  }

  return <ContactForm open={open} onClose={close} initial={editId ? initial : undefined} onSubmit={submit} />
}
