# Kora Health — practice management UI

A high-fidelity, runnable design prototype for a cloud practice management system
aimed at **New Zealand specialist clinics**. It combines the specialist-clinic
workflow of a letters/referrals/ACC/Xero product with an all-in-one,
dashboard-driven approach: one unified patient view, one inbox, clinical and
admin tools in the same place.

Open `index.html` in a browser — no build step, no dependencies.
The design system lives at `styleguide.html`.

> Kora Health is fictional. Every patient, NHI number, ACC claim, invoice and
> clinician in here is invented. The visual identity is original and is not
> derived from any existing product.

---

## Brand and visual language

| | |
|---|---|
| **Accent** | Pounamu `#2A6044` — a deep, desaturated pine; carries every primary action |
| **Secondary** | Clay `#B87848` — the warm earth tone green needs opposite it |
| **Neutrals** | Greys tinted a few degrees toward the brand, on a `#F3F6F4` ground |
| **Type** | IBM Plex superfamily — Serif for headings, Sans for the interface, Mono for every identifier and figure |
| **Shape** | 3px chips, 5px controls, 7px cards, 10px overlays — radius scales with density |
| **Elevation** | Flat. A hairline separates; a shadow means the thing genuinely floats, so only overlays get one |

Success reuses the brand green rather than introducing a second one — two
competing greens is what makes green systems unreadable. Every other status
is deliberately far from green in hue.

### Avoiding the generic-AI look

The [reliable tells](https://www.925studios.co/blog/ai-slop-design-tells) are a
single typeface throughout, one radius and one soft shadow on everything, an
unmotivated gradient hero, and a row of identical evenly-spaced cards. This
design answers each: a serif/sans/mono superfamily, four radius steps tied to
density, borders instead of shadows, a typographic masthead in place of the
gradient panel, and a divided stat strip instead of matching tiles.

Status colour means the same thing in every screen:
**green** = arrived / paid / done · **amber** = waiting / pending ·
**red** = DNA / overdue / error · **grey** = draft / not started.

Both light and dark themes are full designs, not an inverted filter.

## Screens

| Route | Screen |
|---|---|
| `#/dashboard` | Role-based home — four distinct layouts |
| `#/appointments` | Day/week calendar, columns per clinician and location, drag to reschedule |
| `#/patient/:id` | Unified patient workspace — sticky header, nine sections, floating **+ New** |
| `#/patients` | Patient register |
| `#/inbox` | Unified inbox + doctor's approval queue |
| `#/letter/:id` | Letter editor — split editor / live PDF preview, templates, AI scribe |
| `#/letters` | Letter queue by status |
| `#/tasks` | Kanban board and list view |
| `#/billing` | Invoices, create drawer, split invoicing, payment recording, Xero sync |
| `#/acc` | ACC submission queue with per-row validation and bulk submit |
| `#/reports` | Revenue, utilisation, debtor ageing |
| `#/admin` | Settings cards, users, permissions, consultant profile |

### Role-based dashboards

Switch role from the top bar. Each role gets a different layout, not a
re-ordered one:

- **Clinician** — my clinic list, a *Next patient* card that turns green the
  moment the patient arrives, unsigned notes, letters to approve
- **Reception** — waiting room, all clinics, uninvoiced appointments, callbacks
- **Typist** — typing queue, dictation backlog, turnaround against target
- **Practice Manager** — money and compliance first: ACC errors, overdue
  invoices, clinic utilisation

## Interactions worth trying

- <kbd>Ctrl</kbd>+<kbd>K</kbd> — command palette (*New letter*, *Book appointment*, *Create invoice*)
- <kbd>/</kbd> — global patient search by name, NHI, DOB or phone
- <kbd>g</kbd> then <kbd>d</kbd>/<kbd>a</kbd>/<kbd>p</kbd>/<kbd>i</kbd>/<kbd>l</kbd>/<kbd>t</kbd>/<kbd>b</kbd>/<kbd>c</kbd> — jump to a section · <kbd>[</kbd> — collapse the sidebar
- Dashboard → **Arrived** on a booking, and watch the *Next patient* card go green
- Calendar → drag an appointment to a new time or a different clinician
- Letter editor → *Insert template* → fill the form → AI scribe: record, generate, insert
- Billing → *Create invoice* → **Split this invoice** → drag the patient-share slider
- ACC → **Fix now** on a failing row; fixing the patient record clears every row that shares the problem
- Tasks → drag cards between columns

## Design system

`styleguide.html` documents the colour ramps, type scale, buttons, inputs,
status chips, cards, tables, overlays, feedback states, the icon set, and the
accessibility rules — live, in both themes.

## Accessibility

Verified rather than asserted (see *Verification* below):

- **Contrast** — all 50 checked token pairings meet WCAG AA in both themes:
  ≥ 4.5:1 for text, ≥ 3:1 for control boundaries and the focus ring
- **Keyboard** — every action reachable by Tab; dialogs trap focus, close on
  <kbd>Esc</kbd>, and return focus to where it came from
- **Focus** — always visible: a 2px accent ring, or a border-plus-halo on fields
- **Not colour alone** — every status chip pairs its colour with a label
- **Motion** — 110–280ms, and all of it stops under `prefers-reduced-motion`

## Icons

Typefaces are IBM Plex (OFL), bundled as woff2 in `assets/fonts` — no CDN, so
the app renders identically offline.

The icon set is [Lucide](https://lucide.dev) (ISC licence), bundled into
`assets/js/icons.js` as inline SVG rather than loaded from a CDN — so the app
works offline and every icon shares one 24px grid, 2px stroke and rounded
terminals. `icon(name, size)` returns the markup; unknown names warn in the
console rather than rendering an invisible gap.

## Structure

```
index.html              app shell (sidebar, top bar, search, command palette)
styleguide.html         design system reference
assets/css/
  fonts.css             @font-face for the bundled IBM Plex superfamily
  tokens.css            colour, type, spacing, radius, elevation, motion + dark theme
  base.css              reset, typography, a11y utilities
  components.css        buttons, inputs, chips, cards, tables, modals, toasts, skeletons
  app.css               shell and per-screen layouts
assets/js/
  icons.js              66-icon set on a 24px grid
  data.js               NZ sample data (patients, clinicians, appointments, invoices, ACC)
  ui.js                 formatting, chips, overlays, toasts, focus management
  app.js                routing, roles, theme, global search, command palette
  views/                one module per screen
```

State is in-memory only — a reload resets the prototype. Theme, role and sidebar
preference persist in `localStorage`.

## Sample data

New Zealand throughout: NZ names including te reo Māori and Pasifika, NHI-style
identifiers (`JKL8472`), ACC claim numbers and injury dates, Southern Cross and
private funding, NZD with 15% GST, Auckland addresses and phone formats,
Healthlink delivery, and Xero sync.

## Verification

The prototype was checked in headless Chromium:

- **Smoke** — all 14 routes render, four role dashboards, light and dark, command
  palette, global search, tablet width with no horizontal scroll, zero console errors
- **Accessibility** — accessible names on every control and field across all
  routes, focus ring on 25 tabbed elements, focus trapping in dialogs
- **Contrast** — 50 token pairings computed with alpha compositing against their
  real backgrounds, both themes
- **Interaction** — 11 end-to-end flows: arrival status, calendar drag,
  letter autosave and template insert, AI scribe, kanban drag, ACC fix-now
  revalidation, inbox approval, split invoicing, command palette routing
