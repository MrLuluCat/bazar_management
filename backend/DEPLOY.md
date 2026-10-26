# Deploy backend (VPS)

Backend = PocketBase (API + database). Frontend dipasang terpisah di Vercel, lihat [../frontend/DEPLOY.md](../frontend/DEPLOY.md).

Target: Ubuntu 22.04, Nginx, domain contoh `api-bazar.nasfcakes.cloud` (ganti di `deploy/nginx.bazar.conf` dan `scripts/deploy.sh`). PocketBase dipin di versi **0.40.4** (`scripts/pb-version.sh`).

Status: file ini belum pernah dicoba di VPS sungguhan.

## Isi di server

```
/opt/bazar/
├─ pocketbase        binary linux_amd64
├─ pb_migrations/    dari repo (otomatis dijalankan saat start)
├─ pb_hooks/         dari repo
├─ pb_data/          database + upload (JANGAN ditimpa saat deploy)
└─ .env              BAZAR_ORIGINS=https://<domain-vercel-anda>
```

## 1. Install pertama (di VPS)

```bash
sudo useradd --system --home /opt/bazar --shell /usr/sbin/nologin bazar
sudo mkdir -p /opt/bazar/pb_migrations /opt/bazar/pb_hooks /opt/bazar/pb_data
cd /tmp
V=0.40.4
curl -fsSLO https://github.com/pocketbase/pocketbase/releases/download/v$V/pocketbase_${V}_linux_amd64.zip
curl -fsSLO https://github.com/pocketbase/pocketbase/releases/download/v$V/checksums.txt
grep "pocketbase_${V}_linux_amd64.zip" checksums.txt | sha256sum -c -
sudo apt-get install -y unzip
sudo unzip -o pocketbase_${V}_linux_amd64.zip pocketbase -d /opt/bazar

# domain frontend yang boleh akses API (CORS); pisahkan dengan koma bila lebih dari satu
echo 'BAZAR_ORIGINS=https://bazar.vercel.app' | sudo tee /opt/bazar/.env
sudo chown -R bazar:bazar /opt/bazar && sudo chmod 750 /opt/bazar/pocketbase
```

Salin file dari repo (folder `backend/`) ke server, misalnya dengan `scp`, lalu:

```bash
sudo cp deploy/bazar.service /etc/systemd/system/bazar.service
sudo cp deploy/nginx.bazar.conf /etc/nginx/sites-available/bazar-api
sudo ln -s /etc/nginx/sites-available/bazar-api /etc/nginx/sites-enabled/bazar-api
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api-bazar.nasfcakes.cloud
```

## 2. Kirim migrasi dan jalankan (dari komputer Anda)

```bash
cd backend
DEPLOY_HOST=you@vps npm run deploy
```

Migrasi membuat semua tabel, aturan akses, batas login (5 kali / 60 detik) dan backup harian 02:00 WIB (simpan 7).

## 3. Buat superuser, user grup dan workspace

Panel admin dan login superuser diblokir Nginx. Lewat SSH tunnel:

```bash
# di VPS, sekali
sudo -u bazar /opt/bazar/pocketbase superuser upsert you@example.com 'password-panjang' --dir=/opt/bazar/pb_data
sudo systemctl restart bazar

# di komputer Anda, terminal 1
ssh -L 8090:127.0.0.1:8090 you@vps

# terminal 2, dari folder backend
PB_URL=http://127.0.0.1:8090 ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='password-panjang' \
GROUP_EMAIL=grup@example.com GROUP_PASSCODE='kode-min-6' WORKSPACE_NAME='Bazar Saya' \
npm run bootstrap
```

`GROUP_EMAIL` yang sama dipakai sebagai `VITE_GROUP_EMAIL` di Vercel. Kode akses (`GROUP_PASSCODE`) simpan di password manager, jangan di-commit.

Panel admin: dengan tunnel aktif, buka http://127.0.0.1:8090/_/.

## 4. Update berikutnya

```bash
cd backend
DEPLOY_HOST=you@vps npm run deploy
```

Ganti domain frontend (CORS): ubah `/opt/bazar/.env`, lalu `sudo systemctl restart bazar`.

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
