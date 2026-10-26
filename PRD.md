# PRD — Bazar Manager

Oct 2, 2026 · @maji

## 1. Overview

Bazar Manager = mobile-first PWA to plan bazaar/booth events per month: when, where, who to call, how much paid. Standalone product, not tied to Lazizah. Generic so any vendor/small team can use it.

**Problem.** Vendors join 5–15 bazaars/month (CFD, school events, open houses). Schedule lives in chat + notes. Easy to lose: which day, booth fee paid or not, organizer phone.

**Goals (v1)**

- See this month's bazaars at a glance, grouped by date, incl. 2–3 events on same day.
- Know per event: date, time, location, organizer contact, booth cost, paid amount, remaining.
- Record installment payments (DP + pelunasan).
- Reusable contact book of organizers (PJ), one-tap WhatsApp / call.
- Create repeat events fast: duplicate, or recurring series.
- Sync across phone + laptop. Installable PWA. Readable offline.

**Non-goals (v1)** — deferred, design must not block them:

- Personal accounts, signup, invites (data model ready: workspaces + memberships).
- Reminders / push notifications.
- Sales/omzet tracking per bazaar, stock.
- Export (CSV/PDF), reports beyond monthly summary.
- Offline editing + conflict sync.

**Users (v1).** One person or small group sharing one passcode. Mostly on phone at booth/on the road, sometimes laptop for bulk input.

**Success.** Add an event in < 30 s on phone. Answer "what's on Saturday + is it paid?" in < 5 s from app open. Zero lost organizer numbers.

**UI language.** Bahasa Indonesia (copy, dates `Sab, 12 Okt 2026`, currency `Rp 150.000`). Code + docs English.

## 2. Feature requirements

IDs used by test checklist (§9) and build order (§11).

**F1 — Passcode gate**

- Unlock screen: single passcode field, numeric keypad hint allowed but alphanumeric accepted (min 6 chars).
- Passcode = password of one PocketBase "group" user. Email hidden, set via build env `VITE_GROUP_EMAIL`.
- Session persists (PocketBase authStore, localStorage). Auto-refresh token on app start. Lock button in Settings clears it.
- Wrong passcode: inline error "Kode salah", no hint which part. Rate limit via PocketBase settings: 5 attempts / 60 s per IP on auth endpoint.

**F2 — Agenda (home)**

- Month view as vertical agenda, grouped by date header (`Sab, 12 Okt`). Only dates with events shown.
- Event row: title, time range, location, payment badge, remaining amount if > 0. Cancelled = muted + strikethrough title + "Batal" tag.
- Month nav ‹ › + "Hari ini" (jumps to current month, scrolls to today or next upcoming date).
- Summary strip: event count (active only), total cost, total remaining.
- Filter chips: Semua · Akan datang · Belum lunas. Search box (title, location, contact name), client-side within loaded month.
- Today's date header visually marked. Past dates dimmed slightly, still tappable.

**F3 — Calendar view**

- Toggle Agenda ↔ Kalender (segmented control, choice remembered in localStorage).
- Month grid Mon–Sun. Day cell: date number + event count dot(s) (1 dot, 2 dots, or "3+"). Unpaid-any = accent dot.
- Tap day → bottom sheet listing that day's events (same row component as F2). Desktop: side panel instead of sheet.

**F4 — Event CRUD**

- Fields: title*, date*, start_time, end_time, location*, contact (picker from contact book, or "+ Kontak baru" inline), total_cost (Rp, default 0), notes, status (Aktif/Batal).
- Validation: end_time ≥ start_time when both set; total_cost ≥ 0 integer.
- Create/edit in bottom sheet (mobile) / modal (≥ 768 px). FAB "+" on mobile, header button on desktop.
- Event detail screen: all fields, payment section (F5), contact card with WhatsApp + Telepon buttons, actions: Edit, Duplikat, Batalkan/Aktifkan, Hapus.
- Delete asks confirm; deletes payments too (cascade). Series event → choose scope (F6).

**F5 — Payments (installments)**

- Event has many payments: amount*, paid_at* (default today), note, proof (image ≤ 5 MB, optional).
- Derived, never stored: `paid = Σ amount`, `remaining = max(total_cost − paid, 0)`.
- Status: total_cost = 0 → Gratis · paid = 0 → Belum bayar · 0 < paid < total → DP · paid ≥ total → Lunas. Overpaid → Lunas + "Lebih Rp X" note.
- Quick action "Lunasi" pre-fills remaining amount.
- Edit/delete payment with confirm.

**F6 — Repeat & duplicate**

- Duplikat: copy title, location, contact, times, total_cost, notes to one or more picked dates (multi-date picker). Payments NOT copied. Each copy independent (no series_id).
- Ulangi (on create or from detail): frequency weekly / every 2 weeks / monthly (same date), until date; preview list of generated dates, user can untick any before save. Max 52 occurrences.
- Generated events share `series_id` (uuid). Edit/delete on series event asks: "Hanya event ini" / "Ini & seterusnya". "Seterusnya" applies field changes except date and payments to same-series events with date ≥ this date.

**F7 — Contact book**

- List (alphabetical, search), create/edit/delete. Fields: name*, phone*, organization, notes.
- Phone normalized on save to `62…` digits (accept `08…`, `+62…`, spaces, dashes). Display formatted `0812-3456-7890`.
- Contact detail: WhatsApp (`https://wa.me/62…`), Telepon (`tel:+62…`), list of linked events (upcoming first).
- Delete contact with linked events: confirm, events keep data but contact becomes empty.

**F8 — Settings**

- Workspace name (shown in header). Lock (logout). App version. "Install app" button when `beforeinstallprompt` available; iOS hint (Share → Add to Home Screen).

**F9 — States everywhere**

- Loading: skeleton rows, not spinners, for lists. Empty month: short line + "Tambah event" button. Error: inline message + Coba lagi. Offline: top banner "Offline — data terakhir", write buttons disabled with tooltip.

## 3. Architecture & stack

Single PocketBase process serves both the built SPA and the API; Nginx only terminates SSL and proxies. No Node/PHP runtime on server.

Browser talks to one origin, so no CORS. Admin UI is never public: owner reaches it through an SSH tunnel.

| Layer | Choice | Why |
| --- | --- | --- |
| Backend | PocketBase (pinned 0.x, Go binary) | DB + REST + auth + rules + backups in one file; auth ready for v2 accounts |
| DB | SQLite (inside PocketBase) | zero ops, file backup; fine for this scale |
| Frontend | React 19 + Vite + TypeScript | same stack as lazizah_app_v2 |
| Styling | Tailwind CSS 4, CSS-variable tokens | tokens from §6, light/dark |
| Data | PocketBase JS SDK + TanStack Query | caching, optimistic updates, offline persist |
| Routing | React Router 7 (SPA mode) | URL state for sheets |
| PWA | vite-plugin-pwa (Workbox) | manifest, precache, runtime cache |
| Tests | Vitest, Testing Library, Playwright, axe | §9 |
| Hosting | existing VPS, Nginx + systemd | §8 |

## 4. Data model & access rules

All domain data hangs off `workspace`, never off `user`. v1 = 1 user, 1 workspace, 1 membership. Later: personal accounts + invites = add users/memberships, zero data migration.

**Conventions**

- Money: `number`, integer rupiah, `onlyInt`, min 0. Never float.
- Date: `text` `YYYY-MM-DD` (regex `^\d{4}-\d{2}-\d{2}$`). Time: `text` `HH:mm`. Avoids UTC/WIB shift. Client formats with date-fns `id` locale, TZ Asia/Jakarta.
- IDs: PocketBase default 15-char. `series_id`: client-generated uuid v4.
- Schema lives in `pb_migrations/` (JS migrations, committed). Never edit schema only in admin UI.

**Collections**

| Collection | Fields | Indexes |
| --- | --- | --- |
| `users` (auth) | built-in email/password, `name` | built-in |
| `workspaces` | `name` text* | — |
| `memberships` | `workspace` rel* (cascade), `user` rel* (cascade), `role` select* owner/member | unique (workspace, user) |
| `contacts` | `workspace` rel* (cascade), `name` text*, `phone` text* (digits, starts `62`), `organization` text, `notes` text | (workspace, name) |
| `events` | `workspace` rel* (cascade), `title` text*, `date` text*, `start_time` text, `end_time` text, `location` text*, `contact` rel → contacts (set null), `total_cost` number*, `status` select* active/cancelled, `notes` text, `series_id` text | (workspace, date), (series_id) |
| `payments` | `event` rel* (cascade), `amount` number* (>0), `paid_at` text* date, `note` text, `proof` file (1, image/*, 5 MB, thumb 400x0) | (event) |

All collections: `created`, `updated` autodate.

**API rules** (member check; `M` below)

`M(ws)` = `@collection.memberships.workspace ?= ws && @collection.memberships.user ?= @request.auth.id`

| Collection | list / view | create | update | delete |
| --- | --- | --- | --- | --- |
| `workspaces` | `M(id)` | locked (superuser) | `M(id)` | locked |
| `memberships` | `user = @request.auth.id` | locked | locked | locked |
| `contacts`, `events` | `M(workspace)` | `M(@request.body.workspace)` | `M(workspace)` + workspace unchanged | `M(workspace)` |
| `payments` | `M(event.workspace)` | `M(@request.body.event.workspace)` | `M(event.workspace)` | `M(event.workspace)` |
| `users` | self only | locked (no signup v1) | self | locked |

Implementer: verify exact `?=` + `@collection` join syntax against installed PocketBase version docs; write rule tests (§9) hitting API as anon + as member + as non-member user.

**Bootstrap** (one-time, `backend/scripts/bootstrap.js` via `pocketbase` JS migration or CLI): create superuser, group user (email from env, passcode from env), workspace, owner membership. Idempotent.

**Derived (client, `lib/payment.ts`)**: `paid`, `remaining`, `paymentStatus` per F5. Monthly summary sums active events only.

## 5. Screens & UX flows

Four routes. Mobile: bottom nav (Agenda · Kontak · Pengaturan) + FAB. Desktop ≥ 1024 px: left rail nav, agenda list + detail side-by-side.

| Route | Screen | Key content |
| --- | --- | --- |
| `/unlock` | Unlock | Logo wordmark, passcode field, Masuk button |
| `/` | Agenda / Kalender | Month header, summary strip, filter chips, list or grid |
| `/event/:id` | Event detail | Fields, payment progress, payments list, contact card, actions |
| `/contacts`, `/contacts/:id` | Contacts | Searchable list, detail with linked events |
| `/settings` | Settings | Workspace name, install, lock, version |

Home agenda: date stub + dashed perforation, two events stacked on same day. Event detail: ledger bar, installment list, PJ contact actions.

Create/edit forms = overlay (sheet/modal) with URL state (`?new=event`, `?edit=:id`) so Back closes it.

**Flow A — add event (target < 30 s)**

1. FAB + → sheet opens, focus on Judul.
2. Tanggal defaults to selected day (calendar) or today. Lokasi autocompletes from past locations in workspace.
3. Kontak picker: search existing, or "+ Kontak baru" (name + phone inline, saved on submit).
4. Biaya booth (Rp, numeric keypad, live thousands separator).
5. Optional "Ulangi" toggle → frequency + until + preview list.
6. Simpan → toast "Event ditambahkan" + scroll to its date.

**Flow B — record payment**

1. Detail → "Catat pembayaran" (or "Lunasi").
2. Sheet: nominal (prefilled remaining for Lunasi), tanggal (today), catatan, foto bukti.
3. Simpan → progress bar + badge update optimistically; rollback + toast on error.

**Flow C — next semester**

1. Detail of past event → Duplikat → multi-date picker → Simpan → toast "3 event dibuat".

**Interaction rules**

- Touch targets ≥ 44 px. Sheets have drag handle + close button + Esc.
- Destructive actions: confirm dialog naming the object ("Hapus 'CFD South City' 12 Okt?"). Delete event offers Undo toast 5 s where feasible (soft confirm), payments hard-confirm.
- Forms: labels above fields, errors under field in plain Indonesian, submit disabled only while saving.
- Dates: always show weekday (`Sab, 12 Okt`). Money: `Rp 1.250.000`, tabular numerals.
- Keyboard (desktop): `n` new event, `←/→` month, `t` today, `/` search.

## 6. Design direction

Direction: **"buku agenda pasar"** — a vendor's paper agenda turned app. Calm, ink-on-paper, dense but breathable. Impeccable mode = **Operate**: scanability over expression; brand lives in a few precise details.

**Signature details (keep, few)**

- Date column as a ticket stub: weekday small caps above big tabular day number, thin dashed divider (perforation) between stub and event rows. Same stub on agenda + detail header.
- Payment as a thin ledger bar under each row (filled = paid share), plus text badge. Status never color-only: badge text + icon shape (○ Belum bayar, ◐ DP, ● Lunas, — Gratis).
- Money + dates in tabular numerals, right-aligned amounts.

**Tokens (starting point; impeccable may refine, must stay this restrained)**

| Token | Light | Dark |
| --- | --- | --- |
| `--paper` (bg) | warm off-white `oklch(0.975 0.008 85)` | `oklch(0.19 0.01 85)` |
| `--ink` (text) | `oklch(0.24 0.015 60)` | `oklch(0.93 0.01 85)` |
| `--muted` | `oklch(0.52 0.015 60)` | `oklch(0.68 0.012 85)` |
| `--line` | `oklch(0.88 0.01 80)` | `oklch(0.32 0.01 85)` |
| `--accent` (awning green) | `oklch(0.48 0.09 160)` | `oklch(0.72 0.1 160)` |
| `--paid` / `--partial` / `--unpaid` | green / amber / brick red, AA on paper | lifted for dark |

- Type: one UI family, e.g. Schibsted Grotesk or Instrument Sans (400/500/650), self-hosted woff2, `font-variant-numeric: tabular-nums` for numbers. Scale 13/15/17/22/28. No second display font unless impeccable justifies it.
- Radius 6–10 px, borders 1 px `--line`; elevation only on sheets/modals. Spacing 4-pt grid.
- Icons: one line set (Lucide), 1.5 px stroke. No emoji in UI.
- Motion: 150–220 ms ease-out, sheets slide, list items no stagger; respect `prefers-reduced-motion`.
- Dark mode via `prefers-color-scheme` + manual toggle in Settings.

**Banned (AI-slop list)**

- Purple/indigo gradients, gradient text, glassmorphism, glow shadows, neon.
- Hero sections, marketing copy, illustrations of people, sparkle/AI icons.
- Every element in a rounded white card with drop shadow; nested cards.
- Stat tiles with big colored icons in circles; donut charts for 3 numbers.
- Generic default Inter + slate-500 + blue-600 Tailwind look.
- Placeholder-as-label, centered body text, lorem copy, ALL CAPS buttons.

**Accessibility floor**: WCAG 2.2 AA contrast, visible focus ring (`--accent` 2 px offset), labels on every input, `aria-live` for toasts, sheets trap focus, works at 200% zoom, min width 320 px.

**Impeccable usage (implementer)**: run `impeccable init` first → PRODUCT.md from §1 + this section; then new-work for the visual world → DESIGN.md (must honor this brief: "the brief wins"); load craft-floor before UI edits; finish with `audit` then `polish` (one bounded pass each).

## 7. PWA & offline

Installable + read-only offline. Writes require network.

- `vite-plugin-pwa`, `registerType: 'prompt'` → toast "Versi baru tersedia — Muat ulang".
- Manifest: name "Bazar Manager", short_name "Bazar", `display: standalone`, `start_url: /`, theme/background = `--paper`, icons 192/512 + maskable 512, apple-touch-icon 180.
- Precache app shell (JS/CSS/fonts/icons). `navigateFallback: /index.html`, deny `/api/*` and `/_/*`.
- Runtime: `/api/collections/*/records` GET → NetworkFirst, timeout 4 s, cache `api-v1`, max 200 entries, 30 days. Proof images `/api/files/*` → CacheFirst, 100 entries.
- Data layer: TanStack Query with `persistQueryClient` (IndexedDB via idb-keyval) so last loaded months render instantly on cold start, even offline.
- `navigator.onLine` + query errors → offline banner; mutations disabled offline (no queue in v1).
- Logout clears query cache + `api-v1` cache (contact phones must not linger on shared device).
- iOS: add `apple-mobile-web-app-capable`, status bar style, safe-area insets on bottom nav / FAB.

## 8. Deployment

One binary + one folder on the existing Ubuntu 22.04 VPS, behind existing Nginx. Assumed domain `bazar.nasfcakes.cloud` (open question).

**Layout on server** (`/opt/bazar/`)

- `pocketbase` (linux_amd64 binary, pinned version in `DEPLOY.md`)
- `pb_public/` ← `web/dist` build output
- `pb_migrations/` ← repo, auto-applied on start
- `pb_data/` ← SQLite + uploads (never overwritten by deploy)
- `.env` ← `GROUP_EMAIL`, `GROUP_PASSCODE` (bootstrap only)

**systemd** `bazar.service`: `ExecStart=/opt/bazar/pocketbase serve --http=127.0.0.1:8090`, `User=bazar`, `Restart=always`, `LimitNOFILE=4096`.

**Nginx** server block: `proxy_pass http://127.0.0.1:8090`, websocket upgrade headers (realtime), `client_max_body_size 10M`, gzip. `/_/` (admin UI) → `deny all`; admin reached only via SSH tunnel `ssh -L 8090:127.0.0.1:8090`. SSL via certbot. `index.html` + `sw.js` no-cache; hashed assets 1 year immutable.

**Deploy script** `scripts/deploy.sh` (run locally): `npm run build` in `web/` → rsync `web/dist/` → `pb_public/`, rsync `pb_migrations/` → `systemctl restart bazar` → curl `/api/health` check.

**Backups**: PocketBase built-in scheduled backup daily 02:00 WIB, keep 7; plus weekly rsync of `pb_data/backups` off-server (open: target).

**First install** documented step-by-step in `DEPLOY.md`: user, dirs, binary download + checksum, systemd, nginx, certbot, superuser create, bootstrap group user/workspace.

## 9. Test checklist

Unit = Vitest. Component = Testing Library. E2E = Playwright against local PocketBase seeded by `scripts/seed.js`. Rules = Vitest calling PocketBase API directly.

**Unit (`lib/`)**

- [ ] `paymentStatus`: total 0 → Gratis; paid 0 → Belum bayar; partial → DP; equal → Lunas; overpaid → Lunas + overpay amount
- [ ] `remaining` never negative
- [ ] `normalizePhone`: `0812-3456-7890`, `+62 812 3456 7890`, `62812…` → `628123456789…`; rejects < 9 digits
- [ ] `formatRupiah(1250000)` → `Rp 1.250.000`; parse input with dots back to int
- [ ] `generateOccurrences`: weekly / biweekly / monthly; until inclusive; cap 52; monthly on 31st skips months without 31 (documented)
- [ ] date helpers: group by date, month range, weekday label `Sab` in `id` locale, no TZ shift around 00:00 WIB
- [ ] monthly summary excludes cancelled events

**API rules (F1, §4)**

- [ ] anon: list/create on every collection → 403/empty
- [ ] member: full CRUD on own workspace contacts/events/payments
- [ ] non-member user (test-only second workspace): cannot read/write other workspace; cannot move event to other workspace
- [ ] payments cascade-deleted with event; contact delete sets event.contact null
- [ ] auth rate limit returns 429 after threshold

**Component**

- [ ] EventRow renders badge text + icon per status, remaining only when > 0, cancelled styling
- [ ] EventForm validation messages (end < start, missing title/location/date)
- [ ] RupiahInput live formatting, numeric keyboard (`inputmode=numeric`)
- [ ] Repeat preview: untick removes date from save payload

**E2E (mobile 390×844 + desktop 1440×900)**

- [ ] Unlock with wrong then right passcode; session survives reload; Lock returns to unlock
- [ ] Flow A: add event with new contact in one sheet → appears under its date
- [ ] Flow B: DP then Lunasi → badge DP → Lunas, summary remaining updates
- [ ] Flow C: duplicate to 3 dates → 3 events, no payments copied
- [ ] Ulangi weekly 6× → edit "ini & seterusnya" location → only this + later changed; delete "hanya ini"
- [ ] Calendar: dots on event days, tap day → sheet with events
- [ ] Contact: WhatsApp link `wa.me/62…`, tel link correct
- [ ] Offline (context.setOffline): last month renders, banner shows, write buttons disabled
- [ ] Back button closes open sheet instead of leaving page

**Quality gates**

- [ ] Lighthouse mobile: PWA installable, Performance ≥ 90, Accessibility ≥ 95
- [ ] axe: 0 serious/critical on all routes, both themes
- [ ] Keyboard-only: complete Flow A + B
- [ ] 320 px width + 200% zoom: no horizontal scroll
- [ ] impeccable `audit` findings resolved or listed as accepted
- [ ] Bundle: initial JS ≤ 180 KB gzip

## 10. File manifest

Monorepo `bazar-manager/`. One responsibility per file; split when a file passes ~250 lines.

```
bazar-manager/
├─ PRD.md
├─ PRODUCT.md / DESIGN.md    # written by impeccable
├─ DEPLOY.md
├─ pb/
│  ├─ pb_migrations/
│  │  ├─ 1_init_collections.js   # workspaces, memberships, contacts, events, payments + rules
│  │  └─ 2_settings.js           # rate limit, backup cron, file limits
│  └─ pb_hooks/                  # empty in v1 (reserved)
├─ scripts/
│  ├─ bootstrap.js           # superuser-run: group user + workspace + membership (idempotent)
│  ├─ seed.js                # dev/E2E data: 2 months, overlapping days, series, payments
│  ├─ dev.sh                 # download pinned PocketBase, run serve + vite
│  └─ deploy.sh
├─ deploy/
│  ├─ bazar.service
│  └─ nginx.bazar.conf
└─ web/
   ├─ index.html, vite.config.ts, tailwind (v4, CSS-first tokens), tsconfig, playwright.config.ts
   ├─ public/ icons, apple-touch-icon, fonts/
   ├─ e2e/ unlock, add-event, payments, repeat, calendar, offline .spec.ts
   └─ src/
      ├─ main.tsx, App.tsx, router.tsx
      ├─ styles/ tokens.css (light/dark), base.css
      ├─ lib/
      │  ├─ pb.ts            # PocketBase client singleton, auth refresh
      │  ├─ queryClient.ts   # TanStack Query + IndexedDB persister
      │  ├─ payment.ts       # paid, remaining, paymentStatus
      │  ├─ money.ts         # formatRupiah, parseRupiah
      │  ├─ phone.ts         # normalizePhone, formatPhone, waLink, telLink
      │  ├─ dates.ts         # id locale, groupByDate, monthRange, weekday
      │  ├─ recurrence.ts    # generateOccurrences
      │  └─ *.test.ts
      ├─ api/                # typed data access, one file per collection
      │  ├─ types.ts
      │  ├─ workspace.ts, contacts.ts, events.ts, payments.ts
      │  └─ hooks.ts         # useMonthEvents, useEvent, useContacts, mutations (optimistic)
      ├─ components/
      │  ├─ ui/              # Button, Field, Input, RupiahInput, DatePicker, MultiDatePicker,
      │  │                   # TimeInput, Sheet, Dialog, Toast, Badge, SegmentedControl, Skeleton
      │  ├─ AppShell.tsx, BottomNav.tsx, SideRail.tsx, OfflineBanner.tsx, UpdatePrompt.tsx
      │  ├─ DateStub.tsx, EventRow.tsx, PaymentBar.tsx, StatusBadge.tsx, SummaryStrip.tsx
      │  ├─ MonthHeader.tsx, FilterChips.tsx, CalendarGrid.tsx
      │  ├─ EventForm.tsx, RepeatFields.tsx, DuplicateSheet.tsx, SeriesScopeDialog.tsx
      │  ├─ PaymentForm.tsx, PaymentList.tsx
      │  ├─ ContactPicker.tsx, ContactForm.tsx, ContactCard.tsx
      └─ routes/
         ├─ Unlock.tsx, Agenda.tsx, EventDetail.tsx
         ├─ Contacts.tsx, ContactDetail.tsx, Settings.tsx
```

**Dependencies (web)**: react 19, react-router 7, @tanstack/react-query + persist-client, idb-keyval, pocketbase (JS SDK), date-fns, tailwindcss 4, lucide-react, vite-plugin-pwa, zod (form validation). Dev: vitest, @testing-library/react, playwright, @axe-core/playwright. No UI kit (shadcn optional only for headless primitives; must be restyled to tokens).

## 11. Build order

Straight run, each step ends green (tests listed pass) + one commit. TDD for `lib/` and rules.

1. **Scaffold** — repo layout, `scripts/dev.sh` (pinned PocketBase), Vite + React + TS + Tailwind 4, Vitest, Playwright. Gate: `npm test` + empty e2e run.
2. **Schema + rules** — `1_init_collections.js`, `2_settings.js`, `bootstrap.js`, `seed.js`. Gate: API rules tests (§9).
3. **Pure logic** — `money`, `phone`, `dates`, `payment`, `recurrence` with tests. Gate: unit tests.
4. **Design system** — run impeccable init + new-work → PRODUCT.md, DESIGN.md, `tokens.css`, `ui/` primitives, light/dark. Gate: primitives story page reviewed by owner (screenshot mobile + desktop).
5. **Shell + auth (F1, F8)** — router, AppShell, BottomNav/SideRail, Unlock, Lock, Settings. Gate: E2E unlock.
6. **Agenda read (F2)** — data hooks, DateStub, EventRow, SummaryStrip, filters, search, month nav, states (F9). Gate: seed data renders, component tests.
7. **Event CRUD (F4)** — EventForm sheet, detail, cancel/delete. Gate: E2E Flow A (without new contact).
8. **Contacts (F7)** — list, detail, form, picker + inline create. Gate: E2E Flow A full + contact links.
9. **Payments (F5)** — PaymentForm, list, Lunasi, proof upload, optimistic updates. Gate: E2E Flow B.
10. **Repeat + duplicate (F6)** — RepeatFields, DuplicateSheet, SeriesScopeDialog. Gate: E2E Flow C + series.
11. **Calendar (F3)** — CalendarGrid, day sheet/panel, view toggle. Gate: E2E calendar.
12. **PWA (§7)** — manifest, SW, persister, offline banner, update prompt, logout cache clear. Gate: E2E offline + Lighthouse installable.
13. **Harden + polish** — impeccable `audit` → fix batch → `polish` (one bounded pass). Keyboard shortcuts. Gate: all quality gates §9.
14. **Deploy** — `deploy/` files, `DEPLOY.md`, first install on VPS, backup verified by restore test. Gate: production smoke (unlock, add, pay, install on phone).

## 12. Confirm before code

No code until owner ticks every box below.

**Owner confirms**

- [ ] Scope §1–2 correct, non-goals accepted
- [ ] Data model + rules §4 (workspace-first) OK
- [ ] Design direction §6 + banned list OK
- [ ] Domain decided (assumed `bazar.nasfcakes.cloud`)
- [ ] Off-server backup target decided (or accept on-server only for v1)
- [ ] Passcode chosen (≥ 6 chars), stored only in server `.env` + password manager

**Implementer setup (Claude Code)**

- Model: **Sonnet 5.5** for all build steps.
- Plugins: superpowers (writing-plans → executing-plans, test-driven-development, verification-before-completion) + impeccable.
- First message to implementer: "Read PRD.md. Use superpowers:writing-plans to turn §11 into a plan; stop for my approval. UI work goes through impeccable per §6."
- Verify PocketBase API (rules syntax, migrations, rate limiter, backups) against docs of the pinned version before step 2; note deviations in PRD.
- Ask owner before: adding dependencies not in §10, changing schema fields, deviating from §6 tokens or banned list.
- Each step: tests first, implement, run gate, commit `feat(step-N): …`. Never mark a step done without gate output shown.

**Open questions**

- Workspace display name default? (proposed: "Bazar Saya", editable in Settings)
- Proof photo: keep optional for v1? (proposed: yes)
