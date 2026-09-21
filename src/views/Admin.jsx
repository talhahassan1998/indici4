import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building2, Users, CalendarDays, Clock, Mail, LayoutTemplate, Link2, Shield, ReceiptText,
  ChevronLeft, ChevronRight, Plus, Pencil, RefreshCw, Check, Sparkles, Send, Search, Upload, Download, Lock, Stethoscope,
} from 'lucide-react';
import K from '../data/sample.js';
import { money, fmtTime, fmtClock } from '../lib/format.js';
import { Chip, Avatar, Banner, Switch, Nil } from '../components/Primitives.jsx';
import { useUi } from '../lib/ui.jsx';

const CARDS = [
  { id: 'clinic', Icon: Building2, title: 'Clinic details', sub: 'Name, addresses, GST number, opening hours', meta: '3 locations' },
  { id: 'users', Icon: Users, title: 'Users & permissions', sub: 'Accounts, roles, consultant profiles', meta: `${K.staff.length} users` },
  { id: 'types', Icon: CalendarDays, title: 'Appointment types', sub: 'Durations, colours, default fees', meta: `${K.apptTypes.length} types` },
  { id: 'rooms', Icon: Clock, title: 'Clinics & timetables', sub: 'Sessions, rooms, leave and blocked time', meta: '12 sessions/week' },
  { id: 'brand', Icon: Mail, title: 'Letter branding', sub: 'Letterhead, logo, footer, signature blocks', meta: 'Kora default' },
  { id: 'tpl', Icon: LayoutTemplate, title: 'Templates', sub: 'Letter and note templates with merge fields', meta: `${K.letterTemplates.length} templates` },
  { id: 'codes', Icon: ReceiptText, title: 'Billing codes', sub: 'Synced from Xero: prices, accounts, ACC codes', meta: `${K.billingCodes.length} codes` },
  { id: 'integ', Icon: Link2, title: 'Integrations', sub: 'Xero, ACC, Healthlink, AI scribe', meta: '4 connected' },
  { id: 'audit', Icon: Shield, title: 'Security & audit', sub: 'Access log, 2FA, data retention', meta: 'AA compliant' },
];

const PERMS = {
  Clinical: [['View patient records', true], ['Write and sign notes', true], ['Prescribe', true],
    ['Approve and send letters', true], ['Order tests', true], ['Amend signed notes', false]],
  Billing: [['View invoices', true], ['Create and edit invoices', true], ['Record payments', false],
    ['Void invoices', false], ['Submit ACC claims', true], ['Manage Xero connection', false]],
  Admin: [['Manage appointment types', false], ['Manage users', false], ['Edit templates', true],
    ['Export practice data', false], ['View audit log', false]],
};

const INTEGRATIONS = [
  { n: 'Xero', s: 'Connected', d: 'Invoices and payments sync both ways.', ok: true, Icon: ReceiptText },
  { n: 'ACC', s: 'Connected', d: 'Provider gateway for ACC32/ACC45 and invoicing.', ok: true, Icon: Shield },
  { n: 'Healthlink', s: 'Connected', d: 'Secure delivery to GPs and other providers.', ok: true, Icon: Send },
  { n: 'AI scribe', s: 'Connected', d: 'Ambient drafting. Audio deleted once approved.', ok: true, Icon: Sparkles },
  { n: 'NHI lookup', s: 'Not set up', d: 'Validate NHI numbers against the national index.', ok: false, Icon: Search },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const KIND = { clinic: 'chip-accent', theatre: 'chip-warm', admin: '', leave: 'chip-bad' };

export default function Admin() {
  const { section } = useParams();
  const nav = useNavigate();
  const { toast } = useUi();
  const [selUser, setSelUser] = useState('u1');

  const Crumb = ({ title, sub }) => (
    <div className="page-hd">
      <div className="page-title">
        <Link className="t-xs accent-t" to="/admin"><ChevronLeft size={12} /> Admin</Link>
        <h1>{title}</h1><span className="page-sub">{sub}</span></div>
    </div>
  );

  if (section === 'users') {
    const u = K.st(selUser);
    return (
      <div className="page">
        <Crumb title="Users & permissions" sub={`${K.staff.length} accounts · permissions apply immediately`} />
        <div className="dash-grid">
          <div className="col-4"><section className="card">
            <div className="card-hd"><h3>People</h3><span className="spacer" /><span className="chip">{K.staff.length}</span></div>
            <div className="list-rows">{K.staff.map(s => (
              <button className="list-row" key={s.id} data-user={s.id} aria-selected={selUser === s.id}
                onClick={() => setSelUser(s.id)}>
                <Avatar id={s.id} size="sm" />
                <span className="grow" style={{ textAlign: 'left' }}><b className="t-sm">{s.name}</b>
                  <span className="t-xs subtle" style={{ display: 'block' }}>{s.spec}</span></span>
                <span className="chip">{s.role}</span></button>
            ))}</div>
          </section></div>
          <div className="col-8 col g-4">
            <section className="card">
              <div className="card-hd"><Avatar id={u.id} size="lg" />
                <div className="grow"><h3>{u.name}</h3><span className="t-xs subtle">{u.spec} · {u.role}</span></div>
                <Chip status="paid" label="Active" /></div>
              <div className="card-bd"><dl className="kv">
                <dt>Last sign-in</dt><dd>Today, 7:58am · Auckland</dd>
                <dt>Two-factor</dt><dd><Chip status="paid" label="Enabled (app)" /></dd></dl></div>
            </section>
            {u.role === 'Clinician' && (
              <section className="card">
                <div className="card-hd"><span className="stat-ic"><Stethoscope size={15} /></span><h3>Consultant profile</h3>
                  <span className="spacer" /><span className="t-xs subtle">Used on letters, ACC claims and invoices</span></div>
                <div className="card-bd col g-4">
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                    <div className="field"><label className="label" htmlFor="fMcnz">Registration (MCNZ)</label>
                      <input className="input t-mono" id="fMcnz" defaultValue={u.mcnz} /></div>
                    <div className="field"><label className="label" htmlFor="fHpi">HPI number</label>
                      <input className="input t-mono" id="fHpi" defaultValue={u.hpi} /></div>
                    <div className="field"><label className="label" htmlFor="fAccId">ACC provider ID</label>
                      <input className="input t-mono" id="fAccId" defaultValue={u.accId} /></div>
                    <div className="field"><label className="label" htmlFor="fSpec">Specialty</label>
                      <input className="input" id="fSpec" defaultValue={u.spec} /></div>
                  </div>
                  <div className="divider" />
                  <div className="field"><label className="label">Signature</label>
                    <div className="row g-4">
                      <div className="card card-flat" style={{ background: '#fff', padding: '14px 22px' }}>
                        <span style={{ fontFamily: "'Segoe Script','Bradley Hand',cursive", fontSize: 26, color: '#116330' }}>
                          {u.signature || u.name}</span></div>
                      <div className="col g-2">
                        <button className="btn btn-secondary btn-sm"><Upload size={14} /> Upload image</button>
                        <button className="btn btn-ghost btn-sm"><Pencil size={14} /> Draw new</button></div>
                    </div></div>
                </div>
              </section>
            )}
            <section className="card">
              <div className="card-hd"><span className="stat-ic"><Lock size={15} /></span><h3>Permissions</h3></div>
              <div className="card-bd col g-5">{Object.entries(PERMS).map(([g, rows]) => (
                <div className="col g-3" key={g}>
                  <span className="t-eyebrow">{g}</span>
                  <div className="perm-grid">{rows.map(([label, on]) => (
                    <div className="perm-row" key={label}><span className="grow t-sm">{label}</span>
                      <PermSwitch label={label} initial={on} toast={toast} /></div>
                  ))}</div>
                </div>
              ))}</div>
            </section>
          </div>
        </div>
      </div>
    );
  }

  if (section === 'types') return (
    <div className="page"><Crumb title="Appointment types" sub="Duration, colour and the billing code each type bills to" />
      <section className="card"><div className="table-wrap"><table className="tbl">
        <thead><tr><th>Type</th><th>Colour</th><th className="num-cell">Duration</th><th>Billing code</th>
          <th className="num-cell">Default fee</th><th>Bills to</th></tr></thead>
        <tbody>{K.apptTypes.map(t => { const b = K.code(t.code); return (
          <tr key={t.id}><td><b>{t.name}</b></td>
            <td><span className="row g-2"><i style={{ width: 12, height: 12, borderRadius: 3, background: `var(--appt-${t.type})` }} />
              <span className="t-xs subtle t-mono">{t.type}</span></span></td>
            <td className="num-cell">{t.mins} min</td><td className="t-mono t-sm">{t.code}</td>
            <td className="num-cell">{t.price ? money(t.price) : <span className="subtle">No charge</span>}</td>
            <td>{b && b.acc ? <span className="chip chip-warm">ACC {b.acc}</span> : <span className="chip">Patient or insurer</span>}</td>
          </tr>
        ); })}</tbody></table></div></section>
    </div>
  );

  if (section === 'codes') return (
    <div className="page"><Crumb title="Billing codes" sub="Mastered in Xero and synced into Kora" />
      <Banner icon={<RefreshCw size={16} />}>
        <b>Xero is the source of truth</b><br />
        <span className="t-sm">Add or reprice a code in Xero and it appears here on the next sync. Editing is
        deliberately disabled so the two systems cannot drift apart.</span>
      </Banner>
      <section className="card mt-4"><div className="table-wrap"><table className="tbl">
        <thead><tr><th>Code</th><th>Name</th><th className="num-cell">Price</th><th>Account</th>
          <th>Tax</th><th>ACC code</th><th>Status</th></tr></thead>
        <tbody>{K.billingCodes.map(b => (
          <tr key={b.code}><td className="t-mono t-sm"><b>{b.code}</b></td><td>{b.name}</td>
            <td className="num-cell">{money(b.price)}</td><td className="t-mono t-sm">{b.acct}</td>
            <td className="t-sm">{b.tax}</td><td className="t-mono t-sm">{b.acc || <Nil label="No ACC code" />}</td>
            <td>{b.active ? <Chip status="paid" label="Active" /> : <Chip status="draft" label="Archived" />}</td></tr>
        ))}</tbody></table></div>
        <div className="card-ft row"><span className="t-xs subtle">{K.billingCodes.length} codes · last synced {fmtClock(K.XERO_SYNC)} today</span></div>
      </section>
    </div>
  );

  if (section === 'rooms') return (
    <div className="page"><Crumb title="Clinics & timetables" sub="Locations, and the recurring sessions each clinician works" />
      <h2 className="t-h3 mb-3">Locations</h2>
      <div className="settings-grid mb-6">{K.clinics.map(c => (
        <div className="card setting-card" key={c.id}>
          <span className="sc-ic"><Building2 size={18} /></span>
          <span><b className="t-h4" style={{ display: 'block' }}>{c.short}</b>
            <span className="t-sm muted">{c.addr}</span></span>
          <div className="row g-2 mt-2"><span className="chip">{c.phone}</span></div>
        </div>
      ))}</div>
      <h2 className="t-h3 mb-3">Weekly timetable</h2>
      <div className="row g-4 wrap mb-3">{Object.entries({ clinic: 'Clinic', theatre: 'Theatre', admin: 'Admin / MDT', leave: 'Leave' })
        .map(([k, l]) => <span className={`chip ${KIND[k]}`} key={k}>{l}</span>)}</div>
      <section className="card"><div className="table-wrap"><table className="tbl">
        <thead><tr><th>Clinician</th>{DAYS.map(d => <th key={d}>{d}</th>)}</tr></thead>
        <tbody>{K.clinicians.map(c => (
          <tr key={c.id}>
            <td style={{ minWidth: 190 }}><span className="row g-2"><Avatar id={c.id} size="sm" />
              <span className="cell2"><b>{c.name}</b><span>{c.spec}</span></span></span></td>
            {DAYS.map((d, di) => {
              const sess = K.timetables.filter(t => t.cl === c.id && t.day === di);
              if (!sess.length) return <td key={d}><Nil label="Not working" /></td>;
              return (
                <td key={d} style={{ minWidth: 150 }}><div className="col g-2">{sess.map((t, i) => (
                  <button className="card card-flat" key={i} data-edit-session
                    style={{ padding: '7px 9px', textAlign: 'left', width: '100%' }}>
                    <b className="t-xs">{fmtTime(t.start)}–{fmtTime(t.end)}</b>
                    <span className="t-xs subtle" style={{ display: 'block' }}>{K.cln(t.clinic).short}</span>
                    <span className={`chip ${KIND[t.kind]} mt-2`}>{t.kind}</span>
                  </button>
                ))}</div></td>
              );
            })}
          </tr>
        ))}</tbody></table></div></section>
    </div>
  );

  if (section === 'tpl') return (
    <div className="page"><Crumb title="Letter templates" sub="Reusable letters that fill in patient details automatically" />
      <section className="card"><div className="table-wrap"><table className="tbl">
        <thead><tr><th>Template</th><th>Group</th><th>Prompts for</th><th>Pinned</th></tr></thead>
        <tbody>{K.letterTemplates.map(t => (
          <tr key={t.id}><td><b>{t.name}</b></td><td><span className="chip">{t.group}</span></td>
            <td className="t-sm">{t.fields.length ? t.fields.map(f => <span className="chip" key={f.k}>{f.label}</span>)
              : <span className="subtle">No prompts</span>}</td>
            <td>{t.pinned ? <span className="chip chip-accent">Pinned</span> : <Nil label="Not pinned" />}</td></tr>
        ))}</tbody></table></div></section>
    </div>
  );

  if (section === 'brand') return (
    <div className="page"><Crumb title="Letter & invoice branding" sub="Applied to every letter and invoice that leaves the clinic" />
      <div className="dash-grid">
        <div className="col-6"><section className="card">
          <div className="card-hd"><h3>Organisation</h3><span className="spacer" />
            <span className="chip chip-accent">From Xero</span></div>
          <div className="card-bd col g-4"><div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="field"><label className="label" htmlFor="fLegal">Legal name</label><input className="input" id="fLegal" defaultValue={K.org.legal} /></div>
            <div className="field"><label className="label" htmlFor="fTrading">Trading name</label><input className="input" id="fTrading" defaultValue={K.org.trading} /></div>
            <div className="field"><label className="label" htmlFor="fGst">GST number</label><input className="input t-mono" id="fGst" defaultValue={K.org.gst} /></div>
            <div className="field"><label className="label" htmlFor="fBank">Bank account</label><input className="input t-mono" id="fBank" defaultValue={K.org.bank} /></div>
          </div></div>
        </section></div>
        <div className="col-6"><section className="card">
          <div className="card-hd"><h3>Preview</h3></div>
          <div className="card-bd" style={{ background: 'var(--bg-sunken)' }}>
            <div className="card" style={{ background: '#fff', color: '#151B18', padding: '26px 28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #116330', paddingBottom: 12 }}>
                <div><b style={{ color: '#116330', fontSize: 17 }}>Kora Health</b>
                  <div style={{ fontSize: 9.5, color: '#4E5852', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700 }}>Specialist Clinic</div></div>
                <div style={{ fontSize: 9.5, color: '#4E5852', textAlign: 'right' }}>{K.clinics[0].addr}<br />GST {K.org.gst}</div>
              </div>
              <p style={{ fontSize: 11, color: '#4E5852', marginTop: 34, paddingTop: 10, borderTop: '1px solid #CBD4CE' }}>
                <b>{K.org.legal}</b> · NZBN {K.org.nzbn}<br />
                Direct credit to <b>{K.org.bank}</b><br />{K.org.terms}</p>
            </div>
          </div>
        </section></div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="page-hd">
        <div className="page-title"><h1>Admin</h1><span className="page-sub">Practice configuration for Kora Health, Newmarket</span></div>
        <div className="page-actions"><Link className="btn btn-secondary btn-sm" to="/styleguide"><Sparkles size={14} /> Design system</Link></div>
      </div>
      <div className="settings-grid mb-6">{CARDS.map(c => (
        <button className="card card-link setting-card" key={c.id} data-card={c.id}
          onClick={() => ['users', 'types', 'codes', 'rooms', 'tpl', 'brand'].includes(c.id)
            ? nav(`/admin/${c.id}`) : toast(c.title, 'This settings area would open here.', 'info')}>
          <span className="sc-ic"><c.Icon size={18} /></span>
          <span><b className="t-h4" style={{ display: 'block' }}>{c.title}</b><span className="t-sm muted">{c.sub}</span></span>
          <span className="row between mt-2"><span className="chip">{c.meta}</span><ChevronRight size={15} className="subtle" /></span>
        </button>
      ))}</div>
      <h2 className="t-h3 mb-3 mt-6">Integrations</h2>
      <section className="card"><div className="list-rows">{INTEGRATIONS.map(x => (
        <div className="work-row" key={x.n}>
          <span className="work-ic" style={{ background: x.ok ? 'var(--ok-bg)' : 'var(--surface-3)',
            color: x.ok ? 'var(--ok-fg)' : 'var(--text-muted)' }}><x.Icon size={16} /></span>
          <span className="grow"><b>{x.n}</b><span>{x.d}</span></span>
          {x.ok ? <span className="sync-pill"><Check size={12} /> {x.s}</span> : <span className="chip">{x.s}</span>}
          <button className="btn btn-secondary btn-sm" onClick={() => toast(x.n, 'Integration settings would open here.', 'info')}>
            {x.ok ? 'Manage' : 'Connect'}</button>
        </div>
      ))}</div></section>
    </div>
  );
}

function PermSwitch({ label, initial, toast }) {
  const [on, setOn] = useState(initial);
  return <Switch checked={on} onChange={v => { setOn(v); toast('Permission updated', `${label} ${v ? 'granted' : 'removed'}`, 'ok'); }} label={label} />;
}
