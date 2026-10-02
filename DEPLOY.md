# Deploying Bazar Manager

One PocketBase binary serves the API and the built SPA. Nginx only terminates SSL and proxies. Target: Ubuntu 22.04 VPS, domain `bazar.nasfcakes.cloud` (change it in `deploy/nginx.bazar.conf` and `scripts/deploy.sh` if different).

Pinned PocketBase version: **0.40.4** (`linux_amd64`).

Status: files are written but **not yet tested on a VPS**. Step 14's gate (production smoke, restore test) is still open.

## 1. First install (on the VPS)

```bash
# user and directories
sudo useradd --system --home /opt/bazar --shell /usr/sbin/nologin bazar
sudo mkdir -p /opt/bazar/pb_public /opt/bazar/pb_migrations /opt/bazar/pb_data
sudo chown -R bazar:bazar /opt/bazar

# binary + checksum
cd /tmp
V=0.40.4
curl -fsSLO https://github.com/pocketbase/pocketbase/releases/download/v$V/pocketbase_${V}_linux_amd64.zip
curl -fsSLO https://github.com/pocketbase/pocketbase/releases/download/v$V/checksums.txt
grep "pocketbase_${V}_linux_amd64.zip" checksums.txt | sha256sum -c -
sudo apt-get install -y unzip
sudo unzip -o pocketbase_${V}_linux_amd64.zip pocketbase -d /opt/bazar
sudo chown bazar:bazar /opt/bazar/pocketbase && sudo chmod 750 /opt/bazar/pocketbase

# service
sudo cp deploy/bazar.service /etc/systemd/system/bazar.service
sudo systemctl daemon-reload

# nginx + SSL
sudo cp deploy/nginx.bazar.conf /etc/nginx/sites-available/bazar
sudo ln -s /etc/nginx/sites-available/bazar /etc/nginx/sites-enabled/bazar
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d bazar.nasfcakes.cloud
```

## 2. First deploy (from your machine)

Migrations create the collections and settings (auth rate limit 5 / 60 s, daily backup 02:00 WIB keeping 7).

```bash
DEPLOY_HOST=you@vps VITE_GROUP_EMAIL=grup@example.com scripts/deploy.sh
```

`VITE_GROUP_EMAIL` is baked into the build. It is the group user's email, not a secret.

## 3. Create the superuser, group user and workspace

Do this over an SSH tunnel; the admin UI and superuser login are blocked in Nginx.

```bash
# on the VPS (once): create the superuser
sudo -u bazar /opt/bazar/pocketbase superuser upsert you@example.com 'a-long-password' --dir=/opt/bazar/pb_data
sudo systemctl restart bazar

# on your machine
ssh -L 8090:127.0.0.1:8090 you@vps
# in another terminal, from the repo root:
PB_URL=http://127.0.0.1:8090 ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-password' \
GROUP_EMAIL=grup@example.com GROUP_PASSCODE='min-6-chars' WORKSPACE_NAME='Bazar Saya' \
node scripts/bootstrap.js
```

The script is idempotent. The passcode is the group user's password: keep it in your password manager. Never commit it.

## 4. Admin UI

`ssh -L 8090:127.0.0.1:8090 you@vps`, then open `http://127.0.0.1:8090/_/`.

## 5. Updates

Re-run `scripts/deploy.sh`. It rsyncs `web/dist/` to `pb_public/` and `pb/pb_migrations/` to `pb_migrations/`, restarts the service and checks `/api/health`. It never touches `pb_data/`.

## 6. Backups

- PocketBase writes a backup daily at 02:00 WIB (19:00 UTC) and keeps 7, into `pb_data/backups/`.
- Off-server copy (weekly) is **not decided yet**. Example once a target exists, in the `bazar` user's crontab:

```cron
0 3 * * 0  rsync -az /opt/bazar/pb_data/backups/ backup-user@backup-host:bazar-backups/
```

### Restore test (do this once before relying on backups)

1. Pick a file in `/opt/bazar/pb_data/backups/`.
2. On a scratch directory: `mkdir /tmp/restore && unzip <backup>.zip -d /tmp/restore`.
3. Run `/opt/bazar/pocketbase serve --http=127.0.0.1:8099 --dir=/tmp/restore/pb_data` (adjust to the unzipped layout) and check the event count in the admin UI over a tunnel to port 8099.
4. To restore for real: `systemctl stop bazar`, move the current `pb_data` aside, put the unzipped data in place, `chown -R bazar:bazar`, `systemctl start bazar`.

## 7. Production smoke (phone)

Unlock with the passcode, add an event, record a payment, then install the PWA (Chrome: menu, Install app; iOS Safari: Share, Add to Home Screen).
