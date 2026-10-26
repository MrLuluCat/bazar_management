import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pb } from '../lib/pb'
import type { ContactRecord, EventRecord } from './types'

export type ContactInput = { name: string; phone: string; organization: string; notes: string }

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: () => pb.collection('contacts').getFullList<ContactRecord>({ sort: 'name' }),
  })
}

export function useContact(id: string | undefined) {
  return useQuery({ queryKey: ['contact', id], queryFn: () => pb.collection('contacts').getOne<ContactRecord>(id!), enabled: !!id })
}

export type LinkedEvent = Pick<EventRecord, 'id' | 'title' | 'date' | 'status' | 'location'>

export function useContactEvents(id: string | undefined) {
  return useQuery({
    queryKey: ['contact-events', id],
    enabled: !!id,
    queryFn: () =>
      pb.collection('events').getFullList<LinkedEvent>({
        filter: pb.filter('contact = {:id}', { id }),
        fields: 'id,title,date,status,location',
        sort: 'date',
      }),
  })
}

function useInvalidate() {
  const qc = useQueryClient()
  return () =>
    Promise.all(['contacts', 'contact', 'contact-events', 'events', 'event'].map((k) => qc.invalidateQueries({ queryKey: [k] })))
}

export function useCreateContact(workspaceId: string | undefined) {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (input: ContactInput) => {
      if (!workspaceId) throw new Error('Workspace belum siap')
      return pb.collection('contacts').create<ContactRecord>({ ...input, workspace: workspaceId })
    },
    onSuccess: invalidate,
  })
}

export function useUpdateContact() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<ContactInput> }) => pb.collection('contacts').update<ContactRecord>(id, patch),
    onSuccess: invalidate,
  })
}

export function useDeleteContact() {
  const invalidate = useInvalidate()
  return useMutation({
    mutationFn: (id: string) => pb.collection('contacts').delete(id),
    onSuccess: invalidate,
  })
}
