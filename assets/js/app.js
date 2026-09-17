/* Kora Health — application shell: routing, roles, theme, search, command palette */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { qs, qsa, h, on, esc } = U;

  /* ------------------------------------------------------------ state */
  const ROLES = {
    clinician: { user: 'u1', label: 'Clinician',        desc: 'Dr Alice Fenwick · Orthopaedics' },
    reception: { user: 'u5', label: 'Reception',        desc: 'Mereana Hopa · Front of house' },
    typist:    { user: 'u6', label: 'Typist',           desc: 'Josh Petersen · Medical typist' },
    manager:   { user: 'u7', label: 'Practice Manager', desc: 'Lorraine Beckett · Operations' },
  };

  const state = {
    role: localStorage.getItem('kora.role') || 'clinician',
    rail: localStorage.getItem('kora.rail') === 'true',
    theme: localStorage.getItem('kora.theme') || 'light',
  };
  window.APP = state;

  /* ------------------------------------------------------------ nav */
  const NAV = [
    { group: 'Today', items: [
      { id: 'dashboard',    label: 'Dashboard',    icon: 'dashboard' },
      { id: 'appointments', label: 'Appointments', icon: 'calendar', badge: () => K.appts.filter(a => a.status === 'arrived').length },
      { id: 'patients',     label: 'Patients',     icon: 'patients' },
      { id: 'inbox',        label: 'Inbox',        icon: 'inbox',    badge: () => K.inbox.filter(i => i.unread).length, tone: 'bad' },
    ]},
    { group: 'Clinical', items: [
      { id: 'letters',      label: 'Letters',      icon: 'letters',  badge: () => K.letters.filter(l => l.status === 'pending').length, tone: 'warm' },
      { id: 'tasks',        label: 'Tasks',        icon: 'tasks',    badge: () => K.tasks.filter(t => t.col !== 'done' && U.daysOverdue(t.due) > 0).length, tone: 'bad' },
    ]},
    { group: 'Money', items: [
      { id: 'billing',      label: 'Billing',      icon: 'billing' },
      { id: 'acc',          label: 'ACC',          icon: 'acc',      badge: () => K.accQueue.filter(a => !a.valid).length, tone: 'bad' },
    ]},
    { group: 'Practice', items: [
      { id: 'reports',      label: 'Reports',      icon: 'reports' },
      { id: 'admin',        label: 'Admin',        icon: 'admin' },
    ]},
  ];

  function renderNav() {
    const current = (location.hash.replace('#/', '').split('/')[0]) || 'dashboard';
    qs('#nav').innerHTML = NAV.map(g => `
      <div class="nav-group">
        <div class="nav-group-label">${g.group}</div>
        ${g.items.map(it => {
          const n = it.badge ? it.badge() : 0;
          const active = current === it.id || (current === 'patient' && it.id === 'patients') || (current === 'letter' && it.id === 'letters');
          return `<a class="nav-item" href="#/${it.id}" ${active ? 'aria-current="page"' : ''}>
            ${ic(it.icon, 18)}
            <span class="nav-label">${it.label}</span>
            ${n ? `<span class="badge-count ${it.tone === 'warm' ? 'warm' : it.tone === 'bad' ? '' : 'quiet'}">${n}</span>` : ''}
          </a>`;
        }).join('')}
      </div>`).join('');
  }

  /* ------------------------------------------------------------ theme */
  function applyTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
    const b = qs('#themeBtn');
    b.innerHTML = ic(state.theme === 'dark' ? 'sun' : 'moon', 17);
    b.dataset.tip = state.theme === 'dark' ? 'Light mode' : 'Dark mode';
  }
  function applyRail() {
    qs('#app').dataset.rail = String(state.rail);
    const b = qs('#railToggle');
    b.innerHTML = ic('panel', 17);
    b.setAttribute('aria-expanded', String(!state.rail));
    b.dataset.tip = state.rail ? 'Expand sidebar' : 'Collapse sidebar';
  }
  function applyRole() {
    const r = ROLES[state.role], u = K.st(r.user);
    qs('#userName').textContent = u.name;
    qs('#userRole').textContent = u.spec;
    qs('#userAvatar').textContent = u.initials;
    qs('#userAvatar').className = `avatar tone-${u.tone}`;
    qs('#roleLabel').textContent = r.label;
  }

  /* ------------------------------------------------------------ router */
  const ROUTES = {
    dashboard:    () => window.Views.dashboard,
    appointments: () => window.Views.appointments,
    patients:     () => window.Views.patients,
    patient:      () => window.Views.patient,
    inbox:        () => window.Views.inbox,
    letters:      () => window.Views.letters,
    letter:       () => window.Views.letter,
    tasks:        () => window.Views.tasks,
    billing:      () => window.Views.billing,
    acc:          () => window.Views.acc,
    reports:      () => window.Views.reports,
    admin:        () => window.Views.admin,
  };

  let scrollMemory = {};
  function route() {
    U.closeAllOverlays();
    const raw = location.hash.replace(/^#\/?/, '') || 'dashboard';
    const parts = raw.split('/');
    const key = parts[0] || 'dashboard';
    const view = (ROUTES[key] || ROUTES.dashboard)();
    const root = qs('#view');

    if (!view) { root.innerHTML = U.empty('alert', 'Screen not found', 'That link does not lead anywhere yet.'); return; }

    // brief skeleton so loading states are part of the design, not an afterthought
    U.renderSkeleton(view);
    const params = { id: parts[1], sub: parts[2], role: state.role, user: ROLES[state.role].user };

    requestAnimationFrame(() => {
      U.mountView(view, params);
      document.title = `${view.title ? view.title(params) : 'Kora Health'} · Kora Health`;
      renderNav();
      window.scrollTo(0, scrollMemory[raw] || 0);
    });
  }
  window.addEventListener('hashchange', () => { route(); });
  window.addEventListener('scroll', () => {
    scrollMemory[location.hash.replace(/^#\/?/, '')] = window.scrollY;
  }, { passive: true });

  /* ------------------------------------------------------------ global search */
  function searchPatients(q) {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return K.patients.filter(p => {
      const name = `${p.first} ${p.last}`.toLowerCase();
      return name.includes(s)
        || p.nhi.toLowerCase().includes(s)
        || p.phone.replace(/\s/g, '').includes(s.replace(/\s/g, ''))
        || p.dob.includes(s)
        || U.fmtDate(p.dob).toLowerCase().includes(s);
    }).slice(0, 7);
  }

  function initSearch() {
    const input = qs('#globalSearch'), box = qs('#searchResults');
    qs('#searchIcon').innerHTML = ic('search', 16);
    let active = -1, hits = [];

    function paint() {
      if (!hits.length) {
        box.innerHTML = `<div class="empty" style="padding:28px 16px">
          <span class="e-ic">${ic('search', 20)}</span>
          <h4 class="t-sm">No patient found</h4>
          <p class="t-xs">Try an NHI (e.g. JKL8472), a surname, or a date of birth.</p></div>`;
      } else {
        box.innerHTML = hits.map((p, i) => `<button class="search-hit ${i === active ? 'active' : ''}" role="option"
          aria-selected="${i === active}" data-id="${p.id}">
          ${U.avatar(p.id, 'sm', p.tone)}
          <span class="hit-main"><b>${esc(p.first)} ${esc(p.last)}</b>
          <span>${esc(p.nhi)} · ${U.fmtDate(p.dob)} (${U.age(p.dob)}) · ${esc(p.phone)}</span></span>
          ${U.funderChip(p.funder)}
        </button>`).join('');
      }
      box.hidden = false;
      input.setAttribute('aria-expanded', 'true');
    }
    function hide() { box.hidden = true; active = -1; input.setAttribute('aria-expanded', 'false'); }

    input.addEventListener('input', () => { hits = searchPatients(input.value); active = hits.length ? 0 : -1; input.value.trim() ? paint() : hide(); });
    input.addEventListener('focus', () => { if (input.value.trim()) { hits = searchPatients(input.value); paint(); } });
    input.addEventListener('blur', () => setTimeout(hide, 160));
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, hits.length - 1); paint(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); paint(); }
      else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); location.hash = `#/patient/${hits[active].id}`; input.value = ''; hide(); input.blur(); }
      else if (e.key === 'Escape') { input.value = ''; hide(); input.blur(); }
    });
    on(box, 'mousedown', '.search-hit', (e, t) => { location.hash = `#/patient/${t.dataset.id}`; input.value = ''; hide(); });
  }

  /* ------------------------------------------------------------ command palette */
  function commands() {
    const list = [
      { g: 'Create', id: 'new-letter',  label: 'New letter',        sub: 'Open the letter editor with a blank draft', icon: 'letters', run: () => location.hash = '#/letter/new' },
      { g: 'Create', id: 'book',        label: 'Book appointment',  sub: 'Open the booking panel on the calendar',    icon: 'calendar', run: () => { location.hash = '#/appointments'; setTimeout(() => window.Views.appointments.openBooking && window.Views.appointments.openBooking(), 260); } },
      { g: 'Create', id: 'invoice',     label: 'Create invoice',    sub: 'New invoice from an appointment',           icon: 'billing', run: () => { location.hash = '#/billing'; setTimeout(() => window.Views.billing.openCreate && window.Views.billing.openCreate(), 260); } },
      { g: 'Create', id: 'task',        label: 'New task',          sub: 'Assign work to a colleague',                icon: 'tasks',   run: () => { location.hash = '#/tasks'; setTimeout(() => window.Views.tasks.openNew && window.Views.tasks.openNew(), 260); } },
      { g: 'Create', id: 'patient',     label: 'Register new patient', sub: 'Add a patient record',                   icon: 'user',    run: () => U.toast('New patient', 'Registration form would open here.', 'info') },
      { g: 'Go to',  id: 'g-dash',      label: 'Dashboard',        sub: 'Your role home',       icon: 'dashboard',    run: () => location.hash = '#/dashboard' },
      { g: 'Go to',  id: 'g-appt',      label: 'Appointments',     sub: 'Day and week views',   icon: 'calendar',     run: () => location.hash = '#/appointments' },
      { g: 'Go to',  id: 'g-pt',        label: 'Patients',         sub: 'Patient register',     icon: 'patients',     run: () => location.hash = '#/patients' },
      { g: 'Go to',  id: 'g-inbox',     label: 'Inbox & approvals',sub: 'Results, referrals, letters', icon: 'inbox', run: () => location.hash = '#/inbox' },
      { g: 'Go to',  id: 'g-bill',      label: 'Billing',          sub: 'Invoices and payments',icon: 'billing',      run: () => location.hash = '#/billing' },
      { g: 'Go to',  id: 'g-acc',       label: 'ACC submissions',  sub: 'Validate and submit',  icon: 'acc',          run: () => location.hash = '#/acc' },
      { g: 'Go to',  id: 'g-admin',     label: 'Admin settings',   sub: 'Clinic, users, templates', icon: 'admin',    run: () => location.hash = '#/admin' },
      { g: 'Go to',  id: 'g-style',     label: 'Design system',    sub: 'Palette, type, components', icon: 'sparkle', run: () => location.href = 'styleguide.html' },
      { g: 'Actions',id: 'a-theme',     label: state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', sub: 'Toggle appearance', icon: state.theme === 'dark' ? 'sun' : 'moon', run: toggleTheme },
      { g: 'Actions',id: 'a-sync',      label: 'Sync items to Xero',sub: 'Push today’s invoices', icon: 'sync',       run: () => U.toast('Xero sync started', '5 invoices queued for sync.', 'info') },
      { g: 'Actions',id: 'a-acc',       label: 'Submit ACC batch',  sub: '3 invoices ready',      icon: 'send',       run: () => location.hash = '#/acc' },
    ];
    K.patients.slice(0, 6).forEach(p => list.push({
      g: 'Patients', id: `p-${p.id}`, label: `${p.first} ${p.last}`,
      sub: `${p.nhi} · ${U.age(p.dob)}y · ${p.funder}`, icon: 'user',
      run: () => location.hash = `#/patient/${p.id}`
    }));
    return list;
  }

  function openPalette() {
    const all = commands();
    let filtered = all, active = 0;

    const ov = U.overlay('cmdk', `
      <div class="cmdk" aria-label="Command palette">
        <div class="cmdk-input-wrap">
          ${ic('command' in {} ? 'sparkle' : 'sparkle', 18)}
          <input class="cmdk-input" id="cmdkInput" data-autofocus placeholder="Type a command or search…" aria-label="Command" autocomplete="off" spellcheck="false">
          <span class="kbd">Esc</span>
        </div>
        <div class="cmdk-list" id="cmdkList" role="listbox"></div>
        <div class="cmdk-ft">
          <span><span class="kbd">↑</span> <span class="kbd">↓</span> navigate</span>
          <span><span class="kbd">↵</span> run</span>
          <span class="spacer"></span>
          <span>Kora Health</span>
        </div>
      </div>`, { onMount(panel, close) {
        const input = qs('#cmdkInput', panel), list = qs('#cmdkList', panel);

        function paint() {
          if (!filtered.length) {
            list.innerHTML = `<div class="empty" style="padding:30px 16px"><span class="e-ic">${ic('search', 20)}</span>
              <h4 class="t-sm">Nothing matched</h4><p class="t-xs">Try “letter”, “invoice”, “ACC” or a patient name.</p></div>`;
            return;
          }
          let last = null;
          list.innerHTML = filtered.map((c, i) => {
            const head = c.g !== last ? `<div class="cmdk-group-label">${c.g}</div>` : '';
            last = c.g;
            return `${head}<button class="cmdk-item" role="option" aria-selected="${i === active}" data-active="${i === active}" data-i="${i}">
              ${ic(c.icon, 17)}<span class="ci-main"><b>${esc(c.label)}</b><span>${esc(c.sub)}</span></span>
              ${i === active ? '<span class="kbd">↵</span>' : ''}</button>`;
          }).join('');
          const el = list.querySelector('[data-active="true"]');
          if (el) el.scrollIntoView({ block: 'nearest' });
        }
        function run(i) { const c = filtered[i]; if (!c) return; close(); setTimeout(c.run, 40); }

        input.addEventListener('input', () => {
          const q = input.value.trim().toLowerCase();
          filtered = !q ? all : all.filter(c => (c.label + ' ' + c.sub + ' ' + c.g).toLowerCase().includes(q));
          active = 0; paint();
        });
        input.addEventListener('keydown', e => {
          if (e.key === 'ArrowDown') { e.preventDefault(); active = (active + 1) % filtered.length; paint(); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); active = (active - 1 + filtered.length) % filtered.length; paint(); }
          else if (e.key === 'Enter') { e.preventDefault(); run(active); }
        });
        on(list, 'click', '.cmdk-item', (e, t) => run(Number(t.dataset.i)));
        on(list, 'mousemove', '.cmdk-item', (e, t) => { const i = Number(t.dataset.i); if (i !== active) { active = i; paint(); } });
        paint();
      }});
    return ov;
  }

  /* ------------------------------------------------------------ actions */
  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('kora.theme', state.theme);
    applyTheme();
  }

  function initShell() {
    qs('#railToggle').addEventListener('click', () => {
      state.rail = !state.rail; localStorage.setItem('kora.rail', String(state.rail)); applyRail();
    });
    qs('#themeBtn').addEventListener('click', toggleTheme);
    qs('#cmdkIcon').innerHTML = ic('sparkle', 15);
    qs('#cmdkBtn').addEventListener('click', openPalette);

    const ib = qs('#inboxBtn');
    const unread = K.inbox.filter(i => i.unread).length;
    ib.innerHTML = ic('bell', 17) + (unread ? `<span class="badge-count" style="position:absolute;top:1px;right:1px">${unread}</span>` : '');
    ib.addEventListener('click', () => location.hash = '#/inbox');

    qs('#roleBtn').addEventListener('click', e => {
      U.menu(e.currentTarget, [
        { label: 'View the app as' },
        ...Object.entries(ROLES).map(([k, r]) => ({
          id: k, icon: state.role === k ? 'check' : 'user', label: `${r.label} — ${r.desc.split(' · ')[0]}`,
          action: () => {
            state.role = k; localStorage.setItem('kora.role', k);
            applyRole(); route();
            U.toast(`Now viewing as ${r.label}`, r.desc, 'info');
          }
        }))
      ]);
    });

    qs('#userBtn').addEventListener('click', e => {
      U.menu(e.currentTarget, [
        { label: K.st(ROLES[state.role].user).name },
        { icon: 'user',   label: 'My profile & signature', action: () => location.hash = '#/admin/users' },
        { icon: 'sparkle',label: 'Design system',          action: () => location.href = 'styleguide.html' },
        { icon: state.theme === 'dark' ? 'sun' : 'moon', label: state.theme === 'dark' ? 'Light mode' : 'Dark mode', action: toggleTheme },
        '-',
        { icon: 'logout', label: 'Sign out', danger: true, action: () => U.toast('Signed out', 'This is a design prototype.', 'info') },
      ]);
    });

    document.addEventListener('keydown', e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); return; }
      if (e.key === 'Escape') { if (U.openLayers.length) { e.preventDefault(); U.closeTop(); } return; }
      if (typing) return;
      if (e.key === '/') { e.preventDefault(); qs('#globalSearch').focus(); }
      if (e.key === '[') { state.rail = !state.rail; localStorage.setItem('kora.rail', String(state.rail)); applyRail(); }
      if (e.key.toLowerCase() === 'g') {
        const once = ev => {
          const map = { d: 'dashboard', a: 'appointments', p: 'patients', i: 'inbox', l: 'letters', t: 'tasks', b: 'billing', c: 'acc', r: 'reports', s: 'admin' };
          if (map[ev.key.toLowerCase()]) { ev.preventDefault(); location.hash = `#/${map[ev.key.toLowerCase()]}`; }
          document.removeEventListener('keydown', once, true);
        };
        document.addEventListener('keydown', once, true);
        setTimeout(() => document.removeEventListener('keydown', once, true), 1400);
      }
    });
  }

  window.openPalette = openPalette;

  /* ------------------------------------------------------------ boot */
  applyTheme(); applyRail(); applyRole(); initShell(); initSearch(); renderNav();
  if (!location.hash) location.hash = '#/dashboard';
  route();
})();
