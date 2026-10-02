# Design — Bazar Manager

Direction: **"buku agenda pasar"** (a vendor's paper agenda as an app). Mode: Operate. The PRD §6 brief is pinned; this file records what shipped from it. Source of truth for values: `web/src/styles/tokens.css`.

## Palette (OKLCH, light / dark)

Restrained: warm paper neutrals plus one awning-green accent; three status hues, each always paired with text and a shape.

- `--paper` ground `0.975 0.008 85` / `0.19 0.01 85`; `--surface` (inputs, sheets) one step lighter.
- `--ink` text, `--muted` secondary, `--line` and `--line-strong` hairlines.
- `--accent` awning green `0.48 0.09 160` / `0.72 0.1 160`; `--accent-wash` for hover; focus ring is `--accent`, 2 px, offset 2 px.
- `--paid` green, `--partial` amber, `--unpaid` brick red; all AA on paper, lifted in dark.

Theme: follows `prefers-color-scheme`, overridable with `data-theme="light|dark"` on `<html>`.

## Type

One family, **Schibsted Grotesk** variable (400–900), self-hosted woff2 in `web/public/fonts/`. Scale 13 / 15 / 17 / 22 / 28 px. Weights 400, 500, 650 (headings). Money, dates and times use `font-variant-numeric: tabular-nums` (class `.num`).

## Shape and depth

Radius 6 / 8 / 10 px. Borders 1 px `--line`. Elevation only on sheets and toasts (offset shadow, no glow). Spacing on a 4 px grid. Touch targets 44 px.

## Signature details

- **Date stub:** small-caps weekday over a large tabular day number, a dashed vertical perforation, then the day's events.
- **Ledger bar:** 4 px bar under each event; filled share = paid share.
- **Status badge:** text plus shape: ○ Belum bayar, ◐ DP, ● Lunas, — Gratis, × Batal.

## Components (`web/src/components/ui/`)

Button (primary, secondary, danger, ghost; `loading`, `disabledReason`), Field + Input/Textarea/Select, RupiahInput, TimeInput, DatePicker, MultiDatePicker, Sheet (bottom sheet on mobile, modal at 768 px; focus trap, Esc, drag handle), Dialog, Toast (`toast.show`, `aria-live`), Badge, SegmentedControl, Skeleton/SkeletonRows. Dev preview: `/_sandbox`.

## Motion

150–220 ms exponential ease-out. Sheets slide up, toasts rise, list items do not stagger. `prefers-reduced-motion` collapses all durations.

## Icons

Lucide, 1.5 px stroke, no emoji.

## Banned (from PRD §6)

Purple gradients, gradient text, glass, glows, hero/marketing copy, nested cards, icon-circle stat tiles, donut charts for three numbers, default Inter + slate + blue, placeholder-as-label, all-caps buttons.
