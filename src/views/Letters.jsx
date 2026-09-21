import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutTemplate, Filter, Sparkles, Mail } from 'lucide-react';
import K from '../data/sample.js';
import { relTime } from '../lib/format.js';
import { Chip, Avatar, Empty, Nil } from '../components/Primitives.jsx';

export default function Letters() {
  const nav = useNavigate();
  const [f, setF] = useState('all');
  const list = K.letters.filter(l => f === 'all' || l.status === f);
  const count = s => K.letters.filter(l => l.status === s).length;
  return (
    <div className="page">
      <div className="page-hd">
        <div className="page-title"><h1>Letters</h1>
          <span className="page-sub">{count('pending')} awaiting approval · {count('draft')} in draft · {count('sent')} sent this week</span></div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => nav('/admin/tpl')}><LayoutTemplate size={14} /> Templates</button>
          <button className="btn btn-primary btn-sm" onClick={() => nav('/letter/new')}><Plus size={14} /> New letter</button>
        </div>
      </div>
      <div className="toolbar">
        <div className="pill-nav" role="group" aria-label="Filter letters">
          {[['all','All'],['draft','Draft'],['pending','Awaiting approval'],['approved','Approved'],['sent','Sent']].map(([k, l]) => (
            <button key={k} aria-pressed={f === k} onClick={() => setF(k)}>
              {l}{k !== 'all' && <span className="t-n">{count(k)}</span>}</button>
          ))}
        </div>
        <span className="spacer" />
        <button className="btn btn-ghost btn-sm"><Filter size={14} /> More filters</button>
      </div>
      <section className="card">
        {list.length ? <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Letter</th><th>Patient</th><th>Recipient</th><th>Clinician</th>
            <th>Typed by</th><th>Channel</th><th>Updated</th><th>Status</th></tr></thead>
          <tbody>{list.map(l => { const p = K.pt(l.pt); return (
            <tr key={l.id} style={{ cursor: 'pointer' }} tabIndex={0}
              onClick={() => nav(`/letter/${l.id}`)}
              onKeyDown={e => { if (e.key === 'Enter') nav(`/letter/${l.id}`); }}>
              {/* The chip is inline-flex, so sitting it straight after the
                  title gave it no gap at all and the two ran together. */}
              <td><span className="cell2">
                <span className="cell-title"><b>{l.title}</b>
                  {l.aiAssisted && <span className="chip chip-warm"><Sparkles size={13} /> AI draft</span>}</span>
                <span>{l.words} words</span></span></td>
              <td><span className="row g-2"><Avatar id={p.id} size="xs" />
                <span className="cell2"><span>{p.first} {p.last}</span>
                  <span className="t-mono">{p.nhi}</span></span></span></td>
              <td><span className="cell2"><span>{K.gp(l.to).name}</span>
                <span>{K.gp(l.to).practice}</span></span></td>
              <td className="t-sm">{K.st(l.cl).name}</td>
              <td className="t-sm">{l.typedBy ? K.st(l.typedBy).name : <Nil label="Not typed yet" />}</td>
              <td className="t-sm">{l.channel}</td><td className="t-sm">{relTime(l.updated)}</td>
              <td><Chip status={l.status} /></td>
            </tr>
          ); })}</tbody></table></div>
          : <Empty icon={<Mail size={22} />} title="No letters here" body="Nothing matches this filter yet." />}
      </section>
    </div>
  );
}
