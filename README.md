# Kora Health — practice management UI

A high-fidelity, runnable design prototype for a cloud practice management system
aimed at **New Zealand specialist clinics**. It combines the specialist-clinic
workflow of a letters/referrals/ACC/Xero product with an all-in-one,
dashboard-driven approach: one unified patient view, one inbox, clinical and
admin tools in the same place.

Built with **React 18 + Vite**. Motion is [Motion](https://motion.dev)
(framer-motion) for the interface and **three.js** for the sign-in brand scene.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in dist/
npm run preview    # serve the build on :8181
```

Two entry points: `index.html` (the app) and `login.html` (sign-in).
The design system is a route inside the app — `#/styleguide`.

> Kora Health is fictional. Every patient, NHI number, ACC claim, invoice and
> clinician in here is invented. The visual identity is original and is not
> derived from any existing product.

---

## Brand and visual language

| | |
|---|---|
| **Accent** | Pounamu `#15803E`, with `#17A24A` one step brighter; carries every primary action |
| **Secondary** | Clay `#B87848`, the warm earth tone green needs opposite it |
| **Neutrals** | Near-neutral greys with a faint green cast, on a `#F6F9F7` ground |
| **Type** | IBM Plex superfamily: Serif for headings, Sans for the interface, Mono for every identifier and figure |
| **Shape** | 3px chips, 5px controls, 7px cards, 10px overlays; radius scales with density |
| **Elevation** | Flat. A hairline separates; a shadow means the thing genuinely floats, so only overlays get one |

Success reuses the brand green rather than introducing a second one. Two
competing greens is what makes green systems unreadable, and every other
status is deliberately far from green in hue.

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
| `#/consult/:id` | Consultation — SOAP notes, measurements, coding, prompts, sign and file |
| `#/admin` | Settings cards, users, permissions, consultant profile |
| `#/styleguide` | The design system, rendered from the product's own components |
| `login.html` | Sign-in: credentials → authenticator code → practice and location |

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

`#/styleguide` documents the colour ramps, type scale, buttons, inputs, status
chips, cards, tables, overlays, feedback states, the icon set and the
accessibility rules — live, in both themes. It renders the same components the
product does, so it cannot drift from the app the way a static spec does.

## Accessibility

Verified rather than asserted (see *Verification* below):

- **Contrast** — all 50 checked token pairings meet WCAG AA in both themes:
  ≥ 4.5:1 for text, ≥ 3:1 for control boundaries and the focus ring
- **Keyboard** — every action reachable by Tab; dialogs trap focus, close on
  <kbd>Esc</kbd>, and return focus to where it came from
- **Focus** — always visible: a 2px accent ring, or a border-plus-halo on fields
- **Not colour alone** — every status chip pairs its colour with a label
- **Motion** — 110–280ms, and all of it stops under `prefers-reduced-motion`

## Type, icons and 3D

Typefaces are IBM Plex (OFL), bundled as woff2 in `src/fonts` and imported
through CSS — no CDN, so the app renders identically offline.

Icons are [Lucide](https://lucide.dev) (ISC licence) via `lucide-react`: real
vectors on one 24px grid with a 1.75 stroke and rounded terminals, tree-shaken
so only the 63 icons actually used ship. Every icon sits beside a label or an
`aria-label` — none carries meaning on its own.

**three.js is used in exactly one place**: the sign-in brand panel, which is a
marketing surface rather than a clinical one. Nine concentric rings on separate
z-planes drift behind a dust field. It is dynamically imported so the ~690 KB
chunk never loads for the app itself, skipped entirely under
`prefers-reduced-motion`, paused when the tab is hidden, fully disposed on
unmount, and wrapped so a WebGL failure can never block someone signing in.
Interface animation is Motion, which respects reduced-motion and leaves the
accessibility tree alone — a PMS is used for eight hours a day on shared,
often old clinic machines, and a WebGL canvas is the wrong tool for that.

## Structure

```
index.html              app entry
login.html              sign-in entry
vite.config.js          two-entry build
src/
  main.jsx              app root — HashRouter
  login.jsx             sign-in root
  App.jsx               routes, role, theme, command palette
  components/
    Shell.jsx           sidebar, top bar, global search, keyboard shortcuts
    CommandPalette.jsx  Ctrl+K — grouped commands, arrow/enter, focus trapped
    BrandScene.jsx      the three.js sign-in scene (dynamically imported)
    Primitives.jsx      chips, avatars, banners, cards, empty states, skeletons
  lib/
    ui.jsx              overlays and toasts — focus trap, Escape, focus restore
    format.js           NZD, dates, ages, GST totals, status maps
    theme.js            theme and persisted local state
  data/sample.js        NZ sample data (494 patients, clinicians, appointments,
                        invoices, ACC queue, billing codes, recalls)
  views/                one module per screen, plus StyleGuide.jsx
  styles/               tokens, base, components, app, auth, fonts
  fonts/                the bundled IBM Plex woff2 files
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

- **Smoke** — all 16 routes render, the sign-in page and its three.js canvas,
  four role dashboards, light and dark, zero console errors
- **Accessibility** — accessible names on every control and field across all
  routes, focus ring on 25 tabbed elements, focus trapping in dialogs
- **Keyboard** — every `g`-then-letter jump, and that a lone `g` or a `g` typed
  into a field never navigates
- **Contrast** — 50 token pairings computed with alpha compositing against their
  real backgrounds, both themes
- **Interaction** — 11 end-to-end flows: arrival status, calendar drag,
  letter autosave and template insert, AI scribe, kanban drag, ACC fix-now
  revalidation, inbox approval, split invoicing, command palette routing
- **Sign-in, search and consult** — the three-step login, the four-field patient
  search with NHI check-digit validation, and the consult screen end to end:
  SOAP autosave, BMI, templates, dot phrases, the confidential flag, the
  function rail, services for invoicing, and sign-and-file
- **Patient grid** — 494 records, full-width layout, pinned Name and Actions
  columns, sticky header, sorting, paging and live filtering
