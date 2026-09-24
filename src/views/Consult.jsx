import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Clock, FileText, SquareCheckBig, Activity, Pill, FlaskConical, TriangleAlert, HeartPulse,
  Shield, Bell, Copy, Eye, Share2, ShieldCheck, LayoutTemplate, Plus, X, Check, Mail,
  CalendarDays, ReceiptText, Mic, LayoutDashboard, Phone, MapPin, SquarePen, Search, History,
  Users, Printer, UploadCloud, MessageSquare, ChevronLeft, ChevronRight, Ellipsis,
} from 'lucide-react';
import K from '../data/sample.js';
import { fmtDate, fmtDateDMY, fmtDateShort, fmtClock, fmtLongDate, age, money } from '../lib/format.js';
import { Chip, FunderChip, Avatar, Banner, Empty } from '../components/Primitives.jsx';
import { useUi, Modal, Drawer, Menu, useAutosave, SavedIndicator } from '../lib/ui.jsx';

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

  const CodingCard = <DiagnosisCoding p={p} codes={codes} setCodes={setCodes} bump={bump} toast={toast} open={open} />;

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

      {/* Quick-glance cards and quick-action pills are hidden for now —
          re-enable by restoring this block (see git history). */}

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
              <OverflowTabs items={PANELS} active={panel} onChange={setPanel} label="Consult side panel" />
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
/* A tab strip that never wraps to a second row: whatever doesn't fit the
   current width collapses behind a "More" tab, the way antd's own tabs
   degrade — so shrinking the side panel costs a click, not the panel's own
   height. Widths are measured off a hidden clone of every tab, so the count
   that fits is exact rather than guessed from a breakpoint. */
function OverflowTabs({ items, active, onChange, label }) {
  const outerRef = useRef(null);
  const itemRefs = useRef([]);
  const moreRef = useRef(null);
  const [visible, setVisible] = useState(items.length);
  const [menu, setMenu] = useState(null);

  useLayoutEffect(() => {
    const recompute = () => {
      const outer = outerRef.current;
      if (!outer) return;
      const avail = outer.clientWidth;
      const widths = itemRefs.current.map(el => el ? el.getBoundingClientRect().width + 2 : 0);
      const moreW = (moreRef.current ? moreRef.current.getBoundingClientRect().width : 0) + 2;
      let total = 0, count = items.length;
      for (let i = 0; i < widths.length; i++) {
        total += widths[i];
        if (total > avail || (total + moreW > avail && i < items.length - 1)) { count = i; break; }
      }
      setVisible(Math.max(1, count));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    if (outerRef.current) ro.observe(outerRef.current);
    return () => ro.disconnect();
  }, [items]);

  const shown = items.slice(0, visible);
  const hidden = items.slice(visible);
  const activeHidden = hidden.includes(active);

  return (
    <nav className="tabs otabs" role="tablist" aria-label={label} ref={outerRef}>
      <div className="otabs-measure" aria-hidden="true">
        {items.map((t, i) => <button key={t} ref={el => { itemRefs.current[i] = el; }} tabIndex={-1}>{t}</button>)}
        <button className="otabs-more" ref={moreRef} tabIndex={-1}><Ellipsis size={16} /></button>
      </div>
      {shown.map(t => (
        <button role="tab" key={t} aria-selected={active === t} onClick={() => onChange(t)}>{t}</button>
      ))}
      {hidden.length > 0 && (
        <button className="otabs-more" role="tab" aria-selected={activeHidden} aria-label="More sections"
          onClick={e => setMenu({ anchor: e.currentTarget,
            items: hidden.map(t => ({ label: t, action: () => onChange(t) })) })}>
          <Ellipsis size={16} /></button>
      )}
      {menu && <Menu anchor={menu.anchor} items={menu.items} onClose={() => setMenu(null)} />}
    </nav>
  );
}

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
/* Each diagnosis category is its own card, coloured so the three read as
   distinct records rather than one long list split by a label — and each
   uses the same .ps-grid table the Patients list and the Appointments grid
   view already use, so a record grid looks like a record grid everywhere
   in the product rather than growing its own one-off layout per screen. */
function DxCategory({ tone, icon, title, items }) {
  return (
    <div className={`dx-cat is-${tone}`}>
      <div className="dx-cat-hd">
        <span className="dx-cat-ic">{icon}</span>
        <b className="grow">{title}</b>
        <span className="dx-cat-count">{items.length}</span>
      </div>
      <div className="dx-cat-bd">
        {items.length ? (
          <div className="ps-grid is-embedded">
            <table>
              <thead><tr><th>Added</th><th>Onset</th><th>Name</th><th>Actions</th></tr></thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.key}>
                    <td className="t-mono t-xs">{it.added}</td>
                    <td className="t-mono t-xs">{it.onset}</td>
                    <td>
                      <span className="row g-2">
                        <b className="t-sm">{it.name}</b>
                        {it.acc && <span className="chip chip-warm">ACC</span>}
                        {it.resolved && <span className="chip">Resolved</span>}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm tip" data-tip={it.actionLabel}
                        aria-label={it.actionLabel} onClick={it.onAction}>{it.actionIcon}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <span className="dx-cat-empty"><Check size={14} /> No record found</span>}
      </div>
    </div>
  );
}

function DiagnosisCoding({ p, codes, setCodes, bump, toast, open }) {
  const [tab, setTab] = useState('Diagnosis');
  const [q, setQ] = useState('');
  const [pq, setPq] = useState('');
  const [, forceFam] = useState(0);
  const matchesQ = text => !q.trim() || text.toLowerCase().includes(q.trim().toLowerCase());

  const recent = codes.filter(matchesQ);
  const longTerm = K.problems.filter(x => x.pt === p.id && x.status === 'active' && matchesQ(x.text));
  const shortTerm = K.problems.filter(x => x.pt === p.id && x.status === 'resolved' && matchesQ(x.text));
  const suggestions = DX_SUGGESTIONS.filter(c => !codes.includes(c) && matchesQ(c));
  const procs = K.procedures.filter(x => x.pt === p.id
    && (!pq.trim() || x.name.toLowerCase().includes(pq.trim().toLowerCase())));
  const famList = K.familyHistory.filter(x => x.pt === p.id);
  const openFamDrawer = editing => open(close => (
    <FamilyHxDrawer close={close} p={p} editing={editing} toast={toast} force={forceFam} />
  ));
  const removeFam = id => {
    const i = K.familyHistory.findIndex(x => x.id === id);
    if (i > -1) K.familyHistory.splice(i, 1);
    forceFam(n => n + 1);
  };

  return (
    <section className="sect">
      <div className="row" style={{ alignItems: 'center' }}>
        <div style={{ flex: '0 1 auto', minWidth: 0 }}>
          <OverflowTabs items={DX_TABS} active={tab} onChange={setTab} label="Patient record section" /></div>
        {tab === 'Diagnosis' && (
          <div className="input-group" style={{ flex: '1 1 160px', minWidth: 140, maxWidth: 320 }}>
            <span className="ic-lead"><Search size={14} /></span>
            <input className="input" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search…" aria-label="Find a diagnosis" />
          </div>
        )}
        {tab === 'Procedure Hx' && (
          <div className="input-group" style={{ flex: '1 1 160px', minWidth: 140, maxWidth: 320 }}>
            <span className="ic-lead"><Search size={14} /></span>
            <input className="input" value={pq} onChange={e => setPq(e.target.value)}
              placeholder="Search…" aria-label="Find a procedure" />
          </div>
        )}
        {tab === 'Family Hx' && (
          <>
            <span className="spacer" />
            <button className="btn btn-primary btn-sm" onClick={() => openFamDrawer(null)}>
              <Plus size={14} /> Add</button>
          </>
        )}
      </div>

      {tab === 'Procedure Hx' ? (
        <div className="col g-4">
          {procs.length ? (
            <div className="ps-grid is-embedded">
              <table>
                <thead><tr><th>Added</th><th>Onset</th><th>Name</th><th>Provider</th><th>Actions</th></tr></thead>
                <tbody>
                  {procs.map(x => (
                    <tr key={x.name}>
                      <td className="t-mono t-xs">{fmtDateDMY(x.added)}</td>
                      <td className="t-mono t-xs">{fmtDateDMY(x.onset)}</td>
                      <td className="wrap-cell">
                        <b className="t-sm">{x.name}</b>
                        {x.note && <span className="t-xs subtle" style={{ display: 'block', fontStyle: 'italic' }}>{x.note}</span>}
                      </td>
                      <td className="t-xs subtle">{K.st(x.provider).name}</td>
                      <td>
                        <button className="btn btn-ghost btn-icon btn-sm tip" data-tip="View in timeline"
                          aria-label={`View ${x.name} in timeline`}
                          onClick={() => toast('Timeline', x.name, 'info')}><History size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <span className="t-sm subtle">No record found.</span>}
        </div>
      ) : tab === 'Family Hx' ? (
        <FamilyHxPanel list={famList} onEdit={openFamDrawer} onRemove={removeFam} />
      ) : tab === 'Social Hx' ? (
        <SocialHxPanel toast={toast} />
      ) : tab !== 'Diagnosis' ? (
        <Empty icon={<FileText size={22} />} title="Nothing recorded"
          body={`No ${tab.toLowerCase()} recorded for this patient yet.`} />
      ) : (
        <div className="col g-4">
          <DxCategory tone="accent" icon={<Clock size={14} />} title="Recent diagnosis"
            items={recent.map(c => ({
              key: c, name: c, added: 'Today', onset: 'Today',
              onAction: () => { setCodes(x => x.filter(y => y !== c)); bump(); }, actionIcon: <X size={13} />,
              actionLabel: `Remove ${c}`,
            }))} />

          <DxCategory tone="info" icon={<HeartPulse size={14} />} title="Long term diagnosis"
            items={longTerm.map(x => ({
              key: x.text, name: x.text, added: fmtDateDMY(x.added), onset: fmtDateDMY(x.onset), acc: x.acc,
              onAction: () => toast('Timeline', x.text, 'info'), actionIcon: <History size={13} />,
              actionLabel: `View ${x.text} in timeline`,
            }))} />

          <DxCategory tone="warm" icon={<Activity size={14} />} title="Short term diagnosis"
            items={shortTerm.map(x => ({
              key: x.text, name: x.text, added: fmtDateDMY(x.added), onset: fmtDateDMY(x.onset), acc: x.acc, resolved: true,
              onAction: () => toast('Timeline', x.text, 'info'), actionIcon: <History size={13} />,
              actionLabel: `View ${x.text} in timeline`,
            }))} />

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

const RELATIONS = ['Mother', 'Father', 'Sister', 'Brother', 'Daughter', 'Son',
  'Grandmother (maternal)', 'Grandfather (maternal)', 'Grandmother (paternal)', 'Grandfather (paternal)', 'Aunt', 'Uncle'];
const REL_TYPES = ['Biological', 'Step', 'Adopted'];
const FAMILY_DISEASES = ['Type 2 diabetes', 'Heart disease', 'Breast cancer', 'Bowel cancer',
  'Hypertension', 'Stroke', 'Asthma', 'Mental illness', 'Other'];
const blankFamilyForm = () => ({
  relation: '', relType: '', disease: '', name: '', ageDiagnosed: '', ageOfDeath: '', alive: true, notes: '', confidential: false,
});

/* Family Hx: a grid fed by an Add/Edit drawer rather than a permanently
   inline form, so the grid stays on screen and one drawer form serves both
   flows — Save pushes or, when editing, updates in place in K.familyHistory
   (the same "mutate the shared sample data, force a repaint" pattern
   K.appts.push already uses elsewhere) so the change shows up in the grid
   immediately without a parallel copy of the list living in component state. */
function FamilyHxPanel({ list, onEdit, onRemove }) {
  return (
    <div className="col g-4">
      {list.length ? (
        <div className="ps-grid is-embedded">
          <table>
            <thead><tr>
              <th>Date</th><th>Name</th><th>Relation</th><th>Alive</th><th>Disease</th><th>Notes</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {list.map(x => (
                <tr key={x.id}>
                  <td className="t-mono t-xs">{fmtDateDMY(x.date)}</td>
                  <td>
                    <span className="row g-2"><b className="t-sm">{x.name}</b>
                      {x.confidential && <span className="chip chip-bad">Confidential</span>}</span>
                  </td>
                  <td className="t-xs">{x.relation}</td>
                  <td>{x.alive ? <span className="chip chip-ok">Alive</span> : <span className="chip">Deceased</span>}</td>
                  <td className="t-xs">{x.disease || <span className="subtle">—</span>}</td>
                  <td className="t-xs subtle wrap-cell">{x.notes || '—'}</td>
                  <td>
                    <span className="row g-1">
                      <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Edit ${x.name}`}
                        onClick={() => onEdit(x)}><SquarePen size={13} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Remove ${x.name}`}
                        onClick={() => onRemove(x.id)}><X size={13} /></button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : <span className="t-sm subtle">No record found.</span>}
    </div>
  );
}

function FamilyHxDrawer({ close, p, editing, toast, force }) {
  const [form, setForm] = useState(() => editing ? { ...editing } : blankFamilyForm());
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = () => {
    if (!form.relation || !form.name.trim()) {
      toast('Missing details', 'Relationship and name are required.', 'warn');
      return;
    }
    if (editing) {
      const i = K.familyHistory.findIndex(x => x.id === editing.id);
      if (i > -1) K.familyHistory[i] = { ...K.familyHistory[i], ...form };
    } else {
      K.familyHistory.push({ id: 'fh' + Date.now(), pt: p.id, date: K.TODAY.toISOString().slice(0, 10), ...form });
    }
    force(n => n + 1);
    close();
    toast(editing ? 'Family history updated' : 'Family history added', form.name, 'ok');
  };

  return (
    <Drawer title={editing ? 'Edit family history' : 'Add family history'}
      sub={`${p.first} ${p.last} · ${p.nhi}`} onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Cancel</button>
        <button className="btn btn-primary" onClick={save}><Check size={14} /> Save</button>
      </>}>
      <div className="col g-4">
        <div className="fam-row">
          <div className="field">
            <label className="label" htmlFor="famRel">Relationship</label>
            <select className="select" id="famRel" value={form.relation} onChange={e => set('relation', e.target.value)}>
              <option value="">Select…</option>
              {RELATIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="famRelType">Relationship type</label>
            <select className="select" id="famRelType" value={form.relType} onChange={e => set('relType', e.target.value)}>
              <option value="">Select…</option>
              {REL_TYPES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div className="fam-row">
          <div className="field">
            <label className="label" htmlFor="famDisease">Disease</label>
            <select className="select" id="famDisease" value={form.disease} onChange={e => set('disease', e.target.value)}>
              <option value="">Choose…</option>
              {FAMILY_DISEASES.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div className="field">
            <label className="label" htmlFor="famName">Name</label>
            <input className="input" id="famName" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="Family member's name" />
          </div>
        </div>

        <div className="fam-row">
          <div className="field">
            <label className="label" htmlFor="famAgeDx">Age diagnosed</label>
            <input className="input" id="famAgeDx" value={form.ageDiagnosed} inputMode="numeric"
              onChange={e => set('ageDiagnosed', e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="famAgeDeath">Age of death</label>
            <input className="input" id="famAgeDeath" value={form.ageOfDeath} inputMode="numeric" disabled={form.alive}
              onChange={e => set('ageOfDeath', e.target.value)} />
          </div>
        </div>

        <div className="fam-row">
          <label className="row g-2 t-sm fam-check" style={{ cursor: 'pointer' }}>
            <span className="check" role="checkbox" aria-checked={form.alive}
              onClick={() => setForm(f => ({ ...f, alive: !f.alive, ageOfDeath: !f.alive ? '' : f.ageOfDeath }))}>
              <Check size={11} /></span> Alive</label>
          <label className="row g-2 t-sm fam-check" style={{ cursor: 'pointer' }}>
            <span className="check" role="checkbox" aria-checked={form.confidential}
              onClick={() => set('confidential', !form.confidential)}><Check size={11} /></span> Confidential</label>
        </div>

        <div className="field">
          <label className="label" htmlFor="famNotes">Notes</label>
          <textarea className="textarea" id="famNotes" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} />
        </div>
      </div>
    </Drawer>
  );
}

const SOCIAL_HX_TABS = ['Social History', 'Audit C', 'TICS', 'PHQ3'];

const SOCIAL_FIELDS = [
  { key: 'smoking', label: 'Smoking', options: ['Never smoked', 'Ex-smoker', 'Current smoker', 'Vapes only'] },
  { key: 'alcohol', label: 'Alcohol intake', options: ['None', 'Occasional', 'Moderate', 'Heavy'] },
  { key: 'exercise', label: 'Exercise', options: ['Sedentary', 'Light', 'Moderate', 'Active'] },
  { key: 'travel', label: 'Overseas travel', options: ['None recent', 'Within 6 months', 'Within 1 month'] },
  { key: 'drugUse', label: 'Drug use', options: ['None', 'Occasional', 'Regular'] },
  { key: 'religion', label: 'Religion', options: ['Not stated', 'Christian', 'Muslim', 'Hindu', 'Buddhist', 'Other', 'None'] },
  { key: 'impairment', label: 'Impairment', options: ['None', 'Hearing', 'Vision', 'Mobility', 'Cognitive'] },
  { key: 'living', label: 'Social / Living', options: ['Lives alone', 'Lives with family', 'Lives with partner', 'Residential care'] },
  { key: 'stress', label: 'Stress, Coping and Mood', options: ['Coping well', 'Some difficulty', 'Struggling', 'Crisis'] },
  { key: 'urine', label: 'Urine Status', options: ['Not tested', 'Normal', 'Abnormal'] },
  { key: 'blood', label: 'Blood Status', options: ['Not tested', 'Normal', 'Abnormal'] },
  { key: 'smokingAdvice', label: 'Smoking Advice Status', options: ['Not offered', 'Offered — declined', 'Offered — accepted', 'Not applicable'] },
  { key: 'triage', label: 'Triage Score', options: ['1 — Immediate', '2 — Urgent', '3 — Semi-urgent', '4 — Standard', '5 — Non-urgent'] },
];
const blankSocialForm = () => Object.fromEntries(
  SOCIAL_FIELDS.map(f => [f.key, { value: '', confidential: false, comment: '' }])
);

const AUDIT_C_QUESTIONS = [
  { key: 'freq', text: 'How often do you have a drink containing alcohol?',
    options: [['Never', 0], ['Monthly or less', 1], ['2–4 times a month', 2], ['2–3 times a week', 3], ['4+ times a week', 4]] },
  { key: 'qty', text: 'How many drinks containing alcohol do you have on a typical day when drinking?',
    options: [['1–2', 0], ['3–4', 1], ['5–6', 2], ['7–9', 3], ['10 or more', 4]] },
  { key: 'binge', text: 'How often do you have six or more drinks on one occasion?',
    options: [['Never', 0], ['Less than monthly', 1], ['Monthly', 2], ['Weekly', 3], ['Daily or almost daily', 4]] },
];
const AUDIT_C_BANDS = [
  { max: 3, label: 'Low risk', tone: 'chip-ok' },
  { max: 7, label: 'Increasing risk', tone: 'chip-warn' },
  { max: 12, label: 'High risk', tone: 'chip-bad' },
];

const TICS_QUESTIONS = [
  { key: 'more', text: 'In the last year, have you ever drunk or used drugs more than you meant to?',
    options: [['No', 0], ['Yes', 1]] },
  { key: 'cutdown', text: 'Have you felt you wanted to cut down on your drinking or drug use in the last year?',
    options: [['No', 0], ['Yes', 1]] },
];
const TICS_BANDS = [
  { max: 0, label: 'Negative screen', tone: 'chip-ok' },
  { max: 2, label: 'Positive screen', tone: 'chip-bad' },
];

const PHQ3_QUESTIONS = [
  { key: 'interest', text: 'Little interest or pleasure in doing things',
    options: [['Not at all', 0], ['Several days', 1], ['More than half the days', 2], ['Nearly every day', 3]] },
  { key: 'down', text: 'Feeling down, depressed, or hopeless',
    options: [['Not at all', 0], ['Several days', 1], ['More than half the days', 2], ['Nearly every day', 3]] },
  { key: 'selfHarm', text: 'Thoughts that you would be better off dead, or of hurting yourself',
    options: [['Not at all', 0], ['Several days', 1], ['More than half the days', 2], ['Nearly every day', 3]] },
];
const PHQ3_BANDS = [
  { max: 2, label: 'Minimal', tone: 'chip-ok' },
  { max: 5, label: 'Mild', tone: 'chip-warn' },
  { max: 9, label: 'Needs review', tone: 'chip-bad' },
];

function scoreBand(score, bands) {
  return bands.find(b => score <= b.max) || bands[bands.length - 1];
}

/* Audit C / TICS / PHQ3 are all the same shape — a short list of scored
   questions — so one component renders all three from data rather than
   three near-identical forms. */
function Questionnaire({ blurb, questions, bands, form, setForm }) {
  const total = questions.reduce((sum, q) => {
    const opt = q.options.find(([label]) => label === form[q.key]);
    return sum + (opt ? opt[1] : 0);
  }, 0);
  const answered = questions.filter(q => form[q.key]).length;
  const band = scoreBand(total, bands);
  return (
    <div className="col g-4">
      {blurb && <p className="t-sm subtle">{blurb}</p>}
      <div className="ps-grid is-embedded">
        <table>
          <thead><tr><th>Question</th><th>Response</th></tr></thead>
          <tbody>
            {questions.map(q => (
              <tr key={q.key}>
                <td className="t-sm wrap-cell">{q.text}</td>
                <td style={{ minWidth: 200 }}>
                  <select className="select" value={form[q.key] || ''}
                    onChange={e => setForm(f => ({ ...f, [q.key]: e.target.value }))}>
                    <option value="">Select…</option>
                    {q.options.map(([label]) => <option key={label}>{label}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="row g-3" style={{ alignItems: 'center' }}>
        <span className="t-sm"><b>Total score:</b> {answered ? total : <span className="subtle">—</span>}</span>
        {answered === questions.length && <span className={`chip ${band.tone}`}>{band.label}</span>}
        {answered > 0 && answered < questions.length && <span className="t-xs subtle">{answered} of {questions.length} answered</span>}
      </div>
    </div>
  );
}

/* Social Hx: its own inner tab strip (Social History / Audit C / TICS /
   PHQ3) with a Save alongside it, like the reference — each sub-tab is a
   simple form kept in local state, since (unlike Family Hx) there's one
   record per patient rather than a list feeding a grid below. */
function SocialHxPanel({ toast }) {
  const [subTab, setSubTab] = useState('Social History');
  const [social, setSocial] = useState(blankSocialForm);
  const [auditC, setAuditC] = useState({});
  const [tics, setTics] = useState({});
  const [phq3, setPhq3] = useState({});
  const setField = (key, patch) => setSocial(f => ({ ...f, [key]: { ...f[key], ...patch } }));

  const save = () => toast('Social history saved', subTab, 'ok');

  return (
    <div className="col g-4">
      <div className="row" style={{ alignItems: 'center' }}>
        <nav className="tabs" role="tablist" aria-label="Social history section">
          {SOCIAL_HX_TABS.map(t => (
            <button role="tab" key={t} aria-selected={subTab === t} onClick={() => setSubTab(t)}>{t}</button>
          ))}
        </nav>
        <span className="spacer" />
        <button className="btn btn-primary btn-sm" onClick={save}><Check size={14} /> Save</button>
      </div>

      {subTab === 'Social History' ? (
        <div className="ps-grid is-embedded">
          <table>
            <thead><tr><th>Field</th><th>Response</th><th>Confidential</th><th>Comment</th></tr></thead>
            <tbody>
              {SOCIAL_FIELDS.map(f => (
                <tr key={f.key}>
                  <td className="t-sm"><b>{f.label}</b></td>
                  <td style={{ minWidth: 180 }}>
                    <select className="select" value={social[f.key].value}
                      onChange={e => setField(f.key, { value: e.target.value })}>
                      <option value="">--Select--</option>
                      {f.options.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </td>
                  <td>
                    <span className="check" role="checkbox" aria-checked={social[f.key].confidential}
                      aria-label={`${f.label} confidential`}
                      onClick={() => setField(f.key, { confidential: !social[f.key].confidential })}>
                      <Check size={11} /></span>
                  </td>
                  <td style={{ minWidth: 220 }}>
                    <textarea className="textarea" rows={1} value={social[f.key].comment}
                      onChange={e => setField(f.key, { comment: e.target.value })} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : subTab === 'Audit C' ? (
        <Questionnaire blurb="Alcohol Use Disorders Identification Test — Consumption (AUDIT-C)."
          questions={AUDIT_C_QUESTIONS} bands={AUDIT_C_BANDS} form={auditC} setForm={setAuditC} />
      ) : subTab === 'TICS' ? (
        <Questionnaire blurb="Two-Item Conjoint Screen for alcohol and drug use."
          questions={TICS_QUESTIONS} bands={TICS_BANDS} form={tics} setForm={setTics} />
      ) : (
        <Questionnaire blurb="3-item patient health questionnaire (mood screen)."
          questions={PHQ3_QUESTIONS} bands={PHQ3_BANDS} form={phq3} setForm={setPhq3} />
      )}
    </div>
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
