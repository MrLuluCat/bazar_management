# Admin panel (multi-lapak) — design

Date: 2026-10-26. Status: approved by owner in chat ("lanjutkan terus tanpa confirm").

## Goal

The owner runs one server (VPS, PocketBase serving app + API). After the server starts, everything that used to need a terminal is done in a web GUI: create the first admin, create lapak (group + workspace), rename, change passcode, clear a lapak's data, delete a lapak, list/create/restore backups.

## Decisions

- Panel lives in the app at `/admin/*`, online on the VPS. PocketBase's own `/_/` and superuser login stay blocked by Nginx (SSH tunnel only).
- Admin = separate auth collection `admins`, not a PocketBase superuser. Privileged work runs server-side in `pb_hooks` routes under `/api/admin/*`, each requiring `admins` auth. A leaked admin token can only do panel actions, never schema changes.
- First admin: setup wizard guarded by a one-time token. While no admin exists, the server generates a random token on start, stores its SHA-256 hash, and logs `/admin/setup?token=…`. Valid 24 h, single use. A restart while still no admin replaces the token.
- Lapak login: link per lapak, `/l/:slug`. `GET /api/lapak/:slug` returns `{ name, email }` of the group user. The device remembers the last lapak. `/unlock` without a remembered lapak tells the user to ask the admin for the link. `VITE_GROUP_EMAIL` is removed.
- Reset scope: clear one lapak's data (events, payments, contacts), delete one lapak (workspace + group user + data), restore a backup. No "wipe whole database" in the online panel.
- Every destructive action (clear, delete, restore) requires typing the confirmation word (the lapak slug, or the word `pulihkan` for a restore) and creates a `pre-*.zip` backup first. Only the 10 newest `pre-*` backups are kept.

## Data

- `workspaces.slug`: text, required, pattern `^[a-z0-9]+(-[a-z0-9]+)*$`, 3–40 chars, unique index. Existing rows get a slug from their name (fallback `lapak`), de-duplicated with a suffix.
- `admins`: auth collection. Password min 12. Auth token 8 h. List/view self only; create/update/delete null (only hooks create).
- `admin_setup`: base collection, all rules null. Fields `token_hash`, `expires`.
- Group users get email `lapak-<slug>@bazar.local` (internal, never shown).

## API (`pb_hooks/admin.pb.js`, helpers in `pb_hooks/lib/admin.js`)

Public:
- `GET /api/lapak` → `{ items: [{ name, slug }] }` for the start-screen picker (owner request 2026-10-26: lapak names are visible to anyone who opens the site; data still needs the passcode).
- `GET /api/lapak/{slug}` → `{ name, email }` or 404.
- `GET /api/admin/setup` → `{ needed: boolean }`.
- `POST /api/admin/setup` `{ token, email, password }` → creates the first admin, deletes the token. 403 if an admin exists or token wrong/expired.

Admin-only (`$apis.requireAuth("admins")`):
- `GET /api/admin/lapak` → list with `events`, `contacts` counts.
- `POST /api/admin/lapak` `{ name, slug, passcode }` → workspace + user + owner membership.
- `PATCH /api/admin/lapak/{id}` `{ name }`.
- `POST /api/admin/lapak/{id}/passcode` `{ passcode }` (min 6). Existing sessions of that lapak are signed out.
- `POST /api/admin/lapak/{id}/clear` `{ confirm: slug }`.
- `DELETE /api/admin/lapak/{id}` `{ confirm: slug }`.
- `GET /api/admin/backups`, `POST /api/admin/backups`, `POST /api/admin/backups/{name}/restore` `{ confirm: "pulihkan" }`. Restore is refused on Windows (PocketBase cannot restart there); the VPS is Linux.

Errors: JSON `{ message }` in Indonesian, 400 for validation, 403 for confirmation mismatch.

Rate limits: `*:auth` 5/60 s already covers admin login; `/api/admin/` 30/60 s; `GET /api/lapak/` 20/60 s.

## Frontend

- `lib/adminPb.ts`: second PocketBase client with its own auth store key (`pb_admin`), so admin and lapak sessions never mix.
- `lib/lapak.ts`: remembered lapak in localStorage (`bazar.lapak`), read with try/catch.
- Routes (lazy): `/l/:slug`, `/admin/setup`, `/admin/login`, `/admin` (lapak list + create), `/admin/lapak/:id` (rename, passcode, link, danger zone), `/admin/backup`.
- UI follows DESIGN.md (existing tokens, components). Mobile first.

## Testing

- Backend (vitest, real PocketBase): setup token single use and required; admin routes reject anonymous and lapak users; create lapak → login works; passcode change; clear keeps lapak, removes data, other lapak untouched; delete removes user and workspace; destructive actions without the right confirm return 403; a `pre-*` backup appears; slug lookup.
- E2E: unlock via `/l/:slug`; admin login, create lapak, open its link and log in; axe on admin pages.

## Out of scope

Wipe-all from the panel, multiple admin roles, admin password reset by email. A forgotten admin password is reset through PocketBase's own `/_/` over an SSH tunnel (edit the `admins` record, or delete it and use a fresh setup link).
