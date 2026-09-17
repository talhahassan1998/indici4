/* Kora Health — Search Patient.
   Reception searches on the fields they are given over the phone, so all four
   are present at once rather than hidden behind a mode toggle. */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa, money } = U;
  window.Views = window.Views || {};

  let f = { name: '', dob: '', nhi: '', street: '', searched: false, vault: false };
  let active = 0;

  const digits = v => String(v).replace(/\D/g, '');

  /* ------------------------------------------------------------ matching */
  function results() {
    const name = f.name.trim().toLowerCase();
    const nhi = f.nhi.trim().toLowerCase();
    const dob = digits(f.dob);
    const street = f.street.trim().toLowerCase();
    if (!name && !nhi && !dob && !street) return [];

    return K.patients.filter(p => {
      if (nhi && !p.nhi.toLowerCase().startsWith(nhi)) return false;
      if (street && !p.addr.toLowerCase().includes(street)) return false;
      if (dob) {
        const d = digits(p.dob.split('-').reverse().join(''));   // ddmmyyyy
        if (!d.startsWith(dob) && !digits(p.dob).includes(dob)) return false;
      }
      if (name) {
        // "surname firstname", either order, plus preferred name
        const hay = [p.last, p.first, p.preferred || ''].join(' ').toLowerCase();
        const terms = name.split(/\s+/).filter(Boolean);
        if (!terms.every(t => hay.includes(t))) return false;
      }
      return true;
    }).sort((a, b) => a.last.localeCompare(b.last) || a.first.localeCompare(b.first));
  }

  /* ------------------------------------------------------------ legend */
  function legend() {
    return `<div class="row g-4 wrap" style="padding:9px var(--s-5);background:var(--surface-2);
                 border-bottom:1px solid var(--line)">
      <span class="t-eyebrow">Enrolment</span>
      ${Object.entries(K.ENROL_STATUS).map(([k, v]) => `
        <span class="row g-2 t-xs muted"><i style="width:9px;height:9px;border-radius:3px;background:${v.tone}"></i>${esc(v.label)}</span>`).join('')}
    </div>`;
  }

  /* ------------------------------------------------------------ search form */
  function nhiNote() {
    if (!f.nhi.trim()) return '<span class="hint">Three letters, four digits</span>';
    const r = K.nhiCheck(f.nhi);
    if (r.state === 'ok')      return `<span class="err ok-t">${ic('check', 12)} Check digit valid</span>`;
    if (r.state === 'partial') return `<span class="hint">${esc(r.why)}</span>`;
    return `<span class="err">${ic('alert', 12)} ${esc(r.why)}</span>`;
  }

  function form() {
    return `<section class="card card-raised">
      <div class="card-bd">
        <div class="grid" style="grid-template-columns:minmax(220px,2fr) minmax(150px,1fr) minmax(150px,1fr);gap:var(--s-4)">
          <div class="field">
            <label class="label" for="fName">Patient name</label>
            <input class="input" id="fName" value="${esc(f.name)}" placeholder="Surname, then first name" autocomplete="off" spellcheck="false">
            <span class="hint">Either order. Preferred names are searched too.</span>
          </div>
          <div class="field">
            <label class="label" for="fDob">Date of birth</label>
            <input class="input" id="fDob" value="${esc(f.dob)}" placeholder="DD/MM/YYYY" inputmode="numeric" autocomplete="off">
            <span class="hint">Partial is fine — 1974 works</span>
          </div>
          <div class="field">
            <label class="label" for="fNhi">NHI</label>
            <input class="input t-mono" id="fNhi" value="${esc(f.nhi)}" placeholder="JKL8407"
                   maxlength="7" autocomplete="off" spellcheck="false" style="text-transform:uppercase">
            ${nhiNote()}
          </div>
        </div>

        <div class="grid mt-4" style="grid-template-columns:minmax(220px,2fr) auto;gap:var(--s-4);align-items:end">
          <div class="field">
            <label class="label" for="fStreet">Street</label>
            <input class="input" id="fStreet" value="${esc(f.street)}" placeholder="Street name or suburb" autocomplete="off">
          </div>
          <div class="row g-2 wrap" style="justify-content:flex-end">
            <button class="btn btn-ghost btn-sm" data-act="clear">Clear</button>
            <button class="btn btn-secondary btn-sm" data-act="advanced">${ic('filter', 14)} Advanced search</button>
            <button class="btn btn-secondary btn-sm" data-act="vault">${ic('lock', 14)} Search vault</button>
            <button class="btn btn-primary" data-act="search">${ic('search', 15)} Search</button>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------ results */
  function nameCell(p) {
    const st = K.ENROL_STATUS[p.status];
    return `<span class="col g-1" style="min-width:0">
      <span class="row g-2">
        <b style="color:${st.tone}">${esc(K.displayName(p))}</b>
        ${p.alerts.length ? `<span class="tip" data-tip="${esc(p.alerts.join(', '))}" style="color:var(--bad-fg);display:inline-flex">${ic('alert', 13)}</span>` : ''}
      </span>
      <span class="chip ${st.chip}" style="align-self:flex-start">${esc(st.label)}</span>
    </span>`;
  }

  function resultsTable(list) {
    return `<section class="card">
      <div class="card-hd">
        <h3>${list.length} ${list.length === 1 ? 'patient' : 'patients'}</h3>
        ${f.vault ? '<span class="chip chip-warn">Including vault</span>' : ''}
        <span class="spacer"></span>
        <span class="t-xs subtle">Click a row to open the record</span>
      </div>
      ${legend()}
      <div class="table-wrap"><table class="tbl tbl-compact">
        <thead><tr>
          <th style="min-width:200px">Name</th><th>Date of birth</th><th class="num-cell">Age</th><th>Gender</th>
          <th>NHI</th><th>Chart no.</th><th style="min-width:180px">Address</th><th>Mobile</th>
          <th>Provider</th>
          <th class="tip" data-tip="Funded / not funded">Fund</th>
          <th class="tip" data-tip="Community Services Card">CSC</th>
          <th class="tip" data-tip="Enrolment">Enrol</th>
          <th class="tip" data-tip="Registered or casual">Reg</th>
          <th class="tip" data-tip="Payment group">Pay grp</th>
          <th class="tip" data-tip="General Medical Services subsidy">GMS</th>
          <th class="num-cell">Balance</th><th></th>
        </tr></thead>
        <tbody>${list.map((p, i) => {
          const bal = K.balance(p.id);
          return `<tr data-open="${p.id}" data-i="${i}" tabindex="0" class="${i === active ? 'selected' : ''}">
            <td>${nameCell(p)}</td>
            <td class="t-sm">${U.fmtDate(p.dob)}</td>
            <td class="num-cell t-sm">${U.age(p.dob)}</td>
            <td class="t-sm">${p.sex === 'F' ? 'Female' : 'Male'}</td>
            <td class="t-mono t-sm">${esc(p.nhi)}</td>
            <td class="t-mono t-xs subtle">${esc(p.chart)}</td>
            <td class="t-xs">${esc(p.addr)}</td>
            <td class="t-sm">${esc(p.phone)}</td>
            <td class="t-sm">${esc(K.st(p.provider).name.replace('Dr ', ''))}</td>
            <td class="t-sm">${p.fund === 'F' ? '<span class="chip chip-ok">F</span>' : '<span class="subtle">N</span>'}</td>
            <td class="t-sm">${p.csc ? '<span class="chip chip-warm">CSC</span>' : '<span class="subtle">—</span>'}</td>
            <td class="t-sm">${p.enrol === 'NES' ? '<span class="chip chip-ok">NES</span>' : '<span class="chip">U</span>'}</td>
            <td class="t-sm">${esc(p.reg)}</td>
            <td class="t-sm">${esc(p.payGrp)}</td>
            <td class="t-sm">${esc(p.gms)}</td>
            <td class="num-cell ${bal > 0 ? 'bad-t' : 'subtle'}"><b>${bal > 0 ? money(bal) : '$0.00'}</b></td>
            <td><span class="row-actions">
              <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Book appointment" data-a="book" data-p="${p.id}" aria-label="Book appointment for ${esc(p.first)} ${esc(p.last)}">${ic('calendar', 14)}</button>
              <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Start consult" data-a="consult" data-p="${p.id}" aria-label="Start consult with ${esc(p.first)} ${esc(p.last)}">${ic('stethoscope', 14)}</button>
              <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Create invoice" data-a="invoice" data-p="${p.id}" aria-label="Create invoice for ${esc(p.first)} ${esc(p.last)}">${ic('billing', 14)}</button>
              <button class="btn btn-ghost btn-icon btn-sm" data-a="more" data-p="${p.id}" aria-label="More actions for ${esc(p.first)} ${esc(p.last)}">${ic('dots', 14)}</button>
            </span></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
    </section>`;
  }

  function landing() {
    const recent = ['p1', 'p9', 'p12'].map(id => K.pt(id));
    return `<div class="dash-grid mt-4">
      <div class="col-7"><section class="card">
        <div class="card-hd"><h3>Recently viewed</h3><span class="spacer"></span><span class="t-xs subtle">This device</span></div>
        <div class="list-rows">
          ${recent.map(p => `<button class="list-row" data-open="${p.id}">
            ${avatar(p.id, 'sm', p.tone)}
            <span class="grow" style="text-align:left"><b class="t-sm">${esc(K.displayName(p))}</b>
              <span class="t-xs subtle" style="display:block">${esc(p.nhi)} · ${esc(p.chart)} · ${U.age(p.dob)}${p.sex}</span></span>
            ${U.funderChip(p.funder)}${ic('chevronRight', 15, 'subtle')}</button>`).join('')}
        </div>
      </section></div>
      <div class="col-5"><section class="card card-bd col g-3">
        <span class="t-eyebrow">Before you register someone new</span>
        <p class="t-sm muted">Search the NHI first. Married and preferred names are the usual reason a
          patient looks missing, and a duplicate record splits their history in two.</p>
        <div class="row g-2">
          <button class="btn btn-secondary btn-sm" data-act="register">${ic('plus', 14)} Register patient</button>
          <button class="btn btn-ghost btn-sm" data-act="merge">${ic('link', 14)} Find duplicates</button>
        </div>
      </section></div>
    </div>`;
  }

  /* ------------------------------------------------------------ view */
  window.Views.patients = {
    title: () => 'Search Patient',
    skeleton: () => `<div class="page"><div class="sk" style="height:180px;border-radius:16px"></div>
      <div class="card mt-4">${U.skeletonList(5)}</div></div>`,

    render() {
      const list = f.searched ? results() : [];
      const anyField = [f.name, f.dob, f.nhi, f.street].some(x => x.trim());
      return `<div class="page">
        <div class="page-hd">
          <div class="page-title"><h1>Search Patient</h1>
            <span class="page-sub">Kora Specialists · Newmarket</span></div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm" data-act="merge">${ic('link', 14)} Find duplicates</button>
            <button class="btn btn-primary btn-sm" data-act="register">${ic('plus', 14)} Register patient</button>
          </div>
        </div>

        ${form()}

        ${!f.searched ? landing()
          : list.length ? `<div class="mt-4">${resultsTable(list)}</div>`
          : `<section class="card mt-4">${U.empty('search', 'No patient matched',
              anyField ? 'Check the spelling, try the NHI on its own, or search the vault for archived records.'
                       : 'Enter a name, date of birth, NHI or street to search.',
              `<div class="row g-2">
                 <button class="btn btn-secondary btn-sm" data-act="vault">${ic('lock', 14)} Search vault</button>
                 <button class="btn btn-primary btn-sm" data-act="register">${ic('plus', 14)} Register patient</button>
               </div>`)}</section>`}
      </div>`;
    },

    mount(root) {
      const FIELDS = { fName: 'name', fDob: 'dob', fNhi: 'nhi', fStreet: 'street' };

      const repaint = (focusId) => {
        const el = focusId && qs('#' + focusId, root);
        const pos = el ? el.selectionStart : null;
        const fresh = U.mountView(this);
        if (focusId) {
          const n = qs('#' + focusId, fresh);
          if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) {} }
        }
        return fresh;
      };

      Object.entries(FIELDS).forEach(([id, key]) => {
        const el = qs('#' + id, root);
        if (!el) return;
        el.addEventListener('input', () => {
          f[key] = key === 'nhi' ? el.value.toUpperCase() : el.value;
          // Only the NHI field repaints live — it is validating as you type.
          if (key === 'nhi') repaint(id);
        });
        el.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); f.searched = true; active = 0; repaint(); }
        });
      });

      const open = id => { location.hash = `#/patient/${id}`; };

      on(root, 'click', '[data-act="search"]', () => { f.searched = true; active = 0; repaint(); });
      on(root, 'click', '[data-act="clear"]', () => {
        f = { name: '', dob: '', nhi: '', street: '', searched: false, vault: false };
        repaint('fName');
      });
      on(root, 'click', '[data-act="vault"]', () => {
        f.vault = true; f.searched = true; repaint();
        U.toast('Vault included', 'Archived and transferred-out records are now in the results.', 'info');
      });
      on(root, 'click', '[data-act="advanced"]', () => U.toast('Advanced search',
        'Provider, enrolment, payment group, ACC claim and appointment history would filter here.', 'info'));
      on(root, 'click', '[data-act="register"]', () => U.toast('Register patient',
        'An NHI lookup runs first so you do not create a duplicate.', 'info'));
      on(root, 'click', '[data-act="merge"]', () => U.toast('Duplicate check',
        'Candidates matched on name, date of birth and address.', 'info'));

      on(root, 'click', '[data-open]', (e, t) => { if (!e.target.closest('.row-actions')) open(t.dataset.open); });
      on(root, 'keydown', '[data-open]', (e, t) => { if (e.key === 'Enter') open(t.dataset.open); });

      on(root, 'click', '[data-a]', (e, t) => {
        e.stopPropagation();
        const id = t.dataset.p;
        switch (t.dataset.a) {
          case 'book':    location.hash = '#/appointments'; setTimeout(() => window.Views.appointments.openBooking(id), 280); break;
          case 'consult': location.hash = `#/consult/${id}`; break;
          case 'invoice': location.hash = '#/billing'; setTimeout(() => window.Views.billing.openCreate(), 280); break;
          case 'more': U.menu(t, [
            { label: K.ptName(id) },
            { icon: 'user',    label: 'Open record',        action: () => open(id) },
            { icon: 'edit',    label: 'Edit demographics',  action: () => U.toast('Edit', 'Demographics form would open.', 'info') },
            { icon: 'letters', label: 'Write letter',       action: () => location.hash = `#/letter/new?pt=${id}` },
            { icon: 'flask',   label: 'Request tests',      action: () => { location.hash = `#/patient/${id}/tests`; } },
            { icon: 'rx',      label: 'Prescribe',          action: () => { location.hash = `#/patient/${id}/rx`; } },
            '-',
            { icon: 'print',   label: 'Print summary',      action: () => U.toast('Print', 'Patient summary sent to the printer.', 'ok') },
            { icon: 'copy',    label: 'Copy NHI',           action: () => { navigator.clipboard && navigator.clipboard.writeText(K.pt(id).nhi); U.toast('NHI copied', K.pt(id).nhi, 'ok'); } },
          ]); break;
        }
      });
    },
  };
})();
