# Bazar Manager

Aplikasi web (PWA, mobile-first) untuk mengatur jadwal bazar/booth per bulan: kapan, di mana, siapa yang dihubungi, dan berapa yang sudah dibayar. Bahasa antarmuka: Indonesia.

Fitur: agenda per bulan + tampilan kalender, catat pembayaran cicilan (DP + pelunasan), buku kontak penanggung jawab (WhatsApp / telepon sekali ketuk), duplikat dan ulangi event, bisa dipasang di HP, dan bisa dibaca saat offline.

Dokumen lain: [PRD.md](PRD.md) (spesifikasi), [DESIGN.md](DESIGN.md) (desain), [DEPLOY.md](DEPLOY.md) (pasang di server).

## Teknologi

- Backend: [PocketBase](https://pocketbase.io) 0.40.4 (satu file program, database SQLite, API, login)
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS 4
- Tes: Vitest, Testing Library, Playwright, axe

## Yang perlu dipasang dulu

| Perangkat | Versi | Cek |
| --- | --- | --- |
| Node.js | 20 atau lebih baru (diuji di 24) | `node -v` |
| Git Bash (Windows) atau terminal Linux/macOS | | |
| Google Chrome | untuk tes browser | |

Windows: jalankan semua perintah di bawah di **Git Bash**, bukan CMD/PowerShell. Koneksi internet dibutuhkan saat setup (unduh PocketBase dan paket npm).

## Install dan jalankan (pertama kali)

Dari folder proyek:

```bash
# 1. Setup sekali jalan: unduh PocketBase, pasang paket, buat akun admin, user grup, workspace, dan data contoh
scripts/setup-local.sh --seed

# 2. Jalankan aplikasi (PocketBase + web sekaligus)
scripts/dev.sh
```

Buka **http://localhost:5173** dan masuk dengan kode akses **`bazar-123`**.

Hentikan dengan `Ctrl+C`.

Tanpa data contoh: jalankan `scripts/setup-local.sh` tanpa `--seed`. Data contoh berisi event di Oktober dan November 2026, jadi pindah bulan dengan tombol panah di agenda.

### Ganti kode akses, email atau nama

Setup memakai nilai bawaan ini. Ganti lewat variabel lingkungan sebelum menjalankan setup:

```bash
GROUP_PASSCODE='kode-baru-min-6' WORKSPACE_NAME='Lapak Rina' scripts/setup-local.sh
```

| Variabel | Bawaan |
| --- | --- |
| `GROUP_PASSCODE` | `bazar-123` (kode akses, minimal 6 karakter) |
| `GROUP_EMAIL` | `grup@bazar.local` (tersimpan di `web/.env.local`) |
| `WORKSPACE_NAME` | `Bazar Saya` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | `admin@local.test` / `admin-pass-123` |

Nama lapak juga bisa diganti dari menu Pengaturan di aplikasi.

### Mulai dari nol lagi

Hapus database lokal lalu setup ulang:

```bash
rm -rf .pb/data
scripts/setup-local.sh --seed
```

## Setiap kali mau pakai

```bash
scripts/dev.sh
```

- Aplikasi: http://localhost:5173
- API PocketBase: http://127.0.0.1:8090
- Panel admin PocketBase: http://127.0.0.1:8090/_/ (login `admin@local.test`)

### Jalankan manual (tanpa dev.sh)

Terminal A:

```bash
.pb/pocketbase.exe serve --http=127.0.0.1:8090 --dir=.pb/data --migrationsDir=pb/pb_migrations
```

(di Linux/macOS: `.pb/pocketbase`)

Terminal B:

```bash
cd web
npm run dev
```

## Cara pakai singkat

1. **Masuk** dengan kode akses.
2. **Tambah event**: tombol `+` (HP) atau tombol "Tambah event" (desktop), atau tekan `n`. Isi judul, tanggal, lokasi, biaya booth. Pilih kontak atau buat kontak baru di formulir yang sama.
3. **Ulangi**: centang "Ulangi" saat membuat event, pilih frekuensi dan tanggal akhir, hilangkan centang pada tanggal yang tidak diinginkan.
4. **Catat pembayaran**: buka event, "Catat pembayaran" untuk DP, "Lunasi" untuk mengisi sisa otomatis.
5. **Duplikat**: buka event, "Duplikat", pilih beberapa tanggal. Pembayaran tidak ikut disalin.
6. **Kontak**: menu Kontak. Ketuk WhatsApp atau Telepon untuk langsung menghubungi.
7. **Kalender**: di agenda, pilih "Kalender". Ketuk tanggal untuk melihat event hari itu.
8. **Kunci**: Pengaturan, "Kunci". Ini juga menghapus data tersimpan di perangkat.

Pintasan keyboard (desktop): `n` event baru, `←` `→` pindah bulan, `t` ke hari ini, `/` cari.

Pasang di HP: Chrome menu "Install app"; iPhone Safari: Bagikan, "Tambah ke Layar Utama". Fitur PWA (offline, pasang) hanya aktif pada hasil build, bukan di `npm run dev`.

## Menjalankan tes

Semua dari folder `web`:

```bash
cd web
npm test             # tes unit dan komponen (cepat)
npm run test:rules   # tes aturan akses PocketBase (menjalankan PocketBase sementara di port 8091/8092)
npm run e2e          # tes browser Chrome (mobile + desktop), butuh port 5173 dan 8090 kosong
npm run e2e:pwa      # tes offline/PWA pada hasil build, butuh port 4173 dan 8090 kosong
npx tsc --noEmit     # cek tipe
```

Tes `e2e` membuat database sementara sendiri; database lokal Anda tidak tersentuh. Hentikan `scripts/dev.sh` dulu sebelum menjalankan `e2e` karena port sama.

## Struktur folder

```
pb/pb_migrations/   skema database + aturan akses (JS, otomatis dijalankan PocketBase)
pb/tests/           tes aturan akses
scripts/            setup-local.sh, dev.sh, bootstrap.js, seed.js, deploy.sh, gen-icons.mjs
deploy/             bazar.service (systemd), nginx.bazar.conf
web/src/lib/        logika murni: uang, telepon, tanggal, pembayaran, pengulangan
web/src/api/        akses data (PocketBase + TanStack Query)
web/src/components/ komponen UI; ui/ = komponen dasar
web/src/routes/     halaman
web/e2e/            tes browser
.pb/                program + data PocketBase lokal (tidak di-commit)
```

## Build produksi dan pasang di server

```bash
cd web
VITE_GROUP_EMAIL=grup@bazar.local npm run build   # hasil di web/dist
```

Langkah lengkap pemasangan di VPS (Nginx, systemd, backup): lihat [DEPLOY.md](DEPLOY.md). Catatan: langkah itu belum pernah dicoba di server sungguhan.

## Masalah umum

| Gejala | Penyebab / solusi |
| --- | --- |
| `scripts/setup-local.sh: command not found` atau error `\r` | Jalankan di Git Bash dari folder proyek. Jika file terkonversi CRLF: `sed -i 's/\r$//' scripts/*.sh` |
| Login selalu "Kode salah" | Kode akses salah, atau `web/.env.local` berisi email berbeda dari `GROUP_EMAIL` saat setup. Setelah ubah `.env.local`, restart `scripts/dev.sh` |
| Login diblokir sebentar | Batas 5 percobaan per 60 detik. Tunggu semenit |
| `Port 8090/5173 already in use` | Ada proses lama. Tutup terminal lama atau di PowerShell: `Get-NetTCPConnection -LocalPort 8090 -State Listen \| % { Stop-Process -Id $_.OwningProcess -Force }` |
| Halaman kosong / "Workspace tidak ditemukan" | Setup belum dijalankan atau database terhapus. Ulangi `scripts/setup-local.sh --seed` |
| Tes e2e gagal mulai | Pastikan Chrome terpasang dan port 5173/8090 kosong |
| Event bulan ini kosong padahal ada data contoh | Data contoh ada di Okt dan Nov 2026; pindah bulan |

## Lisensi

Belum ditentukan.
