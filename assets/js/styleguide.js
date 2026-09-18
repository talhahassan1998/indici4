/* Kora Health — design system page */
(function () {
  const U = window.UI, ic = window.icon, K = window.KORA;
  const { qs, on, esc, chip, avatar, money } = U;

  /* theme */
  const theme = localStorage.getItem('kora.theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const tb = qs('#sgTheme');
  const paintTheme = () => {
    const t = document.documentElement.getAttribute('data-theme');
    tb.innerHTML = `${ic(t === 'dark' ? 'sun' : 'moon', 14)} ${t === 'dark' ? 'Light' : 'Dark'}`;
  };
  tb.addEventListener('click', () => {
    const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('kora.theme', t);
    paintTheme();
  });
  paintTheme();

  /* colour ramps */
  const ramp = (el, name, steps, dark) => {
    qs(el).innerHTML = steps.map((s, i) => {
      const v = `var(--${name}-${s})`;
      return `<div style="background:${v};color:${i >= dark ? '#fff' : 'var(--n-900)'}" title="--${name}-${s}">${s}</div>`;
    }).join('');
  };
  ramp('#rampTeal', 'pou',  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900], 4);
  ramp('#rampGold', 'clay', [50, 100, 200, 300, 400, 500, 600], 4);
  ramp('#rampN',    'n',      [0, 25, 50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 900], 8);

  /* semantic swatches */
  qs('#semantic').innerHTML = [
    ['Arrived · Paid · Done', 'ok', '--ok-fg'],
    ['Waiting · Pending', 'warn', '--warn-fg'],
    ['DNA · Overdue · Error', 'bad', '--bad-fg'],
    ['Draft · Inactive', 'draft', '--draft-fg'],
    ['In consult · Info', 'info', '--info-fg'],
    ['Accent · Selected', 'accent', '--accent'],
  ].map(([label, key, token]) => `<div class="sw">
      <div class="chipbox" style="background:var(--${key === 'accent' ? 'accent-soft' : key + '-bg'});display:grid;place-items:center">
        <span class="chip ${key === 'draft' ? '' : 'chip-' + key}"><i class="dot"></i>${key}</span></div>
      <div class="meta"><b>${esc(label)}</b><span>${token}</span></div>
    </div>`).join('');

  /* buttons */
  qs('#btnRow').innerHTML = [
    ['btn-primary', 'Approve and send', 'check'],
    ['btn-secondary', 'Save draft', null],
    ['btn-soft', 'Mark arrived', 'check'],
    ['btn-warm', 'Generate draft', 'sparkle'],
    ['btn-ghost', 'Cancel', null],
    ['btn-danger', 'Record DNA', 'x'],
  ].map(([c, l, i]) => `<button class="btn ${c}">${i ? ic(i, 15) : ''}${l}</button>`).join('') +
    `<button class="btn btn-primary" disabled>Disabled</button>`;

  qs('#btnSizes').innerHTML = `
    <button class="btn btn-primary btn-lg">${ic('plus', 17)} Large</button>
    <button class="btn btn-primary">${ic('plus', 15)} Default</button>
    <button class="btn btn-primary btn-sm">${ic('plus', 13)} Small</button>
    <button class="btn btn-secondary btn-icon">${ic('dots', 15)}</button>
    <button class="btn btn-secondary btn-icon btn-sm">${ic('dots', 14)}</button>
    <div class="btn-group"><button class="btn btn-secondary">Day</button>
      <button class="btn btn-secondary">Week</button><button class="btn btn-secondary">Month</button></div>`;

  qs('#i2ic').innerHTML = ic('search', 15);
  qs('#chk1').innerHTML = ic('check', 11);

  /* chips */
  const chips = (sel, list) => qs(sel).innerHTML = list;
  chips('#chipsAppt', ['booked', 'arrived', 'consult', 'done', 'dna'].map(s => chip(s)).join(''));
  chips('#chipsLetter', ['draft', 'pending', 'approved', 'sent'].map(s => chip(s)).join(''));
  chips('#chipsInv', ['draft', 'sent', 'paid', 'overdue'].map(s => chip(s)).join(''));
  chips('#chipsFund', ['ACC', 'Southern Cross', 'Private'].map(f => U.funderChip(f)).join('') +
    `<span class="alert-badge">${ic('alert', 13)}Penicillin allergy</span>` +
    `<span class="alert-badge warn">${ic('info', 13)}Falls risk</span>`);
  chips('#chipsMisc', `<span class="badge-count">6</span><span class="badge-count quiet">12</span>
    <span class="badge-count warm">3</span>
    ${avatar('u1')}${avatar('u2')}${avatar('u3', 'lg')}
    <span class="avatar-stack">${avatar('u1', 'sm')}${avatar('u2', 'sm')}${avatar('u4', 'sm')}</span>
    <span class="sync-pill">${ic('sync', 13)} Xero connected</span>
    <span class="sync-pill off">${ic('link', 13)} Not set up</span>`);

  /* cards */
  qs('#cardDemo').innerHTML = `
    <div class="card stat">
      <div class="stat-top"><span class="stat-ic">${ic('billing', 15)}</span><span class="stat-label">Invoiced today</span></div>
      <span class="stat-value">$1,184</span><span class="stat-sub">5 invoices · incl GST</span></div>
    <div class="card stat">
      <div class="stat-top"><span class="stat-ic bad">${ic('alert', 15)}</span><span class="stat-label">ACC errors</span></div>
      <span class="stat-value" style="color:var(--bad-fg)">3</span><span class="stat-sub">Will be rejected as-is</span></div>
    <div class="card">
      <div class="card-hd"><h3>With header</h3><span class="spacer"></span><span class="chip">12</span></div>
      <div class="card-bd"><p class="t-sm muted">Body content sits on the surface colour with a hairline divider above.</p></div>
      <div class="card-ft row"><span class="t-xs subtle">Footer for metadata</span></div></div>
    <div class="card card-bd col g-3">
      <span class="t-eyebrow">Progress</span>
      <span class="t-metric">72%</span>
      <div class="meter"><span class="meter-track" style="width:72%"></span></div>
      <span class="t-xs subtle">Collected today</span></div>`;

  /* table */
  qs('#tblDemo').innerHTML = `
    <thead><tr><th>Invoice</th><th>Patient</th><th>Payer</th><th class="num-cell">Total</th><th>Status</th><th></th></tr></thead>
    <tbody>${K.invoices.slice(0, 4).map((i, n) => {
      const t = U.invoiceTotals(i), p = K.pt(i.pt);
      return `<tr class="${i.status === 'overdue' ? 'row-err' : ''}">
        <td class="t-mono t-sm"><b>${i.id}</b></td>
        <td><span class="row g-2">${avatar(p.id, 'xs', p.tone)}<span class="t-sm">${p.first} ${p.last}</span></span></td>
        <td>${U.funderChip(i.payer)}</td>
        <td class="num-cell"><b>${money(t.incl)}</b></td>
        <td>${chip(i.status)}</td>
        <td><span class="row-actions">
          <button class="btn btn-ghost btn-icon btn-sm" aria-label="Send">${ic('send', 14)}</button>
          <button class="btn btn-ghost btn-icon btn-sm" aria-label="More">${ic('dots', 14)}</button></span></td>
      </tr>`;
    }).join('')}</tbody>`;

  /* overlays */
  qs('#overlayDemo').innerHTML = `
    <button class="btn btn-secondary" data-o="modal">${ic('alert', 15)} Open modal</button>
    <button class="btn btn-secondary" data-o="drawer">${ic('panel', 15)} Open drawer</button>
    <button class="btn btn-secondary" data-o="menu">${ic('dots', 15)} Open menu</button>`;
  on(document, 'click', '[data-o]', (e, t) => {
    if (t.dataset.o === 'modal') U.modal({
      title: 'Cancel this appointment?', sub: 'Te Aroha Ngata · 9:45am', icon: 'alert', tone: 'bad',
      body: `<div class="field"><label class="label" for="r">Reason <span class="req">*</span></label>
        <select class="select" id="r" data-autofocus><option>Patient requested — rebooking</option><option>Patient unwell</option></select>
        <span class="hint">Recorded on the timeline and used in DNA reporting.</span></div>`,
      footer: `<button class="btn btn-ghost" data-close>Keep booking</button>
               <button class="btn btn-danger" data-close>Cancel appointment</button>`
    });
    if (t.dataset.o === 'drawer') U.drawer({
      title: 'Create invoice', sub: 'Te Aroha Ngata · JKL8472 · ACC',
      body: `<div class="col g-4">
        <div class="banner ok"><span class="b-ic">${ic('check', 15)}</span>
          <span class="t-sm">Pre-filled from <b>New consultation</b> with Dr Alice Fenwick.</span></div>
        <div class="field"><label class="label">Payer</label><select class="select"><option>ACC</option></select></div>
        <div class="col g-2">
          <div class="row between t-sm"><span class="muted">Subtotal</span><span class="num">$395.00</span></div>
          <div class="row between t-sm"><span class="muted">GST 15%</span><span class="num">$59.25</span></div>
          <div class="divider"></div>
          <div class="row between"><span class="t-h4">Total</span><span class="t-h3 num">$454.25</span></div></div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button><span class="spacer"></span>
               <button class="btn btn-primary" data-close>${ic('send', 15)} Create invoice</button>`
    });
    if (t.dataset.o === 'menu') U.menu(t, [
      { label: 'Quick actions' },
      { icon: 'check', label: 'Mark as arrived', kbd: 'A' },
      { icon: 'x', label: 'Mark as DNA' },
      { icon: 'billing', label: 'Create invoice' },
      '-',
      { icon: 'trash', label: 'Cancel with reason', danger: true },
    ]);
  });

  /* feedback */
  qs('#toastDemo').innerHTML = `
    <button class="btn btn-secondary" data-t="ok">Success toast</button>
    <button class="btn btn-secondary" data-t="warn">Warning toast</button>
    <button class="btn btn-secondary" data-t="bad">Error toast</button>
    <button class="btn btn-secondary" data-t="info">Info toast</button>`;
  on(document, 'click', '[data-t]', (e, t) => {
    const map = {
      ok: ['Payment recorded', '$454.25 by EFTPOS · receipt emailed'],
      warn: ['Recorded as DNA', 'Wiremu Kawiti · 2:45pm'],
      bad: ['ACC submission failed', 'Claim number not recognised — check the ACC45.'],
      info: ['Xero sync started', '5 invoices queued for sync.'],
    }[t.dataset.t];
    U.toast(map[0], map[1], t.dataset.t);
  });

  qs('#emptyDemo').innerHTML = U.empty('inbox', 'Inbox zero',
    'Nothing waiting on you. Results and referrals arrive here automatically from Healthlink.',
    `<button class="btn btn-secondary btn-sm">${ic('refresh', 14)} Check again</button>`);
  qs('#skDemo').innerHTML = U.skeletonList(3);

  qs('#bannerDemo').innerHTML = [
    ['', 'info', 'A text reminder is sent 24 hours before the appointment.'],
    ['ok', 'check', 'Everything validates — 3 invoices totalling $675.00 are ready to send to ACC.'],
    ['warn', 'clock', 'Waiting for your approval — typed by Josh Petersen, 2 hours ago.'],
    ['bad', 'alert', 'Date of injury is missing. ACC will reject invoices on this claim.'],
  ].map(([c, i, txt]) => `<div class="banner ${c}"><span class="b-ic">${ic(i, 16)}</span><span>${txt}</span></div>`).join('');

  qs('#sv1').innerHTML = `${ic('check', 13)} Saved just now`;

  /* icons */
  qs('#iconGrid').innerHTML = window.ICON_NAMES.map(n =>
    `<button class="icon-cell" data-icon="${n}" title="${n}">${ic(n, 20)}<span>${n}</span></button>`).join('');
  on(document, 'click', '[data-icon]', (e, t) => {
    const n = t.dataset.icon;
    navigator.clipboard && navigator.clipboard.writeText(`icon('${n}')`);
    U.toast('Copied', `icon('${n}')`, 'ok');
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape' && U.openLayers.length) U.closeTop(); });
})();
