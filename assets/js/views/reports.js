/* Kora Health — Reports */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, money } = U;
  window.Views = window.Views || {};

  const WEEKS = [
    { l: 'W33', rev: 18420, dna: 4 }, { l: 'W34', rev: 21160, dna: 3 },
    { l: 'W35', rev: 19880, dna: 6 }, { l: 'W36', rev: 24310, dna: 2 },
    { l: 'W37', rev: 22740, dna: 5 }, { l: 'W38', rev: 26090, dna: 3 },
  ];
  const max = Math.max(...WEEKS.map(w => w.rev));

  window.Views.reports = {
    title: () => 'Reports',
    skeleton: () => `<div class="page"><div class="sk sk-block" style="height:300px"></div></div>`,
    render() {
      const byPayer = ['ACC', 'Southern Cross', 'Private'].map(p => ({
        p, v: K.invoices.filter(i => i.payer === p).reduce((s, i) => s + U.invoiceTotals(i).incl, 0)
      }));
      const totalRev = byPayer.reduce((s, x) => s + x.v, 0);
      return `<div class="page">
        <div class="page-hd">
          <div class="page-title"><h1>Reports</h1><span class="page-sub">Six weeks to 18 September 2026 · all figures incl GST</span></div>
          <div class="page-actions">
            <select class="select" style="max-width:190px" aria-label="Period">
              <option>Last 6 weeks</option><option>This quarter</option><option>Financial year to date</option></select>
            <button class="btn btn-secondary btn-sm">${ic('download', 14)} Export CSV</button>
          </div>
        </div>

        <div class="dash-grid">
          ${[
            { l: 'Revenue', v: money(WEEKS.reduce((s, w) => s + w.rev, 0)), s: '+12% on prior 6 weeks', tone: 'ok', i: 'dollar' },
            { l: 'Appointments', v: '412', s: '68 per week average', tone: '', i: 'calendar' },
            { l: 'DNA rate', v: '5.6%', s: '23 missed appointments', tone: 'warn', i: 'x' },
            { l: 'Letter turnaround', v: '4.2h', s: 'Target under 6 hours', tone: 'ok', i: 'letters' },
          ].map(s => `<div class="col-3"><div class="card stat">
            <div class="stat-top"><span class="stat-ic ${s.tone}">${ic(s.i, 15)}</span><span class="stat-label">${s.l}</span></div>
            <span class="stat-value">${s.v}</span><span class="stat-sub">${s.s}</span></div></div>`).join('')}

          <div class="col-8"><section class="card">
            <div class="card-hd"><h3>Revenue by week</h3><span class="spacer"></span>
              <span class="row g-3 t-xs muted">
                <span class="row g-2"><i style="width:9px;height:9px;border-radius:3px;background:var(--accent)"></i>Invoiced</span>
                <span class="row g-2"><i style="width:9px;height:9px;border-radius:3px;background:var(--warm)"></i>Current week</span></span></div>
            <div class="card-bd">
              <div class="bars">${WEEKS.map((w, i) => `<div class="bar ${i === WEEKS.length - 1 ? 'alt' : ''}"
                style="height:${Math.round(w.rev / max * 100)}%" title="${w.l}: ${money(w.rev)}"
                aria-label="${w.l} ${money(w.rev)}"></div>`).join('')}</div>
              <div class="bar-labels">${WEEKS.map(w => `<span>${w.l}</span>`).join('')}</div>
            </div>
            <div class="card-ft row"><span class="t-xs subtle">Highest week: ${money(max)} · average ${money(Math.round(WEEKS.reduce((s, w) => s + w.rev, 0) / WEEKS.length))}</span></div>
          </section></div>

          <div class="col-4"><section class="card">
            <div class="card-hd"><h3>Revenue by payer</h3></div>
            <div class="card-bd col g-4">
              ${byPayer.map(x => `<div class="col g-2">
                <div class="row between t-sm"><span>${esc(x.p)}</span><b class="num">${money(x.v)}</b></div>
                <div class="meter"><span class="meter-track" style="width:${Math.round(x.v / totalRev * 100)}%;background:${
                  x.p === 'ACC' ? 'var(--warm)' : x.p === 'Southern Cross' ? 'var(--info-fg)' : 'var(--accent)'}"></span></div>
                <span class="t-xs subtle">${Math.round(x.v / totalRev * 100)}% of billed revenue</span>
              </div>`).join('')}
            </div>
          </section></div>

          <div class="col-6"><section class="card">
            <div class="card-hd"><h3>Clinician activity</h3></div>
            <div class="table-wrap"><table class="tbl tbl-compact">
              <thead><tr><th>Clinician</th><th class="num-cell">Seen</th><th class="num-cell">DNA</th>
                <th class="num-cell">Letters</th><th class="num-cell">Billed</th></tr></thead>
              <tbody>${K.clinicians.map((c, i) => `<tr>
                <td><span class="row g-2">${avatar(c.id, 'xs')}<span class="t-sm">${esc(c.name)}<br>
                  <span class="t-xs subtle">${esc(c.spec)}</span></span></span></td>
                <td class="num-cell">${[112, 96, 84, 120][i]}</td>
                <td class="num-cell">${[5, 7, 4, 7][i]}</td>
                <td class="num-cell">${[64, 48, 52, 12][i]}</td>
                <td class="num-cell"><b>${money([38420, 31280, 27940, 14860][i])}</b></td>
              </tr>`).join('')}</tbody></table></div>
          </section></div>

          <div class="col-6"><section class="card">
            <div class="card-hd"><h3>Debtor ageing</h3><span class="spacer"></span>
              <a class="btn btn-ghost btn-sm" href="#/billing">Chase overdue ${ic('chevronRight', 13)}</a></div>
            <div class="table-wrap"><table class="tbl tbl-compact">
              <thead><tr><th>Bracket</th><th class="num-cell">Invoices</th><th class="num-cell">Value</th><th>Share</th></tr></thead>
              <tbody>${[['Current', 5, 1892.50, 'ok'], ['1–30 days', 3, 1104.00, ''], ['31–60 days', 2, 1207.50, 'warn'], ['60+ days', 1, 989.00, 'bad']]
                .map(([b, n, v, tone]) => `<tr>
                  <td><span class="chip ${tone ? 'chip-' + tone : ''}">${b}</span></td>
                  <td class="num-cell">${n}</td><td class="num-cell"><b>${money(v)}</b></td>
                  <td style="width:120px"><div class="meter"><span class="meter-track" style="width:${Math.round(v / 5193 * 100)}%;background:${
                    tone === 'bad' ? 'var(--bad-fg)' : tone === 'warn' ? 'var(--warn-fg)' : 'var(--accent)'}"></span></div></td>
                </tr>`).join('')}</tbody></table></div>
          </section></div>
        </div>
      </div>`;
    },
    mount() {},
  };
})();
