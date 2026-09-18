import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Plus, Link2, Download, Check, TriangleAlert, User, Pencil, FilePen,
  SquareCheckBig, DollarSign, CalendarDays, Bell, Syringe, House, UserPlus, UserCheck,
  Printer, IdCard, EllipsisVertical, ChevronLeft, ChevronRight, Mail, Pill, FlaskConical,
  ReceiptText, Copy,
} from 'lucide-react';
import K from '../data/sample.js';
import { fmtDate, age, money } from '../lib/format.js';
import { Avatar, Switch, Empty } from '../components/Primitives.jsx';
import { useUi, Menu } from '../lib/ui.jsx';

const COLS = [
  { k: 'last',     label: 'Name', sort: true },
  { k: 'dob',      label: 'DOB', sort: true },
  { k: 'age',      label: 'Age', sort: true, num: true },
  { k: null,       label: 'Gender' },
  { k: 'nhi',      label: 'NHI', sort: true },
  { k: 'chart',    label: 'Chart no.', sort: true },
  { k: null,       label: 'Address' },
  { k: null,       label: 'Phone' },
  { k: null,       label: 'Mobile' },
  { k: 'provider', label: 'Provider', sort: true },
  { k: null,       label: 'Fund',  tip: 'Funded or not funded' },
  { k: null,       label: 'CSC',   tip: 'Community Services Card' },
  { k: null,       label: 'Enrol', tip: 'Enrolment status' },
  { k: null,       label: 'Reg',   tip: 'Registered or casual' },
  { k: null,       label: 'Pay grp', tip: 'Payment group' },
  { k: 'gms',      label: 'GMS',   tip: 'General Medical Services subsidy', sort: true },
  { k: 'balance',  label: 'Balance', sort: true, num: true },
  { k: null,       label: 'Actions' },
];

/* Same affordances as the current product, on one icon grid and each with a name. */
const ACTIONS = [
  { id: 'open',    Icon: User,           label: 'Open patient record' },
  { id: 'edit',    Icon: Pencil,         label: 'Edit demographics' },
  { id: 'notes',   Icon: FilePen,        label: 'Clinical notes' },
  { id: 'tasks',   Icon: SquareCheckBig, label: 'Tasks' },
  { id: 'account', Icon: DollarSign,     label: 'Account and invoices' },
  { id: 'book',    Icon: CalendarDays,   label: 'Book appointment' },
  { id: 'recall',  Icon: Bell,           label: 'Recalls' },
  { sep: true },
  { id: 'cir',     Icon: Syringe,        label: 'Immunisations (CIR)' },
  { id: 'family',  Icon: House,          label: 'Family and household' },
  { id: 'relate',  Icon: UserPlus,       label: 'Add relationship' },
  { id: 'enrol',   Icon: UserCheck,      label: 'Enrolment' },
  { sep: true },
  { id: 'print',   Icon: Printer,        label: 'Print summary' },
  { id: 'label',   Icon: IdCard,         label: 'Patient label' },
  { id: 'more',    Icon: EllipsisVertical, label: 'More actions' },
];

const digits = v => String(v).replace(/\D/g, '');

export default function Patients() {
  const nav = useNavigate();
  const { toast } = useUi();
  const [f, setF] = useState({ name: '', dob: '', nhi: '', street: '' });
  const [sort, setSort] = useState({ k: 'last', dir: 1 });
  const [page, setPage] = useState(1);
  const [per, setPer] = useState(100);
  const [vault, setVault] = useState(false);
  const [menu, setMenu] = useState(null);
  const gridRef = useRef(null);

  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setPage(1); };

  const list = useMemo(() => {
    const name = f.name.trim().toLowerCase(), nhi = f.nhi.trim().toLowerCase();
    const dob = digits(f.dob), street = f.street.trim().toLowerCase();
    let out = K.patients.filter(p => {
      if (!vault && p.status === 'deceased') return false;
      if (nhi && !p.nhi.toLowerCase().startsWith(nhi)) return false;
      if (street && !p.addr.toLowerCase().includes(street)) return false;
      if (dob) {
        const dmy = digits(p.dob.split('-').reverse().join(''));
        if (!dmy.startsWith(dob) && !digits(p.dob).includes(dob)) return false;
      }
      if (name) {
        const hay = [p.last, p.first, p.preferred || ''].join(' ').toLowerCase();
        if (!name.split(/\s+/).filter(Boolean).every(t => hay.includes(t))) return false;
      }
      return true;
    });
    const key = {
      last: p => `${p.last} ${p.first}`, dob: p => p.dob, age: p => p.dob, nhi: p => p.nhi,
      chart: p => p.chart, provider: p => K.st(p.provider).name, balance: p => K.balance(p.id), gms: p => p.gms,
    }[sort.k] || (p => p.last);
    return out.sort((a, b) => {
      const x = key(a), y = key(b);
      const cmp = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'en-NZ');
      return (sort.k === 'age' ? -cmp : cmp) * sort.dir;
    });
  }, [f, sort, vault]);

  const pages = Math.max(1, Math.ceil(list.length / per));
  const cur = Math.min(page, pages);
  const rows = list.slice((cur - 1) * per, cur * per);
  const nhiState = f.nhi.trim() ? K.nhiCheck(f.nhi) : null;

  const act = (id, pid, anchor) => {
    const p = K.pt(pid);
    const say = (t, b) => toast(t, `${p.first} ${p.last} · ${b}`, 'info');
    switch (id) {
      case 'open': nav(`/patient/${pid}`); break;
      case 'notes': nav(`/consult/${pid}`); break;
      case 'account': nav(`/patient/${pid}/invoices`); break;
      case 'book': nav('/appointments?book=1'); break;
      case 'tasks': nav('/tasks?new=1'); break;
      case 'edit': say('Edit demographics', 'name, address, contact and funding'); break;
      case 'recall': say('Recalls', `${K.recalls.filter(r => r.pt === pid).length} on file`); break;
      case 'cir': say('Immunisations', 'Community Immunisation Register'); break;
      case 'family': say('Family and household', 'linked members and shared address'); break;
      case 'relate': say('Add relationship', 'next of kin, caregiver or dependant'); break;
      case 'enrol': say('Enrolment', `${K.ENROL_STATUS[p.status].label} · ${p.payGrp}`); break;
      case 'print': toast('Printing summary', `${p.first} ${p.last}`, 'ok'); break;
      case 'label': toast('Patient label', p.nhi, 'ok'); break;
      case 'more': setMenu({ anchor, items: [
        { heading: K.displayName(p) },
        { icon: <Mail size={15} />, label: 'Write letter', action: () => nav(`/letter/new?pt=${pid}`) },
        { icon: <Pill size={15} />, label: 'Prescribe', action: () => nav(`/patient/${pid}/rx`) },
        { icon: <FlaskConical size={15} />, label: 'Request tests', action: () => nav(`/patient/${pid}/tests`) },
        { icon: <ReceiptText size={15} />, label: 'Create invoice', action: () => nav('/billing?create=1') },
        '-',
        { icon: <Copy size={15} />, label: 'Copy NHI', action: () => { navigator.clipboard?.writeText(p.nhi); toast('NHI copied', p.nhi, 'ok'); } },
      ]}); break;
      default: break;
    }
  };

  return (
    <div className="ps-shell">
      <div className="ps-head">
        <div className="page-title">
          <h1 className="t-h2">Search Patient</h1>
          <span className="page-sub">Kora Specialists · Newmarket · <b className="num">{K.patients.length.toLocaleString('en-NZ')}</b> records</span>
        </div>
        <span className="spacer" />
        <div className="row g-2">
          <button className="btn btn-ghost btn-sm" onClick={() => toast('Export queued', `${list.length} rows will be emailed as CSV.`, 'ok')}>
            <Download size={14} /> Export</button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast('Duplicate check', 'Candidates matched on name, date of birth and address.', 'info')}>
            <Link2 size={14} /> Find duplicates</button>
          <button className="btn btn-primary btn-sm" onClick={() => toast('Register patient', 'An NHI lookup runs first so you do not create a duplicate.', 'info')}>
            <Plus size={14} /> Register patient</button>
        </div>
      </div>

      <div className="ps-filters">
        <div className="ps-filter-grid">
          <div className="field"><label className="label" htmlFor="fName">Patient name</label>
            <input className="input" id="fName" value={f.name} placeholder="Surname, then first name"
              autoComplete="off" onChange={e => set('name', e.target.value)} /></div>
          <div className="field"><label className="label" htmlFor="fDob">Date of birth</label>
            <input className="input" id="fDob" value={f.dob} placeholder="DD/MM/YYYY" inputMode="numeric"
              autoComplete="off" onChange={e => set('dob', e.target.value)} /></div>
          <div className="field"><label className="label" htmlFor="fNhi">NHI</label>
            <input className="input t-mono" id="fNhi" value={f.nhi} placeholder="JKL8407" maxLength={7}
              autoComplete="off" style={{ textTransform: 'uppercase' }}
              onChange={e => set('nhi', e.target.value.toUpperCase())} /></div>
          <div className="field"><label className="label" htmlFor="fStreet">Street or suburb</label>
            <input className="input" id="fStreet" value={f.street} placeholder="Devon Street"
              autoComplete="off" onChange={e => set('street', e.target.value)} /></div>
          <div className="row g-2">
            <button className="btn btn-primary" data-act="search"
              onClick={() => { setPage(1); if (gridRef.current) gridRef.current.scrollTop = 0; }}>
              <Search size={15} /> Search</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setF({ name: '', dob: '', nhi: '', street: '' }); setPage(1); }}>Clear</button>
            <button className="btn btn-ghost btn-icon btn-sm tip" data-tip="Advanced search" aria-label="Advanced search"
              onClick={() => toast('Advanced search', 'Provider, enrolment, payment group and ACC claim would filter here.', 'info')}>
              <Filter size={15} /></button>
          </div>
        </div>
        <div className="row g-3 mt-2">
          {!nhiState ? <span className="hint">Three letters, four digits</span>
            : nhiState.state === 'ok' ? <span className="err ok-t"><Check size={12} /> Check digit valid</span>
            : nhiState.state === 'partial' ? <span className="hint">{nhiState.why}</span>
            : <span className="err"><TriangleAlert size={12} /> {nhiState.why}</span>}
        </div>
      </div>

      <div className="ps-legend">
        <span className="t-eyebrow">Enrolment</span>
        {Object.entries(K.ENROL_STATUS).map(([k, v]) => (
          <span className="lg" key={k}><i style={{ background: v.tone }} />{v.label}</span>
        ))}
        <span className="spacer" />
        <label className="row g-2 t-xs" style={{ cursor: 'pointer' }}>
          <Switch checked={vault} onChange={v => { setVault(v); setPage(1); }} id="fVault" label="Include deceased and archived" />
          <span className="muted">Include deceased and archived</span>
        </label>
      </div>

      <div className="ps-grid" ref={gridRef}>
        <table>
          <thead><tr>
            {COLS.map(c => {
              const sorted = c.k && sort.k === c.k;
              return (
                <th key={c.label}
                  className={`${c.sort ? 'sortable' : ''} ${c.tip ? 'tip' : ''} ${c.num ? 'num-cell' : ''}`}
                  data-tip={c.tip} data-sort={c.sort ? c.k : undefined}
                  aria-sort={sorted ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                  onClick={c.sort ? () => setSort(s => s.k === c.k ? { k: c.k, dir: -s.dir } : { k: c.k, dir: 1 }) : undefined}>
                  {c.label}{c.sort && <span className="sort-ind">{sorted ? (sort.dir === 1 ? '↑' : '↓') : '↕'}</span>}
                </th>
              );
            })}
          </tr></thead>
          <tbody>
            {rows.map(p => {
              const st = K.ENROL_STATUS[p.status], bal = K.balance(p.id);
              const mobile = p.phone && p.phone.startsWith('+64 2') ? p.phone : '';
              const landline = p.phone && !p.phone.startsWith('+64 2') ? p.phone : '';
              return (
                <tr key={p.id} tabIndex={0}
                  onClick={e => { if (!e.target.closest('.p-actions')) nav(`/patient/${p.id}`); }}
                  onKeyDown={e => { if (e.key === 'Enter') nav(`/patient/${p.id}`); }}>
                  <td><span className="pname">
                    <i className="p-dot" style={{ background: st.tone }} title={st.label} />
                    <b style={{ color: st.tone }}>{p.last.toUpperCase()}, {p.first}</b>
                    {p.preferred && <span className="p-pref">({p.preferred})</span>}
                    {p.alerts.length > 0 && (
                      <span className="tip" data-tip={p.alerts.join(', ')} style={{ color: 'var(--bad-fg)', display: 'inline-flex' }}>
                        <TriangleAlert size={13} /></span>
                    )}
                  </span></td>
                  <td className="t-mono t-xs">{fmtDate(p.dob)}</td>
                  <td className="num-cell">{age(p.dob)}</td>
                  <td>{p.sex === 'F' ? 'Female' : 'Male'}</td>
                  <td className="t-mono t-xs">{p.nhi}</td>
                  <td className="t-mono t-xs subtle">{p.chart}</td>
                  <td className="wrap-cell t-xs">{p.addr}</td>
                  <td className="t-xs">{landline || <span className="subtle">—</span>}</td>
                  <td className="t-xs">{mobile || <span className="subtle">—</span>}</td>
                  <td className="t-xs">{K.st(p.provider).name.replace(/^(Dr|Nurse) /, '')}</td>
                  <td>{p.fund === 'F' ? <span className="chip chip-ok">F</span> : <span className="subtle">N</span>}</td>
                  <td>{p.csc ? <span className="chip chip-warm">CSC</span> : <span className="subtle">—</span>}</td>
                  <td>{p.enrol === 'NES' ? <span className="chip chip-ok">NES</span> : <span className="chip">U</span>}</td>
                  <td>{p.reg}</td>
                  <td className="t-xs">{p.payGrp}</td>
                  <td className="t-xs">{p.gms}</td>
                  <td className={`num-cell ${bal > 0 ? 'bad-t' : 'subtle'}`}>{bal > 0 ? <b>{money(bal)}</b> : '$0.00'}</td>
                  <td><span className="p-actions">
                    {ACTIONS.map((a, i) => a.sep ? <span className="pa-sep" key={i} /> : (
                      <button className="pa tip" key={a.id} data-tip={a.label}
                        aria-label={`${a.label} — ${p.first} ${p.last}`}
                        onClick={e => { e.stopPropagation(); act(a.id, p.id, e.currentTarget); }}>
                        <a.Icon size={15} />
                      </button>
                    ))}
                  </span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!rows.length && (
          <Empty icon={<Search size={22} />} title="No patient matched"
            body="Check the spelling, try the NHI on its own, or include archived records." />
        )}
      </div>

      <div className="ps-foot">
        <span className="t-sm muted">Showing <b className="num">{list.length ? (cur - 1) * per + 1 : 0}–{Math.min(cur * per, list.length)}</b> of <b className="num">{list.length.toLocaleString('en-NZ')}</b> patients</span>
        <span className="spacer" />
        <label className="row g-2 t-xs muted">Rows
          <select className="select" value={per} aria-label="Rows per page"
            style={{ height: 30, width: 76, paddingTop: 2, paddingBottom: 2 }}
            onChange={e => { setPer(Number(e.target.value)); setPage(1); }}>
            {[50, 100, 200].map(n => <option key={n}>{n}</option>)}
          </select></label>
        <div className="pager" role="group" aria-label="Pagination">
          <button onClick={() => { setPage(1); gridRef.current.scrollTop = 0; }} disabled={cur === 1} aria-label="First page"><ChevronLeft size={13} /><ChevronLeft size={13} /></button>
          <button onClick={() => { setPage(cur - 1); gridRef.current.scrollTop = 0; }} disabled={cur === 1} aria-label="Previous page"><ChevronLeft size={14} /></button>
          {Array.from({ length: Math.min(5, pages) }, (_, i) => Math.max(1, Math.min(pages - 4, cur - 2)) + i)
            .filter(n => n >= 1 && n <= pages)
            .map(n => <button key={n} aria-current={n === cur} onClick={() => { setPage(n); gridRef.current.scrollTop = 0; }}>{n}</button>)}
          <button onClick={() => { setPage(cur + 1); gridRef.current.scrollTop = 0; }} disabled={cur === pages} aria-label="Next page"><ChevronRight size={14} /></button>
          <button onClick={() => { setPage(pages); gridRef.current.scrollTop = 0; }} disabled={cur === pages} aria-label="Last page"><ChevronRight size={13} /><ChevronRight size={13} /></button>
        </div>
      </div>
      {menu && <Menu anchor={menu.anchor} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}
