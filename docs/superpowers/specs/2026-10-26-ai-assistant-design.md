# AI assistant — design

Date: 2026-10-26. Status: approved by owner in chat ("gas, lanjutin tanpa confirm"). Pattern taken from the owner's POS app (lazizah_api `feature/ai-inferhub`): InferHub agent with tools, proposals only, key on the server.

## Goal

A lapak member can ask about the agenda and payments, or send text/photos (event poster, organizer chat, transfer receipt) and get proposals for an event, a payment or a contact. Nothing is written until the user taps Simpan.

## Backend (`pb_hooks/ai.pb.js`, `pb_hooks/lib/ai.js`)

- `GET /api/ai/status` → `{ enabled }` (lapak login required). The app hides the assistant when false.
- `POST /api/ai/assistant` (lapak login, 20/min, body ≤16 MB): `messages[]` (`role` user|assistant, `text` ≤4000, `images[]` ≤3 data-URL JPEG/PNG/WebP on the last user message only), ≤20 messages, ≤12 000 chars total. Returns `{ reply, proposals[], steps[{tool,label,ok}], model, truncated }`.
- Agent loop, max 6 model calls, deadline 2 × timeout. OpenAI-style `/chat/completions` with `tools`, `tool_choice: auto`, `thinking` from env.
- Tools: `get_agenda(month)`, `search_events(query)`, `search_contacts(query)` read only the caller's workspace; `propose_event`, `propose_payment`, `propose_contact` validate and normalize (dates, times, phone → `62…`, event/contact must belong to the workspace) and return `valid` + `errors`.
- Errors: 400 input, 429 upstream busy, 502/504 upstream failure, 503 no key / bad key. The key is only sent in the `Authorization` header and never logged.

## Config (env)

`INFERHUB_API_KEY` (required to enable), `INFERHUB_BASE_URL` (default `https://api.inferhub.dev/v1`), `INFERHUB_MODEL` (default `cb/deepseek-v4.1-flash`), `INFERHUB_TIMEOUT_SECONDS` (90), `INFERHUB_THINKING` (`disabled`), `INFERHUB_SUPPORTS_IMAGES` (true). Local: `backend/.env` (git-ignored) loaded by `scripts/dev.sh` / `start.sh`. VPS: `/opt/bazar/.env` via systemd `EnvironmentFile`.

## Frontend

- Header button "Asisten" (only when enabled) opens a sheet: messages, proposal cards, composer (text, up to 3 photos compressed to ≤1600 px JPEG, Enter sends, Stop aborts, 190 s client timeout).
- Cards: Simpan (creates the record), Simpan & ubah (creates, then opens the existing edit sheet), Buang. Invalid proposals show their errors and cannot be saved.
- Conversation is in memory only and is cleared when the lapak session ends (Kunci). Offline: composer disabled.

## Privacy

Messages, photos and the agenda/contact data returned by tools (including organizer phone numbers) are sent to InferHub. Accepted by the owner.

## Testing

Backend: fake InferHub server; status/auth, input validation (no upstream call), key only in header, env model, workspace isolation in tools, proposal validation, image parts, upstream error mapping. E2E: fake InferHub in global setup; answer, proposal, not saved until Simpan, saved after; axe on the open panel.

## Out of scope

Streaming, saved conversation history, Gemini fallback, admin-panel AI settings.
