import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, Clock, Stethoscope, FileText, Mail, TriangleAlert, Check,
  RefreshCw, ReceiptText, CalendarDays, ShieldCheck, EllipsisVertical, X,
  Sparkles, Plus, Users, ClipboardCheck,
} from 'lucide-react';
import K from '../data/sample.js';
import { fmtLongDate, fmtTime, age, money0, money, invoiceTotals, daysOverdue } from '../lib/format.js';
import { Chip, FunderChip, Avatar, Banner, Empty } from '../components/Primitives.jsx';
import { useUi, Menu } from '../lib/ui.jsx';

const NOW = 10 * 60 + 22;

const stats = () => {
  const unsigned = K.notes.filter(n => !n.signed).length;
  const pending = K.letters.filter(l => l.status === 'pending').length;
  const drafts = K.letters.filter(l => l.status === 'draft').length;
  const uninvoiced = K.appts.filter(a => (a.status === 'done' || a.status === 'consult') && !a.invoiced).length;
  const overdueT = K.tasks.filter(t => t.col !== 'done' && daysOverdue(t.due) > 0).length;
  const todayInv = K.invoices.filter(i => i.date === '2026-09-17');
  const todayTotal = todayInv.reduce((s, i) => s + invoiceTotals(i).incl, 0);
  const unpaid = K.invoices.filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + invoiceTotals(i).incl, 0);
  const overdueInv = K.invoices.filter(i => i.status === 'overdue');
  return {
    unsigned, pending, drafts, uninvoiced, overdueT, todayInv, todayTotal, unpaid, overdueInv,
    accErr: K.accQueue.filter(a => !a.valid).length,
    accReady: K.accQueue.filter(a => a.valid).length,
    arrived: K.appts.filter(a => a.status === 'arrived').length,
    dna: K.appts.filter(a => a.status === 'dna').length,
  };
};

function Masthead({ user, figures }) {
  const parts = user.name.split(' ');
  const greeting = parts[0] === 'Dr' ? `Dr. ${parts[parts.length - 1]}` : parts[0];
  return (
    <>
      <div className="dash-hero">
        <div>
          <h1>Hello, {greeting}</h1>
          <p className="dash-hero-date">{fmtLongDate(K.TODAY)} · {fmtTime(NOW)}</p>
        </div>
        <Link className="btn btn-primary" to="/appointments"><Plus size={16} /> Book appointment</Link>
      </div>
      <div className="stat-cards">
        {figures.map(f => (
          <div className="dstat-card" key={f.l}>
            <span className={`dstat-ic is-${f.tone}`}><f.Icon size={20} /></span>
            <div><b>{f.v}</b><span>{f.l}</span></div>
          </div>
        ))}
      </div>
    </>
  );
}

function NextPatient({ appt }) {
  if (!appt) return (
    <div className="next-card">
      <span className="t-eyebrow">Next up</span>
      <Empty icon={<Check size={22} />} title="Clinic list complete" body="Nothing more booked for you today." />
    </div>
  );
  const p = K.pt(appt.pt), t = K.at(appt.type);
  const arrived = appt.status === 'arrived';
  return (
    <div className="next-card">
      <div className="next-card-hd">
        <span className="t-eyebrow">Next up</span>
        <Chip status={appt.status} lg />
      </div>
      <div className="row g-4">
        <Avatar id={p.id} size="xl" />
        <div className="grow">
          <Link className="t-h3" style={{ textDecoration: 'none', color: 'inherit' }} to={`/patient/${p.id}`}>
            {p.first} {p.last}
          </Link>
          <div className="t-sm muted">{age(p.dob)}y {p.sex} · <span className="t-mono">{p.nhi}</span></div>
        </div>
      </div>
      <div className="next-card-tags">
        <FunderChip funder={p.funder} />
        {p.alerts.map(a => <span className="alert-badge" key={a}><TriangleAlert size={13} />{a}</span>)}
      </div>
      <div className="next-card-meta">
        <span className="row g-2"><Stethoscope size={15} />{appt.note || t.name}</span>
        {arrived
          ? <span className="row g-2"><Check size={15} />Arrived {Math.max(1, NOW - appt.start)} minutes ago</span>
          : <span className="row g-2"><Clock size={15} />Booked for {fmtTime(appt.start)}</span>}
      </div>
      <div className="row g-2">
        <Link className="btn btn-primary grow" to={`/consult/${p.id}`}><Stethoscope size={15} /> Start consultation</Link>
        <Link className="btn btn-secondary" to={`/patient/${p.id}/notes`}><FileText size={15} /> View notes</Link>
      </div>
    </div>
  );
}

function ClinicList({ list, showClinician, onMenu }) {
  return (
    <section className="sect">
      <div className="sect-hd" style={{ border: 'none' }}>
        <h2>{showClinician ? 'All clinics today' : 'My clinic today'}</h2>
        <span className="sect-meta">{list.length} appointments</span>
        <span className="spacer" />
        <Link className="btn btn-ghost btn-sm" to="/appointments">Open calendar <ChevronRight size={14} /></Link>
      </div>
      <div className="today-list">
        {list.length ? list.map(a => {
          const p = K.pt(a.pt), t = K.at(a.type);
          return (
            <div className="today-row" data-status={a.status} key={a.id}>
              <span className="today-time">{fmtTime(a.start)}<small>{t.mins} min</small></span>
              <span className="today-patient truncate">
                <i className="today-dot" />
                <span className="today-patient-text truncate">
                  <b>{p.first} {p.last}</b>
                  <span>{p.nhi} · {a.note || t.name}{showClinician ? ` · ${K.st(a.cl).name}` : ''}</span>
                </span>
                {p.alerts.length > 0 && (
                  <span className="tip" data-tip={p.alerts.join(', ')} style={{ color: 'var(--bad-fg)', display: 'inline-flex' }}>
                    <TriangleAlert size={15} /></span>
                )}
              </span>
              <Chip status={a.status} />
              <button className="btn btn-ghost btn-icon btn-sm" onClick={e => onMenu(e.currentTarget, a)}
                aria-label={`More actions for ${p.first} ${p.last}`}><EllipsisVertical size={16} /></button>
            </div>
          );
        }) : <Empty icon={<CalendarDays size={22} />} title="No appointments today"
              body="When bookings are made they will appear here in time order." />}
      </div>
    </section>
  );
}

/* A queue of things waiting on you: count, what it is, and where it goes. */
function WorkList({ title, sub, rows }) {
  return (
    <section className="sect">
      <div className="sect-hd" style={{ border: 'none' }}><h2>{title}</h2>{sub && <span className="sect-meta">{sub}</span>}</div>
      <div className="attn-list">
        {rows.map(r => (
          <div className={`attn-row ${r.urgent && r.n > 0 ? '' : 'is-quiet'}`} key={r.label}>
            <span className="attn-count">{r.n}</span>
            <span className="grow"><b>{r.label}</b><span>{r.sub}</span></span>
            <Link className="attn-link" to={r.to}>Links <ChevronRight size={14} /></Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function BillingSnapshot({ s }) {
  const paidToday = s.todayInv.filter(i => i.status === 'paid').reduce((a, i) => a + i.paid, 0);
  const pct = Math.round((paidToday / Math.max(s.todayTotal, 1)) * 100);
  return (
    <section className="sect">
      <div className="sect-hd"><h2>Billing today</h2><span className="spacer" />
        <span className="sync-pill"><RefreshCw size={13} /> Xero synced 9:42am</span></div>

      <div className="fig-row">
        <div className="fig"><b>{money0(s.todayTotal)}</b>
          <span>Invoiced</span><small>{s.todayInv.length} invoices, incl GST</small></div>
        <div className="fig is-warn"><b>{money0(s.unpaid)}</b>
          <span>Unpaid</span><small>{s.overdueInv.length} overdue</small></div>
        <div className={`fig ${s.accErr ? 'is-bad' : 'is-ok'}`}><b>{s.accErr}</b>
          <span>ACC errors</span><small>{s.accReady} ready to submit</small></div>
      </div>

      <div className="col g-2 mt-2">
        <div className="row between t-sm muted"><span>Collected today</span>
          <span className="num">{pct}% of {money0(s.todayTotal)}</span></div>
        <div className="meter"><span className="meter-track" style={{ width: `${pct}%` }} />
          <span style={{ width: `${100 - pct}%`, background: 'var(--warn-bg)' }} /></div>
      </div>

      {s.accErr > 0 && (
        <Banner tone="bad" icon={<TriangleAlert size={16} />}>
          <b>{s.accErr} ACC submissions need attention</b><br />
          <span className="t-sm">Missing claim number or injury date will be rejected by ACC.</span>
        </Banner>
      )}

      <div className="row g-2 mt-2">
        <Link className="btn btn-secondary btn-sm" to="/billing"><ReceiptText size={14} /> All invoices</Link>
        <Link className="btn btn-ghost btn-sm" to="/acc"><ShieldCheck size={14} /> ACC queue</Link>
      </div>
    </section>
  );
}

export default function Dashboard({ role, userId }) {
  const { toast } = useUi();
  const nav = useNavigate();
  const [, force] = useState(0);
  const [menu, setMenu] = useState(null);
  const s = stats();
  const user = K.st(userId);

  const mine = K.appts.filter(a => a.cl === userId).sort((a, b) => a.start - b.start);
  const all = K.appts.slice().sort((a, b) => a.start - b.start);
  const next = mine.find(a => a.status === 'arrived') || mine.find(a => a.status === 'consult')
    || mine.find(a => a.status === 'booked' && a.start >= NOW) || null;

  const arrive = a => { a.status = 'arrived'; force(n => n + 1);
    toast(`${K.ptName(a.pt)} marked as arrived`, `${fmtTime(a.start)} · ${K.at(a.type).name}`, 'ok'); };

  const openMenu = (anchor, a) => setMenu({ anchor, items: [
    { heading: K.ptName(a.pt) },
    { icon: <Check size={15} />, label: 'Mark as arrived', action: () => arrive(a) },
    { icon: <X size={15} />, label: 'Mark as DNA', action: () => { a.status = 'dna'; force(n => n + 1); toast('Recorded as DNA', K.ptName(a.pt), 'warn'); } },
    { icon: <FileText size={15} />, label: 'Open patient', action: () => nav(`/patient/${a.pt}`) },
    { icon: <ReceiptText size={15} />, label: 'Create invoice', action: () => nav('/billing?create=1') },
  ]});

  const figures = role === 'reception'
    ? [{ v: all.length, l: 'Appointments today', Icon: CalendarDays, tone: 'info' },
       { v: s.arrived, l: 'In the waiting room', Icon: Users, tone: 'warm' },
       { v: s.dna, l: 'Did not attend', Icon: TriangleAlert, tone: 'bad' },
       { v: s.todayInv.length, l: 'Invoices raised', Icon: ReceiptText, tone: 'ok' }]
    : role === 'typist'
    ? [{ v: s.drafts + s.pending, l: 'In your queue', Icon: Mail, tone: 'info' },
       { v: s.drafts, l: 'To type', Icon: FileText, tone: 'warm' },
       { v: s.pending, l: 'Awaiting approval', Icon: TriangleAlert, tone: 'bad' },
       { v: '2h 10m', l: 'Dictation backlog', Icon: Clock, tone: 'ok' }]
    : role === 'manager'
    ? [{ v: money0(s.todayTotal), l: 'Invoiced today', Icon: ReceiptText, tone: 'ok' },
       { v: money0(s.unpaid), l: 'Outstanding', Icon: TriangleAlert, tone: 'warm' },
       { v: s.accErr, l: 'ACC errors', Icon: ShieldCheck, tone: 'bad' },
       { v: s.dna, l: 'DNAs today', Icon: Users, tone: 'info' }]
    : [{ v: mine.length, l: 'Patients booked', Icon: Users, tone: 'info' },
       { v: mine.filter(a => a.status === 'done').length, l: 'Seen so far', Icon: ClipboardCheck, tone: 'ok' },
       { v: s.unsigned, l: 'Unsigned notes', Icon: TriangleAlert, tone: 'bad' },
       { v: s.pending, l: 'Letters to approve', Icon: Mail, tone: 'warm' }];

  return (
    <div className="page">
      <div className="dash-grid">
        <div className="col-12"><Masthead user={user} figures={figures} /></div>

        {role === 'typist' ? (
          <>
            <div className="col-8">
              <section className="sect sect-lead">
                <div className="sect-hd"><h2>Typing queue</h2>
                  <span className="sect-meta">Oldest dictation first</span></div>
                <div className="list-rows">
                  {K.letters.filter(l => l.status === 'draft' || l.status === 'pending').map(l => {
                    const p = K.pt(l.pt);
                    return (
                      <Link className="work-row" to={`/letter/${l.id}`} key={l.id}>
                        <span className="work-ic" style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}><Mail size={16} /></span>
                        <span className="grow"><b>{l.title}</b><span>{p.first} {p.last} · {p.nhi} · {K.st(l.cl).name}</span></span>
                        {l.aiAssisted && <span className="chip chip-warm"><Sparkles size={12} /> AI draft</span>}
                        <Chip status={l.status} />
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>
            <div className="col-4">
              <WorkList title="Your work" sub="Oldest first" rows={[
                { label: 'New dictations', sub: 'Uploaded since 8am', n: 5, to: '/letters', urgent: true },
                { label: 'Returned for edits', sub: 'Clinician requested changes', n: 2, to: '/letters' },
              ]} />
            </div>
          </>
        ) : (
          <>
            <div className="col-7">
              <ClinicList list={role === 'reception' || role === 'manager' ? all : mine}
                showClinician={role === 'reception' || role === 'manager'} onMenu={openMenu} />
            </div>
            <div className="col-5 col g-6">
              {role === 'clinician' && <NextPatient appt={next} />}
              <WorkList title={role === 'manager' ? 'Exceptions' : 'Needs your attention'} sub={role === 'manager' ? 'Money and compliance first' : 'Sorted by urgency'}
                rows={role === 'manager' ? [
                  { label: 'ACC submissions failing', sub: 'Will be rejected as-is', n: s.accErr, to: '/acc', urgent: true },
                  { label: 'Overdue invoices', sub: 'More than 14 days', n: s.overdueInv.length, to: '/billing', urgent: true },
                  { label: 'Uninvoiced appointments', sub: 'Revenue not captured', n: s.uninvoiced, to: '/billing' },
                  { label: 'Letters awaiting sign-off', sub: 'Ageing over 24 hours', n: s.pending, to: '/letters' },
                ] : role === 'reception' ? [
                  { label: 'Uninvoiced appointments', sub: 'Consults finished, not billed', n: s.uninvoiced, to: '/billing', urgent: true },
                  { label: 'Phone messages', sub: 'Callbacks to action', n: 3, to: '/inbox' },
                  { label: 'Unconfirmed tomorrow', sub: 'Send reminder texts', n: 7, to: '/appointments' },
                  { label: 'Overdue tasks', sub: 'Reception queue', n: s.overdueT, to: '/tasks', urgent: true },
                ] : [
                  { label: 'Unsigned notes', sub: 'Waiting for your signature', n: s.unsigned, to: '/patients', urgent: true },
                  { label: 'Letters to approve', sub: 'Typed and ready to send', n: s.pending, to: '/inbox' },
                  { label: 'Results to review', sub: '2 flagged abnormal', n: 4, to: '/inbox' },
                  { label: 'Overdue tasks', sub: 'Assigned to you or your team', n: s.overdueT, to: '/tasks', urgent: true },
                ]} />
              <BillingSnapshot s={s} />
            </div>
          </>
        )}
      </div>
      {menu && <Menu anchor={menu.anchor} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}
