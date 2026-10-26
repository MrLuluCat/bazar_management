import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { pb } from '../lib/pb'
import type { WorkspaceRecord } from './types'

export function useWorkspace() {
  return useQuery({
    queryKey: ['workspace'],
    queryFn: async (): Promise<WorkspaceRecord> => {
      const r = await pb.collection('workspaces').getList<WorkspaceRecord>(1, 1)
      if (!r.items[0]) throw new Error('Workspace tidak ditemukan')
      return r.items[0]
    },
  })
}

export function useUpdateWorkspaceName() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => pb.collection('workspaces').update<WorkspaceRecord>(id, { name }),
    onSuccess: (ws) => qc.setQueryData(['workspace'], ws),
  })
}
