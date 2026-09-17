/* Kora Health — Patient workspace (unified patient view) */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa, money } = U;
  window.Views = window.Views || {};

  const TABS = [
    { id: 'summary',  label: 'Summary',       icon: 'dashboard' },
    { id: 'timeline', label: 'Timeline',      icon: 'clock' },
    { id: 'notes',    label: 'Notes',         icon: 'file' },
    { id: 'letters',  label: 'Letters',       icon: 'letters' },
    { id: 'rx',       label: 'Prescriptions', icon: 'rx' },
    { id: 'tests',    label: 'Tests',         icon: 'flask' },
    { id: 'referrals',label: 'Referrals',     icon: 'referral' },
    { id: 'invoices', label: 'Invoices',      icon: 'billing' },
    { id: 'docs',     label: 'Documents',     icon: 'copy' },
  ];

  let timelineFilter = 'all';

  /* --------------------------------------------------------- header */
  function header(p, tab) {
    const gp = K.gp(p.gp);
    const counts = {
      letters: K.letters.filter(l => l.pt === p.id).length,
      invoices: K.invoices.filter(i => i.pt === p.id).length,
      notes: K.notes.filter(n => n.pt === p.id).length,
      timeline: (K.timeline[p.id] || []).length,
      rx: K.prescriptions.filter(r => r.pt === p.id).length,
      tests: K.testRequests.filter(r => r.pt === p.id).length,
    };
    return `<div class="pt-header">
      <div class="pt-id">
        ${avatar(p.id, 'xl', p.tone)}
        <div class="grow" style="min-width:0">
          <div class="row g-3 wrap">
            <h1 class="pt-name">${esc(p.first)} ${esc(p.last)}</h1>
            ${U.funderChip(p.funder)}
          </div>
          <div class="pt-meta">
            <span>${U.age(p.dob)}y ${p.sex}</span><span class="dot-sep">·</span>
            <span>${U.fmtDate(p.dob)}</span><span class="dot-sep">·</span>
            <span>NHI <span class="t-mono">${esc(p.nhi)}</span>
              <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Copy NHI" data-copy="${esc(p.nhi)}" aria-label="Copy NHI">${ic('copy', 13)}</button></span>
            <span class="dot-sep">·</span><span>${esc(p.phone)}</span>
            <span class="dot-sep">·</span><span>GP ${esc(gp.name)}</span>
          </div>
          <div class="pt-badges mt-2">
            ${p.alerts.map(a => `<span class="alert-badge">${ic('alert', 13)}${esc(a)}</span>`).join('')}
            ${p.warn.map(a => `<span class="alert-badge warn">${ic('info', 13)}${esc(a)}</span>`).join('')}
            ${p.claim ? `<span class="chip chip-warm">${ic('acc', 12)} ${esc(p.claim)}</span>` : ''}
          </div>
        </div>
        <div class="col g-2" style="align-items:flex-end">
          <div class="row g-2">
            <a class="btn btn-primary btn-sm" href="#/consult/${p.id}">${ic('stethoscope', 14)} Start consult</a>
            <button class="btn btn-secondary btn-sm" data-act="email">${ic('send', 14)} Email</button>
            <button class="btn btn-secondary btn-sm" data-act="print">${ic('print', 14)} Print</button>
            <button class="btn btn-secondary btn-icon btn-sm" data-act="more" aria-label="More actions">${ic('dots', 15)}</button>
          </div>
          <span class="saved" id="ptSaved">${ic('check', 13)} All changes saved</span>
        </div>
      </div>

      <nav class="tabs mt-4" role="tablist" aria-label="Patient sections">
        ${TABS.map(t => `<button role="tab" aria-selected="${t.id === tab}" data-tab="${t.id}">
          ${ic(t.icon, 15)} ${t.label}
          ${counts[t.id] ? `<span class="badge-count quiet">${counts[t.id]}</span>` : ''}
        </button>`).join('')}
      </nav>
    </div>`;
  }

  /* --------------------------------------------------------- summary */
  function summary(p) {
    const gp = K.gp(p.gp);
    const upcoming = K.appts.filter(a => a.pt === p.id && a.status === 'booked').sort((a, b) => a.start - b.start);
    const invs = K.invoices.filter(i => i.pt === p.id);
    const owing = invs.filter(i => i.status === 'sent' || i.status === 'overdue')
      .reduce((s, i) => s + U.invoiceTotals(i).incl, 0);

    return `<div class="dash-grid">
      <div class="col-4 col g-4">
        <section class="card">
          <div class="card-hd"><h3>Contact</h3>
            <span class="spacer"></span>
            <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Edit" data-act="edit-contact" aria-label="Edit contact">${ic('edit', 14)}</button></div>
          <div class="card-bd"><dl class="kv">
            <dt>Mobile</dt><dd>${esc(p.phone)}</dd>
            <dt>Email</dt><dd class="truncate">${esc(p.email)}</dd>
            <dt>Address</dt><dd>${esc(p.addr)}</dd>
            <dt>Next of kin</dt><dd>${esc(p.nok)}</dd>
            <dt>Preferred</dt><dd>Text message reminders</dd>
          </dl></div>
        </section>

        <section class="card">
          <div class="card-hd"><h3>General practice</h3></div>
          <div class="card-bd"><dl class="kv">
            <dt>GP</dt><dd>${esc(gp.name)}</dd>
            <dt>Practice</dt><dd>${esc(gp.practice)}</dd>
            <dt>Healthlink</dt><dd class="t-mono t-sm">${esc(gp.hl)}</dd>
            <dt>Email</dt><dd class="truncate">${esc(gp.email)}</dd>
          </dl>
          <div class="mt-4"><button class="btn btn-secondary btn-sm btn-block" data-act="letter">${ic('letters', 14)} Write to GP</button></div></div>
        </section>
      </div>

      <div class="col-4 col g-4">
        ${p.funder === 'ACC' ? `
        <section class="card">
          <div class="card-hd">
            <span class="stat-ic" style="background:var(--warm-soft);color:var(--warm-text)">${ic('acc', 15)}</span>
            <h3>ACC claim</h3><span class="spacer"></span>
            ${p.injury ? chip('approved', { label: 'Active' }) : chip('overdue', { label: 'Incomplete' })}
          </div>
          <div class="card-bd">
            <dl class="kv">
              <dt>Claim number</dt><dd class="t-mono">${esc(p.claim)}</dd>
              <dt>Date of injury</dt><dd>${p.injury ? U.fmtDate(p.injury) : '<span class="bad-t">Missing</span>'}</dd>
              <dt>Injury site</dt><dd>Right knee — soft tissue</dd>
              <dt>Approved</dt><dd>6 of 12 sessions used</dd>
            </dl>
            ${!p.injury ? `<div class="banner bad mt-4"><span class="b-ic">${ic('alert', 15)}</span>
              <span class="grow"><b>Date of injury missing</b><br><span class="t-xs">ACC will reject invoices without it.</span></span>
              <button class="btn btn-secondary btn-sm" data-act="fix-injury">Fix now</button></div>` : ''}
          </div>
        </section>` : `
        <section class="card">
          <div class="card-hd"><h3>Funding</h3></div>
          <div class="card-bd"><dl class="kv">
            <dt>Type</dt><dd>${esc(p.funder)}</dd>
            ${p.funder === 'Southern Cross' ? `<dt>Member no.</dt><dd class="t-mono">SC-4471-0${p.id.slice(1)}</dd>
              <dt>Prior approval</dt><dd>${chip('approved', { label: 'Approved' })}</dd>` :
              `<dt>Billing</dt><dd>Invoice patient directly</dd>`}
            <dt>Terms</dt><dd>14 days from invoice</dd>
          </dl></div>
        </section>`}

        <section class="card">
          <div class="card-hd"><h3>Active referrals</h3><span class="spacer"></span>
            <button class="btn btn-ghost btn-sm" data-act="new-referral">${ic('plus', 13)} New</button></div>
          <div class="list-rows">
            <div class="work-row">
              <span class="work-ic" style="background:var(--accent-soft);color:var(--accent-text)">${ic('referral', 15)}</span>
              <span class="grow"><b>${esc(K.gp(p.gp).name)} → Dr Alice Fenwick</b>
                <span>Received 12 Aug 2026 · expires 12 Feb 2027</span></span>
              ${chip('approved', { label: 'Active' })}
            </div>
            <div class="work-row">
              <span class="work-ic" style="background:var(--surface-3);color:var(--text-muted)">${ic('referral', 15)}</span>
              <span class="grow"><b>Physiotherapy — Kōwhai Physio</b>
                <span>Sent 20 Aug 2026 · 4 of 6 sessions</span></span>
              ${chip('sent', { label: 'In progress' })}
            </div>
          </div>
        </section>
      </div>

      <div class="col-4 col g-4">
        <section class="card">
          <div class="card-hd"><h3>Upcoming appointments</h3></div>
          <div class="list-rows">
            ${upcoming.length ? upcoming.map(a => `<a class="work-row" href="#/appointments">
              <span class="work-ic" style="background:var(--info-bg);color:var(--info-fg)">${ic('calendar', 15)}</span>
              <span class="grow"><b>${U.fmtTime(a.start)} today</b>
                <span>${esc(K.at(a.type).name)} · ${esc(K.st(a.cl).name)}</span></span>
              ${chip(a.status)}</a>`).join('')
              : U.empty('calendar', 'Nothing booked', 'Use the + New button to book this patient in.')}
          </div>
          <div class="card-ft"><button class="btn btn-secondary btn-sm btn-block" data-act="book">${ic('plus', 14)} Book appointment</button></div>
        </section>

        <section class="card">
          <div class="card-hd"><h3>Account</h3><span class="spacer"></span>
            <a class="btn btn-ghost btn-sm" href="#/billing">All invoices ${ic('chevronRight', 13)}</a></div>
          <div class="card-bd col g-4">
            <div class="row between">
              <div class="col g-1"><span class="t-eyebrow">Outstanding</span>
                <span class="t-metric ${owing > 0 ? 'bad-t' : 'ok-t'}">${money(owing)}</span></div>
              <div class="col g-1" style="text-align:right"><span class="t-eyebrow">Lifetime</span>
                <span class="t-h3 num">${money(invs.reduce((s, i) => s + U.invoiceTotals(i).incl, 0))}</span></div>
            </div>
            <div class="divider"></div>
            ${invs.slice(0, 3).map(i => `<a class="row between t-sm" style="text-decoration:none;color:inherit" href="#/billing">
              <span class="t-mono t-xs">${esc(i.id)}</span>
              <span class="row g-2"><span class="num">${money(U.invoiceTotals(i).incl)}</span>${chip(i.status)}</span>
            </a>`).join('') || '<span class="t-sm subtle">No invoices yet.</span>'}
          </div>
        </section>
      </div>
    </div>`;
  }

  /* --------------------------------------------------------- timeline */
  const FEED_FILTERS = [
    { id: 'all',     label: 'Everything' },
    { id: 'note',    label: 'Notes' },
    { id: 'letter',  label: 'Letters' },
    { id: 'rx',      label: 'Prescriptions' },
    { id: 'result',  label: 'Results' },
    { id: 'invoice', label: 'Invoices' },
  ];

  function timelineTab(p) {
    const events = (K.timeline[p.id] || []).filter(e => timelineFilter === 'all' || e.kind === timelineFilter);
    const grouped = {};
    events.forEach(e => { const d = e.at.slice(0, 10); (grouped[d] = grouped[d] || []).push(e); });
    const keys = Object.keys(grouped).sort().reverse();

    return `<div class="dash-grid">
      <div class="col-8">
        <div class="toolbar">
          <span class="t-eyebrow">Filter</span>
          <div class="pill-nav" role="group" aria-label="Filter timeline">
            ${FEED_FILTERS.map(f => `<button aria-pressed="${timelineFilter === f.id}" data-feed="${f.id}">${f.label}</button>`).join('')}
          </div>
          <span class="spacer"></span>
          <span class="t-xs subtle">${events.length} events</span>
        </div>

        ${keys.length ? keys.map(d => `
          <div class="feed-date">${U.fmtLongDate(d)}</div>
          <div class="feed">
            ${grouped[d].map(e => `<article class="feed-item">
              <span class="feed-rail"><span class="feed-ic ${e.kind}">${ic(
                { note: 'file', letter: 'letters', rx: 'rx', result: 'flask', invoice: 'billing' }[e.kind] || 'file', 15)}</span></span>
              <div class="feed-card">
                <div class="row between g-3">
                  <b class="t-sm">${esc(e.title)}</b>
                  <span class="row g-2">
                    ${e.status ? chip(e.status === 'normal' ? 'approved' : e.status, { label: e.status === 'normal' ? 'Normal' : null }) : ''}
                    ${e.kind === 'note' && !e.signed ? chip('pending', { label: 'Unsigned' }) : ''}
                    <span class="t-xs subtle">${U.fmtClock(e.at)}</span>
                  </span>
                </div>
                <p class="t-sm muted mt-2">${esc(e.body)}</p>
                <div class="row g-2 mt-3">
                  ${e.by ? `<span class="row g-2 t-xs subtle">${avatar(e.by, 'xs')} ${esc(K.st(e.by).name)}</span>` : '<span class="t-xs subtle">External</span>'}
                  <span class="spacer"></span>
                  ${e.kind === 'note' && !e.signed ? `<button class="btn btn-soft btn-sm" data-sign>${ic('check', 13)} Sign note</button>` : ''}
                  <button class="btn btn-ghost btn-sm">${ic('eye', 13)} Open</button>
                </div>
              </div>
            </article>`).join('')}
          </div>`).join('')
          : U.empty('clock', 'Nothing to show', 'No events match this filter. Try “Everything”.')}
      </div>

      <div class="col-4">
        <section class="card">
          <div class="card-hd"><h3>At a glance</h3></div>
          <div class="card-bd col g-4">
            <dl class="kv">
              <dt>First seen</dt><dd>29 Jul 2026</dd>
              <dt>Episodes</dt><dd>1 open</dd>
              <dt>Last contact</dt><dd>Today, ${U.fmtTime(8 * 60 + 30)}</dd>
              <dt>Letters sent</dt><dd>${K.letters.filter(l => l.pt === p.id && l.status === 'sent').length}</dd>
            </dl>
            <div class="divider"></div>
            <span class="t-eyebrow">Allergies & alerts</span>
            ${p.alerts.length || p.warn.length
              ? [...p.alerts.map(a => `<span class="alert-badge">${ic('alert', 13)}${esc(a)}</span>`),
                 ...p.warn.map(a => `<span class="alert-badge warn">${ic('info', 13)}${esc(a)}</span>`)].join('')
              : '<span class="t-sm subtle">No known allergies recorded.</span>'}
          </div>
        </section>
      </div>
    </div>`;
  }

  /* --------------------------------------------------------- simple tabs */
  function lettersTab(p) {
    const list = K.letters.filter(l => l.pt === p.id);
    if (!list.length) return card(U.empty('letters', 'No letters yet',
      'Letters you write for this patient appear here with their approval status.',
      `<button class="btn btn-primary btn-sm" data-act="letter">${ic('plus', 14)} New letter</button>`));
    return `<section class="card"><div class="table-wrap"><table class="tbl">
      <thead><tr><th>Letter</th><th>Recipient</th><th>Author</th><th>Channel</th><th>Updated</th><th>Status</th><th></th></tr></thead>
      <tbody>${list.map(l => `<tr data-letter="${l.id}" tabindex="0">
        <td><b>${esc(l.title)}</b>${l.aiAssisted ? ` <span class="chip chip-warm">${ic('sparkle', 11)} AI draft</span>` : ''}</td>
        <td class="t-sm">${esc(K.gp(l.to).name)}<br><span class="t-xs subtle">${esc(K.gp(l.to).practice)}</span></td>
        <td class="t-sm"><span class="row g-2">${avatar(l.cl, 'xs')}${esc(K.st(l.cl).name)}</span></td>
        <td class="t-sm">${esc(l.channel)}</td>
        <td class="t-sm">${U.relTime(l.updated)}</td>
        <td>${chip(l.status)}</td>
        <td><span class="row-actions"><button class="btn btn-ghost btn-icon btn-sm" aria-label="Open">${ic('chevronRight', 14)}</button></span></td>
      </tr>`).join('')}</tbody></table></div></section>`;
  }

  function invoicesTab(p) {
    const list = K.invoices.filter(i => i.pt === p.id);
    if (!list.length) return card(U.empty('billing', 'No invoices yet',
      'Invoices raised from this patient’s appointments appear here.',
      `<button class="btn btn-primary btn-sm" data-act="invoice">${ic('plus', 14)} Create invoice</button>`));
    return `<section class="card"><div class="table-wrap"><table class="tbl">
      <thead><tr><th>Invoice</th><th>Date</th><th>Payer</th><th>Clinician</th>
        <th class="num-cell">Excl GST</th><th class="num-cell">GST</th><th class="num-cell">Total</th><th>Status</th></tr></thead>
      <tbody>${list.map(i => { const t = U.invoiceTotals(i);
        return `<tr><td class="t-mono t-sm">${esc(i.id)}</td><td class="t-sm">${U.fmtDate(i.date)}</td>
        <td>${U.funderChip(i.payer)}</td><td class="t-sm">${esc(K.st(i.cl).name)}</td>
        <td class="num-cell">${money(t.excl)}</td><td class="num-cell subtle">${money(t.gst)}</td>
        <td class="num-cell"><b>${money(t.incl)}</b></td><td>${chip(i.status)}</td></tr>`;
      }).join('')}</tbody></table></div></section>`;
  }

  function card(inner) { return `<section class="card">${inner}</section>`; }

  /* --------------------------------------------------------- prescriptions */
  const RX_STATUS = { sent: 'sent', dispensed: 'paid', cancelled: 'draft' };

  function rxTab(p) {
    const list = K.prescriptions.filter(r => r.pt === p.id)
      .sort((a, b) => b.at.localeCompare(a.at));
    return `<div class="col g-4">
      ${p.alerts.length ? `<div class="banner bad"><span class="b-ic">${ic('alert', 16)}</span>
        <span class="grow"><b>Recorded allergies — checked on every prescription</b><br>
        <span class="t-sm">${p.alerts.map(esc).join(' · ')}</span></span></div>` : ''}
      <section class="card">
        <div class="card-hd"><h3>Prescriptions</h3><span class="chip">${list.length}</span>
          <span class="spacer"></span>
          <button class="btn btn-primary btn-sm" data-act="rx">${ic('plus', 14)} New prescription</button></div>
        ${list.length ? `<div class="table-wrap"><table class="tbl">
          <thead><tr><th>Medicine</th><th>Directions</th><th class="num-cell">Qty</th>
            <th class="num-cell">Repeats</th><th>Pharmacy</th><th>Prescriber</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>${list.map(r => { const m = K.med(r.med), ph = K.pharm(r.pharmacy);
            return `<tr>
              <td><b>${esc(m.name)}</b><br><span class="t-xs subtle">${esc(m.form)}</span>
                ${m.funded ? '' : '<span class="chip chip-warn">Unfunded</span>'}</td>
              <td class="t-sm">${esc(m.dose)}</td>
              <td class="num-cell">${r.qty}</td>
              <td class="num-cell">${r.repeats}</td>
              <td class="t-sm">${esc(ph.name)}<br><span class="t-xs subtle t-mono">${esc(ph.edi)}</span></td>
              <td class="t-sm">${esc(K.st(r.by).name)}</td>
              <td class="t-sm">${U.fmtDateShort(r.at.slice(0, 10))}</td>
              <td>${chip(RX_STATUS[r.status], { label: r.status === 'dispensed' ? 'Dispensed' : r.status === 'sent' ? 'Sent to pharmacy' : 'Cancelled' })}</td>
            </tr>`; }).join('')}</tbody></table></div>`
          : U.empty('rx', 'No current prescriptions',
              'Prescriptions are sent electronically to the patient’s chosen pharmacy. Allergies on the record are checked before anything is sent.',
              `<button class="btn btn-primary btn-sm" data-act="rx">${ic('plus', 14)} New prescription</button>`)}
      </section>
    </div>`;
  }

  function newRx(p, root, pr) {
    let medId = 'm1';
    const clash = () => K.allergyClash(p.id, medId);

    function detail() {
      const m = K.med(medId), c = clash();
      return `${c ? `<div class="banner bad"><span class="b-ic">${ic('alert', 16)}</span>
          <span class="grow"><b>Allergy warning — ${esc(m.name)} is a ${esc(c.cls)}</b><br>
          <span class="t-sm">This patient’s record says: <b>${esc(c.alert)}</b>. Choose another medicine, or record why you are overriding.</span></span>
        </div>
        <div class="field"><label class="label" for="rxOverride">Reason for overriding <span class="req">*</span></label>
          <input class="input" id="rxOverride" placeholder="e.g. previous reaction was intolerance, not allergy"></div>` : ''}
      <div class="grid" style="grid-template-columns:1fr 1fr">
        <div class="field"><label class="label" for="rxQty">Quantity</label>
          <input class="input input-money" id="rxQty" type="number" min="1" value="${m.qty}"></div>
        <div class="field"><label class="label" for="rxRep">Repeats</label>
          <input class="input input-money" id="rxRep" type="number" min="0" value="${m.repeats}"></div>
      </div>
      <div class="field"><label class="label" for="rxDose">Directions</label>
        <textarea class="textarea" id="rxDose" rows="2">${esc(m.dose)}</textarea></div>
      ${m.funded ? '' : `<div class="banner warn"><span class="b-ic">${ic('info', 15)}</span>
        <span class="t-sm">Not funded by Pharmac — the patient pays the full cost. Tell them before sending.</span></div>`}`;
    }

    U.modal({
      title: 'New prescription', sub: `${p.first} ${p.last} · ${p.nhi} · ${U.age(p.dob)}y`,
      icon: 'rx', wide: true,
      body: `<div class="col g-4">
        <div class="field"><label class="label" for="rxMed">Medicine</label>
          <select class="select" id="rxMed" data-autofocus>
            ${K.medicines.map(m => `<option value="${m.id}">${esc(m.name)} ${esc(m.form)}${m.funded ? '' : ' — unfunded'}</option>`).join('')}
          </select></div>
        <div id="rxDetail" class="col g-4">${detail()}</div>
        <div class="divider"></div>
        <div class="field"><label class="label" for="rxPharm">Send electronically to</label>
          <select class="select" id="rxPharm">
            ${K.pharmacies.map(x => `<option value="${x.id}">${esc(x.name)} — ${esc(x.addr)}</option>`).join('')}
          </select>
          <span class="hint">The pharmacy receives it before the patient arrives. No paper script needed.</span></div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button>
        <span class="spacer"></span>
        <button class="btn btn-secondary" data-print>${ic('print', 14)} Print instead</button>
        <button class="btn btn-primary" data-send>${ic('send', 15)} Sign and send</button>`,
      onMount(panel, close) {
        const repaint = () => { qs('#rxDetail', panel).innerHTML = detail(); };
        qs('#rxMed', panel).addEventListener('change', e => { medId = e.target.value; repaint(); });
        const commit = (viaPrint) => {
          const c = clash();
          if (c) {
            const reason = qs('#rxOverride', panel);
            if (!reason || !reason.value.trim()) {
              reason && reason.setAttribute('aria-invalid', 'true');
              U.toast('Allergy override needs a reason', `${K.med(medId).name} clashes with “${c.alert}”.`, 'bad');
              return;
            }
          }
          const m = K.med(medId), ph = K.pharm(qs('#rxPharm', panel).value);
          K.prescriptions.unshift({ id: 'rx' + Date.now(), pt: p.id, by: 'u1', at: '2026-09-17T10:22',
            med: medId, pharmacy: ph.id, status: viaPrint ? 'dispensed' : 'sent',
            qty: Number(qs('#rxQty', panel).value), repeats: Number(qs('#rxRep', panel).value) });
          close();
          U.mountView(window.Views.patient, pr);
          U.toast(viaPrint ? 'Prescription printed' : 'Prescription sent',
            viaPrint ? `${m.name} — signed and printed` : `${m.name} → ${ph.name}`, 'ok');
        };
        qs('[data-send]', panel).addEventListener('click', () => commit(false));
        qs('[data-print]', panel).addEventListener('click', () => commit(true));
      }
    });
  }

  /* --------------------------------------------------------- test requests */
  const TR_STATUS = { sent: 'sent', resulted: 'paid', cancelled: 'draft' };

  function testsTab(p) {
    const list = K.testRequests.filter(r => r.pt === p.id).sort((a, b) => b.at.localeCompare(a.at));
    return `<section class="card">
      <div class="card-hd"><h3>Test requests</h3><span class="chip">${list.length}</span>
        <span class="spacer"></span>
        <button class="btn btn-primary btn-sm" data-act="test">${ic('plus', 14)} New test request</button></div>
      ${list.length ? `<div class="table-wrap"><table class="tbl">
        <thead><tr><th>Test</th><th>Clinical details</th><th>Provider</th>
          <th>Requested by</th><th>Date</th><th>Urgency</th><th>Status</th></tr></thead>
        <tbody>${list.map(r => { const t = K.test(r.test), pv = K.prov(r.provider);
          return `<tr>
            <td><span class="row g-2">${ic(t.kind === 'radiology' ? 'flask' : 'flask', 14)}
              <span><b>${esc(t.name)}</b><br><span class="t-xs subtle">${t.kind === 'radiology' ? 'Radiology' : 'Pathology'}</span></span></span></td>
            <td class="t-sm">${esc(r.note)}</td>
            <td class="t-sm">${esc(pv.name)}<br><span class="t-xs subtle t-mono">${esc(pv.edi)}</span></td>
            <td class="t-sm">${esc(K.st(r.by).name)}</td>
            <td class="t-sm">${U.fmtDateShort(r.at.slice(0, 10))}</td>
            <td>${r.urgency === 'urgent' ? chip('overdue', { label: 'Urgent' }) : chip('draft', { label: 'Routine' })}</td>
            <td>${chip(TR_STATUS[r.status], { label: r.status === 'resulted' ? 'Result filed' : 'Sent' })}</td>
          </tr>`; }).join('')}</tbody></table></div>`
        : U.empty('flask', 'No test requests yet',
            'Radiology and pathology requests are sent electronically, and results file straight back onto this patient’s timeline.',
            `<button class="btn btn-primary btn-sm" data-act="test">${ic('plus', 14)} New test request</button>`)}
    </section>`;
  }

  function newTest(p, root, pr) {
    let testId = 't-xr';
    function detail() {
      const t = K.test(testId);
      const providers = K.testProviders.filter(x => x.kind === t.kind);
      return `<div class="banner"><span class="b-ic">${ic('info', 15)}</span>
          <span class="t-sm"><b>Preparation:</b> ${esc(t.prep)}</span></div>
        <div class="field"><label class="label" for="trProv">Send to</label>
          <select class="select" id="trProv">
            ${providers.map(x => `<option value="${x.id}">${esc(x.name)}</option>`).join('')}
          </select></div>
        ${p.funder === 'ACC' && t.accFundable ? `<label class="row g-3">
          <span class="switch"><input type="checkbox" id="trAcc" checked><span class="track"></span><span class="thumb"></span></span>
          <span class="grow"><b class="t-sm">Bill to ACC claim ${esc(p.claim || '')}</b><br>
            <span class="t-xs subtle">The claim number and injury date go with the request, so the provider bills ACC directly.</span></span>
        </label>` : ''}`;
    }

    U.modal({
      title: 'New test request', sub: `${p.first} ${p.last} · ${p.nhi}`,
      icon: 'flask', wide: true,
      body: `<div class="col g-4">
        <div class="field"><label class="label" for="trTest">Test</label>
          <select class="select" id="trTest" data-autofocus>
            <optgroup label="Radiology">
              ${K.testCatalogue.filter(t => t.kind === 'radiology').map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
            </optgroup>
            <optgroup label="Pathology">
              ${K.testCatalogue.filter(t => t.kind === 'pathology').map(t => `<option value="${t.id}">${esc(t.name)}</option>`).join('')}
            </optgroup>
          </select></div>
        <div id="trDetail" class="col g-4">${detail()}</div>
        <div class="field"><label class="label" for="trNote">Clinical details <span class="req">*</span></label>
          <textarea class="textarea" id="trNote" rows="2" placeholder="What are you looking for? The reporting radiologist or pathologist reads this."></textarea></div>
        <div class="field"><label class="label">Urgency</label>
          <div class="segmented"><button aria-pressed="true" data-urg="routine">Routine</button>
            <button aria-pressed="false" data-urg="urgent">Urgent</button></div></div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button>
        <span class="spacer"></span>
        <button class="btn btn-primary" data-send>${ic('send', 15)} Sign and send</button>`,
      onMount(panel, close) {
        let urgency = 'routine';
        qs('#trTest', panel).addEventListener('change', e => { testId = e.target.value; qs('#trDetail', panel).innerHTML = detail(); });
        on(panel, 'click', '[data-urg]', (e, b) => {
          qsa('[data-urg]', panel).forEach(x => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true'); urgency = b.dataset.urg;
        });
        qs('[data-send]', panel).addEventListener('click', () => {
          const note = qs('#trNote', panel);
          if (!note.value.trim()) {
            note.setAttribute('aria-invalid', 'true');
            U.toast('Clinical details are required', 'The reporting provider needs to know what you are looking for.', 'warn');
            return;
          }
          const t = K.test(testId), pv = K.prov(qs('#trProv', panel).value);
          K.testRequests.unshift({ id: 'tr' + Date.now(), pt: p.id, by: 'u1', at: '2026-09-17T10:22',
            test: testId, provider: pv.id, urgency, status: 'sent', note: note.value.trim() });
          close();
          U.mountView(window.Views.patient, pr);
          U.toast('Test request sent', `${t.name} → ${pv.name}`, 'ok');
        });
      }
    });
  }

  /* --------------------------------------------------------- notes */
  function notesTab(p) {
    const list = K.notes.filter(n => n.pt === p.id).sort((a, b) => b.at.localeCompare(a.at));
    const feed = (K.timeline[p.id] || []).filter(e => e.kind === 'note');
    if (!list.length && !feed.length) return card(U.empty('file', 'No notes yet',
      'Consultation notes written here are signed, timestamped and locked to the author.',
      `<button class="btn btn-primary btn-sm" data-act="note">${ic('plus', 14)} New note</button>`));
    return `<section class="card">
      <div class="card-hd"><h3>Consultation notes</h3>
        <span class="chip ${list.some(n => !n.signed) ? 'chip-warn' : ''}">${list.filter(n => !n.signed).length} unsigned</span>
        <span class="spacer"></span>
        <button class="btn btn-primary btn-sm" data-act="note">${ic('plus', 14)} New note</button></div>
      <div class="col g-4 card-bd">
        ${feed.map(e => `<article class="card card-flat card-bd col g-3">
          <div class="row between g-3">
            <b class="t-sm">${esc(e.title)}</b>
            <span class="row g-2">${e.signed ? chip('paid', { label: 'Signed' }) : chip('pending', { label: 'Unsigned' })}
              <span class="t-xs subtle">${U.fmtDate(e.at.slice(0, 10))} ${U.fmtClock(e.at)}</span></span>
          </div>
          <p class="t-sm muted">${esc(e.body)}</p>
          <div class="row g-2">
            <span class="row g-2 t-xs subtle">${avatar(e.by, 'xs')} ${esc(K.st(e.by).name)}</span>
            <span class="spacer"></span>
            ${!e.signed ? `<button class="btn btn-soft btn-sm" data-sign>${ic('check', 13)} Sign note</button>` : ''}
          </div>
        </article>`).join('')}
      </div>
    </section>`;
  }


  const PLACEHOLDERS = {
    referrals:() => card(U.empty('referral', 'No referrals on file',
      'Referrals in and out — including the referrer, expiry, and session counts.',
      `<button class="btn btn-primary btn-sm" data-act="new-referral">${ic('plus', 14)} New referral</button>`)),
    docs:     () => card(U.empty('copy', 'No documents attached',
      'Drag and drop scans, consent forms and imaging reports here, or email them to docs@korahealth.nz.',
      `<button class="btn btn-primary btn-sm">${ic('upload', 14)} Upload document</button>`)),
  };

  /* --------------------------------------------------------- view */
  window.Views.patient = {
    title: pr => { const p = K.pt(pr.id); return p ? `${p.first} ${p.last}` : 'Patient'; },
    skeleton: () => `<div class="pt-header"><div class="pt-id">
      <div class="sk sk-circle" style="width:60px;height:60px"></div>
      <div class="grow col g-2"><div class="sk" style="height:24px;width:220px"></div>
      <div class="sk sk-line" style="width:320px"></div></div></div>
      <div class="sk sk-line mt-4" style="height:32px"></div></div>
      <div class="pt-body"><div></div><div class="grid" style="grid-template-columns:repeat(3,1fr)">
      <div class="sk sk-block" style="height:220px"></div><div class="sk sk-block" style="height:220px"></div>
      <div class="sk sk-block" style="height:220px"></div></div></div>`,

    render(pr) {
      const p = K.pt(pr.id) || K.patients[0];
      const tab = pr.sub || 'summary';
      const bodies = {
        summary: () => summary(p),
        timeline: () => timelineTab(p),
        notes: () => notesTab(p),
        letters: () => lettersTab(p),
        rx: () => rxTab(p),
        tests: () => testsTab(p),
        invoices: () => invoicesTab(p),
      };
      const body = (bodies[tab] || PLACEHOLDERS[tab] || bodies.summary)(p);
      return `${header(p, tab)}
        <div style="padding:var(--s-5) var(--s-6) var(--s-10)">${body}</div>
        <button class="fab" id="ptFab" aria-haspopup="menu">${ic('plus', 18)} New</button>`;
    },

    // Reused by the consult screen so there is one prescribing path, not two.
    openRx: (p, pr) => newRx(p, null, pr),
    openTest: (p, pr) => newTest(p, null, pr),

    mount(root, pr) {
      const p = K.pt(pr.id) || K.patients[0];
      const bump = U.autosave(qs('#ptSaved', root));

      on(root, 'click', '[data-tab]', (e, t) => { location.hash = `#/patient/${p.id}/${t.dataset.tab}`; });
      on(root, 'click', '[data-feed]', (e, t) => {
        timelineFilter = t.dataset.feed;
        U.mountView(this, pr);
      });
      on(root, 'click', '[data-copy]', (e, t) => {
        navigator.clipboard && navigator.clipboard.writeText(t.dataset.copy);
        U.toast('Copied', t.dataset.copy, 'ok');
      });
      on(root, 'click', '[data-sign]', (e, t) => {
        t.outerHTML = `<span class="chip chip-ok"><i class="dot"></i>Signed just now</span>`;
        bump(); U.toast('Note signed', `${K.st('u1').name} · ${U.fmtTime(10 * 60 + 22)}`, 'ok');
      });
      on(root, 'click', '[data-letter]', (e, t) => location.hash = `#/letter/${t.dataset.letter}`);
      on(root, 'click', '[data-act="fix-injury"]', () => fixInjury(p, root, pr, bump));
      on(root, 'click', '[data-act="letter"]', () => location.hash = `#/letter/new?pt=${p.id}`);
      on(root, 'click', '[data-act="rx"]', () => newRx(p, root, pr));
      on(root, 'click', '[data-act="test"]', () => newTest(p, root, pr));
      on(root, 'click', '[data-act="note"]', () => U.toast('New note', 'The consultation note editor would open here.', 'info'));
      on(root, 'click', '[data-act="invoice"]', () => { location.hash = '#/billing'; setTimeout(() => window.Views.billing.openCreate(), 260); });
      on(root, 'click', '[data-act="book"]', () => { location.hash = '#/appointments'; setTimeout(() => window.Views.appointments.openBooking(p.id), 280); });
      on(root, 'click', '[data-act="print"]', () => U.toast('Print', 'A printable patient summary would open.', 'info'));
      on(root, 'click', '[data-act="email"]', () => U.toast('Email patient', `To ${p.email}`, 'info'));
      on(root, 'click', '[data-act="more"]', (e, t) => U.menu(t, [
        { icon: 'edit',  label: 'Edit demographics', action: () => U.toast('Edit', 'Demographics form would open.', 'info') },
        { icon: 'link',  label: 'Merge duplicate record', action: () => U.toast('Merge', 'Duplicate search would open.', 'info') },
        { icon: 'download', label: 'Export record (PDF)', action: () => U.toast('Export queued', 'You will get an email when ready.', 'info') },
        '-',
        { icon: 'alert', label: 'Add clinical alert', danger: false, action: () => U.toast('Alert added', 'Shown in the header on every screen.', 'ok') },
      ]));

      qs('#ptFab', root).addEventListener('click', e => {
        U.menu(e.currentTarget, [
          { label: `New for ${p.first} ${p.last}` },
          { icon: 'file',    label: 'Note',         kbd: 'N', action: () => U.toast('New note', 'Note editor would open.', 'info') },
          { icon: 'letters', label: 'Letter',       kbd: 'L', action: () => location.hash = `#/letter/new?pt=${p.id}` },
          { icon: 'rx',      label: 'Prescription', kbd: 'P', action: () => newRx(p, root, pr) },
          { icon: 'flask',   label: 'Test request', kbd: 'T', action: () => newTest(p, root, pr) },
          '-',
          { icon: 'send',    label: 'Email',        action: () => U.toast('Compose email', `To ${p.email}`, 'info') },
          { icon: 'tasks',   label: 'Task',         action: () => { location.hash = '#/tasks'; setTimeout(() => window.Views.tasks.openNew(p.id), 260); } },
          { icon: 'billing', label: 'Invoice',      action: () => { location.hash = '#/billing'; setTimeout(() => window.Views.billing.openCreate(), 260); } },
        ]);
      });
    },
  };

  function fixInjury(p, root, pr, bump) {
    U.modal({
      title: 'Add date of injury',
      sub: `${p.first} ${p.last} · ${p.claim}`,
      icon: 'acc', tone: 'warn',
      body: `<div class="col g-4">
        <div class="banner warn"><span class="b-ic">${ic('info', 15)}</span>
          <span>ACC needs the date of injury on every invoice for this claim. Adding it here fixes
          <b>2 queued submissions</b> at once.</span></div>
        <div class="field"><label class="label" for="doi">Date of injury <span class="req">*</span></label>
          <input class="input" id="doi" type="date" value="2026-07-28" max="2026-09-17" data-autofocus></div>
        <div class="field"><label class="label" for="mech">Mechanism of injury</label>
          <input class="input" id="mech" value="Fall from ladder at work" placeholder="e.g. fall at work"></div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button>
               <button class="btn btn-primary" data-save>${ic('check', 15)} Save and revalidate</button>`,
      onMount(panel, close) {
        qs('[data-save]', panel).addEventListener('click', () => {
          p.injury = qs('#doi', panel).value;
          K.accQueue.forEach(a => {
            if (a.pt === p.id) { a.errors = a.errors.filter(e => e.field !== 'injury'); a.valid = a.errors.length === 0; }
          });
          close(); bump();
          U.toast('Injury date saved', '2 ACC submissions now pass validation.', 'ok');
          U.mountView(window.Views.patient, pr);
        });
      }
    });
  }
})();
