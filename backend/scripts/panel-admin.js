// Local setup only: create (or keep) a panel admin, so /admin works without the one-time setup link.
// CLI: ADMIN_EMAIL=… ADMIN_PASSWORD=… [PB_URL=…] node scripts/panel-admin.js   (ADMIN_* = the superuser; reused for the panel)
import { adminLogin } from './bootstrap.js'

const url = process.env.PB_URL ?? 'http://127.0.0.1:8090'
const email = process.env.ADMIN_EMAIL
const password = process.env.ADMIN_PASSWORD
const token = await adminLogin(url, email, password)
const q = new URLSearchParams({ filter: `email="${email}"` })
const found = await fetch(`${url}/api/collections/admins/records?${q}`, { headers: { Authorization: token } }).then((r) => r.json())
if (found.items?.length) {
  console.log('panel admin ok (sudah ada)', email)
} else {
  const res = await fetch(`${url}/api/collections/admins/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ email, password, passwordConfirm: password, verified: true }),
  })
  if (!res.ok) throw new Error('panel admin gagal: ' + (await res.text()))
  console.log('panel admin ok', email)
}
