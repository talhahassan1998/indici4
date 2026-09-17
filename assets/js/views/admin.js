/* Kora Health — Admin settings */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa, money } = U;
  window.Views = window.Views || {};

  const CARDS = [
    { id: 'clinic',   icon: 'building', title: 'Clinic details',        sub: 'Name, addresses, GST number, opening hours', meta: '3 locations' },
    { id: 'users',    icon: 'patients', title: 'Users & permissions',   sub: 'Accounts, roles, consultant profiles',       meta: `${K.staff.length} users` },
    { id: 'types',    icon: 'calendar', title: 'Appointment types',     sub: 'Durations, colours, default fees',           meta: `${K.apptTypes.length} types` },
    { id: 'rooms',    icon: 'clock',    title: 'Clinics & timetables',  sub: 'Sessions, rooms, leave and blocked time',    meta: '12 sessions/week' },
    { id: 'brand',    icon: 'letters',  title: 'Letter branding',       sub: 'Letterhead, logo, footer, signature blocks', meta: 'Kora default' },
    { id: 'tpl',      icon: 'template', title: 'Templates',             sub: 'Letter and note templates with merge fields',meta: `${K.letterTemplates.length} templates` },
    { id: 'codes',    icon: 'billing',  title: 'Billing codes',         sub: 'Synced from Xero — prices, accounts, ACC codes', meta: `${K.billingCodes.length} codes` },
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


  /* ============================================================ sub-screens */
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const KIND = { clinic: 'chip-accent', theatre: 'chip-warm', admin: '', leave: 'chip-bad' };

  function crumb(title, sub) {
    return `<div class="page-hd">
      <div class="page-title">
        <a class="t-xs accent-t" href="#/admin">${ic('chevronLeft', 12)} Admin</a>
        <h1>${esc(title)}</h1><span class="page-sub">${esc(sub)}</span></div>
      <div class="page-actions" id="crumbActions"></div>
    </div>`;
  }

  /* ---- Appointment types ---- */
  function apptTypesScreen() {
    return `<div class="page">
      ${crumb('Appointment types', 'Duration, colour and the billing code each type bills to')}
      <div class="page-actions" style="margin:0 0 var(--s-4)">
        <button class="btn btn-primary btn-sm" data-act="new-type">${ic('plus', 14)} New appointment type</button>
      </div>
      <section class="card"><div class="table-wrap"><table class="tbl">
        <thead><tr><th>Type</th><th>Colour</th><th class="num-cell">Duration</th>
          <th>Billing code</th><th class="num-cell">Default fee</th><th>Bills to</th><th></th></tr></thead>
        <tbody>${K.apptTypes.map(t => { const b = K.code(t.code);
          return `<tr>
            <td><b>${esc(t.name)}</b></td>
            <td><span class="row g-2"><i style="width:12px;height:12px;border-radius:4px;background:var(--appt-${t.type})"></i>
              <span class="t-xs subtle t-mono">${esc(t.type)}</span></span></td>
            <td class="num-cell">${t.mins} min</td>
            <td class="t-mono t-sm">${esc(t.code)}</td>
            <td class="num-cell">${t.price ? money(t.price) : '<span class="subtle">No charge</span>'}</td>
            <td>${b && b.acc ? `<span class="chip chip-warm">ACC ${esc(b.acc)}</span>` : '<span class="chip">Patient or insurer</span>'}</td>
            <td><span class="row-actions"><button class="btn btn-ghost btn-icon btn-sm" data-edit-type="${t.id}" aria-label="Edit ${esc(t.name)}">${ic('edit', 14)}</button></span></td>
          </tr>`; }).join('')}</tbody>
      </table></div>
      <div class="card-ft"><span class="t-xs subtle">Colours here drive the calendar. Fees come from the Xero billing code and can be overridden per invoice.</span></div>
      </section>
    </div>`;
  }

  /* ---- Billing codes (read-only mirror of Xero) ---- */
  function codesScreen() {
    return `<div class="page">
      ${crumb('Billing codes', 'Mastered in Xero and synced into Kora')}
      <div class="banner mb-4"><span class="b-ic">${ic('sync', 16)}</span>
        <span class="grow"><b>Xero is the source of truth</b><br>
        <span class="t-sm">Add or reprice a code in Xero and it appears here on the next sync. Editing is deliberately
        disabled so the two systems cannot drift apart.</span></span>
        <button class="btn btn-secondary btn-sm" data-act="sync-codes">${ic('refresh', 14)} Sync now</button></div>
      <section class="card"><div class="table-wrap"><table class="tbl">
        <thead><tr><th>Code</th><th>Name</th><th class="num-cell">Price</th><th>Account</th>
          <th>Tax</th><th>ACC code</th><th>Status</th></tr></thead>
        <tbody>${K.billingCodes.map(b => `<tr>
          <td class="t-mono t-sm"><b>${esc(b.code)}</b></td>
          <td>${esc(b.name)}</td>
          <td class="num-cell">${money(b.price)}</td>
          <td class="t-mono t-sm">${esc(b.acct)}</td>
          <td class="t-sm">${esc(b.tax)}</td>
          <td class="t-mono t-sm">${b.acc ? esc(b.acc) : '<span class="subtle">—</span>'}</td>
          <td>${b.active ? chip('paid', { label: 'Active' }) : chip('draft', { label: 'Archived' })}</td>
        </tr>`).join('')}</tbody>
      </table></div>
      <div class="card-ft row"><span class="t-xs subtle">${K.billingCodes.length} codes · last synced ${U.fmtClock(K.XERO_SYNC)} today</span></div>
      </section>
    </div>`;
  }

  /* ---- Clinics and timetables ---- */
  function clinicsScreen() {
    const span = (t) => ((t.end - t.start) / 60).toFixed(1).replace('.0', '');
    return `<div class="page">
      ${crumb('Clinics & timetables', 'Locations, and the recurring sessions each clinician works')}

      <h2 class="t-h3 mb-3">Locations</h2>
      <div class="settings-grid mb-6">
        ${K.clinics.map(c => `<div class="card setting-card">
          <span class="sc-ic">${ic('building', 18)}</span>
          <span><b class="t-h4" style="display:block">${esc(c.short)}</b>
            <span class="t-sm muted">${esc(c.addr)}</span></span>
          <div class="row g-2 mt-2"><span class="chip">${ic('phone', 11)} ${esc(c.phone)}</span>
            <span class="spacer"></span>
            <button class="btn btn-ghost btn-sm" data-edit-clinic="${c.id}">${ic('edit', 13)} Edit</button></div>
        </div>`).join('')}
      </div>

      <div class="row between mb-3">
        <h2 class="t-h3">Weekly timetable</h2>
        <button class="btn btn-primary btn-sm" data-act="new-session">${ic('plus', 14)} Add session</button>
      </div>
      <div class="row g-4 wrap mb-3">
        ${Object.entries({ clinic: 'Clinic', theatre: 'Theatre', admin: 'Admin / MDT', leave: 'Leave' })
          .map(([k, l]) => `<span class="chip ${KIND[k]}">${l}</span>`).join('')}
      </div>
      <section class="card"><div class="table-wrap"><table class="tbl">
        <thead><tr><th>Clinician</th>${DAYS.map(d => `<th>${d}</th>`).join('')}</tr></thead>
        <tbody>${K.clinicians.map(c => `<tr>
          <td style="min-width:190px"><span class="row g-2">${avatar(c.id, 'sm')}
            <span><b class="t-sm">${esc(c.name)}</b><br><span class="t-xs subtle">${esc(c.spec)}</span></span></span></td>
          ${DAYS.map((d, di) => {
            const sess = K.timetables.filter(t => t.cl === c.id && t.day === di);
            if (!sess.length) return `<td><span class="t-xs subtle">—</span></td>`;
            return `<td style="min-width:150px"><div class="col g-2">${sess.map(t => `
              <button class="card card-flat" style="padding:7px 9px;text-align:left;width:100%" data-edit-session="${c.id}-${di}-${t.start}">
                <b class="t-xs">${U.fmtTime(t.start)}–${U.fmtTime(t.end)}</b>
                <span class="t-xs subtle" style="display:block">${esc(K.cln(t.clinic).short)} · ${span(t)}h</span>
                <span class="chip ${KIND[t.kind]} mt-2">${esc(t.kind)}</span>
              </button>`).join('')}</div></td>`;
          }).join('')}
        </tr>`).join('')}</tbody>
      </table></div>
      <div class="card-ft"><span class="t-xs subtle">Sessions define bookable hours. Anything outside them shows as unavailable on the calendar,
        and leave is drawn as hatched blocked time.</span></div>
      </section>
    </div>`;
  }

  /* ---- Templates ---- */
  function templatesScreen() {
    return `<div class="page">
      ${crumb('Letter templates', 'Reusable letters that fill in patient details automatically')}
      <div class="page-actions" style="margin:0 0 var(--s-4)">
        <button class="btn btn-primary btn-sm" data-act="new-template">${ic('plus', 14)} New template</button>
      </div>
      <section class="card"><div class="table-wrap"><table class="tbl">
        <thead><tr><th>Template</th><th>Group</th><th>Prompts for</th><th>Pinned</th><th></th></tr></thead>
        <tbody>${K.letterTemplates.map(t => `<tr>
          <td><b>${esc(t.name)}</b></td>
          <td><span class="chip">${esc(t.group)}</span></td>
          <td class="t-sm">${t.fields.length
            ? t.fields.map(f => `<span class="chip">${esc(f.label)}</span>`).join(' ')
            : '<span class="subtle">No prompts — inserts straight in</span>'}</td>
          <td>${t.pinned ? `<span class="chip chip-accent">${ic('pin', 11)} Pinned</span>` : '<span class="subtle t-xs">—</span>'}</td>
          <td><span class="row-actions"><button class="btn btn-ghost btn-icon btn-sm" aria-label="Edit ${esc(t.name)}">${ic('edit', 14)}</button></span></td>
        </tr>`).join('')}</tbody>
      </table></div>
      <div class="card-ft"><span class="t-xs subtle">Merge fields available: patient name, NHI, date of birth, ACC claim,
        injury date, GP, referrer, clinician, today’s date.</span></div>
      </section>
    </div>`;
  }

  /* ---- Letter branding ---- */
  function brandingScreen() {
    const o = K.org;
    return `<div class="page">
      ${crumb('Letter & invoice branding', 'Applied to every letter and invoice that leaves the clinic')}
      <div class="dash-grid">
        <div class="col-6"><section class="card">
          <div class="card-hd"><h3>Organisation</h3><span class="spacer"></span>
            <span class="chip chip-accent">${ic('sync', 11)} From Xero</span></div>
          <div class="card-bd col g-4">
            <div class="grid" style="grid-template-columns:1fr 1fr">
              <div class="field"><label class="label" for="bLegal">Legal name</label>
                <input class="input" id="bLegal" value="${esc(o.legal)}"></div>
              <div class="field"><label class="label" for="bTrade">Trading name</label>
                <input class="input" id="bTrade" value="${esc(o.trading)}"></div>
              <div class="field"><label class="label" for="bGst">GST number</label>
                <input class="input t-mono" id="bGst" value="${esc(o.gst)}"></div>
              <div class="field"><label class="label" for="bNzbn">NZBN</label>
                <input class="input t-mono" id="bNzbn" value="${esc(o.nzbn)}"></div>
              <div class="field"><label class="label" for="bBank">Bank account</label>
                <input class="input t-mono" id="bBank" value="${esc(o.bank)}"></div>
              <div class="field"><label class="label" for="bBrand">Xero branding theme</label>
                <select class="select" id="bBrand"><option>${esc(o.xeroBrand)}</option><option>Kora Specialists — ACC</option></select></div>
            </div>
            <div class="field"><label class="label" for="bTerms">Payment terms</label>
              <textarea class="textarea" id="bTerms" rows="2">${esc(o.terms)}</textarea></div>
          </div>
          <div class="card-ft row"><span class="saved">${ic('check', 13)} Saved automatically</span></div>
        </section></div>

        <div class="col-6"><section class="card">
          <div class="card-hd"><h3>Preview</h3><span class="spacer"></span>
            <span class="t-xs subtle">Letterhead and invoice footer</span></div>
          <div class="card-bd" style="background:var(--bg-sunken)">
            <div class="card" style="background:#fff;color:#1A1814;padding:26px 28px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #14635C;padding-bottom:12px">
                <div><b style="color:#0F4E49;font-size:17px;letter-spacing:-.02em">Kora Health</b>
                  <div style="font-size:9.5px;color:#5D584E;letter-spacing:.06em;text-transform:uppercase;font-weight:700">Specialist Clinic</div></div>
                <div style="font-size:9.5px;color:#5D584E;text-align:right;line-height:1.5">
                  ${esc(K.clinics[0].addr)}<br>${esc(o.phone)} · ${esc(o.email)}<br>GST ${esc(o.gst)}</div>
              </div>
              <p style="font-size:11px;color:#5D584E;margin-top:34px;padding-top:10px;border-top:1px solid #DCD8D0;line-height:1.6">
                <b>${esc(o.legal)}</b> · NZBN ${esc(o.nzbn)}<br>
                Direct credit to <b>${esc(o.bank)}</b> (${esc(o.bankName)})<br>
                ${esc(o.terms)}</p>
            </div>
          </div>
        </section></div>
      </div>
    </div>`;
  }

  window.Views.admin = {
    title: () => 'Admin',
    skeleton: () => `<div class="page"><div class="settings-grid">${Array.from({length:6}).map(() =>
      '<div class="sk sk-block" style="height:150px"></div>').join('')}</div></div>`,

    render(pr) {
      const SUB = {
        users: usersScreen, types: apptTypesScreen, codes: codesScreen,
        rooms: clinicsScreen, tpl: templatesScreen, brand: brandingScreen,
      };
      if (SUB[pr.id]) return SUB[pr.id]();
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
      const LIVE = ['users', 'types', 'codes', 'rooms', 'tpl', 'brand'];
      on(root, 'click', '[data-card]', (e, t) => {
        const id = t.dataset.card;
        if (LIVE.includes(id)) { location.hash = `#/admin/${id}`; return; }
        const c = CARDS.find(x => x.id === id);
        U.toast(c.title, 'This settings area would open here.', 'info');
      });
      on(root, 'click', '[data-act="sync-codes"]', (e, t) => {
        t.innerHTML = `<span class="spinner"></span> Syncing…`;
        setTimeout(() => { U.mountView(this, pr); U.toast('Billing codes synced', `${K.billingCodes.length} codes refreshed from Xero.`, 'ok'); }, 1000);
      });
      on(root, 'click', '[data-act="new-type"], [data-edit-type]', () => U.toast('Appointment type', 'Duration, colour and billing code would be edited here.', 'info'));
      on(root, 'click', '[data-act="new-session"], [data-edit-session]', () => U.toast('Timetable session', 'Day, times, location and session kind would be edited here.', 'info'));
      on(root, 'click', '[data-edit-clinic]', (e, t) => U.toast(K.cln(t.dataset.editClinic).short, 'Address, phone and opening hours would be edited here.', 'info'));
      on(root, 'click', '[data-act="new-template"]', () => U.toast('New template', 'Template body and merge fields would be edited here.', 'info'));
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
