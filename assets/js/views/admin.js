/* Kora Health — Admin settings */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa } = U;
  window.Views = window.Views || {};

  const CARDS = [
    { id: 'clinic',   icon: 'building', title: 'Clinic details',        sub: 'Name, addresses, GST number, opening hours', meta: '3 locations' },
    { id: 'users',    icon: 'patients', title: 'Users & permissions',   sub: 'Accounts, roles, consultant profiles',       meta: `${K.staff.length} users` },
    { id: 'types',    icon: 'calendar', title: 'Appointment types',     sub: 'Durations, colours, default fees',           meta: `${K.apptTypes.length} types` },
    { id: 'rooms',    icon: 'clock',    title: 'Clinics & timetables',  sub: 'Sessions, rooms, leave and blocked time',    meta: '12 sessions/week' },
    { id: 'brand',    icon: 'letters',  title: 'Letter branding',       sub: 'Letterhead, logo, footer, signature blocks', meta: 'Kora default' },
    { id: 'tpl',      icon: 'template', title: 'Templates',             sub: 'Letter and note templates with merge fields',meta: `${K.letterTemplates.length} templates` },
    { id: 'integ',    icon: 'link',     title: 'Integrations',          sub: 'Xero, ACC, Healthlink, AI scribe',           meta: '4 connected' },
    { id: 'audit',    icon: 'shield',   title: 'Security & audit',      sub: 'Access log, 2FA, data retention',            meta: 'AA compliant' },
  ];

  const PERMS = {
    Clinical: [
      ['View patient records', true], ['Write and sign notes', true], ['Prescribe', true],
      ['Approve and send letters', true], ['Order tests', true], ['Amend signed notes', false],
    ],
    Billing: [
      ['View invoices', true], ['Create and edit invoices', true], ['Record payments', false],
      ['Void invoices', false], ['Submit ACC claims', true], ['Manage Xero connection', false],
    ],
    Admin: [
      ['Manage appointment types', false], ['Manage users', false], ['Edit templates', true],
      ['Export practice data', false], ['View audit log', false],
    ],
  };

  const INTEGRATIONS = [
    { n: 'Xero',       s: 'Connected', d: 'Invoices and payments sync both ways. Last sync 9:42am today.', ok: true,  i: 'billing' },
    { n: 'ACC',        s: 'Connected', d: 'Provider gateway for ACC32/ACC45 and invoicing.',               ok: true,  i: 'acc' },
    { n: 'Healthlink', s: 'Connected', d: 'Secure delivery to GPs and other providers.',                   ok: true,  i: 'send' },
    { n: 'AI scribe',  s: 'Connected', d: 'Ambient drafting. Audio deleted once a letter is approved.',    ok: true,  i: 'sparkle' },
    { n: 'NHI lookup', s: 'Not set up',d: 'Validate NHI numbers against the national index.',              ok: false, i: 'search' },
  ];

  window.Views.admin = {
    title: () => 'Admin',
    skeleton: () => `<div class="page"><div class="settings-grid">${Array.from({length:6}).map(() =>
      '<div class="sk sk-block" style="height:150px"></div>').join('')}</div></div>`,

    render(pr) {
      if (pr.id === 'users') return usersScreen();
      return `<div class="page">
        <div class="page-hd">
          <div class="page-title"><h1>Admin</h1><span class="page-sub">Practice configuration for Kora Health, Newmarket</span></div>
          <div class="page-actions"><a class="btn btn-secondary btn-sm" href="styleguide.html">${ic('sparkle', 14)} Design system</a></div>
        </div>

        <div class="settings-grid mb-6">
          ${CARDS.map(c => `<button class="card card-link setting-card" data-card="${c.id}">
            <span class="sc-ic">${ic(c.icon, 18)}</span>
            <span><b class="t-h4" style="display:block">${esc(c.title)}</b>
              <span class="t-sm muted">${esc(c.sub)}</span></span>
            <span class="row between mt-2"><span class="chip">${esc(c.meta)}</span>${ic('chevronRight', 15, 'subtle')}</span>
          </button>`).join('')}
        </div>

        <h2 class="t-h3 mb-3 mt-6">Integrations</h2>
        <section class="card">
          <div class="list-rows">
            ${INTEGRATIONS.map(x => `<div class="work-row">
              <span class="work-ic" style="background:${x.ok ? 'var(--ok-bg)' : 'var(--surface-3)'};color:${x.ok ? 'var(--ok-fg)' : 'var(--text-muted)'}">${ic(x.i, 16)}</span>
              <span class="grow"><b>${esc(x.n)}</b><span>${esc(x.d)}</span></span>
              ${x.ok ? `<span class="sync-pill">${ic('check', 12)} ${esc(x.s)}</span>` : `<span class="chip">${esc(x.s)}</span>`}
              <button class="btn btn-secondary btn-sm" data-int="${esc(x.n)}">${x.ok ? 'Manage' : 'Connect'}</button>
            </div>`).join('')}
          </div>
        </section>
      </div>`;
    },

    mount(root, pr) {
      on(root, 'click', '[data-card]', (e, t) => {
        if (t.dataset.card === 'users') { location.hash = '#/admin/users'; return; }
        const c = CARDS.find(x => x.id === t.dataset.card);
        U.toast(c.title, 'This settings area would open here.', 'info');
      });
      on(root, 'click', '[data-int]', (e, t) => U.toast(t.dataset.int, 'Integration settings would open here.', 'info'));
      on(root, 'click', '[data-perm]', (e, t) => {
        const on_ = t.getAttribute('aria-checked') === 'true';
        t.setAttribute('aria-checked', String(!on_));
        U.toast('Permission updated', `${t.dataset.perm} ${!on_ ? 'granted' : 'removed'}`, 'ok');
      });
      on(root, 'click', '[data-user]', (e, t) => {
        qsa('[data-user]', root).forEach(x => x.setAttribute('aria-selected', 'false'));
        t.setAttribute('aria-selected', 'true');
        const u = K.st(t.dataset.user);
        qs('#userDetail', root).innerHTML = userDetail(u);
      });
    },
  };

  function usersScreen() {
    const u = K.st('u1');
    return `<div class="page">
      <div class="page-hd">
        <div class="page-title">
          <a class="t-xs accent-t" href="#/admin">${ic('chevronLeft', 12)} Admin</a>
          <h1>Users &amp; permissions</h1>
          <span class="page-sub">${K.staff.length} accounts · permissions apply immediately</span></div>
        <div class="page-actions">
          <button class="btn btn-secondary btn-sm">${ic('download', 14)} Export access report</button>
          <button class="btn btn-primary btn-sm">${ic('plus', 14)} Invite user</button></div>
      </div>

      <div class="dash-grid">
        <div class="col-4"><section class="card">
          <div class="card-hd"><h3>People</h3><span class="spacer"></span><span class="chip">${K.staff.length}</span></div>
          <div class="list-rows">
            ${K.staff.map((s, i) => `<button class="list-row" data-user="${s.id}" aria-selected="${i === 0}">
              ${avatar(s.id, 'sm')}
              <span class="grow" style="text-align:left"><b class="t-sm">${esc(s.name)}</b>
                <span class="t-xs subtle" style="display:block">${esc(s.spec)}</span></span>
              <span class="chip">${esc(s.role)}</span>
            </button>`).join('')}
          </div>
        </section></div>

        <div class="col-8" id="userDetail">${userDetail(u)}</div>
      </div>
    </div>`;
  }

  function userDetail(u) {
    const isClinician = u.role === 'Clinician';
    return `<div class="col g-4">
      <section class="card">
        <div class="card-hd">
          ${avatar(u.id, 'lg')}
          <div class="grow"><h3>${esc(u.name)}</h3><span class="t-xs subtle">${esc(u.spec)} · ${esc(u.role)}</span></div>
          <span class="chip chip-ok"><i class="dot"></i>Active</span>
          <button class="btn btn-secondary btn-sm">${ic('edit', 14)} Edit</button>
        </div>
        <div class="card-bd">
          <dl class="kv">
            <dt>Email</dt><dd>${esc(u.name.toLowerCase().replace(/^dr /, '').replace(/[^a-z]+/g, '.'))}@korahealth.nz</dd>
            <dt>Last sign-in</dt><dd>Today, 7:58am · Auckland</dd>
            <dt>Two-factor</dt><dd>${chip('paid', { label: 'Enabled (app)' })}</dd>
          </dl>
        </div>
      </section>

      ${isClinician ? `<section class="card">
        <div class="card-hd"><span class="stat-ic">${ic('stethoscope', 15)}</span><h3>Consultant profile</h3>
          <span class="spacer"></span><span class="t-xs subtle">Used on letters, ACC claims and invoices</span></div>
        <div class="card-bd col g-4">
          <div class="grid" style="grid-template-columns:1fr 1fr">
            <div class="field"><label class="label" for="cpMcnz">Registration number (MCNZ)</label>
              <input class="input t-mono" id="cpMcnz" value="${esc(u.mcnz || '')}"></div>
            <div class="field"><label class="label" for="cpHpi">HPI number</label>
              <input class="input t-mono" id="cpHpi" value="${esc(u.hpi || '')}"></div>
            <div class="field"><label class="label" for="cpAcc">ACC provider ID</label>
              <input class="input t-mono" id="cpAcc" value="${esc(u.accId || '')}" ${u.accId ? '' : 'aria-invalid="true"'}>
              ${u.accId ? '' : `<span class="err">${ic('alert', 12)} Required before ACC invoices can be submitted</span>`}</div>
            <div class="field"><label class="label" for="cpSpec">Specialty</label>
              <input class="input" id="cpSpec" value="${esc(u.spec)}"></div>
            <div class="field"><label class="label" for="cpSup">Default lead supplier</label>
              <select class="select" id="cpSup"><option>Kora Health Ltd</option><option>Ascot Day Surgery</option></select></div>
            <div class="field"><label class="label" for="cpVen">Default vendor</label>
              <select class="select" id="cpVen"><option>Kora Specialists — Newmarket</option><option>Kora Specialists — Takapuna</option></select></div>
          </div>
          <div class="divider"></div>
          <div class="field"><label class="label">Signature</label>
            <div class="row g-4">
              <div class="card card-flat" style="background:#fff;padding:14px 22px;border-radius:12px">
                <span style="font-family:'Segoe Script','Bradley Hand',cursive;font-size:26px;color:#14635C">${esc(u.signature || u.name)}</span>
              </div>
              <div class="col g-2">
                <button class="btn btn-secondary btn-sm">${ic('upload', 14)} Upload image</button>
                <button class="btn btn-ghost btn-sm">${ic('edit', 14)} Draw new</button>
              </div>
            </div>
            <span class="hint">Applied automatically when this clinician approves a letter.</span></div>
        </div>
        <div class="card-ft row g-2"><span class="saved">${ic('check', 13)} Saved automatically</span>
          <span class="spacer"></span><button class="btn btn-primary btn-sm">Save profile</button></div>
      </section>` : ''}

      <section class="card">
        <div class="card-hd"><span class="stat-ic">${ic('lock', 15)}</span><h3>Permissions</h3>
          <span class="spacer"></span><button class="btn btn-ghost btn-sm">Copy from another user</button></div>
        <div class="card-bd col g-5">
          ${Object.entries(PERMS).map(([group, list]) => `<div class="col g-3">
            <span class="t-eyebrow">${group}</span>
            <div class="perm-grid">
              ${list.map(([label, on_]) => `<div class="perm-row">
                <span class="grow t-sm">${esc(label)}</span>
                <label class="switch"><input type="checkbox" ${on_ ? 'checked' : ''} aria-label="${esc(label)}">
                  <span class="track"></span><span class="thumb"></span></label>
              </div>`).join('')}
            </div>
          </div>`).join('')}
        </div>
      </section>
    </div>`;
  }
})();
