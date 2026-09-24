import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, List, SquareKanban, Plus, Check, X, Search, Stethoscope,
  ReceiptText, Pencil, User, Rows3, Flame, Table2,
} from 'lucide-react';
import K from '../data/sample.js';
import { fmtTime, fmtLongDate, age, money, STATUS } from '../lib/format.js';
import { Chip, FunderChip, Avatar, Banner, Empty, Switch } from '../components/Primitives.jsx';
import { useUi, Modal } from '../lib/ui.jsx';
import { useTextScale } from '../lib/theme.js';

/* One hour of the day at 96px rather than a bare 60 at the default text
   size. Every pixel position in this file is minutes * pxPerMin, where
   pxPerMin is this base rate times the live --text-scale (see useTextScale)
   — never the bare constant. A card's box is sized in JS from real minutes,
   not from --fs-*, so if only the font grew under "Extra large text" and
   the box didn't, the now-taller text would spill into the next booking.
   The floor is set by the shortest appointment type (15 minutes) needing
   enough height for one full, un-clipped line of the product's own
   text-size floor (--fs-2xs) plus a visible gap to the next booking — go
   any smaller and the choice becomes "overlap" or "clip", not "compact". */
const PX_PER_MIN = 1.6;
const START_H = 8, END_H = 18, HOURS = END_H - START_H, NOW = 10 * 60 + 22;
const snap = m => Math.round(m / 5) * 5;
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const DATES = ['14 Sep', '15 Sep', '16 Sep', '17 Sep', '18 Sep'];
const hashDay = id => { let s = 0; for (const c of id) s += c.charCodeAt(0); return s % 5; };

export default function Appointments() {
  const { toast, open } = useUi();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [mode, setMode] = useState('day');
  const [view, setView] = useState('diary');
  const [clinic, setClinic] = useState('all');
  const [panel, setPanel] = useState(false);
  const [panelPt, setPanelPt] = useState(null);
  const [, force] = useState(0);
  const dragId = useRef(null);
  const scrollRef = useRef(null);
  const textScale = useTextScale();
  const pxPerMin = PX_PER_MIN * textScale;
  const top = m => (m - START_H * 60) * pxPerMin;

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, top(NOW) - 220); }, [mode]);
  useEffect(() => { if (sp.get('book')) { setPanel(true); sp.delete('book'); setSp(sp, { replace: true }); } }, [sp]);

  const cols = mode === 'week'
    ? DAYS.map((d, i) => ({ id: `d${i}`, title: d, sub: DATES[i], day: i }))
    : K.clinicians.filter(c => clinic === 'all' || K.appts.some(a => a.cl === c.id && a.clinic === clinic))
        .map(c => ({ id: c.id, title: c.name, sub: `${c.spec} · ${K.cln(K.appts.find(a => a.cl === c.id).clinic).short}` }));

  const apptsFor = col => mode === 'week'
    ? K.appts.filter(a => a.cl === 'u1' && hashDay(a.id) === col.day)
    : K.appts.filter(a => a.cl === col.id && (clinic === 'all' || a.clinic === clinic));

  const blocksFor = col => mode === 'week'
    ? K.blocks.filter(b => b.cl === 'u1' && hashDay(b.label) === col.day)
    : K.blocks.filter(b => b.cl === col.id && (clinic === 'all' || b.clinic === clinic));

  const openAppt = a => open(close => <ApptModal close={close} a={a} toast={toast} nav={nav} onDone={() => force(n => n + 1)} />);

  const tpl = `${68 * textScale}px repeat(${cols.length}, minmax(220px, 1fr))`;

  return (
    <div className={`cal-shell ${panel ? 'with-panel' : ''}`}>
      <div className="cal-main">
        <div className="cal-toolbar">
          <div className="row g-2">
            <button className="btn btn-secondary btn-icon btn-sm" aria-label="Previous"><ChevronLeft size={15} /></button>
            <button className="btn btn-secondary btn-sm">Today</button>
            <button className="btn btn-secondary btn-icon btn-sm" aria-label="Next"><ChevronRight size={15} /></button>
          </div>
          <div className="col" style={{ gap: 0 }}>
            <b className="t-h4">{mode === 'day' ? fmtLongDate(K.TODAY) : '14 – 18 September 2026'}</b>
            <span className="t-xs subtle">{mode === 'day'
              ? `${K.appts.length} appointments across ${K.clinicians.length} clinicians`
              : 'Week 38 · Dr Alice Fenwick'}</span>
          </div>
          <span className="spacer" />
          <div className="segmented" role="group" aria-label="Appointment view">
            <button aria-pressed={view === 'diary'} data-view="diary" onClick={() => setView('diary')}><Rows3 size={13} /> Diary</button>
            <button aria-pressed={view === 'heatmap'} data-view="heatmap" onClick={() => setView('heatmap')}><Flame size={13} /> Heat map</button>
            <button aria-pressed={view === 'grid'} data-view="grid" onClick={() => setView('grid')}><Table2 size={13} /> Grid view</button>
          </div>
          <div className="segmented" role="group" aria-label="Calendar range">
            <button aria-pressed={mode === 'day'} data-mode="day" onClick={() => setMode('day')}><List size={13} /> Day</button>
            <button aria-pressed={mode === 'week'} data-mode="week" onClick={() => setMode('week')}><SquareKanban size={13} /> Week</button>
          </div>
          <select className="select" style={{ maxWidth: 210 }} aria-label="Clinic location" value={clinic}
            onChange={e => setClinic(e.target.value)}>
            <option value="all">All locations</option>
            {K.clinics.map(c => <option value={c.id} key={c.id}>{c.short}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" data-act="book" onClick={() => setPanel(true)}><Plus size={14} /> Book</button>
        </div>

        <div className="row g-4 wrap" style={{ padding: '9px var(--s-5)', borderBottom: '1px solid var(--line)', background: 'var(--surface-2)' }}>
          {[['consult','New consultation'],['followup','Follow-up'],['acc','ACC review'],['procedure','Procedure'],['telehealth','Telehealth']]
            .map(([t, l]) => (
              <span className="row g-2 t-xs muted" key={t}>
                <i style={{ width: 9, height: 9, borderRadius: 2, background: `var(--appt-${t})` }} />{l}</span>
            ))}
          <span className="spacer" />
          <span className="t-xs subtle">Drag an appointment to reschedule it</span>
        </div>

        {view === 'heatmap' ? (
          <HeatMap mode={mode} clinic={clinic} openAppt={openAppt} />
        ) : view === 'grid' ? (
          <GridView mode={mode} clinic={clinic} openAppt={openAppt} />
        ) : (
        <div className="cal-scroll" ref={scrollRef}>
          <div className="cal-grid" style={{ gridTemplateColumns: tpl }}>
            <div className="cal-head" style={{ gridColumn: '1 / -1', gridTemplateColumns: tpl }}>
              <div className="cal-gutter" style={{ borderBottom: 0 }} />
              {cols.map(c => (
                <div className="cal-col-head" key={c.id}>
                  {mode === 'day' && <Avatar id={c.id} size="sm" />}
                  <span className="cal-col-head-text">
                    <b className="truncate">{c.title}</b><span className="truncate">{c.sub || ''}</span></span>
                </div>
              ))}
            </div>
            <div className="cal-gutter">
              {Array.from({ length: HOURS }).map((_, i) => (
                <div className="cal-hour-label" key={i}>{fmtTime((START_H + i) * 60)}</div>
              ))}
            </div>
            {cols.map(c => (
              <div className="cal-col" data-col={c.id} key={c.id} style={{ height: HOURS * 60 * pxPerMin }}
                onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDrop={e => {
                  e.preventDefault();
                  const a = K.appts.find(x => x.id === (dragId.current || e.dataTransfer.getData('text/plain')));
                  if (!a) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  const mins = snap(Math.max(0, (e.clientY - r.top) / pxPerMin) + START_H * 60);
                  const from = fmtTime(a.start);
                  a.start = Math.min(mins, END_H * 60 - K.at(a.type).mins);
                  if (mode === 'day' && K.st(c.id)) a.cl = c.id;
                  force(n => n + 1);
                  toast('Appointment moved', `${K.ptName(a.pt)} · ${from} → ${fmtTime(a.start)}`, 'ok');
                }}>
                {Array.from({ length: HOURS * 4 }).map((_, i) => (
                  <div className="cal-slot" key={i} />
                ))}
                {blocksFor(c).map((b, i) => (
                  <div className="blocked" key={i} style={{ top: top(b.start), height: b.mins * pxPerMin }}>{b.label}</div>
                ))}
                {apptsFor(c).map(a => {
                  const p = K.pt(a.pt), t = K.at(a.type);
                  const short = t.mins <= 20;
                  return (
                    <div className={`appt ${short ? 'is-compact' : ''}`} key={a.id} draggable data-appt={a.id} data-type={t.type} tabIndex={0}
                      role="button" aria-label={`${p.first} ${p.last}, ${fmtTime(a.start)}, ${t.name}`}
                      style={{ top: top(a.start), height: t.mins * pxPerMin - 5,
                        opacity: a.status === 'dna' ? .65 : a.status === 'done' ? .8 : 1 }}
                      onDragStart={e => { dragId.current = a.id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', a.id); }}
                      onClick={() => openAppt(a)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAppt(a); } }}>
                      <span className="appt-row">
                        <b className="truncate">{fmtTime(a.start)} {p.first} {p.last}</b>
                        {a.status !== 'booked' && <Chip status={a.status} />}
                      </span>
                      {!short && <span className="appt-meta truncate">{t.name} · {p.nhi}</span>}
                    </div>
                  );
                })}
                {mode === 'day' && <div className="cal-now" style={{ top: top(NOW) }} />}
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {panel && (
        <BookingPanel ptId={panelPt} setPtId={setPanelPt} onClose={() => { setPanel(false); setPanelPt(null); }}
          onBook={(p, t, mins) => {
            K.appts.push({ id: 'new' + Date.now(), pt: p.id, cl: 'u1', clinic: 'c1', start: mins,
              type: t.id, status: 'booked', note: t.name, invoiced: false });
            setPanel(false); setPanelPt(null); force(n => n + 1);
            toast('Appointment booked', `${p.first} ${p.last} · ${fmtTime(mins)} · ${t.name}`, 'ok');
          }} toast={toast} />
      )}
    </div>
  );
}

/* One compressed row per clinician, coloured by appointment type (the same
   legend as the diary strip above), so the whole day or week reads at a
   glance without opening each clinician's own column. Blocks are the real
   appointments, positioned by minute the same way the diary cards are, just
   laid out left-to-right instead of top-to-bottom. */
function HeatMap({ mode, clinic, openAppt }) {
  const START = START_H * 60, END = END_H * 60, SPAN = END - START;
  const rows = K.clinicians.filter(c => clinic === 'all' || K.appts.some(a => a.cl === c.id && a.clinic === clinic));

  const Block = ({ a }) => {
    const p = K.pt(a.pt), t = K.at(a.type);
    const left = ((Math.max(START, a.start) - START) / SPAN) * 100;
    const width = Math.max(mode === 'week' ? 7 : 1.4, (t.mins / SPAN) * 100);
    const st = STATUS[a.status] || {};
    return (
      <button type="button" className="heatmap-block" data-type={t.type}
        style={{ left: `${left}%`, width: `${width}%`, background: `var(--appt-${t.type})`,
          opacity: a.status === 'dna' ? .5 : a.status === 'done' ? .68 : 1 }}
        title={`${p.first} ${p.last} · ${fmtTime(a.start)} · ${t.name}${a.status !== 'booked' ? ` · ${st.label}` : ''}`}
        onClick={() => openAppt(a)} />
    );
  };

  if (!rows.length) {
    return <Empty icon={<Flame size={22} />} title="Nothing to show"
      body="No clinicians have appointments at this location today." />;
  }

  if (mode === 'week') {
    return (
      <div className="heatmap-wrap">
        <div className="heatmap-row heatmap-ruler">
          <div className="heatmap-who" aria-hidden="true" />
          <div className="heatmap-days">
            {DAYS.map((d, i) => (
              <div className="heatmap-daylabel" key={d}>{d} <span className="subtle">{DATES[i]}</span></div>
            ))}
          </div>
        </div>
        {rows.map(c => (
          <div className="heatmap-row" key={c.id}>
            <div className="heatmap-who">
              <Avatar id={c.id} size="sm" />
              <span className="truncate t-sm"><b className="truncate">{c.name}</b></span>
            </div>
            <div className="heatmap-days">
              {DAYS.map((d, i) => (
                <div className="heatmap-track heatmap-track-day" key={d}>
                  {K.appts.filter(a => a.cl === c.id && hashDay(a.id) === i && (clinic === 'all' || a.clinic === clinic))
                    .map(a => <Block a={a} key={a.id} />)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="heatmap-wrap">
      <div className="heatmap-row heatmap-ruler">
        <div className="heatmap-who" aria-hidden="true" />
        <div className="heatmap-track heatmap-ruler-track" style={{ gridTemplateColumns: `repeat(${HOURS}, 1fr)` }}>
          {Array.from({ length: HOURS }).map((_, i) => (
            <span className="heatmap-tick" key={i}>{fmtTime((START_H + i) * 60)}</span>
          ))}
        </div>
      </div>
      {rows.map(c => (
        <div className="heatmap-row" key={c.id}>
          <div className="heatmap-who">
            <Avatar id={c.id} size="sm" />
            <span className="truncate t-sm"><b className="truncate">{c.name}</b></span>
          </div>
          <div className="heatmap-track">
            {K.appts.filter(a => a.cl === c.id && (clinic === 'all' || a.clinic === clinic)).map(a => <Block a={a} key={a.id} />)}
            <div className="heatmap-now" style={{ left: `${((NOW - START) / SPAN) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Every appointment as one sortable row, for scanning or exporting rather
   than for placement in time. Reuses the same sortable-grid pattern (and its
   CSS) as the Patients list, and the same row-click-opens-the-modal
   behaviour as the diary and the heat map. */
function GridView({ mode, clinic, openAppt }) {
  const [sort, setSort] = useState({ k: 'start', dir: 1 });

  const rows = (mode === 'week'
    ? K.clinicians.flatMap(c => K.appts.filter(a => a.cl === c.id && (clinic === 'all' || a.clinic === clinic))
        .map(a => ({ a, day: hashDay(a.id) })))
    : K.appts.filter(a => clinic === 'all' || a.clinic === clinic).map(a => ({ a, day: null }))
  ).map(({ a, day }) => ({ a, day, p: K.pt(a.pt), t: K.at(a.type), cl: K.st(a.cl) }));

  const COLS = [
    ...(mode === 'week' ? [{ k: 'day', label: 'Day', sort: true }] : []),
    { k: 'start', label: 'Time', sort: true },
    { k: 'patient', label: 'Patient', sort: true },
    { k: 'nhi', label: 'NHI' },
    { k: 'clinician', label: 'Clinician', sort: true },
    { k: 'type', label: 'Type' },
    { k: 'status', label: 'Status', sort: true },
    { k: 'location', label: 'Location' },
  ];
  const CMP = {
    day: (x, y) => x.day - y.day || x.a.start - y.a.start,
    start: (x, y) => (x.day ?? 0) - (y.day ?? 0) || x.a.start - y.a.start,
    patient: (x, y) => `${x.p.last} ${x.p.first}`.localeCompare(`${y.p.last} ${y.p.first}`),
    clinician: (x, y) => x.cl.name.localeCompare(y.cl.name),
    status: (x, y) => x.a.status.localeCompare(y.a.status),
  };
  const sorted = [...rows].sort((x, y) => (CMP[sort.k] || CMP.start)(x, y) * sort.dir);

  if (!sorted.length) {
    return <Empty icon={<Table2 size={22} />} title="Nothing booked"
      body="No appointments match this location yet." />;
  }

  return (
    <div className="ps-grid">
      <table>
        <thead><tr>
          {COLS.map(c => {
            const active = c.sort && sort.k === c.k;
            return (
              <th key={c.k} className={c.sort ? 'sortable' : ''} data-sort={c.sort ? c.k : undefined}
                aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                onClick={c.sort ? () => setSort(s => s.k === c.k ? { k: c.k, dir: -s.dir } : { k: c.k, dir: 1 }) : undefined}>
                {c.label}{c.sort && <span className="sort-ind">{active ? (sort.dir === 1 ? '↑' : '↓') : '↕'}</span>}
              </th>
            );
          })}
        </tr></thead>
        <tbody>
          {sorted.map(({ a, day, p, t, cl }) => (
            <tr key={a.id} tabIndex={0} onClick={() => openAppt(a)}
              onKeyDown={e => { if (e.key === 'Enter') openAppt(a); }}>
              {mode === 'week' && <td className="t-xs">{DAYS[day]} <span className="subtle">{DATES[day]}</span></td>}
              <td className="t-mono t-sm">{fmtTime(a.start)}</td>
              <td><span className="row g-2"><Avatar id={p.id} size="xs" /><b className="t-sm">{p.first} {p.last}</b></span></td>
              <td className="t-mono t-xs subtle">{p.nhi}</td>
              <td className="t-xs">{cl.name}</td>
              <td className="t-xs">{t.name}</td>
              <td>{a.status === 'booked' ? <span className="t-xs subtle">Booked</span> : <Chip status={a.status} />}</td>
              <td className="t-xs subtle">{K.cln(a.clinic).short}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BookingPanel({ ptId, setPtId, onClose, onBook, toast }) {
  const [q, setQ] = useState('');
  const [typeId, setTypeId] = useState('t1');
  const [time, setTime] = useState('11:00');
  const [note, setNote] = useState('');
  const p = ptId ? K.pt(ptId) : null;
  const hits = q.trim() ? K.patients.filter(x =>
    `${x.first} ${x.last} ${x.nhi} ${x.phone}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];

  return (
    <aside className="cal-panel" aria-label="Book appointment">
      <div className="drawer-hd">
        <div className="grow"><h3 className="t-h4">New booking</h3>
          <p className="t-xs muted">Thu 17 Sep 2026 · Newmarket</p></div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><X size={15} /></button>
      </div>
      <div className="drawer-bd col g-5">
        <div className="field"><label className="label" htmlFor="bkPt">Patient <span className="req">*</span></label>
          {p ? (
            <div className="row g-3 card card-flat" style={{ padding: '10px 12px' }}>
              <Avatar id={p.id} size="sm" />
              <span className="grow"><b className="t-sm">{p.first} {p.last}</b>
                <span className="t-xs subtle" style={{ display: 'block' }}>{p.nhi} · {age(p.dob)}y</span></span>
              <FunderChip funder={p.funder} />
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setPtId(null)} aria-label="Change patient"><X size={14} /></button>
            </div>
          ) : (
            <div className="input-group"><span className="ic-lead"><Search size={15} /></span>
              <input className="input" id="bkPt" value={q} placeholder="Name, NHI or phone…" autoComplete="off"
                onChange={e => setQ(e.target.value)} />
              {q.trim() && (
                <div className="search-results">
                  {hits.length ? hits.map(x => (
                    <button className="search-hit" key={x.id} data-pick={x.id} onMouseDown={() => { setPtId(x.id); setQ(''); }}>
                      <Avatar id={x.id} size="sm" />
                      <span className="hit-main"><b>{x.first} {x.last}</b>
                        <span>{x.nhi} · {age(x.dob)}y</span></span>
                      <FunderChip funder={x.funder} />
                    </button>
                  )) : <div className="empty" style={{ padding: 22 }}><h4 className="t-sm">No match</h4></div>}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="field"><label className="label" htmlFor="bkType">Appointment type <span className="req">*</span></label>
          <select className="select" id="bkType" value={typeId} onChange={e => setTypeId(e.target.value)}>
            {K.apptTypes.map(t => <option value={t.id} key={t.id}>{t.name}, {t.mins} min · {t.price ? money(t.price) : 'No charge'}</option>)}
          </select></div>
        <div className="field"><label className="label" htmlFor="bkTime">Start time</label>
          <input className="input" id="bkTime" type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
        <div className="field"><label className="label">Available today</label>
          <div className="row g-2 wrap">
            {['11:00', '11:45', '13:00', '14:30', '16:45'].map((t, i) => (
              <button key={t} className={`btn btn-sm ${time === t ? 'btn-soft' : 'btn-secondary'}`}
                onClick={() => setTime(t)}>{fmtTime(Number(t.split(':')[0]) * 60 + Number(t.split(':')[1]))}</button>
            ))}
          </div></div>
        <div className="field"><label className="label" htmlFor="bkNote">Booking note</label>
          <textarea className="textarea" id="bkNote" rows={3} value={note} onChange={e => setNote(e.target.value)}
            placeholder="Reason for visit, interpreter needs, mobility…" /></div>
      </div>
      <div className="drawer-ft">
        <button className="btn btn-ghost grow" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary grow" data-act="confirmbook" onClick={() => {
          if (!p) { toast('Choose a patient first', 'Search by name, NHI or phone number.', 'warn'); return; }
          const [h, m] = time.split(':').map(Number);
          onBook(p, K.at(typeId), h * 60 + m);
        }}><Check size={15} /> Book appointment</button>
      </div>
    </aside>
  );
}

function ApptModal({ close, a, toast, nav, onDone }) {
  const p = K.pt(a.pt), t = K.at(a.type), cl = K.st(a.cl);
  return (
    <Modal title={`${p.first} ${p.last}`}
      sub={`${fmtTime(a.start)} – ${fmtTime(a.start + t.mins)} · ${t.name} · ${cl.name}`} onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={() => { close(); toast('Cancellation', 'A reason is required before cancelling.', 'warn'); }}>
          <X size={14} /> Cancel booking</button>
        <span className="spacer" />
        <button className="btn btn-secondary" onClick={() => { close(); nav(`/patient/${p.id}`); }}><User size={15} /> Open patient</button>
        <button className="btn btn-primary" onClick={() => { close(); nav('/billing?create=1'); }}><ReceiptText size={15} /> Invoice</button>
      </>}>
      <div className="col g-4">
        <div className="row g-3 wrap"><Chip status={a.status} lg /><FunderChip funder={p.funder} /></div>
        <dl className="kv">
          <dt>NHI</dt><dd className="t-mono">{p.nhi}</dd>
          <dt>Date of birth</dt><dd>{age(p.dob)} years</dd>
          <dt>Location</dt><dd>{K.cln(a.clinic).name}</dd>
          <dt>Reason</dt><dd>{a.note}</dd>
          <dt>Fee</dt><dd>{t.price ? `${money(t.price)} + GST` : 'No charge (ACC funded)'}</dd>
        </dl>
        <div className="divider" />
        <span className="t-eyebrow">Quick actions</span>
        <div className="row g-2 wrap">
          {[['arrived', 'Arrived', 'btn-soft'], ['consult', 'In consult', 'btn-secondary'],
            ['done', 'Done', 'btn-secondary'], ['dna', 'DNA', 'btn-danger']].map(([s, l, cls]) => (
            <button className={`btn ${cls} btn-sm`} key={s} data-s={s} onClick={() => {
              a.status = s; close(); onDone();
              toast(`Marked as ${l.toLowerCase()}`, `${p.first} ${p.last} · ${fmtTime(a.start)}`, s === 'dna' ? 'warn' : 'ok');
            }}>{l}</button>
          ))}
        </div>
      </div>
    </Modal>
  );
}
