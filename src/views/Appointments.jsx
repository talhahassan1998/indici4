import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, List, SquareKanban, Plus, Check, X, Search, Stethoscope,
  ReceiptText, Pencil, User,
} from 'lucide-react';
import K from '../data/sample.js';
import { fmtTime, fmtLongDate, age, money } from '../lib/format.js';
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
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const startOfWeek = d => addDays(d, -((d.getDay() + 6) % 7)); // Monday

/* The month picker from the reference, cut down to just that: no calendar
   list, no "Add calendar" — one grid of days, this month's arrows, today
   and the visible week picked out. Clicking a day moves the toolbar's own
   date; the appointments themselves don't change with it, because this
   demo's data models one week, not a real multi-week calendar backend. */
function MiniCalendar({ cursor, viewDate, weekMode, onCursorShift, onPick }) {
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startPad = (first.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startPad + daysInMonth) / 7) * 7 }, (_, i) => {
    const day = i - startPad + 1;
    return day >= 1 && day <= daysInMonth ? new Date(year, month, day) : null;
  });
  const weekStart = startOfWeek(viewDate), weekEnd = addDays(weekStart, 4);
  const inVisibleWeek = d => weekMode && d >= weekStart && d <= weekEnd;
  return (
    <div className="mini-cal">
      <div className="mini-cal-hd">
        <b>{cursor.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}</b>
        <span className="row g-1">
          <button className="btn btn-ghost btn-icon btn-xs" onClick={() => onCursorShift(-1)} aria-label="Previous month"><ChevronLeft size={14} /></button>
          <button className="btn btn-ghost btn-icon btn-xs" onClick={() => onCursorShift(1)} aria-label="Next month"><ChevronRight size={14} /></button>
        </span>
      </div>
      <div className="mini-cal-dow">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
      <div className="mini-cal-grid">
        {cells.map((d, i) => (
          <button key={i} className={`mini-cal-day ${!d ? 'is-out' : ''}
              ${d && sameDay(d, K.TODAY) ? 'is-today' : ''}
              ${d && sameDay(d, viewDate) ? 'is-selected' : ''}
              ${d && inVisibleWeek(d) ? 'in-week' : ''}`}
            disabled={!d} tabIndex={d ? 0 : -1}
            onClick={() => d && onPick(d)}>{d ? d.getDate() : ''}</button>
        ))}
      </div>
    </div>
  );
}

export default function Appointments() {
  const { toast, open } = useUi();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const [mode, setMode] = useState('day');
  const [clinic, setClinic] = useState('all');
  const [panel, setPanel] = useState(false);
  const [panelPt, setPanelPt] = useState(null);
  const [, force] = useState(0);
  const [viewDate, setViewDate] = useState(K.TODAY);
  const [calCursor, setCalCursor] = useState(K.TODAY);
  const dragId = useRef(null);
  const scrollRef = useRef(null);
  const textScale = useTextScale();
  const pxPerMin = PX_PER_MIN * textScale;
  const top = m => (m - START_H * 60) * pxPerMin;

  const pickDate = d => { setViewDate(d); setCalCursor(d); };
  const shiftView = n => pickDate(addDays(viewDate, mode === 'week' ? n * 7 : n));

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
  const weekStart = startOfWeek(viewDate), weekEnd = addDays(weekStart, 4);

  return (
    <div className={`cal-shell ${panel ? 'with-panel' : ''}`}>
      <aside className="cal-sidebar">
        <MiniCalendar cursor={calCursor} viewDate={viewDate} weekMode={mode === 'week'}
          onCursorShift={n => setCalCursor(d => new Date(d.getFullYear(), d.getMonth() + n, 1))}
          onPick={pickDate} />
      </aside>
      <div className="cal-main">
        <div className="cal-toolbar">
          <div className="row g-2">
            <button className="btn btn-secondary btn-icon btn-sm" aria-label="Previous" onClick={() => shiftView(-1)}><ChevronLeft size={15} /></button>
            <button className="btn btn-secondary btn-sm" onClick={() => pickDate(K.TODAY)}>Today</button>
            <button className="btn btn-secondary btn-icon btn-sm" aria-label="Next" onClick={() => shiftView(1)}><ChevronRight size={15} /></button>
          </div>
          <div className="col" style={{ gap: 0 }}>
            <b className="t-h4">{mode === 'day' ? fmtLongDate(viewDate)
              : `${weekStart.getDate()} – ${weekEnd.getDate()} ${weekEnd.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}`}</b>
            <span className="t-xs subtle">{mode === 'day'
              ? `${K.appts.length} appointments across ${K.clinicians.length} clinicians`
              : 'Dr Alice Fenwick'}</span>
          </div>
          <span className="spacer" />
          <div className="segmented" role="group" aria-label="Calendar view">
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
                {Array.from({ length: HOURS * 2 }).map((_, i) => (
                  <div className={`cal-slot ${i % 2 ? 'half' : ''}`} key={i} />
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
