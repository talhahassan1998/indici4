import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronRight, Clock, Stethoscope, FileText, Mail, TriangleAlert, Check,
  RefreshCw, ReceiptText, CalendarDays, ShieldCheck, EllipsisVertical, X,
  Sparkles, Plus,
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
  const hour = Math.floor(NOW / 60);
  const part = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  const short = user.name.split(' ').slice(0, 2).join(' ');
  return (
    <div className="masthead">
      <p className="mh-date">{fmtLongDate(K.TODAY)} · {fmtTime(NOW)}</p>
      <h1>{part}, <em>{short}</em>.</h1>
      <div className="stat-strip">
        {figures.map(f => (
          <div className={`ss ${f.flag ? 'is-flag' : ''}`} key={f.l}>
            <b>{f.v}</b><span>{f.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NextPatient({ appt, onArrive }) {
  if (!appt) return (
    <div className="next-patient col g-3">
      <span className="t-eyebrow np-eyebrow">Next patient</span>
      <Empty icon={<Check size={22} />} title="Clinic list complete" body="Nothing more booked for you today." />
    </div>
  );
  const p = K.pt(appt.pt), t = K.at(appt.type);
  const arrived = appt.status === 'arrived';
  return (
    <div className={`next-patient col g-4 ${arrived ? 'arrived' : ''}`}>
      <div className="row between">
        <span className="t-eyebrow np-eyebrow">{arrived ? 'Waiting for you now' : 'Next patient'}</span>
        <Chip status={appt.status} />
      </div>
      <div className="row g-4">
        <Avatar id={p.id} size="xl" />
        <div className="grow">
          <Link className="t-h3" style={{ textDecoration: 'none', color: 'inherit' }} to={`/patient/${p.id}`}>
            {p.first} {p.last}
          </Link>
          <div className="t-sm muted">{age(p.dob)}y {p.sex} · <span className="t-mono">{p.nhi}</span></div>
          <div className="row g-2 mt-2 wrap">
            <FunderChip funder={p.funder} />
            {p.alerts.map(a => <span className="alert-badge" key={a}><TriangleAlert size={13} />{a}</span>)}
          </div>
        </div>
      </div>
      <div className="row g-4 t-sm">
        <span className="row g-2"><Clock size={14} /><b>{fmtTime(appt.start)}</b></span>
        <span className="row g-2 muted"><Stethoscope size={14} />{t.name} · {t.mins}min</span>
      </div>
      {arrived && (
        <Banner tone="ok" icon={<Check size={15} />}>
          Arrived and waiting <b>{Math.max(1, NOW - appt.start)} minutes</b>. Room 2 is free.
        </Banner>
      )}
      <p className="t-sm muted">{appt.note}</p>
      <div className="row g-2">
        <Link className="btn btn-primary grow" to={`/consult/${p.id}`}><Stethoscope size={15} /> Start consultation</Link>
        <Link className="btn btn-secondary" to={`/patient/${p.id}/notes`}><FileText size={15} /> Notes</Link>
      </div>
    </div>
  );
}

function ClinicList({ list, showClinician, onArrive, onMenu }) {
  return (
    <section className="sect sect-lead">
      <div className="sect-hd">
        <h2>{showClinician ? 'All clinics today' : 'My clinic today'}</h2>
        <span className="sect-meta">{list.length} appointments</span>
        <span className="spacer" />
        <Link className="btn btn-ghost btn-sm" to="/appointments">Open calendar <ChevronRight size={14} /></Link>
      </div>
      <div className="tl">
        {list.length ? list.map(a => {
          const p = K.pt(a.pt), t = K.at(a.type);
          const isNow = a.status === 'consult' || (a.start <= NOW && NOW < a.start + t.mins && a.status !== 'done');
          return (
            <div className={`tl-row ${isNow ? 'is-now' : ''}`} data-status={a.status} key={a.id}>
              <span className="tl-time">{fmtTime(a.start)}<small>{t.mins} min</small></span>
              <span className="tl-spine"><i className="tl-node" /></span>
              <span className="tl-patient grow truncate">
                <b>{p.first} {p.last}</b>
                <span>{p.nhi} · {a.note || t.name}{showClinician ? ` · ${K.st(a.cl).name}` : ''}</span>
              </span>
              {/* Four fixed cells, so the alert flags, the statuses and the
                  Arrived buttons each read as a column down the list rather
                  than shuffling left and right row by row. */}
              <span className="tl-actions">
                <span className="tl-flag">
                  {p.alerts.length > 0 && (
                    <span className="tip" data-tip={p.alerts.join(', ')} style={{ color: 'var(--bad-fg)', display: 'inline-flex' }}>
                      <TriangleAlert size={16} />
                    </span>
                  )}
                </span>
                <Chip status={a.status} />
                <span>
                  {a.status === 'booked' && (
                    <button className="btn btn-soft btn-sm" data-arrive={a.id} onClick={() => onArrive(a)}><Check size={14} /> Arrived</button>
                  )}
                </span>
                <button className="btn btn-ghost btn-icon btn-sm" onClick={e => onMenu(e.currentTarget, a)}
                  aria-label={`More actions for ${p.first} ${p.last}`}><EllipsisVertical size={16} /></button>
              </span>
            </div>
          );
        }) : <Empty icon={<CalendarDays size={22} />} title="No appointments today"
              body="When bookings are made they will appear here in time order." />}
      </div>
    </section>
  );
}

/* A queue of things waiting on you: count, what it is, and where it goes.
   No box around it and no icon beside it — the numbers down the left are
   what you read, and they only read as a column if nothing sits in front. */
function WorkList({ title, sub, rows }) {
  return (
    <section className="sect">
      <div className="sect-hd"><h2>{title}</h2>{sub && <span className="sect-meta">{sub}</span>}</div>
      <ul className="work-list">
        {rows.map(r => (
          <li key={r.label}>
            <Link className="work-row" to={r.to}>
              <span className={`work-n ${r.urgent && r.n > 0 ? 'is-urgent' : ''}`}>{r.n}</span>
              <span className="grow"><b>{r.label}</b><span>{r.sub}</span></span>
              <ChevronRight size={18} className="subtle" />
            </Link>
          </li>
        ))}
      </ul>
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

  const roleLabel = { clinician: 'Clinician', reception: 'Reception', typist: 'Typist', manager: 'Practice manager' }[role];

  const figures = role === 'reception'
    ? [{ v: all.length, l: 'Appointments today' }, { v: s.arrived, l: 'In the waiting room' },
       { v: s.dna, l: 'Did not attend', flag: s.dna > 0 }, { v: s.todayInv.length, l: 'Invoices raised' }]
    : role === 'typist'
    ? [{ v: s.drafts + s.pending, l: 'In your queue' }, { v: s.drafts, l: 'To type' },
       { v: s.pending, l: 'Awaiting approval', flag: s.pending > 0 }, { v: '2h 10m', l: 'Dictation backlog' }]
    : role === 'manager'
    ? [{ v: money0(s.todayTotal), l: 'Invoiced today' }, { v: money0(s.unpaid), l: 'Outstanding' },
       { v: s.accErr, l: 'ACC errors', flag: s.accErr > 0 }, { v: s.dna, l: 'DNAs today', flag: s.dna > 0 }]
    : [{ v: mine.length, l: 'Patients booked' }, { v: mine.filter(a => a.status === 'done').length, l: 'Seen so far' },
       { v: s.unsigned, l: 'Notes to sign', flag: s.unsigned > 0 }, { v: s.pending, l: 'Letters to approve', flag: s.pending > 0 }];

  return (
    <div className="page">
      <div className="page-hd">
        <div className="page-title">
          <span className="t-eyebrow">{roleLabel} view</span>
          <h1>Dashboard</h1>
        </div>
        <div className="page-actions">
          <Link className="btn btn-primary btn-sm" to="/appointments"><Plus size={14} /> Book appointment</Link>
        </div>
      </div>

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
                showClinician={role === 'reception' || role === 'manager'} onArrive={arrive} onMenu={openMenu} />
            </div>
            <div className="col-5 col g-6">
              {role === 'clinician' && <NextPatient appt={next} onArrive={arrive} />}
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
