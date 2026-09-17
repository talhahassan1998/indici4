/* Kora Health — Dashboard (role-based home) */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, money, money0, on, qs, qsa } = U;
  window.Views = window.Views || {};

  const NOW = 10 * 60 + 22;   // 10:22am — "now" for the prototype

  /* ------------------------------------------------------------ helpers */
  function myAppts(userId) {
    const list = K.appts.filter(a => a.cl === userId);
    return list.sort((a, b) => a.start - b.start);
  }
  function allToday() { return K.appts.slice().sort((a, b) => a.start - b.start); }

  function nextPatient(userId) {
    const mine = myAppts(userId);
    return mine.find(a => a.status === 'arrived')
        || mine.find(a => a.status === 'consult')
        || mine.find(a => a.status === 'booked' && a.start >= NOW)
        || null;
  }

  function stats() {
    const unsigned  = K.notes.filter(n => !n.signed).length;
    const pending   = K.letters.filter(l => l.status === 'pending').length;
    const drafts    = K.letters.filter(l => l.status === 'draft').length;
    const uninvoiced= K.appts.filter(a => (a.status === 'done' || a.status === 'consult') && !a.invoiced).length;
    const overdueT  = K.tasks.filter(t => t.col !== 'done' && U.daysOverdue(t.due) > 0).length;
    const todayInv  = K.invoices.filter(i => i.date === '2026-09-17');
    const todayTotal= todayInv.reduce((s, i) => s + U.invoiceTotals(i).incl, 0);
    const unpaid    = K.invoices.filter(i => i.status === 'sent' || i.status === 'overdue')
                        .reduce((s, i) => s + U.invoiceTotals(i).incl, 0);
    const overdueInv= K.invoices.filter(i => i.status === 'overdue');
    const accErr    = K.accQueue.filter(a => !a.valid).length;
    const accReady  = K.accQueue.filter(a => a.valid).length;
    const arrived   = K.appts.filter(a => a.status === 'arrived').length;
    const dna       = K.appts.filter(a => a.status === 'dna').length;
    const unreadInbox = K.inbox.filter(i => i.unread).length;
    return { unsigned, pending, drafts, uninvoiced, overdueT, todayInv, todayTotal, unpaid,
             overdueInv, accErr, accReady, arrived, dna, unreadInbox };
  }

  /* ------------------------------------------------------------ blocks */
  function greeting(user, s, extra) {
    const hour = Math.floor(NOW / 60);
    const part = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
    const short = user.name.replace(/^Dr /, 'Dr ').split(' ').slice(0, 2).join(' ');
    // Direct children so the card's space-between pins the heading top and the stats bottom.
    return `<div class="greeting-card">
      <div class="greeting-head">
        <p class="g-date">${U.fmtLongDate(K.TODAY)} · ${U.fmtTime(NOW)}</p>
        <h1>${part}, ${esc(short)}.</h1>
      </div>
      <div class="greeting-stats">${extra.map(x => `
        <div class="gs"><b>${x.v}</b><span>${esc(x.l)}</span></div>`).join('')}
      </div>
    </div>`;
  }

  function nextPatientCard(a) {
    if (!a) return `<div class="next-patient col g-3">
      <span class="t-eyebrow np-eyebrow">Next patient</span>
      ${U.empty('check', 'Clinic list complete', 'Nothing more booked for you today.')}
    </div>`;
    const p = K.pt(a.pt), t = K.at(a.type);
    const isArrived = a.status === 'arrived';
    const waiting = isArrived ? Math.max(1, NOW - a.start) : 0;
    return `<div class="next-patient col g-4 ${isArrived ? 'arrived' : ''}" id="nextPatient">
      <div class="row between">
        <span class="t-eyebrow np-eyebrow">${isArrived ? 'Waiting for you now' : 'Next patient'}</span>
        ${chip(a.status)}
      </div>
      <div class="row g-4">
        ${avatar(p.id, 'xl', p.tone)}
        <div class="grow">
          <a class="t-h3" style="text-decoration:none;color:inherit" href="#/patient/${p.id}">${esc(p.first)} ${esc(p.last)}</a>
          <div class="t-sm muted">${U.age(p.dob)}y ${p.sex} · <span class="t-mono">${esc(p.nhi)}</span></div>
          <div class="row g-2 mt-2 wrap">
            ${U.funderChip(p.funder)}
            ${p.alerts.map(x => `<span class="alert-badge">${ic('alert', 13)}${esc(x)}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="row g-4 t-sm">
        <span class="row g-2">${ic('clock', 14)}<b>${U.fmtTime(a.start)}</b></span>
        <span class="row g-2 muted">${ic('stethoscope', 14)}${esc(t.name)} · ${t.mins}min</span>
      </div>
      ${isArrived ? `<div class="banner ok"><span class="b-ic">${ic('check', 15)}</span>
        <span>Arrived and waiting <b>${waiting} minutes</b>. Room 2 is free.</span></div>` : ''}
      <p class="t-sm muted">${esc(a.note)}</p>
      <div class="row g-2">
        <a class="btn btn-primary grow" href="#/consult/${p.id}">${ic('stethoscope', 15)} Start consultation</a>
        <button class="btn btn-secondary" data-act="notes" data-id="${p.id}">${ic('file', 15)} Notes</button>
      </div>
    </div>`;
  }

  function timelineCard(list, opts) {
    const o = opts || {};
    return `<section class="card">
      <div class="card-hd">
        <h3>${esc(o.title || "Today’s list")}</h3>
        <span class="chip">${list.length} appointments</span>
        <span class="spacer"></span>
        <a class="btn btn-ghost btn-sm" href="#/appointments">Open calendar ${ic('chevronRight', 14)}</a>
      </div>
      <div class="tl" id="todayList">
        ${list.length ? list.map(a => row(a, o)).join('') : U.empty('calendar', 'No appointments today', 'When bookings are made they will appear here in time order.')}
      </div>
    </section>`;
  }

  function row(a, o) {
    const p = K.pt(a.pt), t = K.at(a.type), cl = K.st(a.cl);
    const isNow = a.status === 'consult' || (a.start <= NOW && NOW < a.start + t.mins && a.status !== 'done');
    return `<div class="tl-row ${isNow ? 'is-now' : ''}" data-status="${a.status}" data-appt="${a.id}">
      <span class="tl-time">${U.fmtTime(a.start)}<small>${t.mins} min</small></span>
      <span class="tl-spine"><i class="tl-node"></i></span>
      <span class="tl-patient grow truncate">
        <b>${esc(p.first)} ${esc(p.last)}</b>
        <span>${esc(p.nhi)} · ${esc(t.name)}${o.showClinician ? ` · ${esc(cl.name)}` : ''} · ${esc(a.note)}</span>
      </span>
      <span class="row g-2">
        ${p.alerts.length ? `<span class="tip" data-tip="${esc(p.alerts.join(', '))}" style="color:var(--bad-fg)">${ic('alert', 15)}</span>` : ''}
        ${chip(a.status)}
        ${a.status === 'booked' ? `<button class="btn btn-soft btn-sm" data-arrive="${a.id}">${ic('check', 13)} Arrived</button>` : ''}
        <button class="btn btn-ghost btn-icon btn-sm" data-menu="${a.id}" aria-label="More actions for ${esc(p.first)} ${esc(p.last)}">${ic('dots', 15)}</button>
      </span>
    </div>`;
  }

  function workCard(rows, title, sub) {
    return `<section class="card">
      <div class="card-hd"><h3>${esc(title)}</h3>
        ${sub ? `<span class="t-xs subtle">${esc(sub)}</span>` : ''}</div>
      <div class="list-rows">
        ${rows.map(r => `<a class="work-row" href="${r.href}">
          <span class="work-ic" style="background:${r.bg};color:${r.fg}">${ic(r.icon, 16)}</span>
          <span class="grow"><b>${esc(r.label)}</b><span>${esc(r.sub)}</span></span>
          <span class="work-n" style="${r.n > 0 && r.urgent ? 'color:var(--bad-fg)' : ''}">${r.n}</span>
          ${ic('chevronRight', 15, 'subtle')}
        </a>`).join('')}
      </div>
    </section>`;
  }

  function billingSnapshot(s) {
    const paidToday = s.todayInv.filter(i => i.status === 'paid').reduce((a, i) => a + i.paid, 0);
    const pct = Math.round((paidToday / Math.max(s.todayTotal, 1)) * 100);
    return `<section class="card">
      <div class="card-hd"><h3>Billing snapshot</h3>
        <span class="spacer"></span>
        <span class="sync-pill">${ic('sync', 13)} Xero connected</span>
      </div>
      <div class="card-bd col g-5">
        <div class="grid" style="grid-template-columns:repeat(3,1fr);gap:var(--s-4)">
          <div class="col g-1">
            <span class="t-eyebrow">Invoiced today</span>
            <span class="t-metric">${money0(s.todayTotal)}</span>
            <span class="t-xs subtle">${s.todayInv.length} invoices · incl GST</span>
          </div>
          <div class="col g-1">
            <span class="t-eyebrow">Unpaid</span>
            <span class="t-metric" style="color:var(--warn-fg)">${money0(s.unpaid)}</span>
            <span class="t-xs subtle">${s.overdueInv.length} overdue · ${money0(s.overdueInv.reduce((a,i)=>a+U.invoiceTotals(i).incl,0))}</span>
          </div>
          <div class="col g-1">
            <span class="t-eyebrow">ACC errors</span>
            <span class="t-metric" style="color:${s.accErr ? 'var(--bad-fg)' : 'var(--ok-fg)'}">${s.accErr}</span>
            <span class="t-xs subtle">${s.accReady} ready to submit</span>
          </div>
        </div>
        <div class="col g-2">
          <div class="row between t-xs muted"><span>Collected today</span><span class="num">${pct}% of ${money0(s.todayTotal)}</span></div>
          <div class="meter"><span class="meter-track" style="width:${pct}%"></span><span style="width:${100-pct}%;background:var(--warn-bg)"></span></div>
        </div>
        ${s.accErr ? `<div class="banner bad"><span class="b-ic">${ic('alert', 16)}</span>
          <span class="grow"><b>${s.accErr} ACC submissions need attention</b><br>
          <span class="t-xs">Missing claim number or injury date will be rejected by ACC.</span></span>
          <a class="btn btn-secondary btn-sm" href="#/acc">Fix now</a></div>` : ''}
      </div>
      <div class="card-ft row g-2">
        <a class="btn btn-secondary btn-sm" href="#/billing">${ic('billing', 14)} All invoices</a>
        <a class="btn btn-ghost btn-sm" href="#/acc">${ic('acc', 14)} ACC queue</a>
        <span class="spacer"></span>
        <span class="t-xs subtle">Last Xero sync 9:42am</span>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------ role layouts */
  function clinicianView(user, s) {
    const mine = myAppts(user.id);
    const seen = mine.filter(a => a.status === 'done').length;
    return `
      <div class="dash-grid">
        <div class="col-8 stretch">${greeting(user, s, [
          { v: mine.length, l: 'Patients booked' },
          { v: seen, l: 'Seen so far' },
          { v: s.unsigned, l: 'Notes to sign' },
          { v: s.pending, l: 'Letters to approve' },
        ])}</div>
        <div class="col-4 stretch">${nextPatientCard(nextPatient(user.id))}</div>

        <div class="col-7">${timelineCard(mine, { title: 'My clinic today' })}</div>
        <div class="col-5 col g-4">
          ${workCard([
            { icon: 'file',    label: 'Unsigned notes',       sub: 'Waiting for your signature',    n: s.unsigned,   href: '#/patients', bg: 'var(--warn-bg)',   fg: 'var(--warn-fg)', urgent: true },
            { icon: 'letters', label: 'Letters to approve',   sub: 'Typed and ready to send',       n: s.pending,    href: '#/inbox',    bg: 'var(--accent-soft)', fg: 'var(--accent-text)' },
            { icon: 'flask',   label: 'Results to review',    sub: '2 flagged abnormal',            n: 4,            href: '#/inbox',    bg: 'var(--info-bg)',   fg: 'var(--info-fg)' },
            { icon: 'tasks',   label: 'Overdue tasks',        sub: 'Assigned to you or your team',  n: s.overdueT,   href: '#/tasks',    bg: 'var(--bad-bg)',    fg: 'var(--bad-fg)', urgent: true },
          ], 'Needs your attention', 'Sorted by urgency')}
          ${billingSnapshot(s)}
        </div>
      </div>`;
  }

  function receptionView(user, s) {
    const list = allToday();
    const waiting = list.filter(a => a.status === 'arrived');
    return `
      <div class="dash-grid">
        <div class="col-8 stretch">${greeting(user, s, [
          { v: list.length, l: 'Appointments today' },
          { v: s.arrived, l: 'In the waiting room' },
          { v: s.dna, l: 'Did not attend' },
          { v: s.todayInv.length, l: 'Invoices raised' },
        ])}</div>
        <div class="col-4 stretch">
          <section class="card" style="height:100%">
            <div class="card-hd"><h3>Waiting room</h3><span class="chip chip-ok"><i class="dot"></i>${waiting.length} here</span></div>
            <div class="list-rows">
              ${waiting.length ? waiting.map(a => {
                const p = K.pt(a.pt);
                return `<a class="work-row" href="#/patient/${p.id}">
                  ${avatar(p.id, 'sm', p.tone)}
                  <span class="grow"><b>${esc(p.first)} ${esc(p.last)}</b>
                  <span>${esc(K.st(a.cl).name)} · waiting ${Math.max(1, NOW - a.start)} min</span></span>
                  ${chip('arrived')}</a>`;
              }).join('') : U.empty('user', 'Waiting room empty', 'Mark patients as Arrived from the list and they will show here.')}
            </div>
          </section>
        </div>

        <div class="col-8">${timelineCard(list, { title: 'All clinics today', showClinician: true })}</div>
        <div class="col-4 col g-4">
          ${workCard([
            { icon: 'billing',  label: 'Uninvoiced appointments', sub: 'Consults finished, not billed', n: s.uninvoiced, href: '#/billing', bg: 'var(--warn-bg)', fg: 'var(--warn-fg)', urgent: true },
            { icon: 'phone',    label: 'Phone messages',          sub: 'Callbacks to action',           n: 3,            href: '#/inbox',   bg: 'var(--accent-soft)', fg: 'var(--accent-text)' },
            { icon: 'calendar', label: 'Unconfirmed tomorrow',    sub: 'Send reminder texts',           n: 7,            href: '#/appointments', bg: 'var(--info-bg)', fg: 'var(--info-fg)' },
            { icon: 'tasks',    label: 'Overdue tasks',           sub: 'Reception queue',               n: s.overdueT,   href: '#/tasks',   bg: 'var(--bad-bg)', fg: 'var(--bad-fg)', urgent: true },
          ], 'Front desk work', 'Clear these before close')}
          ${billingSnapshot(s)}
        </div>
      </div>`;
  }

  function typistView(user, s) {
    const queue = K.letters.filter(l => l.status === 'draft' || l.status === 'pending');
    return `
      <div class="dash-grid">
        <div class="col-12">${greeting(user, s, [
          { v: queue.length, l: 'In your queue' },
          { v: s.drafts, l: 'To type' },
          { v: s.pending, l: 'Awaiting approval' },
          { v: '2h 10m', l: 'Dictation backlog' },
        ])}</div>

        <div class="col-8">
          <section class="card">
            <div class="card-hd"><h3>Typing queue</h3>
              <span class="spacer"></span>
              <div class="segmented" role="group" aria-label="Filter queue">
                <button aria-pressed="true">All</button><button aria-pressed="false">Urgent</button><button aria-pressed="false">Mine</button>
              </div>
            </div>
            <div class="list-rows">
              ${queue.map(l => {
                const p = K.pt(l.pt);
                return `<a class="work-row" href="#/letter/${l.id}">
                  <span class="work-ic" style="background:var(--accent-soft);color:var(--accent-text)">${ic('letters', 16)}</span>
                  <span class="grow"><b>${esc(l.title)}</b>
                  <span>${esc(p.first)} ${esc(p.last)} · ${esc(p.nhi)} · ${esc(K.st(l.cl).name)} · ${U.relTime(l.updated)}</span></span>
                  ${l.aiAssisted ? `<span class="chip chip-warm">${ic('sparkle', 12)} AI draft</span>` : ''}
                  ${chip(l.status)}
                  ${ic('chevronRight', 15, 'subtle')}</a>`;
              }).join('')}
            </div>
            <div class="card-ft row"><span class="t-xs subtle">Letters auto-save as you type. Submit for approval when finished.</span></div>
          </section>
        </div>

        <div class="col-4 col g-4">
          ${workCard([
            { icon: 'mic',     label: 'New dictations',      sub: 'Uploaded since 8am',        n: 5, href: '#/letters', bg: 'var(--bad-bg)', fg: 'var(--bad-fg)', urgent: true },
            { icon: 'letters', label: 'Returned for edits',  sub: 'Clinician requested changes',n: 2, href: '#/letters', bg: 'var(--warn-bg)', fg: 'var(--warn-fg)' },
            { icon: 'send',    label: 'Ready to send',       sub: 'Approved, awaiting dispatch',n: 3, href: '#/letters', bg: 'var(--ok-bg)', fg: 'var(--ok-fg)' },
          ], 'Your work', 'Oldest first')}
          <section class="card card-bd col g-3">
            <span class="t-eyebrow">Turnaround this week</span>
            <span class="t-metric">4.2 <span class="t-sm muted" style="font-weight:600">hours avg</span></span>
            <div class="meter"><span class="meter-track" style="width:72%"></span></div>
            <span class="t-xs subtle">Target is under 6 hours. 28 letters completed.</span>
          </section>
        </div>
      </div>`;
  }

  function managerView(user, s) {
    const list = allToday();
    const util = K.clinicians.map(c => {
      const a = K.appts.filter(x => x.cl === c.id);
      const mins = a.reduce((t, x) => t + K.at(x.type).mins, 0);
      return { c, n: a.length, pct: Math.min(100, Math.round(mins / 480 * 100)) };
    });
    return `
      <div class="dash-grid">
        <div class="col-12">${greeting(user, s, [
          { v: money0(s.todayTotal), l: 'Invoiced today' },
          { v: money0(s.unpaid), l: 'Outstanding' },
          { v: s.accErr, l: 'ACC errors' },
          { v: `${s.dna}`, l: 'DNAs today' },
        ])}</div>

        <div class="col-8 col g-4">
          ${billingSnapshot(s)}
          <section class="card">
            <div class="card-hd"><h3>Clinic utilisation today</h3><span class="spacer"></span>
              <a class="btn btn-ghost btn-sm" href="#/reports">Full report ${ic('chevronRight', 14)}</a></div>
            <div class="card-bd col g-4">
              ${util.map(u => `<div class="col g-2">
                <div class="row between">
                  <span class="row g-2">${avatar(u.c.id, 'sm')}<b class="t-sm">${esc(u.c.name)}</b>
                    <span class="t-xs subtle">${esc(u.c.spec)}</span></span>
                  <span class="t-sm num"><b>${u.pct}%</b> <span class="subtle">· ${u.n} booked</span></span>
                </div>
                <div class="meter"><span class="meter-track" style="width:${u.pct}%;background:${u.pct > 85 ? 'var(--warn-fg)' : 'var(--accent)'}"></span></div>
              </div>`).join('')}
            </div>
          </section>
        </div>

        <div class="col-4 col g-4">
          ${workCard([
            { icon: 'acc',     label: 'ACC submissions failing', sub: 'Will be rejected as-is',   n: s.accErr,     href: '#/acc',     bg: 'var(--bad-bg)', fg: 'var(--bad-fg)', urgent: true },
            { icon: 'billing', label: 'Overdue invoices',        sub: 'More than 14 days',        n: s.overdueInv.length, href: '#/billing', bg: 'var(--bad-bg)', fg: 'var(--bad-fg)', urgent: true },
            { icon: 'billing', label: 'Uninvoiced appointments', sub: 'Revenue not yet captured', n: s.uninvoiced, href: '#/billing', bg: 'var(--warn-bg)', fg: 'var(--warn-fg)' },
            { icon: 'letters', label: 'Letters awaiting sign-off',sub: 'Ageing over 24 hours',    n: s.pending,    href: '#/letters', bg: 'var(--accent-soft)', fg: 'var(--accent-text)' },
          ], 'Exceptions', 'Money and compliance first')}
          <section class="card">
            <div class="card-hd"><h3>Today at a glance</h3></div>
            <div class="card-bd">
              <dl class="kv">
                <dt>Appointments</dt><dd class="num"><b>${list.length}</b></dd>
                <dt>Arrived</dt><dd class="num">${s.arrived}</dd>
                <dt>DNA rate</dt><dd class="num">${Math.round(s.dna / list.length * 100)}% <span class="subtle t-xs">(${s.dna} of ${list.length})</span></dd>
                <dt>Avg wait</dt><dd class="num">9 min</dd>
                <dt>New referrals</dt><dd class="num">2</dd>
              </dl>
            </div>
          </section>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------ view */
  window.Views.dashboard = {
    title: () => 'Dashboard',
    skeleton: () => `<div class="page"><div class="dash-grid">
      <div class="col-8"><div class="sk" style="height:168px;border-radius:16px"></div></div>
      <div class="col-4"><div class="sk" style="height:168px;border-radius:16px"></div></div>
      <div class="col-7"><div class="card">${U.skeletonList(5)}</div></div>
      <div class="col-5"><div class="card">${U.skeletonList(4)}</div></div></div></div>`,

    render(p) {
      const user = K.st(p.user), s = stats();
      const body = p.role === 'reception' ? receptionView(user, s)
                 : p.role === 'typist'    ? typistView(user, s)
                 : p.role === 'manager'   ? managerView(user, s)
                 :                          clinicianView(user, s);
      return `<div class="page">
        <div class="page-hd">
          <div class="page-title">
            <span class="t-eyebrow">${esc(ROLE_LABEL(p.role))} view</span>
            <h1>Dashboard</h1>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" data-act="cmdk">${ic('sparkle', 14)} Quick actions <span class="kbd">Ctrl K</span></button>
            <a class="btn btn-primary btn-sm" href="#/appointments">${ic('plus', 14)} Book appointment</a>
          </div>
        </div>
        ${body}
      </div>`;
    },

    mount(root, p) {
      on(root, 'click', '[data-act="cmdk"]', () => window.openPalette());

      on(root, 'click', '[data-arrive]', (e, t) => {
        e.preventDefault(); e.stopPropagation();
        const a = K.appts.find(x => x.id === t.dataset.arrive);
        a.status = 'arrived';
        U.toast(`${K.ptName(a.pt)} marked as arrived`, `${U.fmtTime(a.start)} · ${K.at(a.type).name}`, 'ok');
        U.mountView(window.Views.dashboard, p);
      });

      on(root, 'click', '[data-menu]', (e, t) => {
        e.preventDefault(); e.stopPropagation();
        const a = K.appts.find(x => x.id === t.dataset.menu);
        U.menu(t, [
          { label: K.ptName(a.pt) },
          { icon: 'check',    label: 'Mark as arrived',   action: () => { a.status = 'arrived'; U.toast('Marked as arrived', K.ptName(a.pt), 'ok'); U.mountView(window.Views.dashboard, p); } },
          { icon: 'x',        label: 'Mark as DNA',       action: () => { a.status = 'dna'; U.toast('Recorded as DNA', K.ptName(a.pt), 'warn'); U.mountView(window.Views.dashboard, p); } },
          { icon: 'user',     label: 'Open patient',      action: () => location.hash = `#/patient/${a.pt}` },
          { icon: 'edit',     label: 'Edit booking',      action: () => location.hash = '#/appointments' },
          '-',
          { icon: 'billing',  label: 'Create invoice',    action: () => { location.hash = '#/billing'; setTimeout(() => window.Views.billing.openCreate(a.id), 280); } },
          { icon: 'trash',    label: 'Cancel with reason',danger: true, action: () => U.toast('Cancellation', 'A reason is required before cancelling.', 'warn') },
        ]);
      });
    },

  };

  function ROLE_LABEL(r) {
    return { clinician: 'Clinician', reception: 'Reception', typist: 'Typist', manager: 'Practice manager' }[r] || 'Clinician';
  }
})();
