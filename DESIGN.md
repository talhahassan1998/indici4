# DESIGN.md — Kora Health

A design system document in the [Stitch DESIGN.md](https://stitch.withgoogle.com/docs/design-md/specification/)
format, extended per [awesome-design-md](https://github.com/VoltAgent/awesome-design-md).
Read this before generating or changing any Kora Health UI. Every value here is
live in `src/styles/tokens.css` — the token name is the source of truth, the hex
is given so an agent can reason about it.

Guardrails in section 7 come from the anti-slop audit
([taste-skill](https://github.com/Leonxlnx/taste-skill)), run against the real
product and kept to the rules that survived it.

---

## 1. Visual Theme & Atmosphere

**Product.** Cloud practice management for New Zealand specialist clinics:
bookings, patient records, consultations, letters, billing, ACC.

**Mood.** Calm, clinical, warm. Not the blue-and-white hospital cliché, not a
consumer SaaS landing page. The interface is a tool someone uses for eight
hours a day on a shared machine, so it stays quiet and lets the data speak.

**Density.** High in the app, low on the sign-in surface. A patient register
shows 100 rows at a glance; a sign-in screen shows one decision. These are
different jobs and they run different scales (see section 3).

**Audience.** Clinicians, reception, typists and practice managers. The
majority are over fifty. That is a design constraint, not a footnote: it sets
minimum type size, control height and contrast floors throughout.

**Philosophy.**
- Show the exception first. Errors, unpaid, overdue, DNA.
- Colour is a promise, never decoration. Green means settled, amber means
  waiting, red means it will fail, grey means not started. It means that on
  every screen.
- Never make someone re-enter what the record already knows.
- Flat by default. A hairline separates; a shadow means the thing genuinely
  floats above the page.

---

## 2. Color Palette & Roles

### Brand — Pounamu

| Token | Hex | Role |
|---|---|---|
| `--pou-50` | `#F1F8F4` | Lightest wash, soft fill behind icons |
| `--pou-100` | `#E5EFE7` | Selected row, active nav background |
| `--pou-200` | `#D2E7DA` | Avatar tint, hover on soft fills |
| `--pou-300` | `#A3D3B4` | Decorative strokes, disabled accent |
| `--pou-400` | `#54B577` | Secondary appointment type |
| `--pou-500` | `#17A24A` | Bright accent, focus halo source |
| `--pou-600` | `#15803E` | **The action colour.** Every primary button |
| `--pou-700` | `#116330` | Hover, and accent text on light surfaces |
| `--pou-800` | `#0D4A25` | Pressed, and the deep brand panel |
| `--pou-900` | `#083018` | Darkest, overlay tint |

### Secondary — Clay

`--clay-50 #FBF1EA` · `--clay-100 #F4E1D3` · `--clay-200 #E6C0A4` ·
`--clay-300 #D29C74` · `--clay-400 #B87848` · `--clay-500 #9A5C31` ·
`--clay-600 #7C4826`

Green needs a warm earth tone opposite it or the whole interface goes cold.
Clay carries emphasis and ACC-related surfaces. **Never** destructive, never
"safe".

### Neutrals

`--n-0 #FFFFFF` · `--n-25 #FCFDFC` · `--n-50 #F6F9F7` · `--n-100 #EDF1EE` ·
`--n-150 #E1E7E3` · `--n-200 #CFD7D2` · `--n-300 #B2BCB6` · `--n-400 #8B978F` ·
`--n-500 #5E6862` · `--n-600 #4E5852` · `--n-700 #39423C` · `--n-800 #262D29` ·
`--n-900 #141A17`

Near-neutral with a faint green cast, so greys sit with the brand instead of
fighting it.

### Semantic status

| Meaning | fg | bg | line |
|---|---|---|---|
| Arrived · Paid · Done | `#146B35` | `#E3F0E8` | `#B4D7C2` |
| Waiting · Pending | `#8A5A12` | `#F8EDD8` | `#E4C793` |
| DNA · Overdue · Error | `#A33528` | `#FDE9E7` | `#EBB2A8` |
| Draft · Inactive | `#4E5852` | `#E8EDEA` | `#CBD4CE` |
| In consult · Info | `#2C5B79` | `#E3EDF4` | `#AECCE0` |

Success **reuses the brand green** rather than introducing a second one. Two
competing greens is what makes green systems unreadable. Every other status is
deliberately far from green in hue.

### Applied roles

`--bg #F6F9F7` (page ground) · `--surface #FFFFFF` (cards) ·
`--surface-2 #FCFDFC` · `--surface-3 #F6F9F7` ·
`--text #141A17` · `--text-muted #4E5852` · `--text-subtle #5E6862` ·
`--line #E1E7E3` (hairline) · `--line-strong #CFD7D2` ·
`--line-field #859089` (control boundary, holds 3:1 on every surface) ·
`--focus #15803E`

### Contrast floors — non-negotiable

- Body text ≥ **4.5:1**
- Large text and every UI boundary ≥ **3:1**
- Both themes, measured with alpha compositing against the real background,
  not against the token's nominal value.

All 50 token pairings in the system are verified at these floors in light and
dark. A new pairing ships only after it is measured.

---

## 3. Typography Rules

**Roboto**, self-hosted as woff2. Never a CDN — the app must render identically
offline in a clinic with bad internet.

| Family | Token | Used for |
|---|---|---|
| Roboto | `--font-sans`, `--font-display` | Everything that is read as words |
| Roboto Mono | `--font-mono` | Every identifier and figure: NHI, chart no., claim no., money, times |

**One typeface for text.** Headings are the same face as body, set heavier and
tighter. A second display face gives a product a voice; it also gives a reader
over fifty a second set of letterforms to decode, and the mastheads it was
carrying are not the part of this screen that matters. Roboto Mono stays,
because a column of figures has to line up.

### Scale — 17px body, compressed at the top

| Token | Size | Use |
|---|---|---|
| `--fs-2xs` | 13px | Floor. Uppercase labels only; nothing in the product is smaller |
| `--fs-xs` | 14px | Hints, timestamps, units |
| `--fs-sm` | 15px | Secondary detail under a label |
| `--fs-md` | 17px | Body, table cells, inputs, buttons |
| `--fs-lg` | 19px | `h4` |
| `--fs-xl` | 21px | Section headings, `h3` |
| `--fs-2xl` | 24px | Figures, `h2` |
| `--fs-3xl` | 28px | `h1` |
| `--fs-4xl` | 32px | Page masthead |

The top of the scale is deliberately compressed. **Hierarchy comes from weight,
colour and the rule under a heading, not from size.** A 48px heading over 14px
body is a landing page; it tells a clinician nothing about what to read next.
17px body and a 21px heading, correctly spaced, tells them everything.

The same scale runs everywhere — the sign-in screen no longer steps up, because
the rest of the product came up to meet it.

Weights: `400 / 500 / 600 / 700 / 800`. Line heights:
`1.15 tight · 1.32 snug · 1.55 base · 1.7 loose`.

**Tabular figures everywhere numbers are compared** — `font-variant-numeric:
tabular-nums` on times, money, counts, ages.

---

## 4. Component Stylings

### Buttons

| Variant | Fill | Text | Use |
|---|---|---|---|
| `btn-primary` | `--accent` | white | One per view |
| `btn-secondary` | surface + 1px `--line-strong` | `--text` | Survives on coloured surfaces |
| `btn-soft` | `--accent-soft` | `--accent-text` | Row-level affirmative |
| `btn-warm` | `--warm-soft` | `--warm-text` | AI and ACC actions |
| `btn-ghost` | transparent | `--text-muted` | Dense toolbars, row actions |
| `btn-danger` | `--bad-bg` | `--bad-fg` | Destructive |

Heights: `36px` default · `44px` `btn-lg` · **`52–56px` on sign-in**.
Every icon button carries an `aria-label`. `:active` uses `scale(.98)`, not a
colour change.

### Inputs

- Label **above**, always visible. Never placeholder-as-label.
- Helper text below the label, error text below the field.
- Height `36px` in the app, **`52px` on sign-in**.
- Border `1px --line-field`. Focus is a 2px `--focus` ring at 2px offset.
- `aria-invalid` on error, with the message naming the fix, not just the fault:
  "Claim numbers have five digits after the year. Check the ACC45."

### Status chips

Tinted pill, 19px tall, uppercase, `--fs-2xs`, radius `--r-xs`.
**No dot.** The tint, the border, the text colour and the label already say it
four times. A dot is reserved for one thing: a genuinely live indicator, such
as a running consultation timer.

### Surfaces

**The page is white.** A grid of four hundred rows on a tinted ground reads as a
panel floating on a background; on white it reads as the page, which is what it
is. Depth comes from a hairline and a radius, not from two shades of off-white
stacked on each other.

**Borders are light.** `--line` for structure, `--line-faint` between rows. The
resting field border is `--n-300`, deliberately softer than the 3:1 that WCAG
1.4.11 asks of a control boundary. That trade is paid for twice: every field
also carries a tinted fill (`--field-bg`), so it is a well rather than an
outline, and focus is a full accent border plus a halo rather than a shade
change. The contrast suite records the resting value at what it actually ships
at rather than dropping the check.

**Colour in a column header, and nowhere else structural.** `--th-bg` is a wash
of the brand green with `--th-fg` over it. A header is a different kind of row
and should say so; a grey header reads as a disabled row.

### Full width

`--content-max` is `none` and `--page-gutter` is 16px. A practice-management
grid earns its keep by showing more rows and more columns at once, and a
1560px measure in the middle of a 2560px monitor throws that away. Panels are
inset by the gutter and nothing more; the border and the radius are what stop
them bleeding off the edge.

Two rules keep that honest:

- `.app` is `grid-template-columns: var(--sidebar-w) minmax(0, 1fr)`. An
  `auto`-minimum track is sized by its content, so the patient grid pushed the
  whole shell wider than the window and dragged the sidebar off the left edge.
- Filter rows are flex with `flex-wrap`, not a fixed grid. A media query is
  written against the window, but what has to fit is the window minus the
  sidebar, so a four-column grid kept overflowing at widths the breakpoint
  thought were roomy.

### Sections, and the few real cards

A block of related content is a **section**: an `h2`, a rule, and its rows,
sitting on the page. `.sect` for a hairline rule, `.sect-lead` for the 2px rule
that marks the one block a page is built around.

A **card** — hairline border, no shadow, `--r-md` — is the exception, not the
container of first resort, and a page is allowed roughly one. Use it when the
content genuinely is a separate surface: a data table, a docked reference
panel, the patient who is waiting for you right now. Boxing every block gives
every block the same weight, and buries the content two surfaces deep.

Figures go in a `.fig-row`: a divided line of numbers, each with its label
underneath. Not four matching tiles. Colour on a figure means *do something*.

### Filter rows

Labels above, controls below, `align-items: end` on the grid. That last part is
the whole trick: the labelled fields and the bare buttons land on the same
bottom edge, so the row reads as one line whether or not a control carries a
label. The primary action sits in that line, not above it.

**Every control on a line is exactly `--h-md`.** Inputs take `height`, never
`min-height` — `min-height` plus padding plus a 1.45 line box renders at
46.6px, and a 44px button beside it is visibly out of true.

A placeholder is not a label. It disappears the moment someone types, and then
the field is unnamed for everybody, not only for a screen reader.

### Grids

Sticky header, right-aligned tabular numbers, row actions always visible (never
revealed on hover: someone who cannot see them cannot find them), and a tinted
row (`.row-err`) when something needs fixing. Rows stay one line; a wrapped
invoice number reads as two invoice numbers, and a table whose row heights vary
with the length of a name cannot be scanned down a column. Cells that genuinely
need to wrap opt in with `.wrap-cell`.

**Selection** is a 46px first column carrying a `.check`, with a select-all in
the header. A selected row says so with a tint, not only with a ticked box in
the corner of the eye. The patient grid pins that column and the name beside it.

**The bar over the grid** (`.grid-bar`) carries what you have, what you have
selected, the bulk action that selection unlocks, and the pages. It sits
directly above the rows, because a pager only reachable by scrolling past four
hundred rows is a pager nobody uses.

### Empty values

An em-dash reads as content and has no accessible name. Use the `Nil` token:
a 9px hairline at 55% `--text-subtle`, with a visually-hidden label ("None",
"No mobile", "Not recorded").

### Navigation

Sidebar, four labelled groups, 254px expanded and 68px collapsed. Count badges
sit on the right of the item and carry a tone (`bad` for overdue, `warm` for
waiting). Active item: `--accent-soft` fill plus a 3px accent edge.

**The collapse control lives in the sidebar**, in the brand row, because it is
the only thing on screen whose whole job is that panel. Collapsed, the brand
row stacks: the mark, then the control that brings the sidebar back. The foot
of the sidebar names the practice and the build, which is what people quote to
support.

**The account lives in the top-right corner** — avatar, name, role, chevron —
where people look for it, next to the notification bell. Below 1180px the name
and role drop and the avatar carries it. Both placements are asserted in the
smoke suite so they cannot drift back.

---

## 5. Layout Principles

**Spacing, 4px base.** `--s-1 4` · `--s-2 8` · `--s-3 12` · `--s-4 16` ·
`--s-5 20` · `--s-6 24` · `--s-7 32` · `--s-8 40` · `--s-9 48` · `--s-10 64`.

Use the scale. A hand-typed `13px` gap is a bug.

**Radius scales with density** — this is the rule, and it is followed everywhere:

| Token | Size | Applies to |
|---|---|---|
| `--r-xs` | 4px | Chips, tags, swatches |
| `--r-sm` | 8px | Buttons, inputs, menu items |
| `--r-md` | 12px | Cards, grid panels |
| `--r-lg` | 16px | Modals, drawers |
| `--r-pill` | 999px | Avatars and genuinely circular things only |

Softened corners, still not pills. A pill on every control reads as a consumer
app; the only pills here are avatars and one sync indicator.

**Control sizes.** `--h-sm` and `--h-md` are both **44px** — "small" changes the
padding, never the target — and `--h-lg` is 52px for a primary action. Anything
you press is at least 44px tall, including the label wrapping a switch.

**Shell.** Sidebar `254px`, topbar `68px`, no content cap, `--page-gutter` `16px`.

**Whitespace.** Dense where data is compared, generous where a decision is
made. The patient grid runs full width with no page gutter; a sign-in panel
gets `48px` of padding on every side.

**Alignment is verifiable, not eyeballed.** On any two-panel layout: identical
padding on both panels, one shared content-column width, headers on the same
baseline, every control on the same left edge and the same width, and a single
repeated vertical gap. This is asserted in a test, not checked by looking.

---

## 6. Depth & Elevation

Flat by default. The system has four steps and uses the top two sparingly:

| Token | Value | When |
|---|---|---|
| `--sh-1` | `none` | Cards. A hairline does the work |
| `--sh-2` | `0 1px 2px rgba(13,35,26,.06), 0 4px 10px rgba(13,35,26,.05)` | Menus, popovers |
| `--sh-3` | `0 2px 6px rgba(13,35,26,.07), 0 10px 24px rgba(13,35,26,.09)` | Drawers |
| `--sh-4` | `0 6px 14px rgba(13,35,26,.10), 0 22px 48px rgba(13,35,26,.14)` | Modals |

Shadows are tinted with the brand's dark green, never neutral black.

**Surface hierarchy:** `--bg` (page) → `--surface` (card) → `--surface-2`
(inset, table header) → `--surface-3` (hover, pressed).

---

## 7. Do's and Don'ts

### Do

- Put the exception first: errors, unpaid, overdue.
- Name the fix, not just the fault.
- Keep common actions reachable from anywhere (`Ctrl K`).
- Autosave, and say so quietly.
- Pair every status colour with a label.
- Give every icon a label or an accessible name.

### Don't — general

- Use colour as the only signal for a status.
- Hide a destructive action behind an unlabelled icon.
- Block the screen with a spinner when a skeleton will do.
- Make someone re-enter what the record already knows.
- Put a serif on a data table.

### Don't — anti-slop guardrails

These come from auditing the real product and finding each one in it.

- **Zero em-dashes (`—`) anywhere visible.** It is the single most reliable
  generated-text tell, and as an empty-cell marker it is also just wrong. Use a
  comma, a colon, a full stop, or the `Nil` token.
- **Ration the middot.** Max one `·` per line as *glue*. A list of parallel
  facts (`Name · NHI · 52y`) is fine; `NHI · type · clinician · note` is four
  fields chained on one separator and needs structure instead.
- **No decorative status dots.** Only for real live state.
- **Eyebrow restraint.** At most one small-caps label per three sections.
- **One radius system, followed.** Round buttons in a square layout is broken.
- **One accent, locked.** A green product does not grow a blue CTA in section 7.
- **No fake-perfect numbers.** `47.2%` and `+64 21 445 1102`, never `99.9%`.
- **No generic names.** NZ-realistic, including te reo Māori and Pasifika names.
- **No hand-rolled icon SVGs.** Lucide, one family, one stroke weight.
- **No three identical evenly-spaced cards** as a layout reflex. If a page has
  more than one bordered surface, ask what the border is doing.
- **No 3D scene, no gradients for their own sake, no glass, no drop shadows.**
  A sign-in screen briefly had an animated contour field. It was removed with
  its dependency: it was the most impressive thing on the screen and the least
  useful, and a clinic workstation's GPU has better work to do. The two
  gradients left in the product are load-bearing — 135° hatching for blocked
  calendar time, and a range track that fills to its value.
- **No unlabelled icon toolbars.** The patient grid once carried fourteen 26px
  glyph buttons per row. Across a hundred rows that is fourteen hundred targets
  a reader over fifty cannot name or reliably hit. Two labelled buttons and a
  named menu do the same work.

---

## 8. Responsive Behavior

**Desktop-first.** This is a workstation product; tablet is supported, phone is
a courtesy.

| Breakpoint | Behaviour |
|---|---|
| ≥ 1400px | Full shell, sidebar expanded, grids at full column count |
| 1100–1400px | Content columns narrow; sidebar unchanged |
| 900–1100px | Sign-in drops its brand panel; app sidebar collapses to the 68px rail |
| < 900px | Single column; grids scroll horizontally with pinned first and last columns |
| < 480px | Sign-in padding drops to 22px; code inputs shrink but stay ≥ 56px tall |

**Touch targets ≥ 44×44px** everywhere, and ≥ 52px on the sign-in surface. The
password reveal is a 40px button inside a 52px field, not a 24px glyph.

**No horizontal page scroll at any width.** Asserted in a test. A wide data
grid scrolls *itself*, never the page.

**Motion.** `110ms / 180ms / 280ms`, easing `cubic-bezier(.2,.7,.3,1)`.
Everything stops under `prefers-reduced-motion`.

---

## 9. Agent Prompt Guide

### Quick reference

```
accent          #15803E     primary action
accent bright   #17A24A     focus, bright step
accent text     #116330     accent text on light
page ground     #F6F9F7
page + surface  #FFFFFF
hairline        #E1E7E3
field fill      #F6F9F7
field border    #A8B3AC
table header    #E5EFE7 on #0D4A25
text            #141A17
text muted      #4E5852
warm secondary  #B87848
ok / warn / bad #146B35 / #8A5A12 / #A33528
radius          4 / 8 / 12 / 16 px, by density
spacing         4 8 12 16 20 24 32 40 48 64
type            Roboto 17px body · Roboto Mono (numbers, IDs)
controls        44px minimum, 52px for a primary action
```

### Ready-to-use prompts

> Build a `<screen>` for Kora Health following DESIGN.md. Deep green `#15803E`
> carries every primary action; clay `#B87848` marks emphasis. Hairline borders,
> no shadows, white page, sections rather than boxes, full width with a 16px
> gutter. Roboto throughout at a 17px body,
> Roboto Mono for every NHI, claim number, time and dollar figure. Status chips
> are tinted pills with a label and no dot. Nothing pressable under 44px.

> Review this screen against DESIGN.md section 7. Report every em-dash, every
> line with more than one middot used as glue, every decorative status dot,
> every unlabelled icon, and every control under 44px.

> Add a `<component>` to Kora Health. Use tokens, never literal hex. Label above
> input. Error text names the fix. Verify contrast at 4.5:1 for text and 3:1 for
> boundaries against the real composited background, in both themes.

### What to verify before calling it done

1. Contrast, measured with alpha compositing, both themes.
2. Accessible name on every control; label association on every field.
3. Visible focus ring on everything tabbable.
4. Zero em-dashes in rendered text.
5. No horizontal page overflow at 1600, 1100 and 900px.
6. Both themes rendered and looked at, not assumed.
