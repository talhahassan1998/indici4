import { DollarSign, CalendarDays, X, Mail, ChevronRight, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import K from '../data/sample.js';
import { money, money0, invoiceTotals } from '../lib/format.js';
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
      {/* The same divided line of figures the rest of the product uses, not
          four matching tiles. */}
      <div className="fig-row mb-5">
        {[{ l: 'Revenue', v: money(WEEKS.reduce((s, w) => s + w.rev, 0)), s: '+12% on prior 6 weeks', tone: '' },
          { l: 'Appointments', v: '412', s: '68 per week average', tone: '' },
          { l: 'DNA rate', v: '5.6%', s: '23 missed appointments', tone: 'is-warn' },
          { l: 'Letter turnaround', v: '4.2h', s: 'Target under 6 hours', tone: 'is-ok' },
        ].map(f => (
          <div className={`fig ${f.tone}`} key={f.l}>
            <b>{f.v}</b><span>{f.l}</span><small>{f.s}</small>
          </div>
        ))}
      </div>

      <div className="dash-grid equal">
        <div className="col-8"><section className="card">
          <div className="card-hd"><h3>Revenue by week</h3><span className="spacer" />
            <span className="t-sm muted">W38 is the week in progress</span></div>
          {/* One column per week: the figure, the bar, the label. A bar chart
              you have to hover to read is a decoration. */}
          <div className="card-bd bars-bd">
            <div className="bars">{WEEKS.map((w, i) => (
              <div className="bar-col" key={w.l}>
                <span className="bar-v">{money0(w.rev)}</span>
                <span className="bar-wrap">
                  <span className={`bar ${i === WEEKS.length - 1 ? 'alt' : ''}`}
                    style={{ height: `${Math.round(w.rev / max * 100)}%` }}
                    aria-label={`${w.l}: ${money(w.rev)}`} />
                </span>
                <span className="bar-l">{w.l}</span>
              </div>
            ))}</div>
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
                  <span className="cell2"><span>{c.name}</span><span>{c.spec}</span></span></span></td>
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
          {/* The brackets are only useful against the total they add up to. */}
          <div className="grid-foot">
            <span className="t-sm muted">11 outstanding</span>
            <span className="spacer" />
            <span className="gf-fig is-lead"><span>Total owed</span><b className="num">{money(5193)}</b></span>
            <span className="gf-fig is-bad"><span>Over 30 days</span><b className="num">{money(2196.5)}</b></span>
          </div>
        </section></div>
      </div>
    </div>
  );
}
