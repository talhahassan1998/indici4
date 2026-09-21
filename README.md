# Kora Health — practice management UI

A high-fidelity, runnable design prototype for a cloud practice management system
aimed at **New Zealand specialist clinics**. It combines the specialist-clinic
workflow of a letters/referrals/ACC/Xero product with an all-in-one,
dashboard-driven approach: one unified patient view, one inbox, clinical and
admin tools in the same place.

Built with **React 18 + Vite**. Motion is [Motion](https://motion.dev)
(framer-motion), used for state changes and nothing decorative.

It is designed for the people who actually sit in front of it, most of whom are
over fifty: a 17px body, nothing pressable under 44px, no gradients, no glass,
no shadows, and hierarchy carried by typography and rules rather than by boxing
every block in a card.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static output in dist/
npm run preview    # serve the build on :8181
```

One entry point. The app opens on sign-in, and lands on the day's
appointments once you are through it. The design system is a route too, at
`#/styleguide`.

**Test accounts**, all with the password `kora2026`. The account you sign in
with sets the role you land in, and they are listed on the sign-in screen so
you can click one to fill the form.

| Username | Who | Role |
|---|---|---|
| `afenwick` | Dr Alice Fenwick | Clinician |
| `mhopa` | Mereana Hopa | Reception |
| `jpetersen` | Josh Petersen | Typist |
| `lbeckett` | Lorraine Beckett | Practice manager |

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
| **Type** | Roboto throughout at a 17px body, Roboto Mono for every identifier and figure |
| **Shape** | 4px chips, 8px controls, 12px cards, 16px overlays; radius scales with density |
| **Ground** | White page, light hairlines, a wash of brand green behind every column header |
| **Width** | No column cap; panels are inset by a 16px gutter so a wide monitor shows more rows, not more margin |
| **Targets** | 44px minimum on anything pressable, 52px for a primary action |
| **Rows of controls** | Every input, select and button on a line is exactly 44px, asserted in a test rather than eyeballed |
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
| `#/login` | Sign-in: credentials, authenticator code, then practice and location |

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

## Type and icons

Typefaces are Roboto and Roboto Mono (Apache 2.0), bundled as woff2 in
`src/fonts` and imported through CSS — no CDN, so the app renders identically
offline.

One face for text. Headings are Roboto set heavier and tighter, not a second
family: a display face gives a product a voice, and it also gives an older
reader a second set of letterforms to decode for no clinical gain.

Icons are [Lucide](https://lucide.dev) (ISC licence) via `lucide-react`: real
vectors on one 24px grid with a 1.75 stroke and rounded terminals, tree-shaken
so only the 63 icons actually used ship. Every icon sits beside a label or an
`aria-label` — none carries meaning on its own.

The sign-in screen carries a **flat SVG illustration** rather than a rendered
scene: the day's clinic list, the patient record with its allergy flag, the
letter that follows the visit, and the invoice behind it — the four things this
product joins up, drawn on an 8px grid in the project's own greens. It is
inline markup with an `aria-label`, so it costs nothing to load and reads
correctly to a screen reader.

An earlier version of this screen ran an animated three.js contour field. It
was removed along with the dependency. It was the most impressive thing on the
screen and the least useful one, and a PMS is used for eight hours a day on
shared, often old clinic machines. Interface animation is Motion, which
respects reduced-motion and leaves the accessibility tree alone.

## Structure

```
index.html              app entry
public/login.html       redirect, so older links still reach sign-in
vite.config.js          build
src/
  main.jsx              app root, HashRouter
  App.jsx               routes, session gate, role, theme, command palette
  components/
    Shell.jsx           sidebar, top bar, global search, keyboard shortcuts
    CommandPalette.jsx  Ctrl+K — grouped commands, arrow/enter, focus trapped
    ClinicIllustration.jsx  the flat SVG on the sign-in panel
    Primitives.jsx      chips, avatars, banners, cards, empty states, skeletons
  lib/
    ui.jsx              overlays and toasts — focus trap, Escape, focus restore
    format.js           NZD, dates, ages, GST totals, status maps
    theme.js            theme and persisted local state
  data/sample.js        NZ sample data (494 patients, clinicians, appointments,
                        invoices, ACC queue, billing codes, recalls)
  views/                one module per screen, plus StyleGuide.jsx
  styles/               tokens, base, components, app, auth, fonts
  fonts/                the bundled Roboto woff2 files
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

- **Smoke** — the app lands on sign-in unauthenticated, all 16 routes render
  behind it, light and dark, no decorative canvas, zero console errors
- **Accessibility** — accessible names on every control and field across all
  routes, focus ring on 25 tabbed elements, focus trapping in dialogs
- **Keyboard** — every `g`-then-letter jump, and that a lone `g` or a `g` typed
  into a field never navigates
- **Sign-in** — its own pass over every visible pairing across all three steps,
  accessible names, and a focus ring on each control
- **Sign-in alignment** — identical padding on both panels, a shared header
  baseline, equal content columns, the same left edge and width on every
  control, one repeated gap, and no panel scroll
- **Designed for 50+** — asserted, not eyeballed: no text under 13px, nothing
  pressable under 44px, and no gradients, glass or drop shadows outside the two
  places where a gradient is load-bearing
- **Contrast** — 50 token pairings computed with alpha compositing against their
  real backgrounds, both themes
- **Interaction** — 11 end-to-end flows: arrival status, calendar drag,
  letter autosave and template insert, AI scribe, kanban drag, ACC fix-now
  revalidation, inbox approval, split invoicing, command palette routing
- **Sign-in, search and consult** — the three-step login, the four-field patient
  search with NHI check-digit validation, and the consult screen end to end:
  SOAP autosave, BMI, templates, dot phrases, the confidential flag, the
  function rail, services for invoicing, and sign-and-file
- **Patient grid** — 494 records, full-width layout, sticky header, no frozen
  columns, sorting, paging, live filtering, row selection and the bulk action
  it unlocks
- **Rows of controls** — every `.input`, `.select` and `.btn` sharing a line is
  measured across 13 routes and must agree to the pixel
- **Sideways overflow** — every route at 1440px and 1280px, asserting nothing
  pushes the shell wider than the window and drags the sidebar off-screen
- **Consistency** — one tab design across every track in the product, nothing
  scrolled out of a tab row, and every two-line cell leading with the heavier,
  larger line
- **Invoice list** — row actions visible without hovering, labelled, 44px, and
  aligned in columns down the table; the table fits its panel; and the footer
  totals match the rows on screen, before and after a filter
