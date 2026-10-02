# Bazar Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Bazar Manager, a mobile-first Indonesian-language PWA for planning bazaar events, installment payments and organizer contacts, backed by one PocketBase process.

**Architecture:** PocketBase serves API + built SPA (`pb_public/`) from one origin. React 19 SPA talks to it through the PocketBase JS SDK; TanStack Query caches and persists to IndexedDB for read-only offline. Domain data hangs off `workspace`; access rules check `memberships`.

**Tech Stack:** PocketBase (pinned 0.x), React 19, Vite, TypeScript, Tailwind 4, React Router 7, TanStack Query + persist-client, idb-keyval, date-fns, zod, lucide-react, vite-plugin-pwa, Vitest, Testing Library, Playwright, @axe-core/playwright.

**Spec:** `PRD.md` (repo root). Section numbers below (§N, F1–F9) refer to it.

## Global Constraints

- UI copy Bahasa Indonesia; code, comments, docs English. Dates `Sab, 12 Okt 2026`, money `Rp 1.250.000`.
- Money = integer rupiah. Dates = text `YYYY-MM-DD`. Times = text `HH:mm`. No `Date` timezone math; TZ Asia/Jakarta.
- Phone stored as digits starting `62`.
- Schema only via committed `pb/pb_migrations/*.js`, never admin-UI-only.
- Dependencies limited to PRD §10 list. Ask owner before adding any other, changing schema fields, or deviating from §6 tokens/banned list.
- Touch targets ≥ 44 px; WCAG 2.2 AA; min width 320 px; labels on every input.
- Every UI edit loads impeccable `reference/craft-floor.md` first; the brief (PRD §6) wins over impeccable defaults. No sparkle/AI icons, no gradient text, no nested cards, no emoji in UI.
- Status never color-only: ○ Belum bayar, ◐ DP, ● Lunas, — Gratis.
- Each task: tests first, implement, run gate, show gate output, one commit `feat(step-N): …`. Never mark done without gate output.
- Repo root is `C:\xampp\htdocs\bazar_management` (PRD manifest calls it `bazar-manager/`; same layout). Not yet a git repo: Task 1 runs `git init`.
- Initial JS bundle ≤ 180 KB gzip.

## Review Focus

Inputs the spec implies but its checklist does not pin. Each has a test in the owning task.

1. Monthly recurrence anchored on day 29/30/31 (Feb, 30-day months) — skip month, never roll over to next month. Task 3.
2. Event spanning no time (`start_time` empty) or `end_time` only — sort and display must not crash; time range shows nothing or single time. Task 6.
3. Phone pasted with `(`, `)`, leading `+`, `0062`, or letters — normalize or reject with Indonesian message, never store garbage. Task 3.
4. Payment overpaid then event `total_cost` edited down/up — derived status recomputed, never stale. Task 3 + 9.
5. Double submit on Simpan (slow network) — second tap must not create duplicate event/payment. Task 7.

## File Structure

Follows PRD §10 exactly. Additions: `web/vitest.config.ts`, `web/src/test/setup.ts`, `pb/tests/rules.test.ts` (rules tests live beside PocketBase, run by web Vitest via a separate config `web/vitest.rules.config.ts`), `web/src/routes/DesignSandbox.tsx` (dev-only primitives page, removed or gated in Task 13).

---

### Task 1: Scaffold (step 1)

**Files:**
- Create: `.gitignore`, `pb/pb_migrations/.gitkeep`, `pb/pb_hooks/.gitkeep`, `scripts/dev.sh`, `web/package.json`, `web/index.html`, `web/vite.config.ts`, `web/tsconfig.json`, `web/vitest.config.ts`, `web/playwright.config.ts`, `web/src/main.tsx`, `web/src/App.tsx`, `web/src/styles/base.css`, `web/src/test/setup.ts`, `web/src/smoke.test.ts`, `web/e2e/smoke.spec.ts`

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `test` (vitest run), `test:rules`, `e2e` (playwright). `scripts/dev.sh` downloads pinned PocketBase to `.pb/pocketbase`, runs `serve` with `--dir=.pb/data --migrationsDir=pb/pb_migrations`, plus `vite`. Vite proxies `/api` to `127.0.0.1:8090`.

- [ ] **Step 1:** `git init`; `.gitignore` covers `node_modules`, `dist`, `.pb/`, `.env`, `pb_data/`, `test-results/`.
- [ ] **Step 2:** Open PocketBase release notes/docs; choose and record the latest stable 0.x version and note JS-migration API shape (`migrate((app)=>…)` vs older `(db)=>…`) in `PRD.md` §4 as a dated "Deviations" note. Everything in Tasks 2 and 12 depends on this.
- [ ] **Step 3:** Write failing `web/src/smoke.test.ts`: `expect(1+1).toBe(2)` plus a Testing Library render of `<App />` expecting text "Bazar". Run `npm test` → FAIL (no App).
- [ ] **Step 4:** Scaffold Vite React-TS in `web/` with React 19, Tailwind 4 (`@tailwindcss/vite`, CSS-first), Vitest (jsdom), Playwright (projects `mobile` 390×844, `desktop` 1440×900, `webServer` = vite dev). `App` renders wordmark "Bazar".
- [ ] **Step 5:** Write `web/e2e/smoke.spec.ts`: goto `/`, expect text "Bazar". Run `npm test && npm run e2e` → PASS. This is the gate.
- [ ] **Step 6:** `scripts/dev.sh`: download pinned PocketBase (linux/mac/windows detection via `uname`), verify binary exists, run both processes. Run it once, `curl /api/health` → 200.
- [ ] **Step 7:** Commit `feat(step-1): scaffold`.

---

### Task 2: Schema + rules (step 2)

**Files:**
- Create: `pb/pb_migrations/1_init_collections.js`, `pb/pb_migrations/2_settings.js`, `scripts/bootstrap.js`, `scripts/seed.js`, `web/vitest.rules.config.ts`, `pb/tests/rules.test.ts`, `pb/tests/helpers.ts`
- Modify: `web/package.json` (`test:rules`)

**Interfaces:**
- Consumes: Task 1 pinned PocketBase + `dev.sh`.
- Produces: collections per PRD §4 with names `workspaces, memberships, contacts, events, payments` and fields exactly as table. `scripts/bootstrap.js` CLI: reads `GROUP_EMAIL`, `GROUP_PASSCODE`, optional `WORKSPACE_NAME` (default `Bazar Saya`); idempotent. `scripts/seed.js`: `seed(pbUrl, adminEmail, adminPass)` creates 2 months of events incl. 3 same-day events, one 6-occurrence weekly series, mixed payments, 4 contacts. `pb/tests/helpers.ts`: `adminClient()`, `memberClient()`, `outsiderClient()` (second user + second workspace), `resetDb()` using a throwaway data dir on port 8091.

- [ ] **Step 1: Write failing rules tests** in `pb/tests/rules.test.ts`, names exactly the PRD §9 API-rules items:
  - `anon cannot list or create on any collection` → 403 or empty list.
  - `member has full CRUD on own workspace contacts, events, payments`.
  - `outsider cannot read or write other workspace` and `outsider cannot move event to other workspace` (update `workspace` → rejected).
  - `payments cascade when event deleted`; `contact delete nulls event.contact`.
  - `auth rate limit returns 429 after 5 attempts in 60s`.
  - `memberships are read-only for members`; `signup locked on users`.
- [ ] **Step 2:** Run `npm run test:rules` → FAIL (no collections).
- [ ] **Step 3:** Write `1_init_collections.js` with collections, relations (cascade/set-null as PRD), indexes, `payments.amount` min 1 onlyInt, `proof` file field (max 1, 5 MB, `image/*`, thumb `400x0`), and API rules using `M(ws)` pattern. Verify `?=` join syntax against pinned version docs first; record deviations in PRD §4.
- [ ] **Step 4:** Write `2_settings.js`: rate limit rule on auth endpoint 5 / 60 s, daily backup cron `0 19 * * *` (= 02:00 WIB, server UTC) keep 7, app name.
- [ ] **Step 5:** Write idempotent `scripts/bootstrap.js` (superuser, group user, workspace, owner membership; second run is no-op). Add test `bootstrap is idempotent` to `rules.test.ts`.
- [ ] **Step 6:** Write `seed.js`; add a Vitest check that seed yields 3 events on one date and one series_id with 6 events.
- [ ] **Step 7:** Run `npm run test:rules` → all PASS (show output). Commit `feat(step-2): schema, rules, bootstrap, seed`.

---

### Task 3: Pure logic (step 3)

**Files:**
- Create under `web/src/lib/`: `money.ts`, `phone.ts`, `dates.ts`, `payment.ts`, `recurrence.ts` and `money.test.ts`, `phone.test.ts`, `dates.test.ts`, `payment.test.ts`, `recurrence.test.ts`

**Interfaces (Produces):**
```ts
// money.ts
formatRupiah(n: number): string            // 1250000 → "Rp 1.250.000"
parseRupiah(s: string): number             // "1.250.000" → 1250000; "" → 0
// phone.ts
normalizePhone(raw: string): string | null // → "62812…" or null if invalid
formatPhone(normalized: string): string    // "628123456789" → "0812-3456-789"
waLink(normalized: string): string         // https://wa.me/62…
telLink(normalized: string): string        // tel:+62…
// payment.ts
type PaymentStatus = 'gratis'|'belum'|'dp'|'lunas'
paid(payments: {amount:number}[]): number
remaining(total: number, payments: {amount:number}[]): number
paymentStatus(total: number, payments: {amount:number}[]): { status: PaymentStatus; overpaid: number }
monthSummary(events: EventWithPayments[]): { count: number; totalCost: number; totalRemaining: number }
// dates.ts  (all take/return 'YYYY-MM-DD' strings)
groupByDate<T extends {date:string}>(events: T[]): { date: string; items: T[] }[]
monthRange(ym: string): { start: string; end: string }   // ym 'YYYY-MM'
weekdayShort(date: string): string        // "Sab"
formatDateLabel(date: string): string     // "Sab, 12 Okt"
todayJakarta(): string
// recurrence.ts
type Frequency = 'weekly'|'biweekly'|'monthly'
generateOccurrences(start: string, freq: Frequency, until: string): string[]  // includes start, until inclusive, max 52
```

- [ ] **Step 1: Write failing tests**, one file per module, asserting exactly the PRD §9 Unit items plus Review Focus cases:
  - money: `formatRupiah(1250000)==='Rp 1.250.000'`, `parseRupiah('1.250.000')===1250000`, `parseRupiah('abc')===0`.
  - phone: `'0812-3456-7890'`, `'+62 812 3456 7890'`, `'628123456789'`, `'(0812) 3456 7890'`, `'0062812…'` all → same `62…`; `'0812'` → null; `'08ab12345678'` → null.
  - payment: Gratis/Belum bayar/DP/Lunas/overpaid(`overpaid===500` when total 1000 paid 1500); `remaining` never negative; `monthSummary` excludes `status==='cancelled'`; recompute after total change (Review Focus 4).
  - dates: group order ascending; `weekdayShort('2026-10-12')==='Sen'`, `'2026-10-17'==='Sab'`; `monthRange('2026-02')` end `2026-02-28`; `todayJakarta` uses `Asia/Jakarta` (mock system time `2026-10-01T17:30:00Z` → `2026-10-02`).
  - recurrence: weekly 6 occurrences; biweekly; monthly from `2026-01-31` until `2026-06-30` → `['2026-01-31','2026-03-31','2026-05-31']` (skip, no rollover); until inclusive; cap 52; until < start → `[]`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement each module. Use string/UTC-based date arithmetic via date-fns on `parseISO` with noon-UTC anchor, or pure `Date.UTC`; no local-time `new Date('YYYY-MM-DD')`. `id` locale for labels.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat(step-3): pure logic`.

---

### Task 4: Design system (step 4)

**Files:**
- Create: `PRODUCT.md`, `DESIGN.md` (by impeccable), `web/src/styles/tokens.css`, `web/public/fonts/*.woff2`, `web/src/components/ui/{Button,Field,Input,RupiahInput,DatePicker,MultiDatePicker,TimeInput,Sheet,Dialog,Toast,Badge,SegmentedControl,Skeleton}.tsx`, `web/src/components/ui/RupiahInput.test.tsx`, `web/src/routes/DesignSandbox.tsx`
- Modify: `web/src/styles/base.css`, `web/src/router.tsx` (dev-only `/_sandbox`)

**Interfaces (Produces):**
```ts
<Button variant="primary"|"secondary"|"danger"|"ghost" loading?:boolean />
<Field label:string error?:string>{children}</Field>
<RupiahInput value:number onChange:(n:number)=>void />   // inputMode="numeric", live "." separators
<Sheet open:boolean onClose:()=>void title:string>…</Sheet>   // mobile sheet / ≥768px modal, focus trap, Esc, drag handle
<Dialog open onClose title confirmLabel danger? onConfirm />
toast.show(msg:string, opts?:{action?:{label:string,onClick:()=>void}; ms?:number})  // aria-live
<Badge kind="gratis"|"belum"|"dp"|"lunas"|"batal" />      // icon shape + text
<MultiDatePicker value:string[] onChange />
```

- [ ] **Step 1:** Run `impeccable context`, then `impeccable init` seeded from PRD §1 + §6 → `PRODUCT.md` (Operate mode, users, brand "buku agenda pasar"). Then new-work → `DESIGN.md`; PRD §6 tokens and banned list are pinned ("the brief wins"). Read `reference/craft-floor.md` before UI edits.
- [ ] **Step 2: Write failing test** `RupiahInput.test.tsx`: typing `1250000` shows `1.250.000`, `inputMode` is `numeric`, `onChange` called with `1250000`; clearing gives `0`.
- [ ] **Step 3:** Write `tokens.css` with light + dark tokens (PRD §6 table; `prefers-color-scheme` plus `[data-theme]` override), AA-checked `--paid/--partial/--unpaid`, 4-pt spacing, radii, type scale 13/15/17/22/28, self-hosted Schibsted Grotesk or Instrument Sans, `tabular-nums` utility.
- [ ] **Step 4:** Build `ui/` primitives restyled to tokens. Lucide 1.5 px stroke. Motion 150–220 ms, reduced-motion respected. Sheets trap focus, close on Esc.
- [ ] **Step 5:** Build `DesignSandbox` showing every primitive in both themes. Run the app; capture mobile (390) and desktop (1440) screenshots, light and dark, **one batched round**; fix the batch; at most one confirm round.
- [ ] **Step 6: Gate:** `npm test` PASS; screenshots shown to owner for review. **Stop for owner approval of the look.**
- [ ] **Step 7:** Commit `feat(step-4): design system`.

---

### Task 5: Shell + auth (step 5; F1, F8)

**Files:**
- Create: `web/src/lib/pb.ts`, `web/src/router.tsx` (extend), `web/src/components/{AppShell,BottomNav,SideRail}.tsx`, `web/src/routes/{Unlock,Settings}.tsx`, `web/src/api/{types,workspace}.ts`, `web/e2e/unlock.spec.ts`, `web/.env.example`
- Modify: `App.tsx`, `main.tsx`

**Interfaces:**
- Produces: `pb` (PocketBase singleton, `autoCancellation(false)`), `unlock(passcode: string): Promise<void>` (auth with `VITE_GROUP_EMAIL`), `lock(): void` (clears `pb.authStore`; Task 12 adds cache clearing), `useAuth(): { isAuthed: boolean }`, `useWorkspace(): UseQueryResult<{id:string; name:string}>`, `updateWorkspaceName(id, name)`. Route guard redirects unauthed to `/unlock`.

- [ ] **Step 1: Write failing E2E** `unlock.spec.ts`: wrong passcode shows "Kode salah"; right passcode lands on `/`; reload keeps session; Settings → Kunci returns to `/unlock`. Run → FAIL.
- [ ] **Step 2:** Implement `pb.ts` with `authRefresh()` on app start (failure → lock). Unlock screen: single field, `minLength` 6 client check, error text exactly "Kode salah" for any auth failure (no hint).
- [ ] **Step 3:** AppShell: bottom nav (Agenda · Kontak · Pengaturan) mobile, left rail ≥ 1024; safe-area insets; header shows workspace name.
- [ ] **Step 4:** Settings: workspace name edit, Kunci, version (from `package.json` via Vite define), theme toggle (auto/light/dark), install button + iOS hint.
- [ ] **Step 5: Gate:** `npm run e2e -- unlock` PASS on mobile + desktop projects. Commit `feat(step-5): shell and auth`.

---

### Task 6: Agenda read (step 6; F2, F9)

**Files:**
- Create: `web/src/api/{events,contacts}.ts` (read funcs), `web/src/api/hooks.ts`, `web/src/components/{DateStub,EventRow,PaymentBar,StatusBadge,SummaryStrip,MonthHeader,FilterChips}.tsx`, `web/src/components/EventRow.test.tsx`, `web/src/routes/Agenda.tsx`, `web/src/lib/queryClient.ts`
- Test: `web/src/routes/Agenda.test.tsx`

**Interfaces:**
- Consumes: Task 3 `groupByDate, monthRange, monthSummary, paymentStatus, formatRupiah, formatDateLabel`; Task 4 `Badge, Skeleton`.
- Produces: `type EventWithPayments = EventRecord & { expand?: { contact?: ContactRecord }; payments: PaymentRecord[] }`; `useMonthEvents(ym: string): UseQueryResult<EventWithPayments[]>` (events by `date` range, payments fetched via a second `getFullList` filtered on those event ids, merged client-side); `filterEvents(events, {chip:'semua'|'akan'|'belum', q:string, today:string})`.

- [ ] **Step 1: Write failing component tests**: `EventRow` renders badge text + icon per status; remaining only when > 0; cancelled has strikethrough title + "Batal" tag; event with empty `start_time` renders without time and without crash (Review Focus 2). Agenda test with mocked hooks: only dates with events listed; "Belum lunas" chip hides lunas/gratis/cancelled; search matches title, location, contact name; empty month shows "Tambah event" button; loading shows skeleton rows; error shows "Coba lagi".
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement components + Agenda per F2: DateStub with perforation, PaymentBar ledger line, SummaryStrip (active only), month nav + "Hari ini" (scroll to today or next upcoming), today header marked, past dates dimmed. Sort within day: start_time asc, empty times last.
- [ ] **Step 4:** Use impeccable craft-floor; one batched screenshot round (mobile+desktop, light+dark) then fix in one batch.
- [ ] **Step 5: Gate:** `npm test` PASS; run against seeded PocketBase (`seed.js`) and show screenshot of rendered seed month. Commit `feat(step-6): agenda`.

---

### Task 7: Event CRUD (step 7; F4)

**Files:**
- Create: `web/src/components/EventForm.tsx`, `web/src/components/EventForm.test.tsx`, `web/src/routes/EventDetail.tsx`, `web/e2e/add-event.spec.ts`
- Modify: `web/src/api/events.ts`, `hooks.ts`, `router.tsx`, `Agenda.tsx` (FAB / header button, `?new=event`, `?edit=:id`)

**Interfaces:**
- Produces: zod `eventSchema` (`title`, `date`, `location` required; `end_time ≥ start_time` when both set; `total_cost` int ≥ 0); mutations `useCreateEvent()`, `useUpdateEvent()`, `useSetEventStatus()`, `useDeleteEvent()`; `usePastLocations(): string[]` for autocomplete. Create/edit overlay URL state so Back closes it.

- [ ] **Step 1: Write failing tests**: `EventForm` shows plain-Indonesian errors for missing judul/lokasi/tanggal and for end < start; submit button disabled while saving and a second click while saving creates exactly one record (Review Focus 5). E2E Flow A (no new contact): FAB → fill → Simpan → toast "Event ditambahkan" → row visible under its date; Back closes the sheet.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement form, detail screen (fields, actions Edit/Duplikat/Batalkan·Aktifkan/Hapus; Duplikat disabled until Task 10), delete confirm naming the object plus 5 s Undo toast (re-create on undo is acceptable as soft confirm; document the choice).
- [ ] **Step 4: Gate:** `npm test` and `npm run e2e -- add-event` PASS. Commit `feat(step-7): event crud`.

---

### Task 8: Contacts (step 8; F7)

**Files:**
- Create: `web/src/components/{ContactPicker,ContactForm,ContactCard}.tsx`, `web/src/routes/{Contacts,ContactDetail}.tsx`, `web/e2e/contacts.spec.ts`
- Modify: `web/src/api/contacts.ts`, `hooks.ts`, `EventForm.tsx`, `EventDetail.tsx`, `router.tsx`

**Interfaces:**
- Consumes: Task 3 `normalizePhone, formatPhone, waLink, telLink`.
- Produces: `useContacts(q?: string)`, `useContact(id)`, `useCreateContact()`, `useUpdateContact()`, `useDeleteContact()`; `<ContactPicker value:string|null onChange(id|NewContactDraft) />` where `NewContactDraft = { name: string; phone: string }` is saved on form submit, then the event is created with the returned id (failure of contact create aborts event create with an error toast).

- [ ] **Step 1: Write failing E2E** `contacts.spec.ts`: Flow A full (new contact inline + event in one sheet → appears under its date); contact detail WhatsApp `href` starts `https://wa.me/62` and tel `href` starts `tel:+62`; deleting a contact with linked events keeps events with empty contact. Add component tests: invalid phone shows "Nomor tidak valid" and nothing is saved (Review Focus 3).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement list (alphabetical, search), detail (linked events upcoming first), form (phone normalized on save, displayed formatted), picker with inline create.
- [ ] **Step 4: Gate:** `npm run e2e -- add-event contacts` PASS. Commit `feat(step-8): contacts`.

---

### Task 9: Payments (step 9; F5)

**Files:**
- Create: `web/src/components/{PaymentForm,PaymentList}.tsx`, `web/src/components/PaymentForm.test.tsx`, `web/e2e/payments.spec.ts`
- Modify: `web/src/api/payments.ts`, `hooks.ts`, `EventDetail.tsx`, `EventRow.tsx`

**Interfaces:**
- Produces: `useCreatePayment(eventId)`, `useUpdatePayment()`, `useDeletePayment()` with optimistic update on `['event', id]` and month query, rollback + error toast on failure; `PaymentForm` props `{ eventId; initialAmount?: number; payment?: PaymentRecord }` (`initialAmount` = remaining for "Lunasi"). Proof upload ≤ 5 MB image, client-checked, error "Foto maksimal 5 MB".

- [ ] **Step 1: Write failing tests**: form rejects amount 0 / negative; "Lunasi" prefills remaining; oversized file shows error; E2E Flow B: DP → badge DP → Lunasi → badge Lunas, Agenda summary remaining updates; edit/delete payment asks confirm; total lowered below paid shows Lunas + "Lebih Rp X" (Review Focus 4).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4: Gate:** `npm run e2e -- payments` PASS. Commit `feat(step-9): payments`.

---

### Task 10: Repeat + duplicate (step 10; F6)

**Files:**
- Create: `web/src/components/{RepeatFields,DuplicateSheet,SeriesScopeDialog}.tsx`, `web/src/components/RepeatFields.test.tsx`, `web/e2e/repeat.spec.ts`
- Modify: `web/src/api/events.ts`, `hooks.ts`, `EventForm.tsx`, `EventDetail.tsx`

**Interfaces:**
- Consumes: Task 3 `generateOccurrences`.
- Produces: `useDuplicateEvent()`: `(sourceId: string, dates: string[]) => Promise<EventRecord[]>` (no payments, no `series_id`); `useCreateSeries()`: `(draft, dates: string[]) => Promise<EventRecord[]>` assigning one client-generated uuid v4 `series_id`; `useUpdateSeries(eventId, patch, scope:'this'|'following')` (following: same `series_id`, `date ≥` this date, patch excludes `date`); `useDeleteSeries(eventId, scope)`. Batch writes use PocketBase batch API when the pinned version supports it, else sequential with partial-failure toast listing the count created.

- [ ] **Step 1: Write failing tests**: component — unticking a preview date removes it from the save payload; max 52 enforced with message; E2E Flow C: duplicate to 3 dates → 3 events, no payments copied; Ulangi weekly 6× → edit location "Ini & seterusnya" on 3rd → only 3rd–6th change; delete "Hanya ini" removes one only.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4: Gate:** `npm run e2e -- repeat` PASS. Commit `feat(step-10): repeat and duplicate`.

---

### Task 11: Calendar (step 11; F3)

**Files:**
- Create: `web/src/components/CalendarGrid.tsx`, `web/src/components/CalendarGrid.test.tsx`, `web/e2e/calendar.spec.ts`
- Modify: `Agenda.tsx`, `ui/SegmentedControl.tsx` usage, add `useViewPref()` in `web/src/lib/viewPref.ts` (localStorage `bazar.view`, wrapped in try/catch)

**Interfaces:**
- Produces: `<CalendarGrid ym events selectedDate onSelect(date) />` Mon–Sun grid; dot count 1, 2, or "3+"; accent dot when any event unpaid (active, status ≠ lunas/gratis). Tap day opens Sheet (mobile) / side panel (≥ 1024) reusing `EventRow`. Selected day feeds FAB default date (Flow A step 2).

- [ ] **Step 1: Write failing tests**: unit — Monday-first offset for `2026-10` (Oct 1 = Thu → 3 leading blanks); 3 events shows "3+"; E2E: dots on event days, tap day → sheet with events; view choice persists across reload.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4: Gate:** `npm run e2e -- calendar` PASS. Commit `feat(step-11): calendar`.

---

### Task 12: PWA (step 12; §7)

**Files:**
- Create: `web/src/components/{OfflineBanner,UpdatePrompt}.tsx`, `web/public/icons/*` (192, 512, maskable-512, apple-touch-icon-180), `web/e2e/offline.spec.ts`
- Modify: `web/vite.config.ts` (vite-plugin-pwa), `web/index.html`, `web/src/lib/queryClient.ts`, `web/src/lib/pb.ts` (`lock()` clears cache), `ui/Button.tsx` (disabled-with-tooltip when offline via `useOnline()`)

**Interfaces:**
- Produces: `useOnline(): boolean` (`navigator.onLine` + `online/offline` events); `queryClient` with `persistQueryClient` (idb-keyval IndexedDB, buster = app version); `lock()` additionally runs `queryClient.clear()`, deletes IndexedDB persisted key, and `caches.delete('api-v1')`.

- [ ] **Step 1: Write failing E2E** `offline.spec.ts` (built preview, not dev server): load month online, `context.setOffline(true)`, reload → month renders from cache, banner "Offline — data terakhir" visible, write buttons disabled; after Lock, offline reload shows no contact phones (cache cleared).
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement PWA config per §7: `registerType: 'prompt'`, manifest, precache, `navigateFallback: /index.html` denylisting `/api` and `/_/`, NetworkFirst `api-v1` (timeout 4 s, 200 entries, 30 d), CacheFirst `/api/files/*` (100). iOS meta tags.
- [ ] **Step 4: Gate:** `npm run e2e -- offline` PASS; Lighthouse CLI on built preview reports installable PWA (show output). Commit `feat(step-12): pwa`.

---

### Task 13: Harden + polish (step 13)

**Files:**
- Create: `web/e2e/a11y.spec.ts`, `web/e2e/keyboard.spec.ts`, `web/src/lib/shortcuts.ts`
- Modify: whatever audit findings require; remove or dev-gate `DesignSandbox`.

**Interfaces:**
- Produces: `useShortcuts(handlers: { n(): void; prev(): void; next(): void; today(): void; search(): void })` — ignores events when focus is in input/textarea/select/contenteditable.

- [ ] **Step 1: Write failing tests**: axe on every route × both themes × both viewports → 0 serious/critical; keyboard-only completes Flow A + B; shortcut test (`n`, `←/→`, `t`, `/`) incl. no trigger while typing in a field; 320 px width + 200% zoom no horizontal scroll.
- [ ] **Step 2:** Run → record failures. **Step 3:** Run impeccable `audit`, fix as one batch, then `polish` once (bounded). Implement shortcuts.
- [ ] **Step 4:** Check initial JS ≤ 180 KB gzip (`vite build` + gzip size); lazy-load routes/DesignSandbox if over. Lighthouse mobile Perf ≥ 90, A11y ≥ 95.
- [ ] **Step 5: Gate:** all PRD §9 quality gates, output shown; accepted audit leftovers listed in `DESIGN.md`. Commit `feat(step-13): harden and polish`.

---

### Task 14: Deploy (step 14)

**Files:**
- Create: `deploy/bazar.service`, `deploy/nginx.bazar.conf`, `scripts/deploy.sh`, `DEPLOY.md`

**Interfaces:**
- Consumes: all prior. Needs from owner: final domain, off-server backup target (or explicit "on-server only"), passcode set on server `.env` by owner (never in repo or chat).

- [ ] **Step 1:** Write `bazar.service` (PRD §8 values), `nginx.bazar.conf` (proxy, websocket headers, `client_max_body_size 10M`, gzip, `/_/` deny all, `index.html` + `sw.js` no-cache, hashed assets 1 y immutable), `deploy.sh` (build, rsync `dist/` → `pb_public/`, rsync migrations, `systemctl restart bazar`, `curl /api/health`; abort on any failure; never touches `pb_data/`). Lint `deploy.sh` with `shellcheck`, `nginx -t` on target.
- [ ] **Step 2:** `DEPLOY.md`: user, dirs, binary + checksum, systemd, nginx, certbot, superuser create, bootstrap, SSH-tunnel admin, backup + restore procedure.
- [ ] **Step 3 (owner-gated):** Ask owner before touching VPS. First install following `DEPLOY.md`; run backup then restore into scratch dir and verify record counts.
- [ ] **Step 4: Gate:** production smoke on phone — unlock, add event, record payment, install PWA. Commit `feat(step-14): deploy`.

---

## Self-Review

- **Spec coverage:** F1 T5; F2 T6; F3 T11; F4 T7; F5 T9; F6 T10; F7 T8; F8 T5; F9 T6 (+T12 offline); §4 T2; §6 T4/T13; §7 T12; §8 T14; §9 gates T2/T3/T13. Flow A T7+T8, B T9, C T10.
- **Open items blocking code (PRD §12):** owner must tick scope, data model, design direction, domain, backup target, passcode. Open questions: default workspace name "Bazar Saya", proof photo optional (plan assumes both proposals accepted).
- **Known risk:** PocketBase version pinned in Task 1 Step 2; rule syntax, JS migration API, rate-limit settings and batch API must be verified there before Task 2.
