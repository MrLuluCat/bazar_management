# Bazar Manager

Aplikasi web (PWA, mobile-first) untuk mengatur jadwal bazar/booth per bulan: kapan, di mana, siapa yang dihubungi, dan berapa yang sudah dibayar. Bahasa antarmuka: Indonesia.

Fitur: agenda per bulan + kalender, pembayaran cicilan (DP + pelunasan), buku kontak penanggung jawab (WhatsApp / telepon sekali ketuk), duplikat dan ulangi event, bisa dipasang di HP, bisa dibaca saat offline.

## Struktur

```
backend/    PocketBase (API + database), juga menyajikan aplikasi dari pb_public/
frontend/   React + Vite (PWA), di-build ke backend/pb_public/
setup.sh    setup lokal sekali jalan (backend + frontend)
dev.sh      mode develop: backend :8090 + frontend :5173 (hot reload)
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
  pocketbase(.exe) + pb_data/ + pb_public/   diunduh/dibuat lokal, tidak di-commit
frontend/
  src/lib/         logika murni: uang, telepon, tanggal, pembayaran, pengulangan
  src/api/         akses data (PocketBase SDK + TanStack Query)
  src/components/  komponen UI; ui/ = komponen dasar
  src/routes/      halaman
  e2e/, e2e-pwa/   tes browser
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

Tanpa data contoh: `./setup.sh`. Data contoh ada di Oktober dan November 2026.

| Alamat | Isi |
| --- | --- |
| http://localhost:5173/l/bazar-saya | lapak contoh, kode akses **`bazar-123`** |
| http://localhost:5173/admin | **panel admin** (`admin@local.test` / `admin-pass-123`) |
| http://127.0.0.1:8090/_/ | panel bawaan PocketBase (database mentah, akun yang sama) |

Setiap lapak dibuka lewat link-nya sendiri (`/l/<link-lapak>`). Perangkat mengingat lapak terakhir, jadi berikutnya cukup buka aplikasi.

### Panel admin

Semua urusan lapak lewat **/admin**, tanpa terminal:

- **Lapak baru**: nama, link, kode akses. Setelah dibuat, salin atau kirim link + kode lewat WhatsApp.
- **Detail lapak**: ganti nama, ganti kode akses (semua perangkat lapak itu keluar), kosongkan data, hapus lapak.
- **Backup**: lihat backup, buat backup sekarang, pulihkan (hanya di server Linux/VPS).

Kosongkan data, hapus lapak dan pulihkan wajib diketik konfirmasinya, dan backup otomatis dibuat dulu.

### Mode produksi di lokal (satu server, seperti di VPS)

```bash
cd backend && npm start     # build frontend ke pb_public/, lalu PocketBase :8090
```

Buka **http://127.0.0.1:8090/l/bazar-saya** (aplikasi) atau **/admin** (panel admin): semua di satu alamat. Fitur offline dan pasang di HP aktif di mode ini.

### Jalankan terpisah

```bash
cd backend && npm run dev      # terminal 1: PocketBase
cd frontend && npm run dev     # terminal 2: web
```

Di lokal, frontend mem-proxy `/api` ke `http://127.0.0.1:8090` (`VITE_PB_URL` kosong di `frontend/.env.local`).

### Nilai bawaan setup lokal

```bash
GROUP_PASSCODE='kode-baru-min-6' WORKSPACE_NAME='Lapak Rina' WORKSPACE_SLUG='lapak-rina' ./setup.sh
```

| Variabel | Bawaan |
| --- | --- |
| `GROUP_PASSCODE` | `bazar-123` (minimal 6 karakter) |
| `WORKSPACE_NAME` / `WORKSPACE_SLUG` | `Bazar Saya` / `bazar-saya` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@local.test` / `admin-pass-123` (superuser + panel admin) |

Setelah setup, lapak lain dibuat lewat panel admin.

### Reset database lokal

Untuk satu lapak cukup lewat panel admin (Kosongkan data). Untuk semuanya:

```bash
rm -rf backend/pb_data
./setup.sh --seed
```

## Deploy

Satu server di VPS (PocketBase menyajikan aplikasi + API di satu domain): [backend/DEPLOY.md](backend/DEPLOY.md).

```bash
cd backend && DEPLOY_HOST=you@vps npm run deploy   # build frontend + kirim + restart
```

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

Pintasan desktop: `n` event baru, `←` `→` pindah bulan, `t` hari ini, `/` cari. Fitur offline dan pasang di HP hanya aktif di hasil build (`cd backend && npm start`, atau di VPS), bukan `./dev.sh`.

## Masalah umum

| Gejala | Solusi |
| --- | --- |
| `./setup.sh: Permission denied` / error `\r` | Jalankan di Git Bash: `bash setup.sh --seed`. Bila CRLF: `sed -i 's/\r$//' *.sh backend/scripts/*.sh` |
| Login "Kode salah" | Kode salah, atau perangkat masih ingat lapak lain: buka link lapak yang benar (`/l/<link-lapak>`) |
| Login diblokir | Batas 5 kali / 60 detik. Tunggu semenit |
| Port 8090/5173 terpakai | PowerShell: `Get-NetTCPConnection -LocalPort 8090,5173 -State Listen \| % { Stop-Process -Id $_.OwningProcess -Force }` |
| "Buka link lapak" di layar masuk | Perangkat belum pernah membuka link lapak. Buka `/l/<link-lapak>` dari admin |
| "Workspace tidak ditemukan" | Setup belum jalan atau `backend/pb_data` terhapus: `./setup.sh --seed` |
