import { DollarSign, CalendarDays, X, Mail, ChevronRight, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import K from '../data/sample.js';
import { money, invoiceTotals } from '../lib/format.js';
import { Avatar } from '../components/Primitives.jsx';

const WEEKS = [
  { l: 'W33', rev: 18420 }, { l: 'W34', rev: 21160 }, { l: 'W35', rev: 19880 },
  { l: 'W36', rev: 24310 }, { l: 'W37', rev: 22740 }, { l: 'W38', rev: 26090 },
];
const max = Math.max(...WEEKS.map(w => w.rev));

export default function Reports() {
  const byPayer = ['ACC', 'Southern Cross', 'Private'].map(p => ({
    p, v: K.invoices.filter(i => i.payer === p).reduce((s, i) => s + invoiceTotals(i).incl, 0),
  }));
  const total = byPayer.reduce((s, x) => s + x.v, 0);
  return (
    <div className="page">
      <div className="page-hd">
        <div className="page-title"><h1>Reports</h1>
          <span className="page-sub">Six weeks to 18 September 2026 · all figures incl GST</span></div>
        <div className="page-actions">
          <select className="select" style={{ maxWidth: 190 }} aria-label="Period">
            <option>Last 6 weeks</option><option>This quarter</option><option>Financial year to date</option></select>
          <button className="btn btn-secondary btn-sm"><Download size={14} /> Export CSV</button>
        </div>
      </div>
      <div className="dash-grid">
        {[{ l: 'Revenue', v: money(WEEKS.reduce((s, w) => s + w.rev, 0)), s: '+12% on prior 6 weeks', tone: 'ok', Icon: DollarSign },
          { l: 'Appointments', v: '412', s: '68 per week average', tone: '', Icon: CalendarDays },
          { l: 'DNA rate', v: '5.6%', s: '23 missed appointments', tone: 'warn', Icon: X },
          { l: 'Letter turnaround', v: '4.2h', s: 'Target under 6 hours', tone: 'ok', Icon: Mail },
        ].map(s => (
          <div className="col-3" key={s.l}><div className="card stat">
            <div className="stat-top"><span className={`stat-ic ${s.tone}`}><s.Icon size={15} /></span>
              <span className="stat-label">{s.l}</span></div>
            <span className="stat-value">{s.v}</span><span className="stat-sub">{s.s}</span></div></div>
        ))}

        <div className="col-8"><section className="card">
          <div className="card-hd"><h3>Revenue by week</h3></div>
          <div className="card-bd">
            <div className="bars">{WEEKS.map((w, i) => (
              <div className={`bar ${i === WEEKS.length - 1 ? 'alt' : ''}`} key={w.l}
                style={{ height: `${Math.round(w.rev / max * 100)}%` }}
                title={`${w.l}: ${money(w.rev)}`} aria-label={`${w.l} ${money(w.rev)}`} />
            ))}</div>
            <div className="bar-labels">{WEEKS.map(w => <span key={w.l}>{w.l}</span>)}</div>
          </div>
        </section></div>

        <div className="col-4"><section className="card">
          <div className="card-hd"><h3>Revenue by payer</h3></div>
          <div className="card-bd col g-4">{byPayer.map(x => (
            <div className="col g-2" key={x.p}>
              <div className="row between t-sm"><span>{x.p}</span><b className="num">{money(x.v)}</b></div>
              <div className="meter"><span className="meter-track" style={{ width: `${Math.round(x.v / total * 100)}%`,
                background: x.p === 'ACC' ? 'var(--warm)' : x.p === 'Southern Cross' ? 'var(--info-fg)' : 'var(--accent)' }} /></div>
              <span className="t-xs subtle">{Math.round(x.v / total * 100)}% of billed revenue</span>
            </div>
          ))}</div>
        </section></div>

        <div className="col-6"><section className="card">
          <div className="card-hd"><h3>Clinician activity</h3></div>
          <div className="table-wrap"><table className="tbl tbl-compact">
            <thead><tr><th>Clinician</th><th className="num-cell">Seen</th><th className="num-cell">DNA</th>
              <th className="num-cell">Letters</th><th className="num-cell">Billed</th></tr></thead>
            <tbody>{K.clinicians.map((c, i) => (
              <tr key={c.id}>
                <td><span className="row g-2"><Avatar id={c.id} size="xs" />
                  <span className="t-sm">{c.name}<br /><span className="t-xs subtle">{c.spec}</span></span></span></td>
                <td className="num-cell">{[112, 96, 84, 120][i]}</td>
                <td className="num-cell">{[5, 7, 4, 7][i]}</td>
                <td className="num-cell">{[64, 48, 52, 12][i]}</td>
                <td className="num-cell"><b>{money([38420, 31280, 27940, 14860][i])}</b></td>
              </tr>
            ))}</tbody></table></div>
        </section></div>

        <div className="col-6"><section className="card">
          <div className="card-hd"><h3>Debtor ageing</h3><span className="spacer" />
            <Link className="btn btn-ghost btn-sm" to="/billing">Chase overdue <ChevronRight size={13} /></Link></div>
          <div className="table-wrap"><table className="tbl tbl-compact">
            <thead><tr><th>Bracket</th><th className="num-cell">Invoices</th><th className="num-cell">Value</th><th>Share</th></tr></thead>
            <tbody>{[['Current', 5, 1892.5, 'ok'], ['1–30 days', 3, 1104, ''], ['31–60 days', 2, 1207.5, 'warn'], ['60+ days', 1, 989, 'bad']]
              .map(([b, n, v, tone]) => (
              <tr key={b}><td><span className={`chip ${tone ? 'chip-' + tone : ''}`}>{b}</span></td>
                <td className="num-cell">{n}</td><td className="num-cell"><b>{money(v)}</b></td>
                <td style={{ width: 120 }}><div className="meter"><span className="meter-track"
                  style={{ width: `${Math.round(v / 5193 * 100)}%`,
                    background: tone === 'bad' ? 'var(--bad-fg)' : tone === 'warn' ? 'var(--warn-fg)' : 'var(--accent)' }} /></div></td>
              </tr>
            ))}</tbody></table></div>
        </section></div>
      </div>
    </div>
  );
}
