import { z } from 'zod'

export const eventSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul wajib diisi'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi'),
    start_time: z.string(),
    end_time: z.string(),
    location: z.string().trim().min(1, 'Lokasi wajib diisi'),
    total_cost: z.number().int('Biaya harus bilangan bulat').min(0, 'Biaya tidak boleh negatif'),
    notes: z.string(),
    status: z.enum(['active', 'cancelled']),
  })
  .refine((v) => !v.start_time || !v.end_time || v.end_time >= v.start_time, {
    path: ['end_time'],
    message: 'Jam selesai harus setelah jam mulai',
  })

export type EventFormValues = z.infer<typeof eventSchema>
