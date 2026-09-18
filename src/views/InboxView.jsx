import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Inbox, Mail, FlaskConical, Share2, Send, Check, Filter, RefreshCw, SquareCheckBig, Printer, ChevronRight, Clock, TriangleAlert } from 'lucide-react';
import K from '../data/sample.js';
import { relTime, fmtDate, fmtClock, age } from '../lib/format.js';
import { Chip, FunderChip, Avatar, Banner, Empty } from '../components/Primitives.jsx';
import { useUi } from '../lib/ui.jsx';

const FOLDERS = [
  { id: 'all', label: 'All', Icon: Inbox },
  { id: 'approval', label: 'Letters to approve', Icon: Mail },
  { id: 'result', label: 'Results', Icon: FlaskConical },
  { id: 'referral', label: 'Referrals in', Icon: Share2 },
  { id: 'message', label: 'Messages', Icon: Send },
];
const KIND_ICON = { approval: Mail, result: FlaskConical, referral: Share2, message: Send };

export default function InboxView() {
  const { toast } = useUi();
  const nav = useNavigate();
  const [folder, setFolder] = useState('all');
  const [sel, setSel] = useState(K.inbox[0]?.id);
  const [, force] = useState(0);

  const items = K.inbox.filter(i => folder === 'all' || i.kind === folder);
  const cur = K.inbox.find(i => i.id === sel) || items[0];
  const count = k => K.inbox.filter(i => (k === 'all' || i.kind === k) && i.unread).length;

  const clear = () => {
    const i = K.inbox.findIndex(x => x.id === cur.id);
    if (i > -1) K.inbox.splice(i, 1);
    const rest = K.inbox.filter(x => folder === 'all' || x.kind === folder);
    setSel(rest[0]?.id); force(n => n + 1);
  };

  return (
    <div className="inbox-shell">
      <nav className="inbox-nav" aria-label="Inbox folders">
        <div className="subnav">
          {FOLDERS.map(f => (
            <button key={f.id} data-folder={f.id} aria-selected={folder === f.id}
              onClick={() => { setFolder(f.id); const l = K.inbox.filter(i => f.id === 'all' || i.kind === f.id); setSel(l[0]?.id); }}>
              <f.Icon size={16} /><span className="grow">{f.label}</span>
              {count(f.id) > 0 && <span className="badge-count">{count(f.id)}</span>}
            </button>
          ))}
        </div>
        <div className="divider mt-4 mb-3" />
        <div className="nav-group-label">Approval queue</div>
        <div className="card card-flat card-bd col g-3" style={{ margin: '0 6px' }}>
          <span className="t-eyebrow">Waiting on you</span>
          <span className="t-metric">{K.letters.filter(l => l.status === 'pending').length}</span>
          <span className="t-xs subtle">Oldest has been waiting 18 hours</span>
          <button className="btn btn-primary btn-sm btn-block" data-act="approveall"
            onClick={() => { setFolder('approval'); const l = K.inbox.filter(i => i.kind === 'approval'); setSel(l[0]?.id); }}>
            <Check size={14} /> Review queue</button>
        </div>
      </nav>

      <div className="inbox-list" aria-label="Messages">
        <div className="ed-bar">
          <b className="t-sm">{FOLDERS.find(f => f.id === folder).label}</b>
          <span className="chip">{items.length}</span><span className="spacer" />
          <button className="btn btn-ghost btn-icon btn-sm tip" data-tip="Filter" aria-label="Filter"><Filter size={15} /></button>
        </div>
        {items.length ? items.map(i => {
          const p = K.pt(i.pt), Icon = KIND_ICON[i.kind];
          return (
            <button className={`inbox-item ${i.unread ? 'unread' : ''}`} key={i.id} data-item={i.id}
              aria-selected={sel === i.id} onClick={() => { i.unread = false; setSel(i.id); force(n => n + 1); }}>
              <span className="work-ic" style={{ background: i.pri === 'high' ? 'var(--bad-bg)' : 'var(--accent-soft)',
                color: i.pri === 'high' ? 'var(--bad-fg)' : 'var(--accent-text)' }}><Icon size={15} /></span>
              <span className="grow" style={{ minWidth: 0 }}>
                <span className="row between g-2"><b className="t-sm truncate">{i.from}</b>
                  <span className="t-xs subtle">{relTime(i.at)}</span></span>
                <span className="t-sm truncate" style={{ display: 'block' }}>{i.subj}</span>
                <span className="row g-2 mt-2"><span className="chip">{p.first} {p.last}</span>
                  {i.pri === 'high' && <span className="chip chip-bad">Urgent</span>}</span>
              </span>
            </button>
          );
        }) : <Empty icon={<Inbox size={22} />} title="Nothing here" body="This folder is clear." />}
      </div>

      <div className="inbox-preview">
        {cur ? <Preview item={cur} toast={toast} nav={nav} onClear={clear} /> :
          <Empty icon={<Inbox size={22} />} title="Nothing selected" body="Choose an item on the left to preview it." />}
      </div>
    </div>
  );
}

function Preview({ item, toast, nav, onClear }) {
  const p = K.pt(item.pt);
  const l = item.letter ? K.ltr(item.letter) : null;
  const Icon = KIND_ICON[item.kind];
  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <section className="card">
        <div className="card-hd">
          <span className={`stat-ic ${item.pri === 'high' ? 'bad' : ''}`}><Icon size={15} /></span>
          <div className="grow"><h3>{item.subj}</h3>
            <span className="t-xs subtle">{item.from} · {fmtDate(item.at.slice(0, 10))} {fmtClock(item.at)}</span></div>
          {item.pri === 'high' && <Chip status="overdue" label="Urgent" />}
        </div>
        <div className="card-bd col g-4">
          <a className="row g-3 card card-flat" style={{ padding: 12, textDecoration: 'none', color: 'inherit' }}
            href={`#/patient/${p.id}`}>
            <Avatar id={p.id} size="lg" />
            <span className="grow"><b>{p.first} {p.last}</b>
              <span className="t-xs subtle" style={{ display: 'block' }}>{p.nhi} · {age(p.dob)}y · GP {K.gp(p.gp).name}</span></span>
            <FunderChip funder={p.funder} />
            <ChevronRight size={16} className="subtle" />
          </a>

          {item.kind === 'approval' && l && (
            <>
              <Banner tone="warn" icon={<Clock size={15} />}>
                <span className="t-sm"><b>Waiting for your approval.</b> Typed by {K.st(l.typedBy).name}, {relTime(l.updated)}.</span>
              </Banner>
              <div className="card card-flat" style={{ background: '#fff', color: '#151B18', padding: '26px 30px', fontSize: 13, lineHeight: 1.7 }}>
                <div style={{ borderBottom: '2px solid #1E4A34', paddingBottom: 10, marginBottom: 18, display: 'flex', justifyContent: 'space-between' }}>
                  <b style={{ color: '#1E4A34', fontSize: 15 }}>Kora Health</b>
                  <span style={{ fontSize: 10, color: '#4E5852' }}>{fmtDate(K.TODAY)}</span></div>
                <p><b>Re: {p.first} {p.last}, NHI {p.nhi}</b></p>
                <p style={{ marginTop: 10 }}>Dear {K.gp(l.to).name},</p>
                <p style={{ marginTop: 10 }}>Thank you for referring {p.first}, whom I reviewed in clinic. The history,
                  examination findings and management plan are set out below…</p>
              </div>
            </>
          )}

          {item.kind === 'result' && (
            <div className="card card-flat card-bd col g-3">
              <div className="row between"><span className="t-eyebrow">Result</span>
                {item.pri === 'high' ? <Chip status="overdue" label="Abnormal" /> : <Chip status="approved" label="Within range" />}</div>
              <dl className="kv"><dt>Reported by</dt><dd>{item.from}</dd>
                <dt>Collected</dt><dd>{fmtDate(item.at.slice(0, 10))}</dd></dl>
              <div className="divider" /><p className="t-sm">{item.subj}</p>
              {item.pri === 'high' && <Banner tone="bad" icon={<TriangleAlert size={15} />}>
                <span className="t-sm">Flagged abnormal by the lab. Acknowledge and decide on follow-up.</span></Banner>}
            </div>
          )}

          {(item.kind === 'referral' || item.kind === 'message') && (
            <div className="card card-flat card-bd"><p className="t-sm">{item.subj}</p>
              <p className="t-xs subtle mt-3">From {item.from} · {relTime(item.at)}</p></div>
          )}
        </div>
        <div className="card-ft row g-2 wrap">
          {item.kind === 'approval' ? (
            <>
              <button className="btn btn-primary" data-act="approve" onClick={() => {
                if (l) l.status = 'sent'; onClear();
                toast('Approved and sent', l ? `${l.title} · via ${l.channel}` : 'Item cleared', 'ok');
              }}><Check size={15} /> Approve and send</button>
              <button className="btn btn-secondary" onClick={() => item.letter && nav(`/letter/${item.letter}`)}>Open in editor</button>
              <button className="btn btn-ghost" onClick={() => toast('Returned to typist', 'Josh Petersen has been notified.', 'warn')}>
                <RefreshCw size={14} /> Return to typist</button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" data-act="file" onClick={() => { onClear(); toast('Filed to patient record', 'Available on the timeline.', 'ok'); }}>
                <Check size={15} /> Acknowledge and file</button>
              <button className="btn btn-secondary" onClick={() => nav('/tasks?new=1')}><SquareCheckBig size={14} /> Create task</button>
            </>
          )}
          <span className="spacer" />
          <button className="btn btn-ghost btn-icon tip" data-tip="Print" aria-label="Print"><Printer size={15} /></button>
        </div>
      </section>
    </div>
  );
}
