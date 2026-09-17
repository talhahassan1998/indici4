/* Kora Health — Billing: invoices, split invoicing, payments, Xero sync */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa, money } = U;
  window.Views = window.Views || {};

  let f = { status: 'all', payer: 'all', clinician: 'all', q: '' };

  function rows() {
    return K.invoices.filter(i =>
      (f.status === 'all' || i.status === f.status) &&
      (f.payer === 'all' || i.payer === f.payer) &&
      (f.clinician === 'all' || i.cl === f.clinician) &&
      (!f.q || (i.id + ' ' + K.ptName(i.pt)).toLowerCase().includes(f.q.toLowerCase()))
    );
  }

  function totals(list) {
    const sum = s => list.filter(i => s ? i.status === s : true).reduce((a, i) => a + U.invoiceTotals(i).incl, 0);
    return { all: sum(), paid: sum('paid'), sent: sum('sent'), overdue: sum('overdue'), draft: sum('draft') };
  }

  window.Views.billing = {
    title: () => 'Billing',
    skeleton: () => `<div class="page"><div class="card">${U.skeletonList(7)}</div></div>`,

    render() {
      const list = rows(), t = totals(K.invoices);
      const count = s => K.invoices.filter(i => i.status === s).length;
      const todayInv = K.invoices.filter(i => i.date === '2026-09-17');
      const todayTotal = todayInv.reduce((a, i) => a + U.invoiceTotals(i).incl, 0);
      return `<div class="page">
        <div class="page-hd">
          <div class="page-title"><h1>Billing</h1>
            <span class="page-sub">All amounts in NZD and include 15% GST unless shown otherwise</span></div>
          <div class="page-actions">
            <span class="sync-pill tip" data-tip="Last synced 9:42am today">${ic('sync', 13)} Xero connected</span>
            <button class="btn btn-secondary btn-sm" data-act="sync">${ic('refresh', 14)} Sync items</button>
            <button class="btn btn-primary btn-sm" data-act="create">${ic('plus', 14)} Create invoice</button>
          </div>
        </div>

        <div class="dash-grid mb-4">
          ${[
            { l: 'Invoiced today', v: money(todayTotal), s: `${todayInv.length} invoices`, ic: 'billing', tone: '' },
            { l: 'Paid', v: money(t.paid), s: `${count('paid')} settled`, ic: 'check', tone: 'ok' },
            { l: 'Awaiting payment', v: money(t.sent), s: `${count('sent')} sent`, ic: 'clock', tone: 'warn' },
            { l: 'Overdue', v: money(t.overdue), s: `${count('overdue')} past due date`, ic: 'alert', tone: 'bad' },
          ].map(s => `<div class="col-3"><div class="card stat">
            <div class="stat-top"><span class="stat-ic ${s.tone}">${ic(s.ic, 15)}</span><span class="stat-label">${s.l}</span></div>
            <span class="stat-value">${s.v}</span><span class="stat-sub">${s.s}</span></div></div>`).join('')}
        </div>

        <div class="banner mb-4"><span class="b-ic">${ic('sync', 16)}</span>
          <span class="grow"><b>Reconcile in Xero only</b><br>
          <span class="t-sm">Billing codes and prices are mastered in Xero and synced into Kora. When a payment lands in the
          bank and is matched in Xero, the invoice is marked paid here automatically — nobody re-keys it.</span></span>
          <span class="t-xs subtle">Last sync ${U.fmtClock(K.XERO_SYNC)}</span></div>

        <div class="toolbar">
          <div class="input-group" style="max-width:250px">
            <span class="ic-lead">${ic('search', 15)}</span>
            <input class="input" id="bq" placeholder="Invoice number or patient…" value="${esc(f.q)}" aria-label="Search invoices">
          </div>
          <select class="select" id="bStatus" style="max-width:160px" aria-label="Status">
            <option value="all">All statuses</option>
            ${['draft', 'sent', 'paid', 'overdue'].map(s => `<option value="${s}" ${f.status === s ? 'selected' : ''}>${U.STATUS[s].label} (${count(s)})</option>`).join('')}
          </select>
          <select class="select" id="bPayer" style="max-width:180px" aria-label="Payer">
            <option value="all">All payers</option>
            ${['ACC', 'Southern Cross', 'Private', 'Hospital'].map(s => `<option value="${s}" ${f.payer === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
          <select class="select" id="bCl" style="max-width:200px" aria-label="Clinician">
            <option value="all">All clinicians</option>
            ${K.clinicians.map(c => `<option value="${c.id}" ${f.clinician === c.id ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}
          </select>
          <span class="spacer"></span>
          <span class="t-xs subtle">${list.length} invoices · ${money(totals(list).all)}</span>
          <button class="btn btn-ghost btn-sm">${ic('download', 14)} Export</button>
        </div>

        <section class="card">
          ${list.length ? `<div class="table-wrap"><table class="tbl">
            <thead><tr>
              <th>Invoice</th><th>Patient</th><th>Date</th><th>Payer</th><th>Clinician</th>
              <th class="num-cell">Excl GST</th><th class="num-cell">GST</th><th class="num-cell">Total</th>
              <th>Status</th><th></th></tr></thead>
            <tbody>${list.map(i => {
              const tt = U.invoiceTotals(i), p = K.pt(i.pt);
              const od = i.status === 'overdue' ? U.daysOverdue(i.due) : 0;
              return `<tr data-inv="${i.id}" tabindex="0" class="${i.status === 'overdue' ? 'row-err' : ''}">
                <td class="t-mono t-sm"><b>${esc(i.id)}</b></td>
                <td><span class="row g-2">${avatar(p.id, 'xs', p.tone)}<span class="t-sm">${esc(p.first)} ${esc(p.last)}<br>
                  <span class="t-xs subtle t-mono">${esc(p.nhi)}</span></span></span></td>
                <td class="t-sm">${U.fmtDateShort(i.date)}${od > 0 ? `<br><span class="t-xs bad-t">${od} days late</span>` : ''}</td>
                <td>${U.funderChip(i.payer)}</td>
                <td class="t-sm">${esc(K.st(i.cl).name)}</td>
                <td class="num-cell">${money(tt.excl)}</td>
                <td class="num-cell subtle">${money(tt.gst)}</td>
                <td class="num-cell"><b>${money(tt.incl)}</b></td>
                <td>${chip(i.status)}${i.reconciled ? `<br><span class="t-xs subtle row g-1" style="margin-top:3px">${ic('sync', 10)} matched in Xero</span>` : ''}</td>
                <td><span class="row-actions">
                  ${i.status !== 'paid' ? `<button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Record payment" data-pay="${i.id}">${ic('card', 14)}</button>` : ''}
                  <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Send" data-send="${i.id}">${ic('send', 14)}</button>
                  <button class="btn btn-ghost btn-icon btn-sm" data-more="${i.id}" aria-label="More">${ic('dots', 14)}</button>
                </span></td>
              </tr>`;
            }).join('')}</tbody></table></div>`
            : U.empty('billing', 'No invoices match', 'Try clearing a filter, or raise a new invoice from a completed appointment.',
              `<button class="btn btn-primary btn-sm" data-act="create">${ic('plus', 14)} Create invoice</button>`)}
        </section>
      </div>`;
    },

    openCreate(apptId) {
      createDrawer(apptId);
    },

    mount(root) {
      const re = () => U.mountView(this);
      const q = qs('#bq', root);
      q.addEventListener('input', () => {
        f.q = q.value; const s = q.selectionStart;
        const fresh = re();
        const n = qs('#bq', fresh); n.focus(); n.setSelectionRange(s, s);
      });
      qs('#bStatus', root).addEventListener('change', e => { f.status = e.target.value; re(); });
      qs('#bPayer', root).addEventListener('change', e => { f.payer = e.target.value; re(); });
      qs('#bCl', root).addEventListener('change', e => { f.clinician = e.target.value; re(); });

      on(root, 'click', '[data-act="create"]', () => createDrawer());
      on(root, 'click', '[data-act="sync"]', (e, t) => {
        t.innerHTML = `<span class="spinner"></span> Syncing…`;
        setTimeout(() => {
          // Xero has matched these against the bank feed, so Kora marks them paid.
          // Staff reconcile in Xero only — nothing to re-key here.
          const reconciled = K.invoices.filter(i => i.status === 'sent' || i.status === 'overdue').slice(0, 2);
          reconciled.forEach(i => { i.status = 'paid'; i.paid = U.invoiceTotals(i).incl; i.reconciled = true; });
          const drafts = K.invoices.filter(i => i.status === 'draft').length;
          re();
          U.toast('Xero sync complete',
            reconciled.length
              ? `${reconciled.length} invoices matched in the bank feed and marked paid · ${drafts} drafts pushed · ${K.billingCodes.length} billing codes refreshed`
              : `${drafts} drafts pushed · ${K.billingCodes.length} billing codes refreshed`, 'ok');
        }, 1200);
      });
      on(root, 'click', '[data-pay]', (e, t) => { e.stopPropagation(); payDrawer(K.invoices.find(i => i.id === t.dataset.pay), re); });
      on(root, 'click', '[data-send]', (e, t) => {
        e.stopPropagation();
        const i = K.invoices.find(x => x.id === t.dataset.send);
        if (i.status === 'draft') i.status = 'sent';
        re(); U.toast('Invoice sent', `${i.id} emailed to ${i.payer === 'Private' ? K.ptName(i.pt) : i.payer}.`, 'ok');
      });
      on(root, 'click', '[data-more]', (e, t) => {
        e.stopPropagation();
        const i = K.invoices.find(x => x.id === t.dataset.more);
        U.menu(t, [
          { label: i.id },
          { icon: 'eye',    label: 'View invoice',       action: () => U.toast('Invoice preview', `${i.id} · ${money(U.invoiceTotals(i).incl)}`, 'info') },
          { icon: 'edit',   label: 'Edit lines',         action: () => createDrawer(null, i) },
          { icon: 'copy',   label: 'Split this invoice', action: () => createDrawer(null, i, true) },
          { icon: 'print',  label: 'Print receipt',      action: () => U.toast('Receipt', 'Sent to the default printer.', 'ok') },
          '-',
          { icon: 'trash',  label: 'Void invoice', danger: true, action: () => U.toast('Void', 'Voiding requires a reason and a manager’s approval.', 'warn') },
        ]);
      });
      on(root, 'click', 'tbody tr', (e, t) => { if (!e.target.closest('.row-actions')) createDrawer(null, K.invoices.find(i => i.id === t.dataset.inv)); });
    },
  };

  /* --------------------------------------------------------- create / edit drawer */
  function createDrawer(apptId, existing, splitOpen) {
    const appt = apptId ? K.appts.find(a => a.id === apptId) : K.appts.find(a => a.status === 'done' && !a.invoiced);
    const pt = existing ? K.pt(existing.pt) : (appt ? K.pt(appt.pt) : K.pt('p1'));
    const type = appt ? K.at(appt.type) : K.apptTypes[0];

    const seedCode = K.code(type.code) || K.billingCodes[0];
    const items = existing ? existing.items.map(x => ({ ...x }))
      : [{ code: seedCode.code, d: seedCode.name, q: 1, p: seedCode.price }];
    const state = { items, split: !!splitOpen, pct: 30, payer: existing ? existing.payer : pt.funder };

    const calc = () => {
      const excl = state.items.reduce((s, i) => s + i.q * i.p, 0);
      const gst = excl * K.GST;
      return { excl, gst, incl: excl + gst };
    };

    function lines() {
      const active = K.billingCodes.filter(b => b.active);
      return `<table class="inv-lines">
        <thead><tr><th style="width:38%">Billable item</th><th style="width:14%">Code</th><th class="num-cell">Qty</th>
          <th class="num-cell">Unit price</th><th class="num-cell">Amount</th><th></th></tr></thead>
        <tbody>${state.items.map((it, n) => `<tr>
          <td><select class="select" data-li="${n}" data-k="code" aria-label="Billable item">
            ${active.map(b => `<option value="${b.code}" ${it.code === b.code ? 'selected' : ''}>${esc(b.name)}</option>`).join('')}
            <option value="__custom" ${it.code ? '' : 'selected'}>Other — describe below</option>
          </select>
          ${it.code ? '' : `<input class="input mt-2" data-li="${n}" data-k="d" value="${esc(it.d)}" aria-label="Description" placeholder="Description">`}</td>
          <td><span class="t-mono t-xs">${it.code ? esc(it.code) : '—'}</span></td>
          <td class="num-cell" style="width:68px"><input class="input input-money" data-li="${n}" data-k="q" type="number" min="1" value="${it.q}" aria-label="Quantity"></td>
          <td class="num-cell" style="width:106px"><input class="input input-money" data-li="${n}" data-k="p" type="number" step="0.01" value="${it.p.toFixed(2)}" aria-label="Unit price"></td>
          <td class="num-cell"><b>${money(it.q * it.p)}</b></td>
          <td><button class="btn btn-ghost btn-icon btn-sm" data-rm="${n}" aria-label="Remove line">${ic('trash', 14)}</button></td>
        </tr>`).join('')}</tbody></table>
        <p class="hint mt-2">${ic('sync', 12)} Codes and prices are mastered in Xero and synced into Kora — last sync ${U.fmtClock(K.XERO_SYNC)} today.
        Unit price stays editable for one-off variations.</p>`;
    }

    function splitBlock() {
      const t = calc();
      const patient = t.incl * state.pct / 100;
      const third = t.incl - patient;
      const thirdName = state.payer === 'Private' ? 'Southern Cross' : state.payer;
      return `<div class="col g-4">
        <div class="row between">
          <span class="t-eyebrow">Patient share</span>
          <span class="row g-2">
            <input class="input input-money" id="splitPct" type="number" min="0" max="100" value="${state.pct}" style="width:74px;height:30px" aria-label="Patient share percent">
            <span class="t-sm muted">%</span>
            <span class="divider-v" style="height:20px"></span>
            <input class="input input-money" id="splitAmt" type="number" step="0.01" value="${patient.toFixed(2)}" style="width:104px;height:30px" aria-label="Patient share amount">
          </span>
        </div>
        <input class="range" id="splitRange" type="range" min="0" max="100" value="${state.pct}" style="--pct:${state.pct}%" aria-label="Patient share slider">
        <div class="split-bar">
          <span class="sb-a" style="width:${state.pct}%">${state.pct >= 14 ? money(patient) : ''}</span>
          <span class="sb-b" style="width:${100 - state.pct}%">${100 - state.pct >= 14 ? money(third) : ''}</span>
        </div>
        <div class="split-viz">
          <div class="card card-flat card-bd col g-2">
            <span class="t-eyebrow">Invoice 1 — patient</span>
            <b class="t-h3 num">${money(patient)}</b>
            <span class="t-xs subtle">${esc(pt.first)} ${esc(pt.last)} · due in 14 days</span>
            <span class="chip">${state.pct}% of total</span>
          </div>
          <div class="card card-flat card-bd col g-2">
            <span class="t-eyebrow">Invoice 2 — third party</span>
            <b class="t-h3 num">${money(third)}</b>
            <span class="t-xs subtle">${esc(thirdName)} · submitted electronically</span>
            <span class="chip chip-warm">${100 - state.pct}% of total</span>
          </div>
        </div>
        <div class="banner"><span class="b-ic">${ic('info', 15)}</span>
          <span class="t-sm">Two invoices will be created and linked. GST is apportioned across both.</span></div>
      </div>`;
    }

    function totalsBlock() {
      const t = calc();
      return `<div class="col g-2">
        <div class="row between t-sm"><span class="muted">Subtotal (excl GST)</span><span class="num">${money(t.excl)}</span></div>
        <div class="row between t-sm"><span class="muted">GST 15% <span class="subtle">· GST on Income</span></span><span class="num">${money(t.gst)}</span></div>
        <div class="divider"></div>
        <div class="row between"><span class="t-h4">Total</span><span class="t-h3 num">${money(t.incl)}</span></div>
      </div>`;
    }

    const d = U.drawer({
      title: existing ? `Edit ${existing.id}` : 'Create invoice',
      sub: `${pt.first} ${pt.last} · ${pt.nhi} · ${pt.funder}`,
      wide: true,
      body: `<div class="col g-5" id="invBody">
        <div class="card card-flat card-bd row g-3">
          ${avatar(pt.id, 'lg', pt.tone)}
          <div class="grow"><b>${esc(pt.first)} ${esc(pt.last)}</b>
            <div class="t-xs subtle">${esc(pt.nhi)} · ${U.age(pt.dob)}y · ${esc(pt.phone)}</div></div>
          ${U.funderChip(pt.funder)}
        </div>

        ${appt ? `<div class="banner ok"><span class="b-ic">${ic('check', 15)}</span>
          <span class="t-sm">Pre-filled from <b>${esc(type.name)}</b> with ${esc(K.st(appt.cl).name)} at ${U.fmtTime(appt.start)}.</span></div>` : ''}

        <div class="grid" style="grid-template-columns:1fr 1fr">
          <div class="field"><label class="label" for="invPayer">Payer</label>
            <select class="select" id="invPayer">
              ${['ACC', 'Southern Cross', 'Private', 'Hospital'].map(x => `<option ${state.payer === x ? 'selected' : ''}>${x}</option>`).join('')}
            </select></div>
          <div class="field"><label class="label" for="invDue">Payment due</label>
            <input class="input" id="invDue" type="date" value="2026-10-01"></div>
        </div>

        <div class="col g-3">
          <div class="row between"><span class="t-eyebrow">Billable items</span>
            <button class="btn btn-ghost btn-sm" data-add>${ic('plus', 13)} Add item</button></div>
          <div id="invLines">${lines()}</div>
        </div>

        <div id="invTotals">${totalsBlock()}</div>

        <div class="card card-flat card-bd col g-2" style="background:var(--surface-2)">
          <div class="row g-2"><span class="t-eyebrow">Invoice branding</span>
            <span class="spacer"></span><span class="chip chip-accent">${ic('sync', 11)} ${esc(K.org.xeroBrand)}</span></div>
          <div class="t-xs muted">${esc(K.org.legal)} · GST ${esc(K.org.gst)}<br>
            Payments to <span class="t-mono">${esc(K.org.bank)}</span> (${esc(K.org.bankName)})<br>
            ${esc(K.org.terms)}</div>
        </div>

        <div class="divider"></div>
        <label class="row g-3">
          <span class="switch"><input type="checkbox" id="splitToggle" ${state.split ? 'checked' : ''}>
            <span class="track"></span><span class="thumb"></span></span>
          <span class="grow"><b class="t-sm">Split this invoice</b><br>
            <span class="t-xs subtle">Charge part to the patient and the rest to a third party</span></span>
        </label>
        <div id="splitArea">${state.split ? splitBlock() : ''}</div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button>
        <span class="spacer"></span>
        <button class="btn btn-secondary" data-draft>Save as draft</button>
        <button class="btn btn-primary" data-issue>${ic('send', 15)} Create ${state.split ? '2 invoices' : 'invoice'}</button>`,
      onMount(panel, close) {
        const refresh = () => {
          qs('#invLines', panel).innerHTML = lines();
          qs('#invTotals', panel).innerHTML = totalsBlock();
          qs('#splitArea', panel).innerHTML = state.split ? splitBlock() : '';
          qs('[data-issue]', panel).innerHTML = `${ic('send', 15)} Create ${state.split ? '2 invoices' : 'invoice'}`;
        };
        on(panel, 'change', 'select[data-li]', (e, t) => {
          const n = Number(t.dataset.li);
          if (t.value === '__custom') { state.items[n] = { code: null, d: 'Other item', q: state.items[n].q, p: state.items[n].p }; }
          else { const b = K.code(t.value); state.items[n] = { code: b.code, d: b.name, q: state.items[n].q, p: b.price }; }
          refresh();
        });
        on(panel, 'input', 'input[data-li]', (e, t) => {
          const n = Number(t.dataset.li), k = t.dataset.k;
          state.items[n][k] = k === 'd' ? t.value : Number(t.value) || 0;
          qs('#invTotals', panel).innerHTML = totalsBlock();
          if (state.split) qs('#splitArea', panel).innerHTML = splitBlock();
          const row = t.closest('tr'); if (row) row.querySelector('td:nth-child(4) b').textContent = money(state.items[n].q * state.items[n].p);
        });
        on(panel, 'click', '[data-rm]', (e, t) => { state.items.splice(Number(t.dataset.rm), 1); refresh(); });
        qs('[data-add]', panel).addEventListener('click', () => {
          const b = K.billingCodes.find(x => x.active);
          state.items.push({ code: b.code, d: b.name, q: 1, p: b.price }); refresh();
        });
        qs('#invPayer', panel).addEventListener('change', e => { state.payer = e.target.value; refresh(); });
        qs('#splitToggle', panel).addEventListener('change', e => { state.split = e.target.checked; refresh(); });

        on(panel, 'input', '#splitRange', (e, t) => {
          state.pct = Number(t.value);
          qs('#splitArea', panel).innerHTML = splitBlock();
          const r = qs('#splitRange', panel); r.focus();
        });
        on(panel, 'change', '#splitPct', (e, t) => { state.pct = Math.max(0, Math.min(100, Number(t.value) || 0)); qs('#splitArea', panel).innerHTML = splitBlock(); });
        on(panel, 'change', '#splitAmt', (e, t) => {
          const total = calc().incl;
          state.pct = Math.round(Math.max(0, Math.min(total, Number(t.value) || 0)) / total * 100);
          qs('#splitArea', panel).innerHTML = splitBlock();
        });

        qs('[data-draft]', panel).addEventListener('click', () => {
          close(); U.toast('Draft saved', `${money(calc().incl)} for ${pt.first} ${pt.last}.`, 'ok');
        });
        qs('[data-issue]', panel).addEventListener('click', () => {
          const t = calc();
          const id = 'INV-' + (10490 + Math.floor(Math.random() * 40));
          if (state.split) {
            K.invoices.unshift({ id, pt: pt.id, cl: appt ? appt.cl : 'u1', date: '2026-09-17', due: '2026-10-01',
              payer: 'Private', status: 'sent', items: [{ d: `${state.items[0].d} (patient share ${state.pct}%)`, q: 1, p: t.excl * state.pct / 100 }], paid: 0 });
            K.invoices.unshift({ id: id + 'B', pt: pt.id, cl: appt ? appt.cl : 'u1', date: '2026-09-17', due: '2026-10-01',
              payer: state.payer === 'Private' ? 'Southern Cross' : state.payer, status: 'sent',
              items: [{ d: `${state.items[0].d} (third party ${100 - state.pct}%)`, q: 1, p: t.excl * (100 - state.pct) / 100 }], paid: 0 });
          } else {
            K.invoices.unshift({ id, pt: pt.id, cl: appt ? appt.cl : 'u1', date: '2026-09-17', due: '2026-10-01',
              payer: state.payer, status: 'sent', items: state.items.slice(), paid: 0 });
          }
          if (appt) appt.invoiced = true;
          close();
          U.mountView(window.Views.billing);
          U.toast(state.split ? '2 invoices created' : 'Invoice created', `${money(t.incl)} · ${pt.first} ${pt.last}`, 'ok');
        });
      }
    });
    return d;
  }

  /* --------------------------------------------------------- payment */
  function payDrawer(inv, re) {
    const t = U.invoiceTotals(inv), pt = K.pt(inv.pt);
    U.modal({
      title: 'Record payment',
      sub: `${inv.id} · ${pt.first} ${pt.last}`,
      icon: 'card', tone: 'ok',
      body: `<div class="col g-4">
        <div class="card card-flat card-bd row between">
          <span class="col g-1"><span class="t-eyebrow">Amount due</span>
            <span class="t-metric">${money(t.incl)}</span>
            <span class="t-xs subtle">${money(t.excl)} + ${money(t.gst)} GST</span></span>
          ${U.funderChip(inv.payer)}
        </div>
        <div class="field"><label class="label" for="payAmt">Amount received</label>
          <div class="input-group"><input class="input input-money" id="payAmt" type="number" step="0.01" value="${t.incl.toFixed(2)}" data-autofocus>
            <span class="affix">NZD</span></div></div>
        <div class="field"><label class="label">Method</label>
          <div class="row g-2 wrap">
            ${['EFTPOS', 'Cash', 'Bank transfer', 'Credit card'].map((m, i) =>
              `<button class="btn ${i === 0 ? 'btn-soft' : 'btn-secondary'} btn-sm" data-method="${m}">${m}</button>`).join('')}
          </div></div>
        <div class="field"><label class="label" for="payRef">Reference</label>
          <input class="input" id="payRef" placeholder="Terminal reference or receipt number"></div>
        <div class="divider"></div>
        <label class="row g-3"><span class="switch"><input type="checkbox" id="rcptEmail" checked><span class="track"></span><span class="thumb"></span></span>
          <span class="t-sm">Email receipt to <b>${esc(pt.email)}</b></span></label>
        <label class="row g-3"><span class="switch"><input type="checkbox"><span class="track"></span><span class="thumb"></span></span>
          <span class="t-sm">Print receipt now</span></label>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button>
               <button class="btn btn-primary" data-go>${ic('check', 15)} Mark as paid</button>`,
      onMount(panel, close) {
        let method = 'EFTPOS';
        on(panel, 'click', '[data-method]', (e, b) => {
          qsa('[data-method]', panel).forEach(x => x.className = 'btn btn-secondary btn-sm');
          b.className = 'btn btn-soft btn-sm'; method = b.dataset.method;
        });
        qs('[data-go]', panel).addEventListener('click', () => {
          inv.status = 'paid'; inv.paid = Number(qs('#payAmt', panel).value);
          close(); re();
          U.toast('Payment recorded', `${money(inv.paid)} by ${method}${qs('#rcptEmail', panel).checked ? ' · receipt emailed' : ''}`, 'ok');
        });
      }
    });
  }
})();
