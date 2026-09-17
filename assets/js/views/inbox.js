/* Kora Health — Unified inbox and approval queue */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa } = U;
  window.Views = window.Views || {};

  let folder = 'all', sel = K.inbox[0].id;

  const FOLDERS = [
    { id: 'all',      label: 'All',                icon: 'inbox' },
    { id: 'approval', label: 'Letters to approve', icon: 'letters' },
    { id: 'result',   label: 'Results',            icon: 'flask' },
    { id: 'referral', label: 'Referrals in',       icon: 'referral' },
    { id: 'message',  label: 'Messages',           icon: 'send' },
  ];

  const items = () => K.inbox.filter(i => folder === 'all' || i.kind === folder);
  const count = k => K.inbox.filter(i => (k === 'all' || i.kind === k) && i.unread).length;

  window.Views.inbox = {
    title: () => 'Inbox',
    skeleton: () => `<div class="page"><div class="card">${U.skeletonList(8)}</div></div>`,

    render() {
      const list = items();
      const cur = K.inbox.find(i => i.id === sel) || list[0];
      return `<div class="inbox-shell">
        <nav class="inbox-nav" aria-label="Inbox folders">
          <div class="subnav">
            ${FOLDERS.map(f => `<button data-folder="${f.id}" aria-selected="${folder === f.id}">
              ${ic(f.icon, 16)} <span class="grow">${f.label}</span>
              ${count(f.id) ? `<span class="badge-count">${count(f.id)}</span>` : ''}</button>`).join('')}
          </div>
          <div class="divider mt-4 mb-3"></div>
          <div class="nav-group-label">Approval queue</div>
          <div class="card card-flat card-bd col g-3" style="margin:0 6px">
            <span class="t-eyebrow">Waiting on you</span>
            <span class="t-metric">${K.letters.filter(l => l.status === 'pending').length}</span>
            <span class="t-xs subtle">Oldest has been waiting 18 hours</span>
            <button class="btn btn-primary btn-sm btn-block" data-act="approveall">${ic('check', 14)} Review queue</button>
          </div>
        </nav>

        <div class="inbox-list" aria-label="Messages">
          <div class="ed-bar">
            <b class="t-sm">${esc(FOLDERS.find(f => f.id === folder).label)}</b>
            <span class="chip">${list.length}</span>
            <span class="spacer"></span>
            <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Filter" aria-label="Filter">${ic('filter', 15)}</button>
          </div>
          ${list.length ? list.map(i => item(i)).join('')
            : U.empty('inbox', 'Nothing here', 'This folder is clear. New items arrive automatically from Healthlink and your labs.')}
        </div>

        <div class="inbox-preview">${cur ? preview(cur) : U.empty('inbox', 'Nothing selected', 'Choose an item on the left to preview it.')}</div>
      </div>`;
    },

    mount(root) {
      const re = () => U.mountView(this);
      on(root, 'click', '[data-folder]', (e, t) => { folder = t.dataset.folder; const l = items(); sel = l.length ? l[0].id : null; re(); });
      on(root, 'click', '[data-item]', (e, t) => {
        sel = t.dataset.item;
        const i = K.inbox.find(x => x.id === sel); if (i) i.unread = false;
        re();
      });
      on(root, 'click', '[data-act="approve"]', (e, t) => {
        const i = K.inbox.find(x => x.id === sel);
        const l = i && i.letter ? K.ltr(i.letter) : null;
        if (l) l.status = 'sent';
        const n = K.inbox.indexOf(i); if (n > -1) K.inbox.splice(n, 1);
        sel = items()[0] ? items()[0].id : null; re();
        U.toast('Approved and sent', l ? `${l.title} · via ${l.channel}` : 'Item cleared', 'ok');
      });
      on(root, 'click', '[data-act="edit"]', () => {
        const i = K.inbox.find(x => x.id === sel);
        if (i && i.letter) location.hash = `#/letter/${i.letter}`;
      });
      on(root, 'click', '[data-act="return"]', () => {
        U.toast('Returned to typist', 'Josh Petersen has been notified with your comments.', 'warn');
      });
      on(root, 'click', '[data-act="file"]', () => {
        const i = K.inbox.find(x => x.id === sel);
        const n = K.inbox.indexOf(i); if (n > -1) K.inbox.splice(n, 1);
        sel = items()[0] ? items()[0].id : null; re();
        U.toast('Filed to patient record', 'Available on the patient timeline.', 'ok');
      });
      on(root, 'click', '[data-act="approveall"]', () => {
        folder = 'approval'; const l = items(); sel = l.length ? l[0].id : null; re();
      });
      on(root, 'click', '[data-act="task"]', () => {
        const i = K.inbox.find(x => x.id === sel);
        location.hash = '#/tasks'; setTimeout(() => window.Views.tasks.openNew(i.pt), 260);
      });
    },
  };

  function item(i) {
    const p = K.pt(i.pt);
    const kindIcon = { approval: 'letters', result: 'flask', referral: 'referral', message: 'send' }[i.kind];
    return `<button class="inbox-item ${i.unread ? 'unread' : ''}" data-item="${i.id}" aria-selected="${sel === i.id}">
      <span class="work-ic" style="background:${i.pri === 'high' ? 'var(--bad-bg)' : 'var(--accent-soft)'};color:${i.pri === 'high' ? 'var(--bad-fg)' : 'var(--accent-text)'}">
        ${ic(kindIcon, 15)}</span>
      <span class="grow" style="min-width:0">
        <span class="row between g-2"><b class="t-sm truncate">${esc(i.from)}</b>
          <span class="t-xs subtle">${U.relTime(i.at)}</span></span>
        <span class="t-sm truncate" style="display:block">${esc(i.subj)}</span>
        <span class="row g-2 mt-2">
          <span class="chip">${esc(p.first)} ${esc(p.last)}</span>
          ${i.pri === 'high' ? '<span class="chip chip-bad"><i class="dot"></i>Urgent</span>' : ''}
        </span>
      </span>
    </button>`;
  }

  function preview(i) {
    const p = K.pt(i.pt);
    const l = i.letter ? K.ltr(i.letter) : null;
    return `<div class="page" style="max-width:820px">
      <div class="card">
        <div class="card-hd">
          <span class="stat-ic ${i.pri === 'high' ? 'bad' : ''}">${ic({ approval: 'letters', result: 'flask', referral: 'referral', message: 'send' }[i.kind], 15)}</span>
          <div class="grow"><h3>${esc(i.subj)}</h3>
            <span class="t-xs subtle">${esc(i.from)} · ${U.fmtDate(i.at.slice(0, 10))} ${U.fmtClock(i.at)}</span></div>
          ${i.pri === 'high' ? chip('overdue', { label: 'Urgent' }) : ''}
        </div>

        <div class="card-bd col g-4">
          <a class="row g-3 card card-flat" style="padding:12px;text-decoration:none;color:inherit" href="#/patient/${p.id}">
            ${avatar(p.id, 'lg', p.tone)}
            <span class="grow"><b>${esc(p.first)} ${esc(p.last)}</b>
              <span class="t-xs subtle" style="display:block">${esc(p.nhi)} · ${U.age(p.dob)}y · GP ${esc(K.gp(p.gp).name)}</span></span>
            ${U.funderChip(p.funder)}
            ${p.alerts.map(a => `<span class="alert-badge">${ic('alert', 12)}${esc(a)}</span>`).join('')}
            ${ic('chevronRight', 16, 'subtle')}
          </a>

          ${i.kind === 'approval' && l ? `
            <div class="banner warn"><span class="b-ic">${ic('clock', 15)}</span>
              <span class="grow t-sm"><b>Waiting for your approval</b> — typed by ${esc(K.st(l.typedBy).name)},
              ${U.relTime(l.updated)}. ${l.aiAssisted ? 'Drafted with the AI scribe and edited by the typist.' : ''}</span></div>
            <div class="card card-flat" style="background:#fff;color:#1A1814;padding:26px 30px;font-size:13px;line-height:1.7">
              <div style="border-bottom:2px solid #14635C;padding-bottom:10px;margin-bottom:18px;display:flex;justify-content:space-between">
                <b style="color:#0F4E49;font-size:15px">Kora Health</b>
                <span style="font-size:10px;color:#5D584E">${U.fmtDate(K.TODAY)}</span></div>
              <p><b>Re: ${esc(p.first)} ${esc(p.last)}, NHI ${esc(p.nhi)}</b></p>
              <p style="margin-top:10px">Dear ${esc(K.gp(l.to).name)},</p>
              <p style="margin-top:10px">Thank you for referring ${esc(p.first)}, whom I reviewed in clinic. The history,
              examination findings and management plan are set out below…</p>
              <p style="margin-top:10px;color:#7D766B;font-style:italic">${l.words} words · ${esc(l.channel)} to ${esc(K.gp(l.to).practice)}
              ${l.cc.length ? ` · CC ${l.cc.join(', ')}` : ''}</p>
            </div>` : ''}

          ${i.kind === 'result' ? `
            <div class="card card-flat card-bd col g-3">
              <div class="row between"><span class="t-eyebrow">Result</span>
                ${i.pri === 'high' ? chip('overdue', { label: 'Abnormal' }) : chip('approved', { label: 'Within range' })}</div>
              <dl class="kv">
                <dt>Requested by</dt><dd>Dr Alice Fenwick</dd>
                <dt>Collected</dt><dd>${U.fmtDate(i.at.slice(0, 10))}</dd>
                <dt>Reported by</dt><dd>${esc(i.from)}</dd>
              </dl>
              <div class="divider"></div>
              <p class="t-sm">${esc(i.subj)}</p>
              ${i.pri === 'high' ? `<div class="banner bad"><span class="b-ic">${ic('alert', 15)}</span>
                <span class="t-sm">Flagged abnormal by the lab. Acknowledge and decide on follow-up.</span></div>` : ''}
            </div>` : ''}

          ${i.kind === 'referral' ? `
            <div class="card card-flat card-bd col g-3">
              <span class="t-eyebrow">Referral details</span>
              <dl class="kv">
                <dt>Referrer</dt><dd>${esc(i.from)}</dd>
                <dt>Received</dt><dd>${U.fmtDate(i.at.slice(0, 10))}</dd>
                <dt>Priority</dt><dd>${i.pri === 'high' ? 'Urgent — see within 2 weeks' : 'Routine'}</dd>
                <dt>Funding</dt><dd>${esc(p.funder)}</dd>
              </dl>
              <p class="t-sm muted">${esc(i.subj)}</p>
            </div>` : ''}

          ${i.kind === 'message' ? `<div class="card card-flat card-bd">
            <p class="t-sm">${esc(i.subj)}</p>
            <p class="t-xs subtle mt-3">From ${esc(i.from)} · ${U.relTime(i.at)}</p></div>` : ''}
        </div>

        <div class="card-ft row g-2 wrap">
          ${i.kind === 'approval'
            ? `<button class="btn btn-primary" data-act="approve">${ic('check', 15)} Approve and send</button>
               <button class="btn btn-secondary" data-act="edit">${ic('edit', 14)} Open in editor</button>
               <button class="btn btn-ghost" data-act="return">${ic('refresh', 14)} Return to typist</button>`
            : `<button class="btn btn-primary" data-act="file">${ic('check', 15)} Acknowledge and file</button>
               <button class="btn btn-secondary" data-act="task">${ic('tasks', 14)} Create task</button>`}
          <span class="spacer"></span>
          <button class="btn btn-ghost btn-icon tip" data-tip="Forward" aria-label="Forward">${ic('send', 15)}</button>
          <button class="btn btn-ghost btn-icon tip" data-tip="Print" aria-label="Print">${ic('print', 15)}</button>
        </div>
      </div>
    </div>`;
  }
})();
