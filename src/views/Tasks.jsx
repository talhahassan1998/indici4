import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SquareKanban, List, Plus, Clock, Check, User } from 'lucide-react';
import K from '../data/sample.js';
import { fmtDate, fmtDateShort, daysOverdue } from '../lib/format.js';
import { Chip, Avatar, Empty } from '../components/Primitives.jsx';
import { useUi, Modal } from '../lib/ui.jsx';

const COLS = [
  { id: 'todo', label: 'To do', tone: '' },
  { id: 'doing', label: 'In progress', tone: 'chip-warn' },
  { id: 'done', label: 'Done', tone: 'chip-ok' },
];

export default function Tasks() {
  const { toast, open } = useUi();
  const [sp, setSp] = useSearchParams();
  const [mode, setMode] = useState('board');
  const [who, setWho] = useState('all');
  const [, force] = useState(0);
  const dragId = useRef(null);

  const list = K.tasks.filter(t => who === 'all' || t.who === who);
  const overdue = list.filter(t => t.col !== 'done' && daysOverdue(t.due) > 0).length;

  const newTask = ptId => open(close => <NewTask close={close} ptId={ptId} toast={toast} onDone={() => force(n => n + 1)} />);
  useEffect(() => { if (sp.get('new')) { sp.delete('new'); setSp(sp, { replace: true }); newTask(); } }, [sp]);

  return (
    <div className="page">
      <div className="page-hd">
        <div className="page-title"><h1>Tasks</h1>
          <span className="page-sub">{list.filter(t => t.col !== 'done').length} open
            {overdue > 0 && <> · <span className="bad-t">{overdue} overdue</span></>}</span></div>
        <div className="page-actions">
          <div className="segmented" role="group" aria-label="View">
            <button aria-pressed={mode === 'board'} onClick={() => setMode('board')}><SquareKanban size={13} /> Board</button>
            <button aria-pressed={mode === 'list'} onClick={() => setMode('list')}><List size={13} /> List</button>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => newTask()}><Plus size={14} /> New task</button>
        </div>
      </div>

      <div className="toolbar">
        <span className="t-eyebrow">Assignee</span>
        <div className="pill-nav" role="group" aria-label="Filter by assignee">
          <button aria-pressed={who === 'all'} onClick={() => setWho('all')}>Everyone</button>
          {K.staff.filter(s => K.tasks.some(t => t.who === s.id)).map(s => (
            <button key={s.id} aria-pressed={who === s.id} onClick={() => setWho(s.id)}>{s.name.split(' ')[0]}</button>
          ))}
        </div>
        <span className="spacer" />
        <span className="t-xs subtle">Drag cards between columns to change status</span>
      </div>

      {mode === 'board' ? (
        <div className="kanban">
          {COLS.map(c => {
            const items = list.filter(t => t.col === c.id);
            return (
              <div className="kb-col" data-col={c.id} key={c.id}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }}
                onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
                onDrop={e => {
                  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
                  const t = K.tasks.find(x => x.id === dragId.current);
                  if (!t) return;
                  const from = t.col; t.col = c.id; force(n => n + 1);
                  if (from !== c.id) toast('Task moved', `${t.title} → ${c.label}`, c.id === 'done' ? 'ok' : 'info');
                }}>
                <div className="kb-hd"><b>{c.label}</b><span className={`chip ${c.tone}`}>{items.length}</span>
                  <span className="spacer" />
                  <button className="btn btn-ghost btn-icon btn-sm" aria-label={`Add to ${c.label}`} onClick={() => newTask()}><Plus size={14} /></button></div>
                <div className="kb-cards">
                  {items.length ? items.map(t => {
                    const p = t.pt ? K.pt(t.pt) : null;
                    const od = t.col !== 'done' && daysOverdue(t.due) > 0;
                    return (
                      <div className="kb-card" key={t.id} draggable data-task={t.id} tabIndex={0} role="button"
                        onDragStart={() => { dragId.current = t.id; }}>
                        <div className="row between g-2 mb-2">
                          <span className={`chip ${t.pri === 'high' ? 'chip-bad' : t.pri === 'low' ? '' : 'chip-warm'}`}>{t.tag}</span>
                          {t.col === 'done' && <span className="ok-t"><Check size={15} /></span>}
                        </div>
                        <div className="kb-title">{t.title}</div>
                        {p && <div className="kb-pt mt-2"><User size={12} /> {p.first} {p.last}</div>}
                        <div className="row between mt-3">
                          <span className="row g-2"><Avatar id={t.who} size="xs" />
                            <span className="t-xs subtle">{K.st(t.who).name.split(' ')[0]}</span></span>
                          <span className={`chip ${od ? 'chip-bad' : ''}`}><Clock size={11} /> {od ? `${daysOverdue(t.due)}d late` : fmtDateShort(t.due)}</span>
                        </div>
                      </div>
                    );
                  }) : <div className="empty" style={{ padding: '26px 12px' }}><p className="t-xs">Nothing here.</p></div>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <section className="card"><div className="table-wrap"><table className="tbl">
          <thead><tr><th style={{ width: 38 }} /><th>Task</th><th>Patient</th><th>Assignee</th>
            <th>Tag</th><th>Due</th><th>Status</th></tr></thead>
          <tbody>{list.map(t => {
            const p = t.pt ? K.pt(t.pt) : null;
            const od = t.col !== 'done' && daysOverdue(t.due) > 0;
            return (
              <tr key={t.id}>
                <td><span className="check" role="checkbox" aria-checked={t.col === 'done'}
                  onClick={() => { t.col = t.col === 'done' ? 'todo' : 'done'; force(n => n + 1); }}><Check size={11} /></span></td>
                <td><b className={`t-sm ${t.col === 'done' ? 'subtle' : ''}`}
                  style={t.col === 'done' ? { textDecoration: 'line-through' } : undefined}>{t.title}</b></td>
                <td className="t-sm">{p ? `${p.first} ${p.last}` : <span className="subtle">—</span>}</td>
                <td><span className="row g-2"><Avatar id={t.who} size="xs" /><span className="t-sm">{K.st(t.who).name}</span></span></td>
                <td><span className="chip">{t.tag}</span></td>
                <td className={`t-sm ${od ? 'bad-t' : ''}`}>{fmtDate(t.due)}</td>
                <td><Chip status={t.col} /></td>
              </tr>
            );
          })}</tbody></table></div></section>
      )}
    </div>
  );
}

function NewTask({ close, ptId, toast, onDone }) {
  const [title, setTitle] = useState('');
  const [who, setWho] = useState('u5');
  const [due, setDue] = useState('2026-09-18');
  const [pt, setPt] = useState(ptId || '');
  const [tag, setTag] = useState('Imaging');
  const [pri, setPri] = useState('normal');
  return (
    <Modal title="New task" sub="Assign work to yourself or a colleague" icon={<SquareKanban size={15} />} onClose={close}
      footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button>
        <button className="btn btn-primary" data-go onClick={() => {
          if (!title.trim()) { toast('Give the task a name', 'A short description is enough.', 'warn'); return; }
          K.tasks.unshift({ id: 'k' + Date.now(), title: title.trim(), pt: pt || null, who, due, col: 'todo', pri, tag });
          close(); onDone(); toast('Task created', title.trim(), 'ok');
        }}><Plus size={15} /> Create task</button></>}>
      <div className="col g-4">
        <div className="field"><label className="label" htmlFor="tkTitle">What needs doing? <span className="req">*</span></label>
          <input className="input" id="tkTitle" value={title} placeholder="e.g. Chase MRI report"
            onChange={e => setTitle(e.target.value)} /></div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="field"><label className="label" htmlFor="tkWho">Assign to</label>
            <select className="select" id="tkWho" value={who} onChange={e => setWho(e.target.value)}>
              {K.staff.map(s => <option value={s.id} key={s.id}>{s.name} — {s.role}</option>)}</select></div>
          <div className="field"><label className="label" htmlFor="tkDue">Due</label>
            <input className="input" id="tkDue" type="date" value={due} onChange={e => setDue(e.target.value)} /></div>
        </div>
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="field"><label className="label" htmlFor="tkPt">Link to patient</label>
            <select className="select" id="tkPt" value={pt} onChange={e => setPt(e.target.value)}>
              <option value="">No patient</option>
              {K.patients.slice(0, 20).map(p => <option value={p.id} key={p.id}>{p.first} {p.last} — {p.nhi}</option>)}</select></div>
          <div className="field"><label className="label" htmlFor="tkTag">Tag</label>
            <select className="select" id="tkTag" value={tag} onChange={e => setTag(e.target.value)}>
              {['Imaging', 'ACC', 'Theatre', 'Billing', 'Letters', 'Admin', 'Clinical', 'Recall'].map(x => <option key={x}>{x}</option>)}</select></div>
        </div>
        <div className="field"><label className="label">Priority</label>
          <div className="segmented">{['low', 'normal', 'high'].map(x => (
            <button key={x} aria-pressed={pri === x} onClick={() => setPri(x)}>{x}</button>))}</div></div>
      </div>
    </Modal>
  );
}
