import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock, FileText, SquareCheckBig, Activity, Pill, FlaskConical, TriangleAlert, HeartPulse,
  Shield, Bell, Copy, Eye, Share2, ShieldCheck, LayoutTemplate, Plus, X, Check, Mail,
  CalendarDays, ReceiptText, Mic, LayoutDashboard,
} from 'lucide-react';
import K from '../data/sample.js';
import { fmtDate, fmtDateShort, fmtClock, fmtLongDate, age, money } from '../lib/format.js';
import { Chip, FunderChip, Avatar, Banner, Empty } from '../components/Primitives.jsx';
import { useUi, Modal, Menu, useAutosave, SavedIndicator } from '../lib/ui.jsx';

const SOAP = [
  { k: 's', label: 'Subjective', ph: 'What the patient reports, in their words.' },
  { k: 'o', label: 'Objective',  ph: 'Examination findings and observations. Include the normals.' },
  { k: 'a', label: 'Assessment', ph: 'Working diagnosis and differentials.' },
  { k: 'p', label: 'Plan',       ph: 'Investigations, treatment, follow-up, what the patient was told.' },
];

const FUNCTIONS = [
  { group: 'This consult', items: [
    { id: 'notes', Icon: FileText, label: 'Notes' },
    { id: 'coding', Icon: SquareCheckBig, label: 'Diagnosis / coding' },
    { id: 'meas', Icon: Activity, label: 'Measurements' },
    { id: 'meds', Icon: Pill, label: 'Medications' },
    { id: 'invest', Icon: FlaskConical, label: 'Investigations' },
  ]},
  { group: 'Record', items: [
    { id: 'allergy', Icon: TriangleAlert, label: 'Allergies & warnings', tone: 'bad' },
    { id: 'problems', Icon: HeartPulse, label: 'Problems' },
    { id: 'immun', Icon: Shield, label: 'Immunisations' },
    { id: 'recall', Icon: Bell, label: 'Recalls', tone: 'warn' },
    { id: 'docs', Icon: Copy, label: 'Letters & documents' },
    { id: 'photos', Icon: Eye, label: 'Photos & PACS' },
  ]},
  { group: 'Send', items: [
    { id: 'referral', Icon: Share2, label: 'Referrals' },
    { id: 'acc', Icon: ShieldCheck, label: 'ACC / WINZ' },
    { id: 'careplan', Icon: LayoutTemplate, label: 'Care plan', badge: '0' },
    { id: 'tasks', Icon: SquareCheckBig, label: 'Tasks' },
  ]},
];

const PANELS = ['Prompts', 'Timeline', 'Problems', 'Inbox', 'Transcribe'];

const TEMPLATES = {
  'Orthopaedic assessment': { s: 'Right knee pain following a fall at work.',
    o: 'Antalgic gait. Small effusion. Range 0–120°. Medial joint line tenderness. McMurray positive medially.',
    a: 'Medial meniscal tear.', p: 'MRI right knee. Review with result in four weeks. Selected duties.' },
  'Post-operative review': { s: 'Routine post-operative review.', o: 'Wound clean and dry. Sutures intact.',
    a: 'Satisfactory progress.', p: 'Remove sutures at 14 days. Physiotherapy.' },
  'ACC review': { s: 'ACC review for work capacity.', o: 'Improving range of movement.',
    a: 'Progressing as expected.', p: 'ACC45 updated. Fit for selected duties. Review six weeks.' },
};

const bmiOf = v => {
  const w = parseFloat(v.wt), h = parseFloat(v.ht);
  return (!w || !h) ? null : (w / Math.pow(h / 100, 2)).toFixed(1);
};
const bmiBand = n => n < 18.5 ? ['Underweight', 'chip-warn']
  : n < 25 ? ['Healthy range', 'chip-ok'] : n < 30 ? ['Overweight', 'chip-warn'] : ['Obese', 'chip-bad'];

export default function Consult() {
  const { id } = useParams();
  const nav = useNavigate();
  const { toast, open } = useUi();
  const p = K.pt(id) || K.patients[0];
  const appt = K.appts.find(a => a.pt === p.id && (a.status === 'consult' || a.status === 'arrived'))
            || K.appts.find(a => a.pt === p.id);

  const [note, setNote] = useState({ s: '', o: '', a: '', p: '' });
  const [vitals, setVitals] = useState({ bp: '', hr: '', temp: '', wt: '', ht: '', spo2: '' });
  const [codes, setCodes] = useState([]);
  const [services, setServices] = useState([]);
  const [fn, setFn] = useState('notes');
  const [panel, setPanel] = useState('Prompts');
  const [type, setType] = useState('Face to face');
  const [confidential, setConfidential] = useState(false);
  const [hidePortal, setHidePortal] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [menu, setMenu] = useState(null);
  const [saveState, bump] = useAutosave();
  const timer = useRef(null);

  useEffect(() => {
    if (!running) return;
    timer.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer.current);
  }, [running]);

  const bal = K.balance(p.id);
  const st = K.ENROL_STATUS[p.status];
  const b = bmiOf(vitals);
  const band = b ? bmiBand(Number(b)) : null;
  const overdue = K.recalls.filter(r => r.pt === p.id && r.status === 'overdue');
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  const setSoap = (k, v) => { setNote(n => ({ ...n, [k]: v })); bump(); };
  const setVital = (k, v) => { setVitals(x => ({ ...x, [k]: v })); bump(); };

  const sign = withLetter => open(close => (
    <Modal title={withLetter ? 'Sign, file and write a letter' : 'Sign and file this consult'}
      sub={`${p.first} ${p.last} · ${p.nhi}`} icon={<Check size={15} />}
      tone={overdue.length ? 'warn' : 'ok'} onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Keep editing</button>
        <button className="btn btn-primary" data-go onClick={() => {
          clearInterval(timer.current);
          if (appt) appt.status = 'done';
          (K.timeline[p.id] = K.timeline[p.id] || []).unshift({
            at: '2026-09-17T10:22', kind: 'note', by: 'u1', title: `${type} consult`,
            body: note.a || note.s || 'Consultation recorded.', signed: true,
          });
          close();
          toast('Note signed and filed', `${Math.max(1, Math.round(elapsed / 60))} min · locked to ${K.st('u1').name}`, 'ok');
          nav(withLetter ? `/letter/new?pt=${p.id}` : `/patient/${p.id}/timeline`);
        }}><Check size={15} /> {withLetter ? 'Sign and write letter' : 'Sign and file'}</button>
      </>}>
      <div className="col g-4">
        {overdue.length > 0 && (
          <Banner tone="warn" icon={<Bell size={15} />}>
            <b>{overdue.length} recall still overdue</b><br />
            <span className="t-sm">{overdue.map(r => r.text).join(', ')}. Action it now or it carries to the next visit.</span>
          </Banner>
        )}
        {SOAP.filter(x => !note[x.k].trim()).length > 0 ? (
          <Banner tone="warn" icon={<TriangleAlert size={15} />}>
            <span className="t-sm"><b>{SOAP.filter(x => !note[x.k].trim()).map(x => x.label).join(', ')}</b> empty.
            You can still sign. The note records what you wrote.</span>
          </Banner>
        ) : <Banner tone="ok" icon={<Check size={15} />}><span className="t-sm">All four SOAP sections completed.</span></Banner>}
        <dl className="kv">
          <dt>Consult type</dt><dd>{type}</dd>
          <dt>Duration</dt><dd className="num">{Math.max(1, Math.round(elapsed / 60))} min</dd>
          <dt>Signed by</dt><dd>{K.st('u1').name} · MCNZ {K.st('u1').mcnz}</dd>
          <dt>Coding</dt><dd>{codes.length ? codes.join(', ') : <span className="subtle">None</span>}</dd>
          <dt>Services</dt><dd>{services.length ? `${services.length} to invoice` : <span className="subtle">None attached</span>}</dd>
        </dl>
      </div>
    </Modal>
  ));

  const openServices = () => open(close => (
    <ServicesModal close={close} p={p} services={services} setServices={setServices} toast={toast} />
  ));

  const counts = {
    allergy: p.alerts.length,
    recall: K.recalls.filter(r => r.pt === p.id && r.status !== 'future').length,
    problems: K.problems.filter(x => x.pt === p.id && x.status === 'active').length,
    meds: K.prescriptions.filter(r => r.pt === p.id).length,
    invest: K.testRequests.filter(r => r.pt === p.id).length,
  };

  const NoteCard = (
    <section className="card">
      <div className="card-hd">
        <h3>Notes</h3><span className="spacer" />
        <select className="select" id="noteTpl" style={{ maxWidth: 210 }} aria-label="Notes template" defaultValue=""
          onChange={e => { const t = TEMPLATES[e.target.value]; if (t) { setNote({ ...t }); bump(); toast('Template applied', 'Edit the wording before signing.', 'ok'); } }}>
          <option value="">Select notes template…</option>
          {Object.keys(TEMPLATES).map(t => <option key={t}>{t}</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={() => {
          const prev = (K.timeline[p.id] || []).find(e => e.kind === 'note');
          if (!prev) return toast('No earlier consult', 'Nothing to copy forward.', 'warn');
          setNote(n => ({ ...n, s: prev.body })); bump();
          toast('Copied forward', 'Pasted into Subjective. Edit before signing.', 'ok');
        }}><Copy size={14} /> Copy last consult</button>
      </div>
      <div className="card-bd-tight row g-4 wrap" style={{ borderBottom: '1px solid var(--line-faint)' }}>
        <label className="row g-2 t-sm" style={{ cursor: 'pointer' }}>
          <span className="check" role="checkbox" aria-checked={confidential} data-flag="confidential"
            onClick={() => { setConfidential(c => !c); bump(); }}><Check size={11} /></span> Confidential</label>
        <label className="row g-2 t-sm" style={{ cursor: 'pointer' }}>
          <span className="check" role="checkbox" aria-checked={hidePortal}
            onClick={() => { setHidePortal(c => !c); bump(); }}><Check size={11} /></span> Hide from patient portal</label>
        {confidential && <span className="chip chip-bad">Restricted to the care team</span>}
      </div>
      <div className="card-bd col g-5">
        {SOAP.map(sx => (
          <div className="field soap-field" key={sx.k}>
            <div className="row between">
              <label className="label" htmlFor={`soap-${sx.k}`}>{sx.label}</label>
              <button className="btn btn-ghost btn-sm" data-dots={sx.k} onClick={e => setMenu({ anchor: e.currentTarget, items: [
                { heading: 'Insert a dot phrase' },
                { icon: <Plus size={15} />, label: '.normalknee · normal knee examination',
                  action: () => { setSoap(sx.k, (note[sx.k] ? note[sx.k] + ' ' : '') + 'Full range of movement. No effusion. Ligaments stable. Neurovascularly intact.'); } },
                { icon: <Plus size={15} />, label: '.noredflags · no red flags',
                  action: () => { setSoap(sx.k, (note[sx.k] ? note[sx.k] + ' ' : '') + 'No night pain, no weight loss, no fevers.'); } },
              ]})}><Plus size={12} /> Go to dots</button>
            </div>
            <textarea className="textarea" id={`soap-${sx.k}`} rows={4} placeholder={sx.ph}
              value={note[sx.k]} onChange={e => setSoap(sx.k, e.target.value)} />
          </div>
        ))}
      </div>
    </section>
  );

  const MeasCard = (
    <section className="card">
      <div className="card-hd"><h3>Measurements</h3><span className="spacer" />
        <span className="t-xs subtle">Recorded this consult</span></div>
      <div className="card-bd row g-4 wrap" style={{ alignItems: 'flex-end' }}>
        {[['bp','Blood pressure','mmHg','128/82',112],['hr','Pulse','bpm','72',82],['temp','Temp','°C','36.8',86],
          ['spo2','SpO₂','%','98',78],['wt','Weight','kg','78',86],['ht','Height','cm','168',86]].map(([k,l,u,ph,w]) => (
          <div className="field" style={{ width: w }} key={k}>
            <label className="label" htmlFor={`v-${k}`}>{l}</label>
            <input className="input input-money" id={`v-${k}`} value={vitals[k]} placeholder={ph}
              inputMode="decimal" onChange={e => setVital(k, e.target.value)} />
            <span className="hint">{u}</span>
          </div>
        ))}
        <div className="field" style={{ minWidth: 150 }}>
          <span className="label">BMI</span>
          <div className="row g-2" id="bmiOut" style={{ height: 36, alignItems: 'center' }}>
            {b ? <><b className="t-h4 num">{b}</b><span className={`chip ${band[1]}`}>{band[0]}</span></>
               : <span className="t-sm subtle">Weight and height</span>}
          </div>
        </div>
      </div>
    </section>
  );

  const CodingCard = (
    <section className="card">
      <div className="card-hd"><h3>Diagnosis / coding</h3><span className="spacer" />
        <span className="t-xs subtle">SNOMED CT · drives recalls, reporting and ACC</span></div>
      <div className="card-bd col g-3">
        <div className="recip-chips">
          {codes.length ? codes.map(c => (
            <span className="chip chip-accent chip-lg chip-removable" key={c}>{c}
              <button className="x" data-rmcode aria-label={`Remove ${c}`}
                onClick={() => { setCodes(x => x.filter(y => y !== c)); bump(); }}><X size={11} /></button></span>
          )) : <span className="t-sm subtle">Nothing coded yet.</span>}
        </div>
        <div className="row g-2 wrap">
          {['Meniscal tear of knee', 'Knee pain', 'Osteoarthritis of knee', 'Work-related injury']
            .filter(c => !codes.includes(c)).map(c => (
            <button className="btn btn-secondary btn-sm" key={c} data-addcode
              onClick={() => { setCodes(x => [...x, c]); bump(); }}><Plus size={12} /> {c}</button>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <>
      <div className="consult-banner">
        <div className="cb-row">
          <Avatar id={p.id} size="lg" />
          <div className="cb-id">
            <Link className="cb-name" to={`/patient/${p.id}`}>{K.displayName(p)}</Link>
            <div className="cb-sub">
              <span>{fmtDate(p.dob)}</span><span className="dot-sep">·</span>
              <span>{age(p.dob)} yrs {p.sex === 'F' ? 'Female' : 'Male'}</span>
              <span className="dot-sep">·</span><span>{p.ethnicity}</span>
            </div>
          </div>
          <dl className="cb-facts">
            <div><dt>NHI</dt><dd className="t-mono">{p.nhi} <span className="chip chip-ok">{p.enrol}</span></dd></div>
            <div><dt>Chart</dt><dd className="t-mono">{p.chart}</dd></div>
            <div><dt>Provider</dt><dd>{K.st(p.provider).name}</dd></div>
            <div><dt>Enrolment</dt><dd><span className={`chip ${st.chip}`}>{st.label}</span></dd></div>
            <div><dt>GMS</dt><dd>{p.gms} {p.fund === 'F' ? <span className="chip chip-ok">Funded</span> : <span className="chip chip-warn">Not funded</span>}</dd></div>
            <div><dt>Balance</dt><dd className={bal > 0 ? 'bad-t' : ''}><b>{money(bal)}</b></dd></div>
            <div><dt>Quintile</dt><dd>{p.quintile} <span className="subtle">· DHB {p.dhb}</span></dd></div>
            <div><dt>Portal</dt><dd>{p.portal ? 'Registered' : <span className="subtle">Not registered</span>}</dd></div>
          </dl>
          <div className="cb-alerts">
            {p.alerts.map(a => <span className="alert-badge" key={a}><TriangleAlert size={12} />{a}</span>)}
            {p.warn.map(a => <span className="alert-badge warn" key={a}>{a}</span>)}
            {p.claim && <span className="chip chip-warm">{p.claim}</span>}
          </div>
        </div>
        <div className="cb-strip">
          <label className="cb-ctl"><span className="t-eyebrow">Consult type</span>
            <select className="select" value={type} onChange={e => { setType(e.target.value); bump(); }}>
              {K.consultTypes.map(t => <option key={t}>{t}</option>)}
            </select></label>
          <label className="cb-ctl"><span className="t-eyebrow">Consult</span>
            <select className="select" defaultValue="Consult 1"><option>Consult 1</option><option>Consult 2</option></select></label>
          <span className={`chip ${running ? 'chip-ok' : ''}`}><i className="dot" />
            <span className="t-mono" id="timerText">{mm}:{ss}</span></span>
          <button className="btn btn-ghost btn-icon btn-sm tip" data-tip={running ? 'Pause timer' : 'Resume timer'}
            aria-label="Toggle consult timer" onClick={() => setRunning(r => !r)}><Clock size={15} /></button>
          <span className="spacer" />
          <button className="btn btn-secondary btn-sm" data-act="services" onClick={openServices}>
            <ReceiptText size={14} /> Services for invoicing
            {services.length > 0 && <span className="badge-count warm">{services.length}</span>}</button>
          <SavedIndicator state={saveState} />
        </div>
      </div>

      <div className="consult-body">
        <nav className="fn-rail" aria-label="Patient note functions">
          {FUNCTIONS.map(g => (
            <div className="fn-group" key={g.group}>
              <div className="nav-group-label">{g.group}</div>
              {g.items.map(it => (
                <button className={`fn-item ${it.tone || ''}`} key={it.id} data-fn={it.id}
                  aria-current={fn === it.id} onClick={() => setFn(it.id)}>
                  <it.Icon size={16} className="ic" /><span className="grow">{it.label}</span>
                  {counts[it.id] ? <span className={`badge-count ${it.tone === 'bad' ? '' : 'quiet'}`}>{counts[it.id]}</span>
                    : it.badge ? <span className="badge-count quiet">{it.badge}</span> : null}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="col g-4" style={{ minWidth: 0 }}>
          {fn === 'meas' ? <>{MeasCard}{NoteCard}</>
            : fn === 'coding' ? <>{CodingCard}{NoteCard}</>
            : <>{NoteCard}{MeasCard}{CodingCard}</>}
        </div>

        <div style={{ minWidth: 0 }}>
          <section className="card" style={{ position: 'sticky', top: 'calc(var(--topbar-h) + 8px)' }}>
            <nav className="tabs" role="tablist" style={{ padding: '0 var(--s-3)' }}>
              {PANELS.map(t => (
                <button role="tab" key={t} aria-selected={panel === t} data-panel={t} onClick={() => setPanel(t)}>{t}</button>
              ))}
            </nav>
            <div className="card-bd">
              {panel === 'Prompts' && <Prompts p={p} toast={toast} />}
              {panel === 'Timeline' && <TimelinePanel p={p} />}
              {panel === 'Problems' && <ProblemsPanel p={p} />}
              {panel === 'Inbox' && <InboxPanel p={p} />}
              {panel === 'Transcribe' && <Transcribe toast={toast} />}
            </div>
          </section>
        </div>
      </div>

      <div className="ed-bar consult-foot">
        <span className="t-xs subtle">Autosaves as you type · signing locks the note against your name</span>
        <span className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={() => { toast('Parked', 'The consult stays open in your queue.', 'ok'); nav('/dashboard'); }}>
          <Clock size={14} /> Park</button>
        <button className="btn btn-secondary btn-sm" data-act="sign" onClick={() => sign(false)}><Check size={14} /> Sign and file</button>
        <button className="btn btn-primary btn-sm" onClick={() => sign(true)}><Mail size={14} /> Sign and write letter</button>
      </div>
      {menu && <Menu anchor={menu.anchor} items={menu.items} onClose={() => setMenu(null)} />}
    </>
  );
}

function Prompts({ p, toast }) {
  const rs = K.recalls.filter(r => r.pt === p.id);
  const overdue = rs.filter(r => r.status === 'overdue');
  if (!rs.length) return <Empty icon={<Check size={22} />} title="No prompts" body="Nothing is due for this patient." />;
  return (
    <div className="col g-4">
      {overdue.length > 0 && (
        <Banner tone="bad" icon={<TriangleAlert size={15} />}>
          <b>{overdue.length} overdue</b><br /><span className="t-xs">Raise these before the patient leaves.</span>
        </Banner>
      )}
      {rs.map(r => (
        <div className="row-t g-3 card card-flat" style={{ padding: 11 }} key={r.text}>
          <span className="work-ic" style={{ width: 28, height: 28,
            background: r.status === 'overdue' ? 'var(--bad-bg)' : r.status === 'due' ? 'var(--warn-bg)' : 'var(--surface-3)',
            color: r.status === 'overdue' ? 'var(--bad-fg)' : r.status === 'due' ? 'var(--warn-fg)' : 'var(--text-muted)' }}>
            <Bell size={14} /></span>
          <span className="grow" style={{ minWidth: 0 }}>
            <b className="t-sm">{r.text}</b>
            <span className="t-xs subtle" style={{ display: 'block' }}>{r.kind} · due {fmtDate(r.due)}</span>
            <span className="row g-2 mt-2">
              <button className="btn btn-soft btn-sm" onClick={() => toast('Recall actioned', r.text, 'ok')}><Check size={12} /> Action</button>
              <button className="btn btn-ghost btn-sm" onClick={() => toast('Recall deferred', `${r.text}, pushed out three months.`, 'info')}>Defer</button>
            </span>
          </span>
          <Chip status={r.status === 'overdue' ? 'overdue' : r.status === 'due' ? 'pending' : 'draft'}
            label={r.status === 'overdue' ? 'Overdue' : r.status === 'due' ? 'Due' : 'Future'} />
        </div>
      ))}
    </div>
  );
}

function TimelinePanel({ p }) {
  const ev = (K.timeline[p.id] || []).slice(0, 6);
  return (
    <div className="col g-3">
      <div className="t-eyebrow">{fmtLongDate(K.TODAY)}</div>
      {ev.length ? ev.map((e, i) => (
        <div className="row g-3" style={{ padding: '9px 0', borderBottom: '1px solid var(--line-faint)' }} key={i}>
          <span className={`feed-ic ${e.kind}`} style={{ width: 26, height: 26 }}><FileText size={13} /></span>
          <span className="grow" style={{ minWidth: 0 }}>
            <b className="t-xs" style={{ display: 'block' }}>{e.title}</b>
            <span className="t-xs subtle">{fmtDateShort(e.at.slice(0, 10))} · {fmtClock(e.at)}</span></span>
        </div>
      )) : <span className="t-sm subtle">Nothing recorded yet.</span>}
    </div>
  );
}

function ProblemsPanel({ p }) {
  const probs = K.problems.filter(x => x.pt === p.id);
  const rx = K.prescriptions.filter(r => r.pt === p.id);
  return (
    <div className="col g-5">
      <div className="col g-2"><span className="t-eyebrow">Problems</span>
        {probs.length ? probs.map(x => (
          <div className="row between g-2" key={x.text}>
            <span className={`t-sm ${x.status === 'resolved' ? 'subtle' : ''}`}>{x.text}
              {x.acc && <span className="chip chip-warm">ACC</span>}</span>
            <span className="t-xs subtle">{fmtDateShort(x.onset)}</span>
          </div>
        )) : <span className="t-sm subtle">None recorded.</span>}
      </div>
      <div className="divider" />
      <div className="col g-2"><span className="t-eyebrow">Current medicines</span>
        {rx.length ? rx.map(r => (
          <div className="t-sm" key={r.id}>{K.med(r.med).name} <span className="subtle">{K.med(r.med).form}</span></div>
        )) : <span className="t-sm subtle">Nothing active.</span>}
      </div>
      <div className="divider" />
      <div className="col g-2"><span className="t-eyebrow">Allergies</span>
        {p.alerts.length ? p.alerts.map(a => <span className="alert-badge" key={a}><TriangleAlert size={12} />{a}</span>)
          : <span className="t-sm subtle">None recorded. Confirm with the patient.</span>}
      </div>
    </div>
  );
}

function InboxPanel({ p }) {
  const items = K.inbox.filter(i => i.pt === p.id);
  if (!items.length) return <Empty icon={<Mail size={22} />} title="Nothing filed" body="No results or messages waiting." />;
  return <div className="col g-3">{items.map(i => (
    <div className="card card-flat" style={{ padding: 10 }} key={i.id}>
      <b className="t-sm">{i.subj}</b><div className="t-xs subtle">{i.from}</div></div>
  ))}</div>;
}

function Transcribe({ toast }) {
  return (
    <div className="col g-4">
      <div className="mic-state off"><span className="mic-dot" />
        <span className="t-sm"><b>Microphone ready</b><br /><span className="t-xs subtle">Consult room 2</span></span>
        <span className="mic-timer">00:00</span></div>
      <button className="btn btn-primary btn-block" onClick={() => toast('Transcribing', 'Recording started. Tell the patient a scribe is in use.', 'ok')}>
        <Mic size={15} /> Start transcribing</button>
      <div className="ai-flag"><TriangleAlert size={14} /> Draft only. You review it before it enters the note</div>
      <p className="t-xs subtle">The transcript fills Subjective and Objective. Audio is deleted once the note is signed.</p>
    </div>
  );
}

function ServicesModal({ close, p, services, setServices, toast }) {
  const [sel, setSel] = useState(services);
  const codes = K.billingCodes.filter(b => b.active);
  return (
    <Modal title="Services for invoicing" sub={`${p.first} ${p.last} · bills to ${p.funder}`}
      icon={<ReceiptText size={15} />} wide onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Cancel</button>
        <button className="btn btn-primary" data-go onClick={() => {
          setServices(sel); close();
          toast('Services attached', `${sel.length} item${sel.length === 1 ? '' : 's'} will bill on sign-off.`, 'ok');
        }}><Check size={15} /> Attach to consult</button>
      </>}>
      <div className="col g-3">
        <p className="t-sm muted">Tick what was delivered. The invoice is raised when you sign the consult.</p>
        <div className="list-rows card card-flat">
          {codes.map(b => (
            <label className="work-row" style={{ padding: '9px var(--s-4)', cursor: 'pointer' }} key={b.code}>
              <span className="check" role="checkbox" aria-checked={sel.includes(b.code)} data-svc={b.code}
                onClick={() => setSel(s => s.includes(b.code) ? s.filter(x => x !== b.code) : [...s, b.code])}>
                <Check size={11} /></span>
              <span className="grow"><b className="t-sm">{b.name}</b>
                <span className="t-xs subtle" style={{ display: 'block' }}>{b.code}{b.acc ? ` · ACC ${b.acc}` : ''}</span></span>
              <span className="num t-sm">{money(b.price)}</span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}
