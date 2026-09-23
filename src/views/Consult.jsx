import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock, FileText, SquareCheckBig, Activity, Pill, FlaskConical, TriangleAlert, HeartPulse,
  Shield, Bell, Copy, Eye, Share2, ShieldCheck, LayoutTemplate, Plus, X, Check, Mail,
  CalendarDays, ReceiptText, Mic, LayoutDashboard, Phone, MapPin, SquarePen, Search, History,
  Users, Printer, UploadCloud, MessageSquare, ChevronLeft, ChevronRight,
} from 'lucide-react';
import K from '../data/sample.js';
import { fmtDate, fmtDateDMY, fmtDateShort, fmtClock, fmtLongDate, age, money } from '../lib/format.js';
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

const PANELS = ['Prompts', 'Timeline', 'Problems', 'Inbox', 'Outbox', 'Transcribe'];

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
  const [noteTab, setNoteTab] = useState('Notes');
  const [dxQuick, setDxQuick] = useState('');
  const [tlQuery, setTlQuery] = useState('');
  const [saveState, bump] = useAutosave();
  const timer = useRef(null);

  /* Rail and side panel are draggable-width and collapsible, like a code
     editor's side panes: the notes column in the middle just fills
     whatever's left. Widths live in state, not layout, because a drag needs
     to repaint every frame without re-deriving anything else. */
  const [railW, setRailW] = useState(224);
  const [railOpen, setRailOpen] = useState(true);
  const [sideW, setSideW] = useState(360);
  const [sideOpen, setSideOpen] = useState(true);
  const dragRef = useRef(null);

  useEffect(() => {
    const onMove = e => {
      const d = dragRef.current; if (!d) return;
      const delta = e.clientX - d.startX;
      if (d.edge === 'rail') setRailW(Math.min(340, Math.max(180, d.startW + delta)));
      else setSideW(Math.min(520, Math.max(260, d.startW - delta)));
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.cursor = ''; document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);
  const beginDrag = edge => e => {
    e.preventDefault();
    dragRef.current = { edge, startX: e.clientX, startW: edge === 'rail' ? railW : sideW };
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
  };

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
    <section className="sect sect-lead">
      <div className="sect-hd">
        <nav className="tabs" role="tablist" aria-label="Notes or history">
          <button role="tab" aria-selected={noteTab === 'Notes'} onClick={() => setNoteTab('Notes')}>Notes</button>
          <button role="tab" aria-selected={noteTab === 'History'} onClick={() => setNoteTab('History')}>History</button>
        </nav>
        <span className="spacer" />
        <button className={`btn btn-sm ${confidential ? 'btn-soft' : 'btn-secondary'}`}
          onClick={() => { setConfidential(c => !c); bump(); }}><Shield size={13} /> Confidential</button>
        <button className="btn btn-secondary btn-sm" onClick={() => window.print()}><Printer size={13} /> Print</button>
      </div>

      {noteTab === 'History' ? <TimelinePanel p={p} /> : (
        <>
          <div className="field">
            <label className="label" htmlFor="dxQuick">Diagnosis</label>
            <div className="input-group">
              <span className="ic-lead"><Search size={15} /></span>
              <input className="input" id="dxQuick" value={dxQuick} placeholder="Add a diagnosis or clinical code…"
                onChange={e => setDxQuick(e.target.value)}
                onKeyDown={e => {
                  if (e.key !== 'Enter' || !dxQuick.trim()) return;
                  const c = dxQuick.trim();
                  setCodes(x => x.includes(c) ? x : [...x, c]); setDxQuick(''); bump();
                  toast('Diagnosis added', 'Also listed under Diagnosis / coding.', 'ok');
                }} />
            </div>
            {codes.length > 0 && (
              <div className="recip-chips" style={{ marginTop: 8 }}>
                {codes.map(c => (
                  <span className="chip chip-accent chip-removable" key={c}>{c}
                    <button className="x" aria-label={`Remove ${c}`}
                      onClick={() => { setCodes(x => x.filter(y => y !== c)); bump(); }}><X size={11} /></button></span>
                ))}
              </div>
            )}
          </div>

          <div className="row g-3 wrap">
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

          <div className="row g-5 wrap">
            <label className="row g-2 t-sm" style={{ cursor: 'pointer' }}>
              <span className="check" role="checkbox" aria-checked={hidePortal}
                onClick={() => { setHidePortal(c => !c); bump(); }}><Check size={11} /></span> Hide from patient portal</label>
            {confidential && <span className="chip chip-bad">Restricted to the care team</span>}
          </div>

          <div className="col g-5">
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
        </>
      )}
    </section>
  );

  const MeasCard = (
    <section className="sect">
      <div className="sect-hd"><h2>Measurements</h2><span className="spacer" />
        <span className="sect-meta">Recorded this consult</span></div>
      <div className="meas-grid">
        {[['bp','Blood pressure','mmHg','128/82'],['hr','Pulse','bpm','72'],['temp','Temperature','°C','36.8'],
          ['spo2','SpO₂','%','98'],['wt','Weight','kg','78'],['ht','Height','cm','168']].map(([k,l,u,ph]) => (
          <div className="field" key={k}>
            <label className="label" htmlFor={`v-${k}`}>{l}</label>
            <input className="input input-money" id={`v-${k}`} value={vitals[k]} placeholder={ph}
              inputMode="decimal" onChange={e => setVital(k, e.target.value)} />
            <span className="hint">{u}</span>
          </div>
        ))}
        {/* A readout, but it sits in the same grid as the fields around it, so
            it takes the same box: an unbordered value in a row of bordered
            inputs is the cell that looks broken. */}
        <div className="field">
          <span className="label">BMI</span>
          <div className="readout" id="bmiOut">
            {b ? <><b className="num">{b}</b><span className={`chip ${band[1]}`}>{band[0]}</span></>
               : <span className="subtle">Not yet</span>}
          </div>
          <span className="hint">From weight and height</span>
        </div>
      </div>
    </section>
  );

  const CodingCard = <DiagnosisCoding p={p} codes={codes} setCodes={setCodes} bump={bump} toast={toast} />;

  /* A fixed-height shell, like the inbox and the letter editor: the header
     block and the action bar stay put; the three panes in between are each
     their own card, independently resizable and collapsible, and each
     scrolls on its own. Before this the whole page scrolled, so the sticky
     footer sat on top of the note and the function rail was cut in half. */
  return (
    <div className="consult-shell">
      <div className="consult-top">
      <div className="cb-strapline">
        <div className="cb-row">
          <Avatar id={p.id} size="lg" />
          <div className="cb-id grow">
            <div className="cb-name-line">
              <Link className="cb-name" to={`/patient/${p.id}`}>{K.displayName(p)}</Link>
              <span className="cb-sub">DOB {fmtDateDMY(p.dob)} · {age(p.dob)} Y · {p.sex === 'F' ? 'Female' : 'Male'}</span>
            </div>
            <div className="cb-pills">
              <a className="cb-pill" href={`tel:${p.phone}`}><Phone size={12} className="ic" />{p.phone}</a>
              <a className="cb-pill" href={`mailto:${p.email}`}><Mail size={12} className="ic" />{p.email}</a>
              <span className="cb-pill"><MapPin size={12} className="ic" />{p.addr}</span>
            </div>
          </div>
          <div className="col g-2" style={{ alignItems: 'flex-end', flex: 'none' }}>
            <div className="cb-badges">
              <span className="chip chip-ok">NHI {p.nhi}</span>
              {p.csc && <span className="chip chip-info">Community Services Card</span>}
              <span className="chip">{p.ethnicity}</span>
              {p.claim && <span className="chip chip-warm">{p.claim}</span>}
            </div>
            <div className="cb-actions">
              <button className="btn btn-secondary btn-sm"
                onClick={() => toast('Edit', 'Demographics form would open.', 'info')}><SquarePen size={13} /> Edit</button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => nav(`/patient/${p.id}/timeline`)}><History size={13} /> History</button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => toast('Care team', 'Care team panel would open.', 'info')}><Users size={13} /> Care Team</button>
            </div>
          </div>
        </div>

        <dl className="cb-facts-strip">
          <div><dt>Chart</dt><dd className="t-mono">{p.chart}</dd></div>
          <div><dt>Provider</dt><dd>{K.st(p.provider).name}</dd></div>
          <div><dt>Enrolment</dt><dd><span className={`chip ${st.chip}`}>{st.label}</span></dd></div>
          <div><dt>GMS</dt><dd>{p.gms} {p.fund === 'F' ? <span className="chip chip-ok">Funded</span> : <span className="chip chip-warn">Not funded</span>}</dd></div>
          <div><dt>Balance</dt><dd className={bal > 0 ? 'bad-t' : ''}><b>{money(bal)}</b></dd></div>
          <div><dt>Quintile</dt><dd>{p.quintile} <span className="subtle">· DHB {p.dhb}</span></dd></div>
          <div><dt>Portal</dt><dd>{p.portal ? 'Registered' : <span className="subtle">Not registered</span>}</dd></div>
        </dl>
      </div>

      <div className="qg-cards">
        <QuickCard tone="ok" icon={<FileText size={14} />} title="Problem List"
          items={K.problems.filter(x => x.pt === p.id && x.status === 'active')}
          onAdd={() => setFn('coding')}
          renderItem={x => <span className="t-sm" key={x.text}>{x.text}</span>} />
        <QuickCard tone="info" icon={<Pill size={14} />} title="Long Term Medications"
          items={K.prescriptions.filter(r => r.pt === p.id)}
          onAdd={() => setFn('meds')}
          renderItem={r => <span className="t-sm" key={r.id}>{K.med(r.med).name}</span>} />
        <QuickCard tone="bad" icon={<TriangleAlert size={14} />} title="Allergies / Adverse Reactions"
          items={p.alerts} onAdd={() => setFn('allergy')}
          renderItem={a => <span className="alert-badge" key={a}><TriangleAlert size={12} />{a}</span>} />
        <QuickCard tone="warm" icon={<Bell size={14} />} title="Alerts"
          items={p.warn} onAdd={() => setFn('allergy')}
          renderItem={a => <span className="alert-badge warn" key={a}>{a}</span>} />
      </div>

      <div className="qa-row">
        <button className="qa-pill" onClick={() => setFn('notes')}><FileText size={14} /> New Note</button>
        <button className="qa-pill" onClick={() => setFn('meds')}><Pill size={14} /> Prescribe</button>
        <button className="qa-pill" onClick={() => setFn('invest')}><FlaskConical size={14} /> Order Labs</button>
        <button className="qa-pill" onClick={() => setFn('referral')}><Share2 size={14} /> Referral</button>
        <button className="qa-pill" onClick={() => setFn('docs')}><UploadCloud size={14} /> Upload Document</button>
        <button className="qa-pill" onClick={() => { setPanel('Inbox'); toast('Message', 'Compose a secure message.', 'info'); }}>
          <MessageSquare size={14} /> Send Message</button>
        <button className="qa-pill" onClick={() => window.print()}><Printer size={14} /> Print Summary</button>
      </div>

      <div className="cb-strip">
        <label className="cb-ctl"><span className="label">Consult type</span>
          <select className="select" value={type} onChange={e => { setType(e.target.value); bump(); }}>
            {K.consultTypes.map(t => <option key={t}>{t}</option>)}
          </select></label>
        <label className="cb-ctl"><span className="label">Consult</span>
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

      <div className="consult-body" style={{ gridTemplateColumns:
        `${railOpen ? railW : 44}px 6px minmax(0, 1fr) 6px ${sideOpen ? sideW : 44}px` }}>

        {railOpen ? (
          <nav className="consult-pane" aria-label="Patient record functions">
            <div className="panel-hd">
              <b className="grow">Patient record</b>
              <button className="btn btn-ghost btn-icon btn-sm" aria-label="Collapse patient record panel"
                onClick={() => setRailOpen(false)}><ChevronLeft size={15} /></button>
            </div>
            <div className="panel-scroll fn-rail">
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
            </div>
          </nav>
        ) : (
          <button className="panel-collapsed" aria-label="Expand patient record panel"
            onClick={() => setRailOpen(true)}><ChevronRight size={15} /></button>
        )}
        <div className={`resize-handle ${!railOpen ? 'is-idle' : ''}`} onMouseDown={railOpen ? beginDrag('rail') : undefined} />

        <div className="consult-pane">
          <div className="panel-scroll">
            <div className="consult-main col g-7">
              {fn === 'meas' ? MeasCard
                : fn === 'coding' ? CodingCard
                : fn === 'notes' ? NoteCard
                : <Empty icon={<FileText size={22} />} title="Not built in this prototype"
                    body="This section isn't wired up yet — try Notes, Measurements or Diagnosis / coding." />}
            </div>
          </div>
        </div>

        <div className={`resize-handle ${!sideOpen ? 'is-idle' : ''}`} onMouseDown={sideOpen ? beginDrag('side') : undefined} />
        {sideOpen ? (
          <aside className="consult-pane">
            <div className="panel-hd">
              <nav className="tabs" role="tablist">
                {PANELS.map(t => (
                  <button role="tab" key={t} aria-selected={panel === t} data-panel={t} onClick={() => setPanel(t)}>{t}</button>
                ))}
              </nav>
              <span className="spacer" />
              <button className="btn btn-ghost btn-icon btn-sm" aria-label="Collapse side panel"
                onClick={() => setSideOpen(false)}><ChevronRight size={15} /></button>
            </div>
            <div className="panel-scroll">
              {panel === 'Timeline' && (
                <div className="input-group" style={{ marginBottom: 12 }}>
                  <span className="ic-lead"><Search size={14} /></span>
                  <input className="input" value={tlQuery} onChange={e => setTlQuery(e.target.value)}
                    placeholder="Search timeline…" aria-label="Search timeline" />
                </div>
              )}
              {panel === 'Prompts' && <Prompts p={p} toast={toast} />}
              {panel === 'Timeline' && <TimelinePanel p={p} query={tlQuery} />}
              {panel === 'Problems' && <ProblemsPanel p={p} />}
              {panel === 'Inbox' && <InboxPanel p={p} />}
              {panel === 'Outbox' && <Empty icon={<Mail size={22} />} title="Nothing sent"
                body="Referrals and letters sent from this consult will appear here." />}
              {panel === 'Transcribe' && <Transcribe toast={toast} />}
            </div>
          </aside>
        ) : (
          <button className="panel-collapsed" aria-label="Expand side panel"
            onClick={() => setSideOpen(true)}><ChevronLeft size={15} /></button>
        )}
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
    </div>
  );
}

/* One of the four quick-glance cards under the patient header — problems,
   long-term medications, allergies, alerts. Same shape whichever list it
   holds, so scanning across all four means learning the layout once. */
function QuickCard({ tone, icon, title, items, onAdd, renderItem }) {
  return (
    <div className={`qg-card is-${tone}`}>
      <div className="qg-hd">{icon}<b className="truncate">{title}</b><span className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={onAdd}><Plus size={13} /> Add</button>
      </div>
      <div className="qg-bd">
        {items.length
          ? <div className="qg-list">{items.map(renderItem)}</div>
          : <span className="qg-empty"><Check size={14} /> No records found</span>}
      </div>
    </div>
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
          <b>{overdue.length} overdue</b><br /><span className="t-sm">Raise these before the patient leaves.</span>
        </Banner>
      )}
      {/* Four boxed tiles in a narrow column read as four of the same thing.
          Divided rows with a coloured edge say which one is late. */}
      <div className="recall-list">
        {rs.map(r => (
          <div className={`recall is-${r.status}`} key={r.text}>
            <div className="row between g-2">
              <b className="t-body">{r.text}</b>
              <Chip status={r.status === 'overdue' ? 'overdue' : r.status === 'due' ? 'pending' : 'draft'}
                label={r.status === 'overdue' ? 'Overdue' : r.status === 'due' ? 'Due' : 'Future'} />
            </div>
            <span className="t-sm muted">{r.kind} · due {fmtDate(r.due)}</span>
            <span className="row g-2">
              <button className="btn btn-soft btn-sm" onClick={() => toast('Recall actioned', r.text, 'ok')}><Check size={14} /> Action</button>
              <button className="btn btn-ghost btn-sm" onClick={() => toast('Recall deferred', `${r.text}, pushed out three months.`, 'info')}>Defer</button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelinePanel({ p, query = '' }) {
  const q = query.trim().toLowerCase();
  const ev = (K.timeline[p.id] || [])
    .filter(e => !q || e.title.toLowerCase().includes(q) || (e.body || '').toLowerCase().includes(q))
    .slice(0, 8);
  return (
    <div className="col g-3">
      <div className="t-eyebrow">{fmtLongDate(K.TODAY)}</div>
      {ev.length ? ev.map((e, i) => (
        <div className="tl-entry" key={i}>
          <div className="row g-3">
            <span className={`feed-ic ${e.kind}`} style={{ width: 26, height: 26 }}><FileText size={13} /></span>
            <span className="grow" style={{ minWidth: 0 }}>
              <b className="t-xs" style={{ display: 'block' }}>{e.title}</b>
              <span className="t-xs subtle">{e.by ? `${K.st(e.by).name} · ` : ''}{fmtDateShort(e.at.slice(0, 10))} · {fmtClock(e.at)}</span>
            </span>
          </div>
          {e.body && <p className="t-xs muted tl-entry-body">{e.body}</p>}
        </div>
      )) : <span className="t-sm subtle">{q ? 'No matching entries.' : 'Nothing recorded yet.'}</span>}
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
  return <div className="plain-rows">{items.map(i => (
    <div key={i.id}>
      <b className="t-body">{i.subj}</b><div className="t-sm muted">{i.from}</div></div>
  ))}</div>;
}

const DX_TABS = ['Diagnosis', 'Procedure Hx', 'Family Hx', 'Social Hx', 'History', 'General comments'];
const DX_SUGGESTIONS = ['Meniscal tear of knee', 'Knee pain', 'Osteoarthritis of knee', 'Work-related injury'];

/* The diagnosis/coding tool as its own sub-tabbed record, the way the rest
   of the chart (problems, allergies, immunisations) already reads: dated
   rows grouped by whether they're the patient's standing history or
   something just added this consult, not a flat run-on of chips. Only
   Diagnosis has real data behind it; the other tabs are the same record
   structure with nothing recorded yet, same as an unused chart section
   anywhere else in the product. */
function DiagnosisCoding({ p, codes, setCodes, bump, toast }) {
  const [tab, setTab] = useState('Diagnosis');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('active');

  const longTerm = K.problems.filter(x => x.pt === p.id
    && (status === 'all' || x.status === status)
    && (!q.trim() || x.text.toLowerCase().includes(q.trim().toLowerCase())));
  const suggestions = DX_SUGGESTIONS.filter(c => !codes.includes(c)
    && (!q.trim() || c.toLowerCase().includes(q.trim().toLowerCase())));

  return (
    <section className="sect">
      <div className="sect-hd"><h2>Diagnosis and coding</h2><span className="spacer" />
        <span className="sect-meta">SNOMED CT · drives recalls, reporting and ACC</span></div>

      <nav className="tabs dx-tabs" role="tablist" aria-label="Patient record section">
        {DX_TABS.map(t => (
          <button role="tab" key={t} aria-selected={tab === t} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>

      {tab !== 'Diagnosis' ? (
        <Empty icon={<FileText size={22} />} title="Nothing recorded"
          body={`No ${tab.toLowerCase()} recorded for this patient yet.`} />
      ) : (
        <div className="col g-4">
          <div className="row g-3 wrap">
            <div className="input-group" style={{ maxWidth: 280, flex: '1 1 220px' }}>
              <span className="ic-lead"><Search size={15} /></span>
              <input className="input" value={q} onChange={e => setQ(e.target.value)}
                placeholder="Find a diagnosis…" aria-label="Find a diagnosis" />
            </div>
            <select className="select" style={{ maxWidth: 160 }} value={status}
              onChange={e => setStatus(e.target.value)} aria-label="Diagnosis status">
              <option value="active">Active</option>
              <option value="resolved">Resolved</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="col g-2">
            <span className="t-eyebrow">Long term diagnosis</span>
            {longTerm.length ? (
              <div className="dx-list">
                {longTerm.map(x => (
                  <div className="dx-row" key={x.text}>
                    <span className="t-xs t-mono subtle dx-date">{fmtDateDMY(x.onset)}</span>
                    <span className="grow t-sm">{x.text}
                      {x.acc && <span className="chip chip-warm" style={{ marginLeft: 6 }}>ACC</span>}
                      {x.status === 'resolved' && <span className="chip" style={{ marginLeft: 6 }}>Resolved</span>}
                    </span>
                    <button className="btn btn-ghost btn-icon btn-sm tip" data-tip="View in timeline"
                      aria-label={`View ${x.text} in timeline`}
                      onClick={() => toast('Timeline', x.text, 'info')}><History size={14} /></button>
                  </div>
                ))}
              </div>
            ) : <span className="t-sm subtle">No record found.</span>}
          </div>

          <div className="col g-2">
            <span className="t-eyebrow">Added this consult</span>
            {codes.length ? (
              <div className="dx-list">
                {codes.map(c => (
                  <div className="dx-row" key={c}>
                    <span className="t-xs subtle dx-date">Today</span>
                    <span className="grow t-sm">{c}</span>
                    <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Remove ${c}`}
                      onClick={() => { setCodes(x => x.filter(y => y !== c)); bump(); }}><X size={14} /></button>
                  </div>
                ))}
              </div>
            ) : <span className="t-sm subtle">Nothing coded yet.</span>}
          </div>

          <div className="row g-2 wrap">
            {suggestions.map(c => (
              <button className="btn btn-secondary btn-sm" key={c} data-addcode
                onClick={() => { setCodes(x => [...x, c]); bump(); }}><Plus size={12} /> {c}</button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Transcribe({ toast }) {
  return (
    <div className="col g-4">
      <div className="mic-state off"><span className="mic-dot" />
        <span className="cell2"><b>Microphone ready</b><span>Consult room 2</span></span>
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
