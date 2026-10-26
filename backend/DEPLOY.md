# Deploy ke VPS (satu server)

Satu proses PocketBase menyajikan aplikasi (hasil build frontend di `pb_public/`) sekaligus API, di satu domain. Nginx di depannya untuk HTTPS dan memblokir panel admin.

Target: Ubuntu 22.04, Nginx, domain contoh `bazar.nasfcakes.cloud` (ganti di `deploy/nginx.bazar.conf` dan `scripts/deploy.sh`). PocketBase dipin di versi **0.40.4** (`scripts/pb-version.sh`).

Status: file ini belum pernah dicoba di VPS sungguhan.

## Isi di server

```
/opt/bazar/
├─ pocketbase        binary linux_amd64
├─ pb_public/        hasil build frontend (dikirim deploy.sh)
├─ pb_migrations/    dari repo (otomatis dijalankan saat start)
├─ pb_hooks/         dari repo
├─ pb_data/          database + upload (JANGAN ditimpa saat deploy)
└─ .env              opsional: INFERHUB_* untuk asisten AI (chmod 600)
```

## 1. Install pertama (di VPS)

```bash
sudo useradd --system --home /opt/bazar --shell /usr/sbin/nologin bazar
sudo mkdir -p /opt/bazar/pb_public /opt/bazar/pb_migrations /opt/bazar/pb_hooks /opt/bazar/pb_data
cd /tmp
V=0.40.4
curl -fsSLO https://github.com/pocketbase/pocketbase/releases/download/v$V/pocketbase_${V}_linux_amd64.zip
curl -fsSLO https://github.com/pocketbase/pocketbase/releases/download/v$V/checksums.txt
grep "pocketbase_${V}_linux_amd64.zip" checksums.txt | sha256sum -c -
sudo apt-get install -y unzip
sudo unzip -o pocketbase_${V}_linux_amd64.zip pocketbase -d /opt/bazar
sudo chown -R bazar:bazar /opt/bazar && sudo chmod 750 /opt/bazar/pocketbase
```

Salin file dari repo (folder `backend/`) ke server, misalnya dengan `scp`, lalu:

```bash
sudo cp deploy/bazar.service /etc/systemd/system/bazar.service
sudo systemctl daemon-reload && sudo systemctl enable bazar
sudo cp deploy/nginx.bazar.conf /etc/nginx/sites-available/bazar
sudo ln -s /etc/nginx/sites-available/bazar /etc/nginx/sites-enabled/bazar
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d bazar.nasfcakes.cloud
```

User yang dipakai untuk deploy perlu boleh menulis ke `/opt/bazar` (mis. masuk grup `bazar`) dan menjalankan `sudo systemctl restart bazar`.

## 2. Kirim aplikasi dan jalankan (dari komputer Anda)

```bash
cd backend
DEPLOY_HOST=you@vps npm run deploy
```

Skrip ini: build frontend ke `backend/pb_public/`, rsync `pb_public`, `pb_migrations`, `pb_hooks` ke `/opt/bazar`, restart service, lalu cek `/api/health`.

Migrasi membuat semua tabel, aturan akses, batas login (5 kali / 60 detik) dan backup harian 02:00 WIB (simpan 7).

## 3. Buat akun admin panel (sekali)

Setelah deploy pertama, server mencetak link setup sekali pakai di log (berlaku 24 jam):

```bash
sudo journalctl -u bazar | grep admin/setup
```

Buka link itu (`https://bazar.nasfcakes.cloud/admin/setup?token=…`), buat email + password admin (minimal 12 karakter, simpan di password manager). Setelah itu semua lewat **https://bazar.nasfcakes.cloud/admin**: buat lapak, kirim link + kode ke tiap tim, ganti kode, kosongkan/hapus lapak, backup dan pulihkan.

Link kedaluwarsa sebelum dipakai: `sudo systemctl restart bazar`, lalu ambil link baru dari log.

Supaya link setup di log memakai domain yang benar, isi **Application URL** di panel bawaan PocketBase (Settings, lewat tunnel di bawah) dengan `https://bazar.nasfcakes.cloud`. Tanpa itu link tercetak dengan `http://127.0.0.1:8090`; cukup ganti bagian depannya dengan domain Anda.

### Panel bawaan PocketBase (darurat)

`/_/` tetap diblokir dari internet. Untuk akses database mentah, buat superuser lalu buka lewat SSH tunnel:

```bash
# di VPS, sekali
sudo -u bazar /opt/bazar/pocketbase superuser upsert you@example.com 'password-panjang' --dir=/opt/bazar/pb_data

# di komputer Anda
ssh -L 8090:127.0.0.1:8090 you@vps
# lalu buka http://127.0.0.1:8090/_/
```

Lupa password admin panel: lewat tunnel, buka koleksi `admins` di `/_/` dan ganti password-nya (atau hapus admin, restart service, dan pakai link setup baru).

## Asisten AI (opsional)

Kunci InferHub hanya di server, di `/opt/bazar/.env` (dibaca systemd):

```bash
sudo tee /opt/bazar/.env >/dev/null <<'ENV'
INFERHUB_API_KEY=isi-kunci-anda
INFERHUB_MODEL=cb/deepseek-v4.1-flash
ENV
sudo chown bazar:bazar /opt/bazar/.env && sudo chmod 600 /opt/bazar/.env
sudo systemctl restart bazar
```

Daftar variabel lengkap: `backend/.env.example`. Tanpa kunci, tombol Asisten tidak muncul di aplikasi.

## 4. Update berikutnya

```bash
cd backend
DEPLOY_HOST=you@vps npm run deploy
```

## 5. Backup

- Otomatis harian 02:00 WIB ke `/opt/bazar/pb_data/backups/`, simpan 7.
- Salinan ke luar server belum ditentukan. Contoh crontab mingguan untuk user `bazar`:

```cron
0 3 * * 0  rsync -az /opt/bazar/pb_data/backups/ backup-user@backup-host:bazar-backups/
```

### Uji restore (lakukan sekali sebelum mengandalkan backup)

1. `mkdir /tmp/restore && unzip /opt/bazar/pb_data/backups/<file>.zip -d /tmp/restore`
2. `/opt/bazar/pocketbase serve --http=127.0.0.1:8099 --dir=/tmp/restore` lalu cek jumlah event lewat tunnel ke port 8099.
3. Restore sungguhan: `systemctl stop bazar`, pindahkan `pb_data` lama, taruh hasil unzip, `chown -R bazar:bazar /opt/bazar/pb_data`, `systemctl start bazar`.

## Catatan

- API di host lain (mis. frontend di CDN) tetap bisa: isi `VITE_PB_URL` saat build dan tambahkan `--origins=https://domain-frontend` di `bazar.service`. Tidak dipakai di setup ini.
