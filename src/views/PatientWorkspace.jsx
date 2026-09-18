import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, Clock, FileText, Mail, Pill, FlaskConical, Share2, ReceiptText, Copy,
  TriangleAlert, Check, Plus, Stethoscope, Send, Printer, EllipsisVertical, ChevronRight,
} from 'lucide-react';
import K from '../data/sample.js';
import { fmtDate, fmtDateShort, fmtClock, age, money, invoiceTotals, fmtTime, relTime } from '../lib/format.js';
import { Chip, FunderChip, Avatar, Banner, Empty, Nil } from '../components/Primitives.jsx';
import { useUi, Modal, Menu, useAutosave, SavedIndicator } from '../lib/ui.jsx';

const TABS = [
  { id: 'summary',  label: 'Summary',       Icon: LayoutDashboard },
  { id: 'timeline', label: 'Timeline',      Icon: Clock },
  { id: 'notes',    label: 'Notes',         Icon: FileText },
  { id: 'letters',  label: 'Letters',       Icon: Mail },
  { id: 'rx',       label: 'Prescriptions', Icon: Pill },
  { id: 'tests',    label: 'Tests',         Icon: FlaskConical },
  { id: 'referrals',label: 'Referrals',     Icon: Share2 },
  { id: 'invoices', label: 'Invoices',      Icon: ReceiptText },
  { id: 'docs',     label: 'Documents',     Icon: Copy },
];

export default function PatientWorkspace() {
  const { id, tab = 'summary' } = useParams();
  const nav = useNavigate();
  const { toast, open } = useUi();
  const p = K.pt(id) || K.patients[0];
  const [, force] = useState(0);
  const [menu, setMenu] = useState(null);
  const [saveState, bump] = useAutosave();

  const counts = {
    letters: K.letters.filter(l => l.pt === p.id).length,
    invoices: K.invoices.filter(i => i.pt === p.id).length,
    notes: K.notes.filter(n => n.pt === p.id).length,
    timeline: (K.timeline[p.id] || []).length,
    rx: K.prescriptions.filter(r => r.pt === p.id).length,
    tests: K.testRequests.filter(r => r.pt === p.id).length,
  };

  const newRx = () => open(close => <RxModal close={close} p={p} toast={toast} onDone={() => force(n => n + 1)} />);
  const newTest = () => open(close => <TestModal close={close} p={p} toast={toast} onDone={() => force(n => n + 1)} />);

  return (
    <>
      <div className="pt-header">
        <div className="pt-id">
          <Avatar id={p.id} size="xl" />
          <div className="grow" style={{ minWidth: 0 }}>
            <div className="row g-3 wrap">
              <h1 className="pt-name">{p.first} {p.last}</h1>
              <FunderChip funder={p.funder} />
            </div>
            <div className="pt-meta">
              <span>{age(p.dob)}y {p.sex}</span><span className="dot-sep">·</span>
              <span>{fmtDate(p.dob)}</span><span className="dot-sep">·</span>
              <span>NHI <span className="t-mono">{p.nhi}</span></span><span className="dot-sep">·</span>
              <span>{p.phone || 'No phone'}</span><span className="dot-sep">·</span>
              <span>GP {K.gp(p.gp).name}</span>
            </div>
            <div className="pt-badges mt-2">
              {p.alerts.map(a => <span className="alert-badge" key={a}><TriangleAlert size={13} />{a}</span>)}
              {p.warn.map(a => <span className="alert-badge warn" key={a}>{a}</span>)}
              {p.claim && <span className="chip chip-warm">{p.claim}</span>}
            </div>
          </div>
          <div className="col g-2" style={{ alignItems: 'flex-end' }}>
            <div className="row g-2">
              <Link className="btn btn-primary btn-sm" to={`/consult/${p.id}`}><Stethoscope size={14} /> Start consult</Link>
              <button className="btn btn-secondary btn-sm" onClick={() => toast('Email patient', p.email, 'info')}><Send size={14} /> Email</button>
              <button className="btn btn-secondary btn-icon btn-sm" aria-label="More actions"
                onClick={e => setMenu({ anchor: e.currentTarget, items: [
                  { icon: <FileText size={15} />, label: 'Edit demographics', action: () => toast('Edit', 'Demographics form would open.', 'info') },
                  { icon: <Printer size={15} />, label: 'Print summary', action: () => toast('Print', 'Sent to the default printer.', 'ok') },
                ]})}><EllipsisVertical size={15} /></button>
            </div>
            <SavedIndicator state={saveState} />
          </div>
        </div>
        <nav className="tabs mt-4" role="tablist" aria-label="Patient sections">
          {TABS.map(t => (
            <button role="tab" key={t.id} aria-selected={t.id === tab} onClick={() => nav(`/patient/${p.id}/${t.id}`)}>
              <t.Icon size={15} /> {t.label}
              {counts[t.id] ? <span className="badge-count quiet">{counts[t.id]}</span> : null}
            </button>
          ))}
        </nav>
      </div>

      <div style={{ padding: 'var(--s-5) var(--s-6) var(--s-10)' }}>
        {tab === 'summary' && <Summary p={p} />}
        {tab === 'timeline' && <Timeline p={p} bump={bump} toast={toast} />}
        {tab === 'notes' && <Notes p={p} bump={bump} toast={toast} />}
        {tab === 'letters' && <LettersTab p={p} nav={nav} />}
        {tab === 'rx' && <RxTab p={p} onNew={newRx} />}
        {tab === 'tests' && <TestsTab p={p} onNew={newTest} />}
        {tab === 'invoices' && <InvoicesTab p={p} />}
        {tab === 'referrals' && <Empty icon={<Share2 size={22} />} title="No referrals on file"
          body="Referrals in and out, including the referrer, expiry, and session counts." />}
        {tab === 'docs' && <Empty icon={<Copy size={22} />} title="No documents attached"
          body="Drag and drop scans, consent forms and imaging reports here." />}
      </div>

      <button className="fab" onClick={e => setMenu({ anchor: e.currentTarget, items: [
        { heading: `New for ${p.first} ${p.last}` },
        { icon: <FileText size={15} />, label: 'Note', action: () => nav(`/consult/${p.id}`) },
        { icon: <Mail size={15} />, label: 'Letter', action: () => nav(`/letter/new?pt=${p.id}`) },
        { icon: <Pill size={15} />, label: 'Prescription', action: newRx },
        { icon: <FlaskConical size={15} />, label: 'Test request', action: newTest },
        '-',
        { icon: <ReceiptText size={15} />, label: 'Invoice', action: () => nav('/billing?create=1') },
      ]})}><Plus size={18} /> New</button>

      {menu && <Menu anchor={menu.anchor} items={menu.items} onClose={() => setMenu(null)} />}
    </>
  );
}

function Summary({ p }) {
  const gp = K.gp(p.gp);
  const upcoming = K.appts.filter(a => a.pt === p.id && a.status === 'booked').sort((a, b) => a.start - b.start);
  const invs = K.invoices.filter(i => i.pt === p.id);
  const owing = K.balance(p.id);
  return (
    <div className="dash-grid">
      <div className="col-4 col g-4">
        <section className="card"><div className="card-hd"><h3>Contact</h3></div>
          <div className="card-bd"><dl className="kv">
            <dt>Mobile</dt><dd>{p.phone || <Nil label="No mobile" />}</dd>
            <dt>Email</dt><dd className="truncate">{p.email}</dd>
            <dt>Address</dt><dd>{p.addr}</dd>
            <dt>Next of kin</dt><dd>{p.nok || <Nil label="Not recorded" />}</dd>
          </dl></div></section>
        <section className="card"><div className="card-hd"><h3>General practice</h3></div>
          <div className="card-bd"><dl className="kv">
            <dt>GP</dt><dd>{gp.name}</dd>
            <dt>Practice</dt><dd>{gp.practice}</dd>
            <dt>Healthlink</dt><dd className="t-mono t-sm">{gp.hl}</dd>
          </dl></div></section>
      </div>
      <div className="col-4 col g-4">
        {p.funder === 'ACC' ? (
          <section className="card"><div className="card-hd"><h3>ACC claim</h3><span className="spacer" />
            <Chip status={p.injury ? 'approved' : 'overdue'} label={p.injury ? 'Active' : 'Incomplete'} /></div>
            <div className="card-bd"><dl className="kv">
              <dt>Claim number</dt><dd className="t-mono">{p.claim || <Nil label="No claim" />}</dd>
              <dt>Date of injury</dt><dd>{p.injury ? fmtDate(p.injury) : <span className="bad-t">Missing</span>}</dd>
            </dl></div></section>
        ) : (
          <section className="card"><div className="card-hd"><h3>Funding</h3></div>
            <div className="card-bd"><dl className="kv">
              <dt>Type</dt><dd>{p.funder}</dd>
              <dt>Terms</dt><dd>14 days from invoice</dd>
            </dl></div></section>
        )}
        <section className="card"><div className="card-hd"><h3>Registration</h3></div>
          <div className="card-bd"><dl className="kv">
            <dt>Chart</dt><dd className="t-mono">{p.chart}</dd>
            <dt>Enrolment</dt><dd><span className={`chip ${K.ENROL_STATUS[p.status].chip}`}>{K.ENROL_STATUS[p.status].label}</span></dd>
            <dt>Provider</dt><dd>{K.st(p.provider).name}</dd>
            <dt>Pay group</dt><dd>{p.payGrp} · GMS {p.gms}</dd>
          </dl></div></section>
      </div>
      <div className="col-4 col g-4">
        <section className="card"><div className="card-hd"><h3>Upcoming appointments</h3></div>
          <div className="list-rows">
            {upcoming.length ? upcoming.map(a => (
              <Link className="work-row" to="/appointments" key={a.id}>
                <span className="work-ic" style={{ background: 'var(--info-bg)', color: 'var(--info-fg)' }}><Clock size={15} /></span>
                <span className="grow"><b>{fmtTime(a.start)} today</b><span>{K.at(a.type).name} · {K.st(a.cl).name}</span></span>
                <Chip status={a.status} /></Link>
            )) : <Empty icon={<Clock size={22} />} title="Nothing booked" body="Use + New to book this patient in." />}
          </div></section>
        <section className="card"><div className="card-hd"><h3>Account</h3></div>
          <div className="card-bd col g-4">
            <div className="row between">
              <div className="col g-1"><span className="t-eyebrow">Outstanding</span>
                <span className={`t-metric ${owing > 0 ? 'bad-t' : 'ok-t'}`}>{money(owing)}</span></div>
              <div className="col g-1" style={{ textAlign: 'right' }}><span className="t-eyebrow">Lifetime</span>
                <span className="t-h3 num">{money(invs.reduce((s, i) => s + invoiceTotals(i).incl, 0))}</span></div>
            </div>
          </div></section>
      </div>
    </div>
  );
}

function Timeline({ p, bump, toast }) {
  const [filter, setFilter] = useState('all');
  const [, force] = useState(0);
  const events = (K.timeline[p.id] || []).filter(e => filter === 'all' || e.kind === filter);
  return (
    <div className="dash-grid">
      <div className="col-8">
        <div className="toolbar">
          <span className="t-eyebrow">Filter</span>
          <div className="pill-nav" role="group" aria-label="Filter timeline">
            {[['all','Everything'],['note','Notes'],['letter','Letters'],['rx','Prescriptions'],['result','Results'],['invoice','Invoices']]
              .map(([k, l]) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
          </div>
          <span className="spacer" /><span className="t-xs subtle">{events.length} events</span>
        </div>
        {events.length ? <div className="feed">{events.map((e, i) => (
          <article className="feed-item" key={i}>
            <span className="feed-rail"><span className={`feed-ic ${e.kind}`}><FileText size={15} /></span></span>
            <div className="feed-card">
              <div className="row between g-3"><b className="t-sm">{e.title}</b>
                <span className="row g-2">
                  {e.kind === 'note' && !e.signed && <Chip status="pending" label="Unsigned" />}
                  <span className="t-xs subtle">{fmtClock(e.at)}</span></span></div>
              <p className="t-sm muted mt-2">{e.body}</p>
              {e.kind === 'note' && !e.signed && (
                <div className="row g-2 mt-3"><span className="spacer" />
                  <button className="btn btn-soft btn-sm" data-sign onClick={() => {
                    e.signed = true; force(n => n + 1); bump();
                    toast('Note signed', `${K.st('u1').name}`, 'ok');
                  }}><Check size={13} /> Sign note</button></div>
              )}
            </div>
          </article>
        ))}</div> : <Empty icon={<Clock size={22} />} title="Nothing to show" body="No events match this filter." />}
      </div>
    </div>
  );
}

function Notes({ p, bump, toast }) {
  const [, force] = useState(0);
  const feed = (K.timeline[p.id] || []).filter(e => e.kind === 'note');
  if (!feed.length) return <Empty icon={<FileText size={22} />} title="No notes yet"
    body="Consultation notes written here are signed, timestamped and locked to the author." />;
  return (
    <section className="card">
      <div className="card-hd"><h3>Consultation notes</h3>
        <span className={`chip ${feed.some(n => !n.signed) ? 'chip-warn' : ''}`}>{feed.filter(n => !n.signed).length} unsigned</span></div>
      <div className="col g-4 card-bd">
        {feed.map((e, i) => (
          <article className="card card-flat card-bd col g-3" key={i}>
            <div className="row between g-3"><b className="t-sm">{e.title}</b>
              <span className="row g-2">
                <Chip status={e.signed ? 'paid' : 'pending'} label={e.signed ? 'Signed' : 'Unsigned'} />
                <span className="t-xs subtle">{fmtDate(e.at.slice(0, 10))}</span></span></div>
            <p className="t-sm muted">{e.body}</p>
            {!e.signed && <div className="row g-2"><span className="spacer" />
              <button className="btn btn-soft btn-sm" data-sign onClick={() => {
                e.signed = true; force(n => n + 1); bump(); toast('Note signed', K.st('u1').name, 'ok');
              }}><Check size={13} /> Sign note</button></div>}
          </article>
        ))}
      </div>
    </section>
  );
}

function LettersTab({ p, nav }) {
  const list = K.letters.filter(l => l.pt === p.id);
  if (!list.length) return <Empty icon={<Mail size={22} />} title="No letters yet"
    body="Letters you write for this patient appear here with their approval status." />;
  return (
    <section className="card"><div className="table-wrap"><table className="tbl">
      <thead><tr><th>Letter</th><th>Recipient</th><th>Author</th><th>Channel</th><th>Updated</th><th>Status</th></tr></thead>
      <tbody>{list.map(l => (
        <tr key={l.id} onClick={() => nav(`/letter/${l.id}`)} style={{ cursor: 'pointer' }}>
          <td><b>{l.title}</b></td>
          <td className="t-sm">{K.gp(l.to).name}</td>
          <td className="t-sm">{K.st(l.cl).name}</td>
          <td className="t-sm">{l.channel}</td>
          <td className="t-sm">{relTime(l.updated)}</td>
          <td><Chip status={l.status} /></td>
        </tr>
      ))}</tbody></table></div></section>
  );
}

function RxTab({ p, onNew }) {
  const list = K.prescriptions.filter(r => r.pt === p.id).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <div className="col g-4">
      {p.alerts.length > 0 && (
        <Banner tone="bad" icon={<TriangleAlert size={16} />}>
          <b>Recorded allergies, checked on every prescription</b><br />
          <span className="t-sm">{p.alerts.join(' · ')}</span>
        </Banner>
      )}
      <section className="card">
        <div className="card-hd"><h3>Prescriptions</h3><span className="chip">{list.length}</span><span className="spacer" />
          <button className="btn btn-primary btn-sm" data-act="rx" onClick={onNew}><Plus size={14} /> New prescription</button></div>
        {list.length ? <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Medicine</th><th>Directions</th><th className="num-cell">Qty</th>
            <th className="num-cell">Repeats</th><th>Pharmacy</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>{list.map(r => { const m = K.med(r.med), ph = K.pharm(r.pharmacy); return (
            <tr key={r.id}>
              <td><b>{m.name}</b><br /><span className="t-xs subtle">{m.form}</span></td>
              <td className="t-sm">{m.dose}</td><td className="num-cell">{r.qty}</td><td className="num-cell">{r.repeats}</td>
              <td className="t-sm">{ph.name}</td><td className="t-sm">{fmtDateShort(r.at.slice(0, 10))}</td>
              <td><Chip status={r.status === 'dispensed' ? 'paid' : 'sent'}
                label={r.status === 'dispensed' ? 'Dispensed' : 'Sent to pharmacy'} /></td>
            </tr>
          ); })}</tbody></table></div>
        : <Empty icon={<Pill size={22} />} title="No current prescriptions"
            body="Prescriptions are sent electronically to the patient’s chosen pharmacy." />}
      </section>
    </div>
  );
}

function TestsTab({ p, onNew }) {
  const list = K.testRequests.filter(r => r.pt === p.id).sort((a, b) => b.at.localeCompare(a.at));
  return (
    <section className="card">
      <div className="card-hd"><h3>Test requests</h3><span className="chip">{list.length}</span><span className="spacer" />
        <button className="btn btn-primary btn-sm" data-act="test" onClick={onNew}><Plus size={14} /> New test request</button></div>
      {list.length ? <div className="table-wrap"><table className="tbl">
        <thead><tr><th>Test</th><th>Clinical details</th><th>Provider</th><th>Date</th><th>Urgency</th><th>Status</th></tr></thead>
        <tbody>{list.map(r => { const t = K.test(r.test), pv = K.prov(r.provider); return (
          <tr key={r.id}>
            <td><b>{t.name}</b><br /><span className="t-xs subtle">{t.kind === 'radiology' ? 'Radiology' : 'Pathology'}</span></td>
            <td className="t-sm">{r.note}</td><td className="t-sm">{pv.name}</td>
            <td className="t-sm">{fmtDateShort(r.at.slice(0, 10))}</td>
            <td>{r.urgency === 'urgent' ? <Chip status="overdue" label="Urgent" /> : <Chip status="draft" label="Routine" />}</td>
            <td><Chip status={r.status === 'resulted' ? 'paid' : 'sent'} label={r.status === 'resulted' ? 'Result filed' : 'Sent'} /></td>
          </tr>
        ); })}</tbody></table></div>
      : <Empty icon={<FlaskConical size={22} />} title="No test requests yet"
          body="Radiology and pathology requests are sent electronically." />}
    </section>
  );
}

function InvoicesTab({ p }) {
  const list = K.invoices.filter(i => i.pt === p.id);
  if (!list.length) return <Empty icon={<ReceiptText size={22} />} title="No invoices yet"
    body="Invoices raised from this patient’s appointments appear here." />;
  return (
    <section className="card"><div className="table-wrap"><table className="tbl">
      <thead><tr><th>Invoice</th><th>Date</th><th>Payer</th>
        <th className="num-cell">Excl GST</th><th className="num-cell">GST</th><th className="num-cell">Total</th><th>Status</th></tr></thead>
      <tbody>{list.map(i => { const t = invoiceTotals(i); return (
        <tr key={i.id}><td className="t-mono t-sm">{i.id}</td><td className="t-sm">{fmtDate(i.date)}</td>
          <td><FunderChip funder={i.payer} /></td>
          <td className="num-cell">{money(t.excl)}</td><td className="num-cell subtle">{money(t.gst)}</td>
          <td className="num-cell"><b>{money(t.incl)}</b></td><td><Chip status={i.status} /></td></tr>
      ); })}</tbody></table></div></section>
  );
}

function RxModal({ close, p, toast, onDone }) {
  const [medId, setMedId] = useState('m1');
  const [override, setOverride] = useState('');
  const [pharmacy, setPharmacy] = useState('ph1');
  const m = K.med(medId);
  const [qty, setQty] = useState(m.qty);
  const [repeats, setRepeats] = useState(m.repeats);
  const [dose, setDose] = useState(m.dose);
  const clash = K.allergyClash(p.id, medId);

  const pick = v => { const nm = K.med(v); setMedId(v); setQty(nm.qty); setRepeats(nm.repeats); setDose(nm.dose); setOverride(''); };

  const commit = viaPrint => {
    if (clash && !override.trim()) {
      toast('Allergy override needs a reason', `${m.name} clashes with “${clash.alert}”.`, 'bad');
      return;
    }
    K.prescriptions.unshift({ id: 'rx' + Date.now(), pt: p.id, by: 'u1', at: '2026-09-17T10:22',
      med: medId, pharmacy, status: viaPrint ? 'dispensed' : 'sent', qty: Number(qty), repeats: Number(repeats) });
    close(); onDone();
    toast(viaPrint ? 'Prescription printed' : 'Prescription sent',
      viaPrint ? `${m.name}, signed and printed` : `${m.name} → ${K.pharm(pharmacy).name}`, 'ok');
  };

  return (
    <Modal title="New prescription" sub={`${p.first} ${p.last} · ${p.nhi} · ${age(p.dob)}y`}
      icon={<Pill size={15} />} wide onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Cancel</button><span className="spacer" />
        <button className="btn btn-secondary" data-print onClick={() => commit(true)}><Printer size={14} /> Print instead</button>
        <button className="btn btn-primary" data-send onClick={() => commit(false)}><Send size={15} /> Sign and send</button>
      </>}>
      <div className="col g-4">
        <div className="field"><label className="label" htmlFor="rxMed">Medicine</label>
          <select className="select" id="rxMed" value={medId} onChange={e => pick(e.target.value)}>
            {K.medicines.map(x => <option value={x.id} key={x.id}>{x.name} {x.form}{x.funded ? '' : ' · unfunded'}</option>)}
          </select></div>
        {clash && (
          <>
            <Banner tone="bad" icon={<TriangleAlert size={16} />}>
              <b>Allergy warning. {m.name} is a {clash.cls}</b><br />
              <span className="t-sm">This patient’s record says: <b>{clash.alert}</b>. Choose another medicine, or record why you are overriding.</span>
            </Banner>
            <div className="field"><label className="label" htmlFor="rxOverride">Reason for overriding <span className="req">*</span></label>
              <input className="input" id="rxOverride" value={override} onChange={e => setOverride(e.target.value)}
                placeholder="e.g. previous reaction was intolerance, not allergy" /></div>
          </>
        )}
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="field"><label className="label" htmlFor="rxQty">Quantity</label>
            <input className="input input-money" id="rxQty" type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} /></div>
          <div className="field"><label className="label" htmlFor="rxRep">Repeats</label>
            <input className="input input-money" id="rxRep" type="number" min="0" value={repeats} onChange={e => setRepeats(e.target.value)} /></div>
        </div>
        <div className="field"><label className="label" htmlFor="rxDose">Directions</label>
          <textarea className="textarea" id="rxDose" rows={2} value={dose} onChange={e => setDose(e.target.value)} /></div>
        {!m.funded && <Banner tone="warn"><span className="t-sm">Not funded by Pharmac. The patient pays the full cost.</span></Banner>}
        <div className="divider" />
        <div className="field"><label className="label" htmlFor="rxPharm">Send electronically to</label>
          <select className="select" id="rxPharm" value={pharmacy} onChange={e => setPharmacy(e.target.value)}>
            {K.pharmacies.map(x => <option value={x.id} key={x.id}>{x.name} · {x.addr}</option>)}
          </select>
          <span className="hint">The pharmacy receives it before the patient arrives.</span></div>
      </div>
    </Modal>
  );
}

function TestModal({ close, p, toast, onDone }) {
  const [testId, setTestId] = useState('t-xr');
  const [note, setNote] = useState('');
  const [urgency, setUrgency] = useState('routine');
  const t = K.test(testId);
  const providers = K.testProviders.filter(x => x.kind === t.kind);
  const [provider, setProvider] = useState(providers[0].id);

  const pickTest = v => {
    setTestId(v);
    const nt = K.test(v);
    const ps = K.testProviders.filter(x => x.kind === nt.kind);
    setProvider(ps[0].id);
  };

  return (
    <Modal title="New test request" sub={`${p.first} ${p.last} · ${p.nhi}`}
      icon={<FlaskConical size={15} />} wide onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Cancel</button><span className="spacer" />
        <button className="btn btn-primary" data-send onClick={() => {
          if (!note.trim()) { toast('Clinical details are required', 'The reporting provider needs to know what you are looking for.', 'warn'); return; }
          K.testRequests.unshift({ id: 'tr' + Date.now(), pt: p.id, by: 'u1', at: '2026-09-17T10:22',
            test: testId, provider, urgency, status: 'sent', note: note.trim() });
          close(); onDone();
          toast('Test request sent', `${t.name} → ${K.prov(provider).name}`, 'ok');
        }}><Send size={15} /> Sign and send</button>
      </>}>
      <div className="col g-4">
        <div className="field"><label className="label" htmlFor="trTest">Test</label>
          <select className="select" id="trTest" value={testId} onChange={e => pickTest(e.target.value)}>
            <optgroup label="Radiology">{K.testCatalogue.filter(x => x.kind === 'radiology').map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</optgroup>
            <optgroup label="Pathology">{K.testCatalogue.filter(x => x.kind === 'pathology').map(x => <option value={x.id} key={x.id}>{x.name}</option>)}</optgroup>
          </select></div>
        <Banner><span className="t-sm"><b>Preparation:</b> {t.prep}</span></Banner>
        <div className="field"><label className="label" htmlFor="trProv">Send to</label>
          <select className="select" id="trProv" value={provider} onChange={e => setProvider(e.target.value)}>
            {providers.map(x => <option value={x.id} key={x.id}>{x.name}</option>)}
          </select></div>
        <div className="field"><label className="label" htmlFor="trNote">Clinical details <span className="req">*</span></label>
          <textarea className="textarea" id="trNote" rows={2} value={note} onChange={e => setNote(e.target.value)}
            placeholder="What are you looking for? The reporting radiologist or pathologist reads this." /></div>
        <div className="field"><label className="label">Urgency</label>
          <div className="segmented">
            <button aria-pressed={urgency === 'routine'} onClick={() => setUrgency('routine')}>Routine</button>
            <button aria-pressed={urgency === 'urgent'} onClick={() => setUrgency('urgent')}>Urgent</button>
          </div></div>
      </div>
    </Modal>
  );
}
