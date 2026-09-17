/* Kora Health — Search Patient.
   A full-bleed data grid: the header and pager are fixed, the rows scroll,
   and the whole thing is built to stay readable at a few hundred rows. */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa, money } = U;
  window.Views = window.Views || {};

  let f = {
    name: '', dob: '', nhi: '', street: '',
    searched: true,              // the grid is the screen, so show it straight away
    sort: 'last', dir: 1, page: 1, per: 100, vault: false,
  };

  const digits = v => String(v).replace(/\D/g, '');

  /* ------------------------------------------------------------ data */
  function matched() {
    const name = f.name.trim().toLowerCase();
    const nhi = f.nhi.trim().toLowerCase();
    const dob = digits(f.dob);
    const street = f.street.trim().toLowerCase();

    let list = K.patients.filter(p => {
      if (!f.vault && p.status === 'deceased') return false;
      if (nhi && !p.nhi.toLowerCase().startsWith(nhi)) return false;
      if (street && !p.addr.toLowerCase().includes(street)) return false;
      if (dob) {
        const dmy = digits(p.dob.split('-').reverse().join(''));
        if (!dmy.startsWith(dob) && !digits(p.dob).includes(dob)) return false;
      }
      if (name) {
        const hay = [p.last, p.first, p.preferred || ''].join(' ').toLowerCase();
        if (!name.split(/\s+/).filter(Boolean).every(t => hay.includes(t))) return false;
      }
      return true;
    });

    const key = {
      last: p => `${p.last} ${p.first}`,
      dob: p => p.dob,
      age: p => p.dob,
      nhi: p => p.nhi,
      chart: p => p.chart,
      provider: p => K.st(p.provider).name,
      balance: p => K.balance(p.id),
      gms: p => p.gms,
    }[f.sort] || (p => p.last);

    return list.sort((a, b) => {
      const x = key(a), y = key(b);
      const cmp = typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'en-NZ');
      return (f.sort === 'age' ? -cmp : cmp) * f.dir;
    });
  }

  /* ------------------------------------------------------------ chrome */
  function nhiNote() {
    if (!f.nhi.trim()) return '<span class="hint">Three letters, four digits</span>';
    const r = K.nhiCheck(f.nhi);
    if (r.state === 'ok') return `<span class="err ok-t">${ic('check', 12)} Check digit valid</span>`;
    if (r.state === 'partial') return `<span class="hint">${esc(r.why)}</span>`;
    return `<span class="err">${ic('alert', 12)} ${esc(r.why)}</span>`;
  }

  function filters() {
    return `<div class="ps-filters">
      <div class="ps-filter-grid">
        <div class="field">
          <label class="label" for="fName">Patient name</label>
          <input class="input" id="fName" value="${esc(f.name)}" placeholder="Surname, then first name" autocomplete="off" spellcheck="false">
        </div>
        <div class="field">
          <label class="label" for="fDob">Date of birth</label>
          <input class="input" id="fDob" value="${esc(f.dob)}" placeholder="DD/MM/YYYY" inputmode="numeric" autocomplete="off">
        </div>
        <div class="field">
          <label class="label" for="fNhi">NHI</label>
          <input class="input t-mono" id="fNhi" value="${esc(f.nhi)}" placeholder="JKL8407" maxlength="7"
                 autocomplete="off" spellcheck="false" style="text-transform:uppercase">
        </div>
        <div class="field">
          <label class="label" for="fStreet">Street or suburb</label>
          <input class="input" id="fStreet" value="${esc(f.street)}" placeholder="Devon Street" autocomplete="off">
        </div>
        <div class="row g-2">
          <button class="btn btn-primary" data-act="search">${ic('search', 15)} Search</button>
          <button class="btn btn-ghost btn-sm" data-act="clear">Clear</button>
          <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Advanced search" data-act="advanced" aria-label="Advanced search">${ic('filter', 15)}</button>
        </div>
      </div>
      <div class="row g-3 mt-2">${nhiNote()}</div>
    </div>`;
  }

  function legend() {
    return `<div class="ps-legend">
      <span class="t-eyebrow">Enrolment</span>
      ${Object.entries(K.ENROL_STATUS).map(([k, v]) =>
        `<span class="lg"><i style="background:${v.tone}"></i>${esc(v.label)}</span>`).join('')}
      <span class="spacer"></span>
      <label class="row g-2 t-xs" style="cursor:pointer">
        <span class="switch"><input type="checkbox" id="fVault" ${f.vault ? 'checked' : ''}>
          <span class="track"></span><span class="thumb"></span></span>
        <span class="muted">Include deceased and archived</span>
      </label>
    </div>`;
  }

  /* ------------------------------------------------------------ grid */
  const COLS = [
    { k: 'last',     label: 'Name',        sort: true },
    { k: 'dob',      label: 'DOB',         sort: true },
    { k: 'age',      label: 'Age',         sort: true, num: true },
    { k: null,       label: 'Gender' },
    { k: 'nhi',      label: 'NHI',         sort: true },
    { k: 'chart',    label: 'Chart no.',   sort: true },
    { k: null,       label: 'Address' },
    { k: null,       label: 'Phone' },
    { k: null,       label: 'Mobile' },
    { k: 'provider', label: 'Provider',    sort: true },
    { k: null,       label: 'Fund',  tip: 'Funded or not funded' },
    { k: null,       label: 'CSC',   tip: 'Community Services Card' },
    { k: null,       label: 'Enrol', tip: 'Enrolment status' },
    { k: null,       label: 'Reg',   tip: 'Registered or casual' },
    { k: null,       label: 'Pay grp', tip: 'Payment group' },
    { k: 'gms',      label: 'GMS',   sort: true, tip: 'General Medical Services subsidy' },
    { k: 'balance',  label: 'Balance', sort: true, num: true },
    { k: null,       label: 'Actions' },
  ];

  /* Same affordances as the current grid, drawn as one consistent icon set
     and given real names so they are learnable rather than memorised. */
  const ACTIONS = [
    { id: 'open',     icon: 'user',      label: 'Open patient record' },
    { id: 'edit',     icon: 'edit',      label: 'Edit demographics' },
    { id: 'notes',    icon: 'noteEdit',  label: 'Clinical notes' },
    { id: 'tasks',    icon: 'tasks',     label: 'Tasks' },
    { id: 'account',  icon: 'dollar',    label: 'Account and invoices' },
    { id: 'book',     icon: 'calendar',  label: 'Book appointment' },
    { id: 'recall',   icon: 'bell',      label: 'Recalls' },
    { sep: true },
    { id: 'cir',      icon: 'syringe',   label: 'Immunisations (CIR)' },
    { id: 'family',   icon: 'household', label: 'Family and household' },
    { id: 'relate',   icon: 'userPlus',  label: 'Add relationship' },
    { id: 'enrol',    icon: 'userCheck', label: 'Enrolment' },
    { sep: true },
    { id: 'print',    icon: 'print',     label: 'Print summary' },
    { id: 'label',    icon: 'idCard',    label: 'Patient label' },
    { id: 'more',     icon: 'dots',      label: 'More actions' },
  ];

  function row(p) {
    const st = K.ENROL_STATUS[p.status];
    const bal = K.balance(p.id);
    const mobile = p.phone && p.phone.startsWith('+64 2') ? p.phone : '';
    const landline = p.phone && !p.phone.startsWith('+64 2') ? p.phone : '';
    return `<tr data-open="${p.id}" tabindex="0">
      <td><span class="pname">
        <i class="p-dot" style="background:${st.tone}" title="${esc(st.label)}"></i>
        <b style="color:${st.tone}">${esc(p.last.toUpperCase())}, ${esc(p.first)}</b>
        ${p.preferred ? `<span class="p-pref">(${esc(p.preferred)})</span>` : ''}
        ${p.alerts.length ? `<span class="tip" data-tip="${esc(p.alerts.join(', '))}" style="color:var(--bad-fg);display:inline-flex">${ic('alert', 13)}</span>` : ''}
      </span></td>
      <td class="t-mono t-xs">${U.fmtDate(p.dob)}</td>
      <td class="num-cell">${U.age(p.dob)}</td>
      <td>${p.sex === 'F' ? 'Female' : 'Male'}</td>
      <td class="t-mono t-xs">${esc(p.nhi)}</td>
      <td class="t-mono t-xs subtle">${esc(p.chart)}</td>
      <td class="wrap-cell t-xs">${esc(p.addr)}</td>
      <td class="t-xs">${esc(landline) || '<span class="subtle">—</span>'}</td>
      <td class="t-xs">${esc(mobile) || '<span class="subtle">—</span>'}</td>
      <td class="t-xs">${esc(K.st(p.provider).name.replace(/^(Dr|Nurse) /, ''))}</td>
      <td>${p.fund === 'F' ? '<span class="chip chip-ok">F</span>' : '<span class="subtle">N</span>'}</td>
      <td>${p.csc ? '<span class="chip chip-warm">CSC</span>' : '<span class="subtle">—</span>'}</td>
      <td>${p.enrol === 'NES' ? '<span class="chip chip-ok">NES</span>' : '<span class="chip">U</span>'}</td>
      <td>${esc(p.reg)}</td>
      <td class="t-xs">${esc(p.payGrp)}</td>
      <td class="t-xs">${esc(p.gms)}</td>
      <td class="num-cell ${bal > 0 ? 'bad-t' : 'subtle'}">${bal > 0 ? `<b>${money(bal)}</b>` : '$0.00'}</td>
      <td><span class="p-actions">
        ${ACTIONS.map(a => a.sep ? '<span class="pa-sep"></span>'
          : `<button class="pa tip" data-tip="${esc(a.label)}" data-a="${a.id}" data-p="${p.id}"
               aria-label="${esc(a.label)} — ${esc(p.first)} ${esc(p.last)}">${ic(a.icon, 15)}</button>`).join('')}
      </span></td>
    </tr>`;
  }

  function grid(list) {
    const start = (f.page - 1) * f.per;
    const page = list.slice(start, start + f.per);
    return `<div class="ps-grid" id="psGrid">
      <table>
        <thead><tr>
          ${COLS.map(cx => {
            const sorted = cx.k && f.sort === cx.k;
            return `<th class="${cx.sort ? 'sortable' : ''} ${cx.tip ? 'tip' : ''} ${cx.num ? 'num-cell' : ''}"
              ${cx.tip ? `data-tip="${esc(cx.tip)}"` : ''}
              ${sorted ? `aria-sort="${f.dir === 1 ? 'ascending' : 'descending'}"` : ''}
              ${cx.sort ? `data-sort="${cx.k}"` : ''}>
              ${esc(cx.label)}${cx.sort ? `<span class="sort-ind">${sorted ? (f.dir === 1 ? '↑' : '↓') : '↕'}</span>` : ''}
            </th>`;
          }).join('')}
        </tr></thead>
        <tbody>${page.map(row).join('')}</tbody>
      </table>
      ${!page.length ? U.empty('search', 'No patient matched',
        'Check the spelling, try the NHI on its own, or include archived records.',
        `<button class="btn btn-primary btn-sm" data-act="register">${ic('plus', 14)} Register patient</button>`) : ''}
    </div>`;
  }

  function pager(list) {
    const pages = Math.max(1, Math.ceil(list.length / f.per));
    f.page = Math.min(f.page, pages);
    const start = list.length ? (f.page - 1) * f.per + 1 : 0;
    const end = Math.min(f.page * f.per, list.length);
    const nums = [];
    for (let i = Math.max(1, f.page - 2); i <= Math.min(pages, f.page + 2); i++) nums.push(i);
    return `<div class="ps-foot">
      <span class="t-sm muted">Showing <b class="num">${start}–${end}</b> of
        <b class="num">${list.length.toLocaleString('en-NZ')}</b> patients</span>
      <span class="spacer"></span>
      <label class="row g-2 t-xs muted">Rows
        <select class="select" id="fPer" style="height:30px;width:76px;padding-top:2px;padding-bottom:2px" aria-label="Rows per page">
          ${[50, 100, 200].map(n => `<option ${f.per === n ? 'selected' : ''}>${n}</option>`).join('')}
        </select></label>
      <div class="pager" role="group" aria-label="Pagination">
        <button data-page="1" ${f.page === 1 ? 'disabled' : ''} aria-label="First page">${ic('chevronLeft', 13)}${ic('chevronLeft', 13)}</button>
        <button data-page="${f.page - 1}" ${f.page === 1 ? 'disabled' : ''} aria-label="Previous page">${ic('chevronLeft', 14)}</button>
        ${f.page > 3 ? '<span class="t-xs subtle" style="padding:0 4px">…</span>' : ''}
        ${nums.map(n => `<button data-page="${n}" aria-current="${n === f.page}">${n}</button>`).join('')}
        ${f.page < pages - 2 ? '<span class="t-xs subtle" style="padding:0 4px">…</span>' : ''}
        <button data-page="${f.page + 1}" ${f.page === pages ? 'disabled' : ''} aria-label="Next page">${ic('chevronRight', 14)}</button>
        <button data-page="${pages}" ${f.page === pages ? 'disabled' : ''} aria-label="Last page">${ic('chevronRight', 13)}${ic('chevronRight', 13)}</button>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ view */
  window.Views.patients = {
    title: () => 'Search Patient',
    skeleton: () => `<div class="page"><div class="sk" style="height:120px;border-radius:12px"></div>
      <div class="sk mt-4" style="height:520px;border-radius:12px"></div></div>`,

    render() {
      const list = matched();
      return `<div class="ps-shell">
        <div class="ps-head">
          <div class="page-title"><h1 class="t-h2">Search Patient</h1>
            <span class="page-sub">Kora Specialists · Newmarket ·
              <b class="num">${K.patients.length.toLocaleString('en-NZ')}</b> records</span></div>
          <span class="spacer"></span>
          <div class="row g-2">
            <button class="btn btn-ghost btn-sm" data-act="export">${ic('download', 14)} Export</button>
            <button class="btn btn-secondary btn-sm" data-act="merge">${ic('link', 14)} Find duplicates</button>
            <button class="btn btn-primary btn-sm" data-act="register">${ic('plus', 14)} Register patient</button>
          </div>
        </div>
        ${filters()}
        ${legend()}
        ${grid(list)}
        ${pager(list)}
      </div>`;
    },

    mount(root) {
      const FIELDS = { fName: 'name', fDob: 'dob', fNhi: 'nhi', fStreet: 'street' };

      const repaint = (focusId, keepScroll) => {
        const el = focusId && qs('#' + focusId, root);
        const pos = el ? el.selectionStart : null;
        const sc = keepScroll ? (qs('#psGrid', root) || {}).scrollTop : 0;
        const fresh = U.mountView(this);
        if (focusId) {
          const n = qs('#' + focusId, fresh);
          if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }
        }
        if (keepScroll && sc) { const g = qs('#psGrid', fresh); if (g) g.scrollTop = sc; }
        return fresh;
      };

      Object.entries(FIELDS).forEach(([id, key]) => {
        const el = qs('#' + id, root);
        if (!el) return;
        el.addEventListener('input', () => {
          f[key] = key === 'nhi' ? el.value.toUpperCase() : el.value;
          f.page = 1;
          repaint(id);                       // the grid filters live
        });
        el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); repaint(id); } });
      });

      const vault = qs('#fVault', root);
      if (vault) vault.addEventListener('change', e => { f.vault = e.target.checked; f.page = 1; repaint(); });
      const per = qs('#fPer', root);
      if (per) per.addEventListener('change', e => { f.per = Number(e.target.value); f.page = 1; repaint(); });

      on(root, 'click', '[data-sort]', (e, t) => {
        const k = t.dataset.sort;
        if (f.sort === k) f.dir = -f.dir; else { f.sort = k; f.dir = 1; }
        repaint();
      });
      on(root, 'click', '[data-page]', (e, t) => {
        if (t.disabled) return;
        f.page = Number(t.dataset.page); repaint();
        const g = qs('#psGrid', qs('#view')); if (g) g.scrollTop = 0;
      });

      const open = id => { location.hash = `#/patient/${id}`; };
      on(root, 'click', 'tbody tr', (e, t) => { if (!e.target.closest('.p-actions')) open(t.dataset.open); });
      on(root, 'keydown', 'tbody tr', (e, t) => { if (e.key === 'Enter') open(t.dataset.open); });

      on(root, 'click', '[data-act="search"]', () => repaint());
      on(root, 'click', '[data-act="clear"]', () => {
        f = { ...f, name: '', dob: '', nhi: '', street: '', page: 1 };
        repaint('fName');
      });
      on(root, 'click', '[data-act="advanced"]', () => U.toast('Advanced search',
        'Provider, enrolment, payment group, ACC claim and appointment history would filter here.', 'info'));
      on(root, 'click', '[data-act="register"]', () => U.toast('Register patient',
        'An NHI lookup runs first so you do not create a duplicate.', 'info'));
      on(root, 'click', '[data-act="merge"]', () => U.toast('Duplicate check',
        'Candidates matched on name, date of birth and address.', 'info'));
      on(root, 'click', '[data-act="export"]', () => U.toast('Export queued',
        `${matched().length} rows will be emailed to you as CSV.`, 'ok'));

      on(root, 'click', '[data-a]', (e, t) => {
        e.stopPropagation();
        const id = t.dataset.p, p = K.pt(id);
        const say = (title, body) => U.toast(title, `${p.first} ${p.last} · ${body}`, 'info');
        switch (t.dataset.a) {
          case 'open':    open(id); break;
          case 'notes':   location.hash = `#/consult/${id}`; break;
          case 'account': location.hash = `#/patient/${id}/invoices`; break;
          case 'book':    location.hash = '#/appointments'; setTimeout(() => window.Views.appointments.openBooking(id), 280); break;
          case 'tasks':   location.hash = '#/tasks'; setTimeout(() => window.Views.tasks.openNew(id), 280); break;
          case 'edit':    say('Edit demographics', 'name, address, contact and funding'); break;
          case 'recall':  say('Recalls', `${K.recalls.filter(r => r.pt === id).length} on file`); break;
          case 'cir':     say('Immunisations', 'Community Immunisation Register'); break;
          case 'family':  say('Family and household', 'linked members and shared address'); break;
          case 'relate':  say('Add relationship', 'next of kin, caregiver or dependant'); break;
          case 'enrol':   say('Enrolment', `${K.ENROL_STATUS[p.status].label} · ${p.payGrp}`); break;
          case 'print':   U.toast('Printing summary', `${p.first} ${p.last} · sent to the default printer`, 'ok'); break;
          case 'label':   U.toast('Patient label', `${p.nhi} · sent to the label printer`, 'ok'); break;
          case 'more': U.menu(t, [
            { label: K.displayName(p) },
            { icon: 'letters', label: 'Write letter',   action: () => location.hash = `#/letter/new?pt=${id}` },
            { icon: 'rx',      label: 'Prescribe',      action: () => location.hash = `#/patient/${id}/rx` },
            { icon: 'flask',   label: 'Request tests',  action: () => location.hash = `#/patient/${id}/tests` },
            { icon: 'billing', label: 'Create invoice', action: () => { location.hash = '#/billing'; setTimeout(() => window.Views.billing.openCreate(), 280); } },
            '-',
            { icon: 'copy',    label: 'Copy NHI', action: () => { navigator.clipboard && navigator.clipboard.writeText(p.nhi); U.toast('NHI copied', p.nhi, 'ok'); } },
            { icon: 'link',    label: 'Merge duplicate', action: () => U.toast('Merge', 'Duplicate search would open.', 'info') },
          ]); break;
        }
      });
    },
  };
})();
