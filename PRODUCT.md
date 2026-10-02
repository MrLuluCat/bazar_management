# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite + TypeScript, Tailwind CSS 4 (CSS-variable tokens), PocketBase backend. Chosen by the owner in PRD.md §3, not delegated.

## Users

Indonesian vendors and small teams who join 5–15 bazaar/booth events a month (CFD, school events, open houses). One person or a small group sharing one passcode. Mostly on a phone at the booth or on the road, sometimes on a laptop for bulk input. Interface language is Bahasa Indonesia.

## Product Purpose

Plan bazaar events per month: when, where, who to call, how much is paid. Replaces a schedule scattered across chat and notes, where the day, booth-fee status and organizer phone get lost. Success: add an event in under 30 seconds on a phone; answer "what's on Saturday and is it paid?" in under 5 seconds from app open; no lost organizer numbers.

## Positioning

A vendor's paper agenda turned app: an agenda grouped by date, a payment ledger per event (DP + pelunasan installments) and a reusable organizer contact book with one-tap WhatsApp/call. Standalone and generic for any vendor; not tied to a specific brand.

## Operating Context

Phone in one hand at a booth, outdoors and in daylight; laptop at home for bulk entry. Installable PWA, readable offline, writes need network. One shared passcode, one workspace per group.

## Capabilities and Constraints

Features F1–F9 and data model are fixed in PRD.md. Currency is integer rupiah (`Rp 1.250.000`); dates `Sab, 12 Okt`; times `HH:mm`; TZ Asia/Jakarta. Non-goals for v1: personal accounts, reminders, sales tracking, export, offline editing.

## Brand Commitments

Design direction "buku agenda pasar" (ink on paper, calm, dense but breathable), pinned in PRD.md §6 including tokens, restraint rules and a banned list. The PRD brief wins over defaults. Working name: Bazar Manager (short: Bazar).

## Evidence on Hand

No real customers, testimonials or analytics. Demonstration data comes from `scripts/seed.js` and is synthetic. No logo yet: wordmark only.

## Product Principles

- Scanability beats expression: the agenda must answer "what, where, paid?" at a glance.
- Status is never color alone: text plus a shape.
- Money and dates are tabular and right-aligned.
- One passcode, no friction: no onboarding, no marketing.
- Reading offline must work; writing never pretends to.

## Accessibility & Inclusion

WCAG 2.2 AA, visible focus ring, touch targets ≥ 44 px, works at 320 px width and 200% zoom, `aria-live` toasts, sheets trap focus, reduced motion respected.

<!-- Inferred from the explicit PRD brief (init interview skipped because the owner supplied the full brief and asked to start coding). -->
