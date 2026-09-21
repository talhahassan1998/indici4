/* The design system, rendered from the same components the product uses —
   so it cannot drift from the app the way a static spec does. */
import { useState } from 'react';
import {
  Activity, Bell, Building2, CalendarDays, ChartColumn, Check, ChevronDown, ChevronLeft,
  ChevronRight, Clock, Copy, CreditCard, DollarSign, Download, EllipsisVertical, Eye, FilePen,
  FileText, Filter, FlaskConical, HeartPulse, House, IdCard, Inbox, Info, LayoutDashboard,
  LayoutTemplate, Link2, List, Lock, LogOut, Mail, Mic, MicOff, Moon, PanelLeft, Pencil, Phone,
  Pill, Plus, Printer, ReceiptText, RefreshCw, Search, Send, Settings, Share2, Shield,
  ShieldCheck, Sparkles, SquareCheckBig, SquareKanban, Stethoscope, Sun, Syringe, Trash2,
  TriangleAlert, Upload, User, UserCheck, UserPlus, Users, X,
} from 'lucide-react';
import K from '../data/sample.js';
import { money, invoiceTotals } from '../lib/format.js';
import { useUi, Modal, Drawer, Menu, SavedIndicator } from '../lib/ui.jsx';
import { Chip, FunderChip, Avatar, Banner, Empty, Skeleton, Switch } from '../components/Primitives.jsx';
import '../styles/styleguide.css';

const SECTIONS = [
  ['colour', 'Colour'], ['type', 'Type'], ['buttons', 'Buttons'], ['inputs', 'Inputs'],
  ['chips', 'Status'], ['cards', 'Cards'], ['tables', 'Tables'], ['overlays', 'Overlays'],
  ['feedback', 'Feedback'], ['icons', 'Icons'], ['a11y', 'Accessibility'],
];

/* The icons actually in use across the product — the grid is the inventory, not a catalogue. */
const ICONS = {
  Activity, Bell, Building2, CalendarDays, ChartColumn, Check, ChevronDown, ChevronLeft,
  ChevronRight, Clock, Copy, CreditCard, DollarSign, Download, EllipsisVertical, Eye, FilePen,
  FileText, Filter, FlaskConical, HeartPulse, House, IdCard, Inbox, Info, LayoutDashboard,
  LayoutTemplate, Link2, List, Lock, LogOut, Mail, Mic, MicOff, Moon, PanelLeft, Pencil, Phone,
  Pill, Plus, Printer, ReceiptText, RefreshCw, Search, Send, Settings, Share2, Shield,
  ShieldCheck, Sparkles, SquareCheckBig, SquareKanban, Stethoscope, Sun, Syringe, Trash2,
  TriangleAlert, Upload, User, UserCheck, UserPlus, Users, X,
};

/* Relative luminance, so each swatch label picks the readable ink rather than
   flipping at a hard-coded step. */
const lum = hex => {
  const c = [1, 3, 5].map(i => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};

function Ramp({ name, steps, hexes }) {
  return (
    <div className="ramp mt-3">
      {steps.map((s, i) => {
        const L = lum(hexes[i]);
        const onWhite = 1.05 / (L + 0.05);
        return (
          <div key={s} title={`--${name}-${s}: ${hexes[i]}`}
            style={{ background: hexes[i], color: onWhite >= 4.5 ? '#fff' : '#141A17' }}>{s}</div>
        );
      })}
    </div>
  );
}

const POU = ['#F1F8F4', '#E5EFE7', '#D2E7DA', '#A3D3B4', '#54B577',
             '#17A24A', '#15803E', '#116330', '#0D4A25', '#083018'];
const CLAY = ['#FBF1EA', '#F4E1D3', '#E6C0A4', '#D29C74', '#B87848', '#9A5C31', '#7C4826'];
const NEUT = ['#FFFFFF', '#FCFDFC', '#F6F9F7', '#EDF1EE', '#E1E7E3', '#CFD7D2',
              '#B2BCB6', '#8B978F', '#5E6862', '#4E5852', '#39423C', '#262D29', '#141A17'];

function Section({ id, title, lede, children }) {
  return (
    <section className="sg-sec" id={id}>
      <h2>{title}</h2>
      <p className="lede">{lede}</p>
      {children}
    </section>
  );
}

export default function StyleGuide() {
  const { open, toast } = useUi();
  const [menu, setMenu] = useState(null);
  const [reminder, setReminder] = useState(true);
  const [waitlist, setWaitlist] = useState(false);
  const [share, setShare] = useState(30);

  const demoModal = () => open(close => (
    <Modal title="Cancel this appointment?" sub="Te Aroha Ngata · 9:45am" tone="bad"
      icon={<TriangleAlert size={15} />} onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Keep booking</button>
        <span className="spacer" />
        <button className="btn btn-danger" onClick={() => { close(); toast('Appointment cancelled', 'Te Aroha Ngata · 9:45am', 'warn'); }}>
          Cancel appointment</button>
      </>}>
      <div className="field">
        <label className="label" htmlFor="sgReason">Reason <span className="req">*</span></label>
        <select className="select" id="sgReason" data-autofocus>
          <option>Patient requested, rebooking</option>
          <option>Patient unwell</option>
          <option>Clinician unavailable</option>
        </select>
        <span className="hint">Recorded on the timeline and used in DNA reporting.</span>
      </div>
    </Modal>
  ));

  const demoDrawer = () => open(close => (
    <Drawer title="Create invoice" sub="Te Aroha Ngata · JKL8472 · ACC" onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Cancel</button>
        <span className="spacer" />
        <button className="btn btn-primary" onClick={() => { close(); toast('Invoice created', 'INV-2026-0442 · $454.25', 'ok'); }}>
          <Send size={15} /> Create invoice</button>
      </>}>
      <div className="col g-4">
        <Banner tone="ok" icon={<Check size={15} />}>
          Pre-filled from <b>New consultation</b> with Dr Alice Fenwick.
        </Banner>
        <div className="field"><label className="label" htmlFor="sgPayer">Payer</label>
          <select className="select" id="sgPayer"><option>ACC</option><option>Southern Cross</option><option>Private</option></select></div>
        <div className="col g-2">
          <div className="row between t-sm"><span className="muted">Subtotal</span><span className="num">$395.00</span></div>
          <div className="row between t-sm"><span className="muted">GST 15%</span><span className="num">$59.25</span></div>
          <div className="divider" />
          <div className="row between"><span className="t-h4">Total</span><span className="t-h3 num">$454.25</span></div>
        </div>
      </div>
    </Drawer>
  ));

  return (
    <div className="page sg-wrap">
      <div className="page-hd">
        <div className="page-title">
          <span className="t-eyebrow">Design system v1.0</span>
          <h1>Kora Health</h1>
          <span className="page-sub">A calm, clinical-but-warm interface language for New Zealand specialist practice.</span>
        </div>
      </div>

      <nav className="sg-jump" aria-label="Design system sections">
        {SECTIONS.map(([id, label]) => <a href={`#/styleguide#${id}`} key={id}
          onClick={e => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>{label}</a>)}
      </nav>

      <p className="sg-lede t-body">
        Pounamu green carries every action; clay marks the things worth noticing. Status colour is a promise:
        green means settled, amber means waiting, red means it will fail, grey means not started.
      </p>

      <Section id="colour" title="Colour"
        lede="One confident accent, one warm secondary, and a near-neutral grey ramp. Every pairing below meets WCAG AA in both themes: 4.5:1 for body text, 3:1 for large text and UI boundaries.">
        <div className="sg-block">
          <span className="t-eyebrow">Pounamu · primary</span>
          <Ramp name="pou" steps={[50, 100, 200, 300, 400, 500, 600, 700, 800, 900]} hexes={POU} />
          <p className="t-xs subtle mt-2">600 is the default action colour. 700/800 are hover and pressed.
            50/100 are soft fills behind icons and selected rows.</p>
        </div>
        <div className="sg-block">
          <span className="t-eyebrow">Clay · secondary highlight</span>
          <Ramp name="clay" steps={[50, 100, 200, 300, 400, 500, 600]} hexes={CLAY} />
          <p className="t-xs subtle mt-2">Emphasis and ACC-related surfaces. Never destructive, never “safe”.</p>
        </div>
        <div className="sg-block">
          <span className="t-eyebrow">Neutrals · surfaces and text</span>
          <Ramp name="n" steps={[0, 25, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900]} hexes={NEUT} />
        </div>
        <div className="sg-block">
          <span className="t-eyebrow">Semantic status</span>
          <div className="sg-cols mt-3">
            {[['Arrived · Paid · Done', 'ok', '--ok-fg'],
              ['Waiting · Pending', 'warn', '--warn-fg'],
              ['DNA · Overdue · Error', 'bad', '--bad-fg'],
              ['Draft · Inactive', 'draft', '--text-subtle'],
              ['In consult · Info', 'info', '--info-fg'],
              ['Accent · Selected', 'accent', '--accent'],
            ].map(([label, key, token]) => (
              <div className="sw" key={key}>
                <div className="swatch" style={{ background: `var(--${key === 'accent' ? 'accent-soft' : key === 'draft' ? 'surface-3' : key + '-bg'})` }}>
                  <Chip tone={key === 'draft' ? undefined : key} label={key} />
                </div>
                <div className="meta"><b>{label}</b><span>{token}</span></div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="type" title="Typography"
        lede="The Roboto superfamily. Roboto for the interface, Roboto Slab for mastheads and letter bodies, Roboto Mono for every number a clinic reads at a glance: times, money, NHI, claim numbers.">
        <div className="sg-block">
          {[['t-display / 34', 'Kia ora, Dr Fenwick', 't-display'],
            ['t-h1 / 28', 'Today’s clinic', 't-h1'],
            ['t-h2 / 23', 'Patient workspace', 't-h2'],
            ['t-h3 / 19', 'Billing snapshot', 't-h3'],
            ['t-h4 / 16', 'Outstanding work', 't-h4'],
            ['body / 14', 'Thank you for referring this patient, whom I saw in clinic today.', 't-body'],
            ['t-sm / 13', 'Secondary detail and table cells.', 't-sm'],
            ['t-xs / 11.5', 'Metadata, hints and timestamps.', 't-xs'],
            ['t-eyebrow / 10.5', 'Section label', 't-eyebrow'],
            ['t-metric', '$4,182.50', 't-metric'],
            ['t-mono', 'JKL8472 · ACC-2026-44817 · 09:45', 't-mono'],
          ].map(([tag, sample, cls]) => (
            <div className="specimen" key={tag}>
              <span className="tag">{tag}</span><span className={cls}>{sample}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section id="buttons" title="Buttons"
        lede="One primary action per view. Secondary carries a border so it survives on coloured surfaces; ghost is for dense toolbars and row actions.">
        <div className="sg-block col g-4">
          <div className="row g-3 wrap">
            <button className="btn btn-primary"><Check size={15} /> Approve and send</button>
            <button className="btn btn-secondary">Save draft</button>
            <button className="btn btn-soft"><Check size={15} /> Mark arrived</button>
            <button className="btn btn-warm"><Sparkles size={15} /> Generate draft</button>
            <button className="btn btn-ghost">Cancel</button>
            <button className="btn btn-danger"><X size={15} /> Record DNA</button>
            <button className="btn btn-primary" disabled>Disabled</button>
          </div>
          <div className="divider" />
          <div className="row g-3 wrap">
            <button className="btn btn-primary btn-lg"><Plus size={17} /> Large</button>
            <button className="btn btn-primary"><Plus size={15} /> Default</button>
            <button className="btn btn-primary btn-sm"><Plus size={13} /> Small</button>
            <button className="btn btn-secondary btn-icon" aria-label="More"><EllipsisVertical size={15} /></button>
            <button className="btn btn-secondary btn-icon btn-sm" aria-label="More"><EllipsisVertical size={14} /></button>
            <div className="btn-group">
              <button className="btn btn-secondary">Day</button>
              <button className="btn btn-secondary">Week</button>
              <button className="btn btn-secondary">Month</button>
            </div>
          </div>
          <div className="divider" />
          <div className="row g-3 wrap">
            <div className="segmented"><button aria-pressed="true">Day</button><button aria-pressed="false">Week</button></div>
            <div className="pill-nav">
              <button aria-pressed="true">All</button><button aria-pressed="false">Draft</button><button aria-pressed="false">Sent</button>
            </div>
            <span className="kbd">Ctrl K</span><span className="kbd">/</span><span className="kbd">Esc</span>
          </div>
        </div>
      </Section>

      <Section id="inputs" title="Inputs"
        lede="Every field has a visible label. Errors say what to do, not just what is wrong, in the same voice used for ACC validation.">
        <div className="sg-block">
          <div className="sg-auto">
            <div className="field"><label className="label" htmlFor="sg1">Patient name</label>
              <input className="input" id="sg1" placeholder="Search by name or NHI" /></div>
            <div className="field"><label className="label" htmlFor="sg2">With leading icon</label>
              <div className="input-group"><span className="ic-lead"><Search size={15} /></span>
                <input className="input" id="sg2" placeholder="Search…" /></div></div>
            <div className="field"><label className="label" htmlFor="sg3">Appointment type</label>
              <select className="select" id="sg3"><option>New consultation, 45 min</option><option>Follow-up, 20 min</option></select></div>
            <div className="field"><label className="label" htmlFor="sg4">Claim number <span className="req">*</span></label>
              <input className="input t-mono" id="sg4" defaultValue="ACC-2026-4481" aria-invalid="true" aria-describedby="sg4err" />
              <span className="err" id="sg4err">Claim numbers have five digits after the year. Check the ACC45.</span></div>
            <div className="field"><label className="label" htmlFor="sg5">Amount</label>
              <div className="input-group"><input className="input input-money" id="sg5" defaultValue="395.00" />
                <span className="affix">NZD</span></div>
              <span className="hint">Excludes GST.</span></div>
            <div className="field"><label className="label" htmlFor="sg6">Disabled</label>
              <input className="input" id="sg6" defaultValue="Read only" disabled /></div>
          </div>
          <div className="field mt-4"><label className="label" htmlFor="sg7">Booking note</label>
            <textarea className="textarea" id="sg7" rows="2" placeholder="Reason for visit, interpreter needs, mobility…" /></div>
          <div className="row g-5 mt-4 wrap">
            <label className="row g-3" htmlFor="sgSw1">
              <Switch id="sgSw1" checked={reminder} onChange={setReminder} label="Text reminder 24h before" />
              <span className="t-sm">Text reminder 24h before</span></label>
            <label className="row g-3" htmlFor="sgSw2">
              <Switch id="sgSw2" checked={waitlist} onChange={setWaitlist} label="Offer slot to waitlist" />
              <span className="t-sm">Offer slot to waitlist</span></label>
            <span className="row g-3"><span className="check" role="checkbox" aria-checked="true"><Check size={11} /></span>
              <span className="t-sm">Selected row</span></span>
          </div>
          <div className="field mt-5" style={{ maxWidth: 420 }}>
            <label className="label" htmlFor="sg8">Patient share · {share}%</label>
            <input className="range" id="sg8" type="range" min="0" max="100" value={share}
              onChange={e => setShare(+e.target.value)} style={{ '--pct': `${share}%` }} /></div>
        </div>
      </Section>

      <Section id="chips" title="Status chips"
        lede="Status colour is consistent everywhere in the product. If a chip is green, the thing is settled. If it is red, someone has to act.">
        <div className="sg-block col g-4">
          <div><span className="t-eyebrow">Appointments</span>
            <div className="row g-2 wrap mt-2">{['booked', 'arrived', 'consult', 'done', 'dna'].map(s => <Chip status={s} key={s} />)}</div></div>
          <div><span className="t-eyebrow">Letters</span>
            <div className="row g-2 wrap mt-2">{['draft', 'pending', 'approved', 'sent'].map(s => <Chip status={s} key={s} />)}</div></div>
          <div><span className="t-eyebrow">Invoices</span>
            <div className="row g-2 wrap mt-2">{['draft', 'sent', 'paid', 'overdue'].map(s => <Chip status={s} key={s} />)}</div></div>
          <div><span className="t-eyebrow">Funding &amp; clinical</span>
            <div className="row g-2 wrap mt-2">
              {['ACC', 'Southern Cross', 'Private'].map(f => <FunderChip funder={f} key={f} />)}
              <span className="alert-badge"><TriangleAlert size={13} />Penicillin allergy</span>
              <span className="alert-badge warn"><Info size={13} />Falls risk</span>
            </div></div>
          <div><span className="t-eyebrow">Counts and avatars</span>
            <div className="row g-3 wrap mt-2">
              <span className="badge-count">6</span>
              <span className="badge-count quiet">12</span>
              <span className="badge-count warm">3</span>
              <Avatar id="u1" /><Avatar id="u2" /><Avatar id="u3" size="lg" />
              <span className="avatar-stack"><Avatar id="u1" size="sm" /><Avatar id="u2" size="sm" /><Avatar id="u4" size="sm" /></span>
              <span className="sync-pill"><RefreshCw size={13} /> Xero connected</span>
              <span className="sync-pill off"><Link2 size={13} /> Not set up</span>
            </div></div>
        </div>
      </Section>

      <Section id="cards" title="Cards"
        lede="A hairline border, a radius that varies with the job, and shadow only when something floats. Numbers are large because a practice manager reads them from across the desk.">
        <div className="sg-block">
          <div className="sg-auto">
            <div className="card stat">
              <div className="stat-top"><span className="stat-ic"><ReceiptText size={15} /></span>
                <span className="stat-label">Invoiced today</span></div>
              <span className="stat-value">$1,184</span><span className="stat-sub">5 invoices · incl GST</span></div>
            <div className="card stat">
              <div className="stat-top"><span className="stat-ic bad"><TriangleAlert size={15} /></span>
                <span className="stat-label">ACC errors</span></div>
              <span className="stat-value" style={{ color: 'var(--bad-fg)' }}>3</span>
              <span className="stat-sub">Will be rejected as-is</span></div>
            <div className="card">
              <div className="card-hd"><h3>With header</h3><span className="spacer" /><span className="chip">12</span></div>
              <div className="card-bd"><p className="t-sm muted">Body content sits on the surface colour with a hairline divider above.</p></div>
              <div className="card-ft row"><span className="t-xs subtle">Footer for metadata</span></div></div>
            <div className="card card-bd col g-3">
              <span className="t-eyebrow">Progress</span>
              <span className="t-metric">72%</span>
              <div className="meter"><span className="meter-track" style={{ width: '72%' }} /></div>
              <span className="t-xs subtle">Collected today</span></div>
          </div>
        </div>
      </Section>

      <Section id="tables" title="Tables"
        lede="Sticky headers, right-aligned tabular numbers, row actions that appear on hover or keyboard focus, and a tinted row when something needs fixing.">
        <div className="sg-block" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="tbl">
            <thead><tr><th>Invoice</th><th>Patient</th><th>Payer</th>
              <th className="num-cell">Total</th><th>Status</th><th /></tr></thead>
            <tbody>
              {K.invoices.slice(0, 4).map(i => {
                const t = invoiceTotals(i), p = K.pt(i.pt);
                return (
                  <tr className={i.status === 'overdue' ? 'row-err' : ''} key={i.id}>
                    <td className="t-mono t-sm"><b>{i.id}</b></td>
                    <td><span className="row g-2"><Avatar id={p.id} size="xs" /><span className="t-sm">{p.first} {p.last}</span></span></td>
                    <td><FunderChip funder={i.payer} /></td>
                    <td className="num-cell"><b>{money(t.incl)}</b></td>
                    <td><Chip status={i.status} /></td>
                    <td><span className="row-actions">
                      <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Send ${i.id}`}><Send size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" aria-label={`More for ${i.id}`}><EllipsisVertical size={14} /></button>
                    </span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="overlays" title="Modals, drawers and menus"
        lede="Modals for decisions, drawers for building something, menus for shortcuts. All trap focus, close on Escape, and return focus where you left it.">
        <div className="sg-block row g-3 wrap">
          <button className="btn btn-secondary" onClick={demoModal}><TriangleAlert size={15} /> Open modal</button>
          <button className="btn btn-secondary" onClick={demoDrawer}><PanelLeft size={15} /> Open drawer</button>
          <button className="btn btn-secondary" onClick={e => setMenu({ anchor: e.currentTarget, items: [
            { heading: 'Quick actions' },
            { icon: <Check size={15} />, label: 'Mark as arrived', kbd: 'A' },
            { icon: <X size={15} />, label: 'Mark as DNA' },
            { icon: <CreditCard size={15} />, label: 'Create invoice' },
            '-',
            { icon: <Trash2 size={15} />, label: 'Cancel with reason', danger: true },
          ] })}><EllipsisVertical size={15} /> Open menu</button>
        </div>
      </Section>

      <Section id="feedback" title="Feedback states"
        lede="Empty states teach. Skeletons hold the shape of what is coming. Toasts confirm without stealing focus.">
        <div className="sg-block col g-4">
          <div className="row g-3 wrap">
            {[['ok', 'Success toast', 'Payment recorded', '$454.25 by EFTPOS · receipt emailed'],
              ['warn', 'Warning toast', 'Recorded as DNA', 'Wiremu Kawiti · 2:45pm'],
              ['bad', 'Error toast', 'ACC submission failed', 'Claim number not recognised. Check the ACC45.'],
              ['info', 'Info toast', 'Xero sync started', '5 invoices queued for sync.'],
            ].map(([kind, label, title, body]) => (
              <button className="btn btn-secondary" key={kind} onClick={() => toast(title, body, kind)}>{label}</button>
            ))}
          </div>
          <div className="divider" />
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--s-4)' }}>
            <div className="card card-flat">
              <Empty icon={<Inbox size={22} />} title="Inbox zero"
                body="Nothing waiting on you. Results and referrals arrive here automatically from Healthlink.">
                <button className="btn btn-secondary btn-sm"><RefreshCw size={14} /> Check again</button>
              </Empty>
            </div>
            <div className="card card-flat"><Skeleton rows={3} /></div>
          </div>
          <div className="divider" />
          <div className="col g-3">
            <Banner icon={<Info size={16} />}>A text reminder is sent 24 hours before the appointment.</Banner>
            <Banner tone="ok" icon={<Check size={16} />}>Everything validates. 3 invoices totalling $675.00 are ready to send to ACC.</Banner>
            <Banner tone="warn" icon={<Clock size={16} />}>Waiting for your approval. Typed by Josh Petersen, 2 hours ago.</Banner>
            <Banner tone="bad" icon={<TriangleAlert size={16} />}>Date of injury is missing. ACC will reject invoices on this claim.</Banner>
          </div>
          <div className="divider" />
          <div className="row g-4 wrap">
            <SavedIndicator state="saved" />
            <span className="row g-2"><span className="spinner" /><span className="t-sm muted">Loading results…</span></span>
          </div>
        </div>
      </Section>

      <Section id="icons" title="Icons"
        lede="Lucide on one 24px grid, 1.75 stroke, rounded joins, drawn as vectors so they stay crisp at any zoom. Icons never carry meaning alone: they sit beside a label or an accessible name.">
        <div className="sg-block">
          <div className="icon-grid">
            {Object.entries(ICONS).map(([n, Ic]) => (
              <button className="icon-cell" key={n} title={n}
                onClick={() => { navigator.clipboard?.writeText(`<${n} size={15} />`); toast('Copied', `<${n} size={15} />`, 'ok'); }}>
                <Ic size={20} /><span>{n}</span>
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section id="a11y" title="Accessibility &amp; principles"
        lede="Clinics are used by tired people at speed, on shared machines, sometimes with a mouse in one hand and a phone in the other.">
        <div className="sg-block col g-4">
          <div className="do-dont">
            <div className="do"><b className="t-sm">Do</b>
              <ul className="mt-2 col g-2 t-sm">
                <li>· Put the exception first: errors, unpaid, overdue.</li>
                <li>· Name the fix: “Add the injury date on the patient record”.</li>
                <li>· Keep common actions reachable from anywhere (Ctrl K).</li>
                <li>· Autosave, and say so quietly.</li>
              </ul></div>
            <div className="dont"><b className="t-sm">Don’t</b>
              <ul className="mt-2 col g-2 t-sm">
                <li>· Use colour as the only signal for a status.</li>
                <li>· Hide a destructive action behind an unlabelled icon.</li>
                <li>· Block the screen with a spinner when a skeleton will do.</li>
                <li>· Make someone re-enter what the record already knows.</li>
              </ul></div>
          </div>
          <div className="divider" />
          <div className="sg-auto">
            <div className="col g-2"><span className="t-eyebrow">Contrast</span>
              <p className="t-sm muted">Body text ≥ 4.5:1, large text and UI borders ≥ 3:1, in light and dark.</p></div>
            <div className="col g-2"><span className="t-eyebrow">Keyboard</span>
              <p className="t-sm muted">Every action reachable by Tab. <span className="kbd">/</span> search,{' '}
                <span className="kbd">Ctrl K</span> palette, <span className="kbd">[</span> sidebar.</p></div>
            <div className="col g-2"><span className="t-eyebrow">Focus</span>
              <p className="t-sm muted">A 2px accent ring with 2px offset. Never removed, never invisible on a coloured surface.</p></div>
            <div className="col g-2"><span className="t-eyebrow">Motion</span>
              <p className="t-sm muted">110–280ms, and everything stops under <span className="t-mono t-xs">prefers-reduced-motion</span>.</p></div>
          </div>
        </div>
      </Section>

      <footer className="mt-6" style={{ paddingTop: 'var(--s-6)', borderTop: '1px solid var(--line)' }}>
        <p className="t-xs subtle">Kora Health is a fictional product built as a design prototype. All patients,
          NHI numbers, ACC claims and invoices are invented.</p>
      </footer>

      {menu && <Menu anchor={menu.anchor} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}
