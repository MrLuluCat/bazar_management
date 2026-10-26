# Deploy frontend (Vercel)

Frontend = React SPA (PWA). Backend harus sudah jalan di VPS, lihat [../backend/DEPLOY.md](../backend/DEPLOY.md).

## Lewat dashboard Vercel

1. Push repo ke GitHub.
2. Vercel: **Add New → Project**, pilih repo.
3. **Root Directory**: `frontend`. Framework: Vite (otomatis). Build: `npm run build`, output `dist` (sudah diatur di `vercel.json`).
4. **Environment Variables** (Production dan Preview):

   | Nama | Contoh |
   | --- | --- |
   | `VITE_PB_URL` | `https://api-bazar.nasfcakes.cloud` |
   | `VITE_GROUP_EMAIL` | `grup@example.com` (sama dengan `GROUP_EMAIL` saat bootstrap backend) |

5. Deploy.
6. Masukkan domain Vercel (mis. `https://bazar.vercel.app`, plus domain kustom bila ada) ke `BAZAR_ORIGINS` di `/opt/bazar/.env` di VPS, lalu `sudo systemctl restart bazar`. Tanpa ini browser menolak request (CORS).

## Lewat CLI

```bash
cd frontend
npx vercel link
npx vercel env add VITE_PB_URL
npx vercel env add VITE_GROUP_EMAIL
npx vercel --prod
```

## Catatan

- `VITE_*` dibaca saat build. Setelah mengubahnya, deploy ulang.
- `vercel.json` mengarahkan semua route ke `index.html` (SPA) dan mematikan cache untuk `index.html`, `sw.js` dan manifest, supaya versi baru langsung terpakai. Aset ber-hash di-cache 1 tahun.
- Preview deployment Vercel punya domain sendiri; tambahkan ke `BAZAR_ORIGINS` bila ingin preview bisa login.
