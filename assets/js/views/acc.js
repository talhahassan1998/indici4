/* Kora Health — ACC submissions: validation, bulk submit, history */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa, money } = U;
  window.Views = window.Views || {};

  let selected = new Set();
  let tab = 'queue';

  window.Views.acc = {
    title: () => 'ACC',
    skeleton: () => `<div class="page"><div class="card">${U.skeletonList(5)}</div></div>`,

    render() {
      const bad = K.accQueue.filter(a => !a.valid);
      const ok = K.accQueue.filter(a => a.valid);
      const total = ok.reduce((s, a) => s + a.amount, 0);

      return `<div class="page">
        <div class="page-hd">
          <div class="page-title"><h1>ACC submissions</h1>
            <span class="page-sub">Validated against ACC business rules before they leave Kora</span></div>
          <div class="page-actions">
            <span class="sync-pill ${bad.length ? 'off' : ''}">${ic('shield', 13)} ACC gateway ${bad.length ? 'blocked' : 'ready'}</span>
            <button class="btn btn-secondary btn-sm" data-act="revalidate">${ic('refresh', 14)} Re-validate all</button>
            <button class="btn btn-primary btn-sm" data-act="submit" ${ok.length ? '' : 'disabled aria-disabled="true"'}>
              ${ic('send', 14)} Submit ${selected.size || ok.length} invoices</button>
          </div>
        </div>

        ${bad.length ? `<div class="banner bad mb-4"><span class="b-ic">${ic('alert', 17)}</span>
          <span class="grow"><b>${bad.length} submissions will be rejected as they are</b><br>
          <span class="t-sm">Each one is missing something ACC requires. Use <b>Fix now</b> to jump straight to the field —
          fixing a patient record usually clears more than one row.</span></span></div>`
        : `<div class="banner ok mb-4"><span class="b-ic">${ic('check', 17)}</span>
          <span class="grow"><b>Everything validates</b><br><span class="t-sm">${ok.length} invoices totalling ${money(total)} are ready to send to ACC.</span></span></div>`}

        <div class="tabs mb-4" role="tablist">
          <button role="tab" aria-selected="${tab === 'queue'}" data-t="queue">${ic('list', 15)} Ready to submit
            <span class="badge-count quiet">${K.accQueue.length}</span></button>
          <button role="tab" aria-selected="${tab === 'history'}" data-t="history">${ic('clock', 15)} Submission history</button>
        </div>

        ${tab === 'queue' ? queueTable(ok, total) : historyTable()}
      </div>`;
    },

    mount(root) {
      const re = () => U.mountView(this);
      on(root, 'click', '[data-t]', (e, t) => { tab = t.dataset.t; re(); });
      on(root, 'click', '[data-sel]', (e, t) => {
        e.stopPropagation();
        const id = t.dataset.sel;
        selected.has(id) ? selected.delete(id) : selected.add(id);
        re();
      });
      on(root, 'click', '[data-selall]', () => {
        const ok = K.accQueue.filter(a => a.valid);
        if (selected.size === ok.length) selected.clear(); else ok.forEach(a => selected.add(a.id));
        re();
      });
      on(root, 'click', '[data-fix]', (e, t) => {
        e.stopPropagation();
        const row = K.accQueue.find(a => a.id === t.dataset.fix);
        fixModal(row, t.dataset.field, re);
      });
      on(root, 'click', '[data-act="revalidate"]', (e, t) => {
        t.innerHTML = `<span class="spinner"></span> Checking…`;
        setTimeout(() => { re(); U.toast('Validation complete', `${K.accQueue.filter(a => !a.valid).length} rows still need attention.`, K.accQueue.some(a => !a.valid) ? 'warn' : 'ok'); }, 900);
      });
      on(root, 'click', '[data-act="submit"]', () => submitModal(re));
    },
  };

  function queueTable(ok, total) {
    return `<section class="card">
      <div class="card-hd">
        <h3>Invoices awaiting submission</h3>
        <span class="spacer"></span>
        ${selected.size ? `<span class="chip chip-accent">${selected.size} selected · ${money(
          K.accQueue.filter(a => selected.has(a.id)).reduce((s, a) => s + a.amount, 0))}</span>` : ''}
        <button class="btn btn-ghost btn-sm" data-selall>${selected.size === ok.length && ok.length ? 'Clear selection' : 'Select all valid'}</button>
      </div>
      <div class="table-wrap"><table class="tbl">
        <thead><tr>
          <th style="width:38px"></th><th>Submission</th><th>Patient</th><th>Claim</th>
          <th>Service date</th><th>Code</th><th class="num-cell">Amount</th><th>Validation</th></tr></thead>
        <tbody>
          ${K.accQueue.map(a => {
            const p = K.pt(a.pt);
            return `<tr class="${a.valid ? '' : 'row-err'}">
              <td>${a.valid ? `<span class="check" role="checkbox" tabindex="0" aria-checked="${selected.has(a.id)}" data-sel="${a.id}"
                aria-label="Select ${esc(a.id)}">${ic('check', 11)}</span>` : `<span class="tip" data-tip="Cannot be submitted yet" style="color:var(--bad-fg)">${ic('lock', 15)}</span>`}</td>
              <td class="t-mono t-sm"><b>${esc(a.id)}</b><br><span class="t-xs subtle">${esc(a.inv)}</span></td>
              <td><span class="row g-2">${avatar(p.id, 'xs', p.tone)}<span class="t-sm">${esc(p.first)} ${esc(p.last)}<br>
                <span class="t-xs subtle t-mono">${esc(p.nhi)}</span></span></span></td>
              <td class="t-mono t-sm">${p.claim ? esc(p.claim) : '<span class="bad-t">missing</span>'}</td>
              <td class="t-sm">${U.fmtDateShort(a.svc)}</td>
              <td class="t-mono t-sm">${esc(a.code)}</td>
              <td class="num-cell"><b>${money(a.amount)}</b></td>
              <td style="min-width:300px">
                ${a.valid ? chip('approved', { label: 'Passes ACC checks' })
                  : `<div class="col g-2">${a.errors.map(er => `
                      <div class="row g-2 t-sm" style="color:var(--bad-fg)">
                        ${ic('alert', 14)}
                        <span class="grow"><b>${esc(er.label)}</b><br>
                          <span class="t-xs" style="color:var(--text-muted)">${esc(er.fix)}</span></span>
                        <button class="btn btn-danger btn-sm" data-fix="${a.id}" data-field="${esc(er.field)}">Fix now</button>
                      </div>`).join('')}</div>`}
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>
      <div class="card-ft row g-3">
        <span class="t-sm muted">${ok.length} of ${K.accQueue.length} ready · ${money(total)}</span>
        <span class="spacer"></span>
        <span class="t-xs subtle">ACC pays approved submissions on the 20th of the following month.</span>
      </div>
    </section>`;
  }

  function historyTable() {
    return `<section class="card">
      <div class="card-hd"><h3>Submission history</h3><span class="spacer"></span>
        <button class="btn btn-ghost btn-sm">${ic('download', 14)} Export remittances</button></div>
      <div class="table-wrap"><table class="tbl">
        <thead><tr><th>Batch</th><th>Submitted</th><th class="num-cell">Invoices</th>
          <th class="num-cell">Value</th><th class="num-cell">Accepted</th><th class="num-cell">Rejected</th><th>Status</th><th></th></tr></thead>
        <tbody>${K.accHistory.map(b => `<tr>
          <td class="t-mono t-sm"><b>${esc(b.batch)}</b></td>
          <td class="t-sm">${U.fmtDate(b.at.slice(0, 10))}<br><span class="t-xs subtle">${U.fmtClock(b.at)}</span></td>
          <td class="num-cell">${b.count}</td>
          <td class="num-cell"><b>${money(b.total)}</b></td>
          <td class="num-cell ok-t">${b.accepted}</td>
          <td class="num-cell ${b.rejected ? 'bad-t' : 'subtle'}">${b.rejected}</td>
          <td>${chip(b.rejected ? 'pending' : 'paid', { label: b.status })}</td>
          <td><span class="row-actions"><button class="btn btn-ghost btn-sm">View</button></span></td>
        </tr>`).join('')}</tbody>
      </table></div>
    </section>`;
  }

  function fixModal(row, field, re) {
    const p = K.pt(row.pt);
    const isClaim = field === 'claim', isProvider = field === 'provider';
    U.modal({
      title: isProvider ? 'Add ACC provider ID' : isClaim ? 'Check the claim number' : 'Add date of injury',
      sub: `${p.first} ${p.last} · ${row.id}`,
      icon: 'acc', tone: 'bad',
      body: `<div class="col g-4">
        <div class="banner warn"><span class="b-ic">${ic('info', 15)}</span>
          <span class="t-sm">${isProvider
            ? 'ACC matches every submission to a registered provider. Without this ID the whole batch is held.'
            : isClaim
            ? 'ACC did not recognise this claim number. Check it against the ACC45, or search ACC for the patient.'
            : 'ACC rejects invoices without an injury date. Adding it here fixes every queued row for this patient.'}</span></div>
        ${isProvider
          ? `<div class="field"><label class="label" for="fx">ACC provider ID for ${esc(K.st(row.cl).name)}</label>
             <input class="input t-mono" id="fx" placeholder="e.g. DR6620" data-autofocus></div>`
          : isClaim
          ? `<div class="field"><label class="label" for="fx">Claim number</label>
             <input class="input t-mono" id="fx" value="${esc(p.claim || '')}" data-autofocus>
             <span class="hint">Format: ACC-YYYY-NNNNN</span></div>
             <button class="btn btn-secondary btn-sm">${ic('search', 14)} Look up claim at ACC</button>`
          : `<div class="field"><label class="label" for="fx">Date of injury</label>
             <input class="input" id="fx" type="date" value="2026-07-28" max="2026-09-17" data-autofocus></div>`}
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button>
               <button class="btn btn-primary" data-go>${ic('check', 15)} Save and re-validate</button>`,
      onMount(panel, close) {
        qs('[data-go]', panel).addEventListener('click', () => {
          const v = qs('#fx', panel).value;
          if (!v) { U.toast('Still empty', 'ACC needs a value here before submitting.', 'warn'); return; }
          if (field === 'injury') { p.injury = v; K.accQueue.forEach(a => { if (a.pt === p.id) clear(a, 'injury'); }); }
          if (field === 'claim')  { p.claim = v; K.accQueue.forEach(a => { if (a.pt === p.id) clear(a, 'claim'); }); }
          if (field === 'provider') { K.st(row.cl).accId = v; K.accQueue.forEach(a => { if (a.cl === row.cl) clear(a, 'provider'); }); }
          close(); re();
          U.toast('Fixed', `${K.accQueue.filter(a => a.valid).length} submissions now pass validation.`, 'ok');
        });
      }
    });
  }
  function clear(a, field) { a.errors = a.errors.filter(e => e.field !== field); a.valid = a.errors.length === 0; }

  function submitModal(re) {
    const ok = K.accQueue.filter(a => a.valid && (!selected.size || selected.has(a.id)));
    const total = ok.reduce((s, a) => s + a.amount, 0);
    U.modal({
      title: `Submit ${ok.length} invoices to ACC`,
      sub: `${money(total)} · batch BATCH-2026-0917`,
      icon: 'send', tone: 'ok',
      body: `<div class="col g-4">
        <div class="list-rows card card-flat" style="max-height:230px;overflow:auto">
          ${ok.map(a => `<div class="work-row" style="padding:9px 14px">
            <span class="grow t-sm"><b>${esc(K.ptName(a.pt))}</b><br>
              <span class="t-xs subtle t-mono">${esc(a.inv)} · ${esc(K.pt(a.pt).claim)} · ${esc(a.code)}</span></span>
            <span class="num t-sm">${money(a.amount)}</span></div>`).join('')}
        </div>
        <div class="row between"><span class="t-h4">Batch total</span><span class="t-h3 num">${money(total)}</span></div>
        <div class="banner"><span class="b-ic">${ic('info', 15)}</span>
          <span class="t-sm">ACC usually responds within two working days. Rejections come back into this queue with a reason.</span></div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button>
               <button class="btn btn-primary" data-go>${ic('send', 15)} Submit batch</button>`,
      onMount(panel, close) {
        qs('[data-go]', panel).addEventListener('click', () => {
          const btn = qs('[data-go]', panel);
          btn.innerHTML = `<span class="spinner"></span> Submitting…`; btn.disabled = true;
          setTimeout(() => {
            K.accHistory.unshift({ batch: 'BATCH-2026-0917', at: '2026-09-17T10:30', count: ok.length, total,
              accepted: ok.length, rejected: 0, status: 'Submitted' });
            ok.forEach(a => { const i = K.accQueue.indexOf(a); if (i > -1) K.accQueue.splice(i, 1); });
            selected.clear(); close(); re();
            U.toast('Batch submitted', `${ok.length} invoices · ${money(total)} sent to ACC.`, 'ok');
          }, 1300);
        });
      }
    });
  }
})();
