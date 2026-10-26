import { vi } from 'vitest'
import { clearLocalData, queryClient } from './queryClient'

test('clearLocalData wipes the query cache and the api-v1 / files-v1 service worker caches', async () => {
  queryClient.setQueryData(['contacts'], [{ phone: '6281234567890' }])
  const del = vi.fn().mockResolvedValue(true)
  vi.stubGlobal('caches', { delete: del })
  await clearLocalData()
  expect(queryClient.getQueryData(['contacts'])).toBeUndefined()
  expect(del).toHaveBeenCalledWith('api-v1')
  expect(del).toHaveBeenCalledWith('files-v1')
  vi.unstubAllGlobals()
})
