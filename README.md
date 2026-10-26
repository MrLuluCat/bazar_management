# Bazar Manager

Aplikasi web (PWA, mobile-first) untuk mengatur jadwal bazar/booth per bulan: kapan, di mana, siapa yang dihubungi, dan berapa yang sudah dibayar. Bahasa antarmuka: Indonesia.

Fitur: agenda per bulan + kalender, pembayaran cicilan (DP + pelunasan), buku kontak penanggung jawab (WhatsApp / telepon sekali ketuk), duplikat dan ulangi event, bisa dipasang di HP, bisa dibaca saat offline.

## Struktur

```
backend/    PocketBase (API + database)  -> dipasang di VPS      (lihat backend/DEPLOY.md)
frontend/   React + Vite (PWA)           -> dipasang di Vercel   (lihat frontend/DEPLOY.md)
setup.sh    setup lokal sekali jalan (backend + frontend)
dev.sh      jalankan backend + frontend sekaligus
PRD.md, DESIGN.md, PRODUCT.md   spesifikasi dan desain
```

Detail tiap bagian:

```
backend/
  pb_migrations/   skema database + aturan akses (otomatis dijalankan PocketBase)
  pb_hooks/        kosong (cadangan)
  scripts/         setup.sh, dev.sh, bootstrap.js, seed.js, deploy.sh, pb-version.sh
  deploy/          bazar.service (systemd), nginx.bazar.conf
  tests/           tes aturan akses
  pocketbase(.exe) + pb_data/   diunduh/dibuat saat setup, tidak di-commit
frontend/
  src/lib/         logika murni: uang, telepon, tanggal, pembayaran, pengulangan
  src/api/         akses data (PocketBase SDK + TanStack Query)
  src/components/  komponen UI; ui/ = komponen dasar
  src/routes/      halaman
  e2e/, e2e-pwa/   tes browser
  vercel.json      konfigurasi Vercel
```

## Yang perlu dipasang

- Node.js 20 atau lebih baru (`node -v`)
- Windows: **Git Bash** (semua perintah di bawah dijalankan di Git Bash, bukan CMD/PowerShell)
- Google Chrome (untuk tes browser)
- Internet saat setup (unduh PocketBase dan paket npm)

## Jalankan di lokal

```bash
./setup.sh --seed     # sekali: unduh PocketBase, buat akun, workspace, data contoh, npm install
./dev.sh              # tiap kali: backend :8090 + frontend :5173 (Ctrl+C menghentikan keduanya)
```

Buka **http://localhost:5173**, kode akses **`bazar-123`**. Data contoh ada di Oktober dan November 2026.

Tanpa data contoh: `./setup.sh`.

| Alamat | Isi |
| --- | --- |
| http://localhost:5173 | aplikasi |
| http://127.0.0.1:8090/_/ | panel admin PocketBase (`admin@local.test` / `admin-pass-123`) |

### Jalankan terpisah

```bash
cd backend && npm run dev      # terminal 1: PocketBase
cd frontend && npm run dev     # terminal 2: web
```

Di lokal, frontend mem-proxy `/api` ke `http://127.0.0.1:8090` (`VITE_PB_URL` kosong di `frontend/.env.local`).

### Ganti kode akses / nama

```bash
GROUP_PASSCODE='kode-baru-min-6' WORKSPACE_NAME='Lapak Rina' ./setup.sh
```

| Variabel | Bawaan |
| --- | --- |
| `GROUP_PASSCODE` | `bazar-123` (minimal 6 karakter) |
| `GROUP_EMAIL` | `grup@bazar.local` (harus sama dengan `VITE_GROUP_EMAIL` di `frontend/.env.local`) |
| `WORKSPACE_NAME` | `Bazar Saya` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@local.test` / `admin-pass-123` |

### Reset database lokal

```bash
rm -rf backend/pb_data
./setup.sh --seed
```

## Deploy

1. Backend ke VPS: [backend/DEPLOY.md](backend/DEPLOY.md)
2. Frontend ke Vercel: [frontend/DEPLOY.md](frontend/DEPLOY.md)
3. Hubungkan: `VITE_PB_URL` (Vercel) = URL API, dan `BAZAR_ORIGINS` (VPS) = URL Vercel.

## Tes

```bash
cd backend  && npm test            # aturan akses PocketBase
cd frontend && npm test            # unit + komponen
cd frontend && npm run e2e         # browser (mobile + desktop); hentikan ./dev.sh dulu (port sama)
cd frontend && npm run e2e:pwa     # offline/PWA pada hasil build
```

## Cara pakai singkat

1. Masuk dengan kode akses.
2. Tambah event: tombol `+` (HP) / "Tambah event" (desktop) / tekan `n`.
3. Ulangi: centang "Ulangi" di formulir, pilih frekuensi dan tanggal akhir.
4. Catat pembayaran: buka event, "Catat pembayaran" atau "Lunasi".
5. Duplikat: buka event, "Duplikat", pilih tanggal (pembayaran tidak disalin).
6. Kontak: menu Kontak, ketuk WhatsApp / Telepon.
7. Kalender: di agenda pilih "Kalender".
8. Kunci: Pengaturan, "Kunci" (menghapus data tersimpan di perangkat).

Pintasan desktop: `n` event baru, `←` `→` pindah bulan, `t` hari ini, `/` cari. Fitur offline dan pasang di HP hanya aktif di hasil build (Vercel), bukan `npm run dev`.

## Masalah umum

| Gejala | Solusi |
| --- | --- |
| `./setup.sh: Permission denied` / error `\r` | Jalankan di Git Bash: `bash setup.sh --seed`. Bila CRLF: `sed -i 's/\r$//' *.sh backend/scripts/*.sh` |
| Login "Kode salah" | Kode salah, atau `VITE_GROUP_EMAIL` beda dengan `GROUP_EMAIL` saat setup. Restart `./dev.sh` setelah ubah `.env.local` |
| Login diblokir | Batas 5 kali / 60 detik. Tunggu semenit |
| Port 8090/5173 terpakai | PowerShell: `Get-NetTCPConnection -LocalPort 8090,5173 -State Listen \| % { Stop-Process -Id $_.OwningProcess -Force }` |
| "Workspace tidak ditemukan" | Setup belum jalan atau `backend/pb_data` terhapus: `./setup.sh --seed` |
| Di Vercel: error jaringan / CORS | Domain Vercel belum ada di `BAZAR_ORIGINS` di VPS |
