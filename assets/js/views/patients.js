/* Kora Health — Patient register */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, avatar, on, qs, qsa } = U;
  window.Views = window.Views || {};

  let filter = { q: '', funder: 'all', clinician: 'all' };

  function nextAppt(ptId) {
    return K.appts.filter(a => a.pt === ptId && a.status === 'booked').sort((a, b) => a.start - b.start)[0];
  }
  function balance(ptId) {
    return K.invoices.filter(i => i.pt === ptId && i.status !== 'paid' && i.status !== 'draft')
      .reduce((s, i) => s + U.invoiceTotals(i).incl, 0);
  }

  function rows() {
    return K.patients.filter(p => {
      if (filter.funder !== 'all' && p.funder !== filter.funder) return false;
      if (!filter.q) return true;
      const s = filter.q.toLowerCase();
      return `${p.first} ${p.last} ${p.nhi} ${p.phone}`.toLowerCase().includes(s);
    });
  }

  window.Views.patients = {
    title: () => 'Patients',
    skeleton: () => `<div class="page"><div class="sk sk-title mb-4" style="height:26px"></div>
      <div class="card">${U.skeletonList(7)}</div></div>`,

    render() {
      const list = rows();
      return `<div class="page">
        <div class="page-hd">
          <div class="page-title"><h1>Patients</h1>
            <span class="page-sub">${K.patients.length} active records · search by name, NHI, DOB or phone</span></div>
          <div class="page-actions">
            <button class="btn btn-secondary btn-sm">${ic('upload', 14)} Import</button>
            <button class="btn btn-primary btn-sm" data-act="new">${ic('plus', 14)} New patient</button>
          </div>
        </div>

        <div class="toolbar">
          <div class="input-group" style="max-width:300px">
            <span class="ic-lead">${ic('search', 15)}</span>
            <input class="input" id="ptq" placeholder="Filter this list…" value="${esc(filter.q)}" aria-label="Filter patients">
          </div>
          <select class="select" id="fFunder" style="max-width:190px" aria-label="Funding type">
            <option value="all">All funding types</option>
            <option value="ACC" ${filter.funder === 'ACC' ? 'selected' : ''}>ACC</option>
            <option value="Southern Cross" ${filter.funder === 'Southern Cross' ? 'selected' : ''}>Southern Cross</option>
            <option value="Private" ${filter.funder === 'Private' ? 'selected' : ''}>Private</option>
          </select>
          <span class="spacer"></span>
          <span class="t-xs subtle">${list.length} shown</span>
        </div>

        <section class="card">
          <div class="table-wrap">
            <table class="tbl">
              <thead><tr>
                <th>Patient</th><th>NHI</th><th>Date of birth</th><th>Contact</th>
                <th>Funding</th><th>Next appointment</th><th class="num-cell">Balance</th><th></th>
              </tr></thead>
              <tbody>
                ${list.length ? list.map(p => {
                  const n = nextAppt(p.id), bal = balance(p.id);
                  return `<tr data-id="${p.id}" tabindex="0">
                    <td><span class="row g-3">${avatar(p.id, 'sm', p.tone)}
                      <span><b>${esc(p.first)} ${esc(p.last)}</b>
                      ${p.alerts.length ? `<span class="tip" data-tip="${esc(p.alerts.join(', '))}" style="color:var(--bad-fg);margin-left:5px;vertical-align:-2px;display:inline-block">${ic('alert', 13)}</span>` : ''}
                      <br><span class="t-xs subtle">${esc(p.addr.split(',').slice(-2).join(',').trim())}</span></span></span></td>
                    <td class="t-mono t-sm">${esc(p.nhi)}</td>
                    <td class="t-sm">${U.fmtDate(p.dob)}<br><span class="t-xs subtle">${U.age(p.dob)} years</span></td>
                    <td class="t-sm">${esc(p.phone)}<br><span class="t-xs subtle truncate" style="max-width:180px;display:inline-block">${esc(p.email)}</span></td>
                    <td>${U.funderChip(p.funder)}</td>
                    <td class="t-sm">${n ? `${U.fmtTime(n.start)} today<br><span class="t-xs subtle">${esc(K.at(n.type).name)}</span>` : '<span class="subtle">—</span>'}</td>
                    <td class="num-cell ${bal > 0 ? 'bad-t' : ''}"><b>${bal > 0 ? U.money(bal) : '—'}</b></td>
                    <td><span class="row-actions">
                      <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="New letter" data-letter="${p.id}">${ic('letters', 14)}</button>
                      <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Book" data-book="${p.id}">${ic('calendar', 14)}</button>
                      <button class="btn btn-ghost btn-icon btn-sm" data-more="${p.id}" aria-label="More">${ic('dots', 14)}</button>
                    </span></td>
                  </tr>`;
                }).join('') : `<tr><td colspan="8">${U.empty('search', 'No patients match', 'Try a different name, NHI or funding type — or clear the filters.')}</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
      </div>`;
    },

    mount(root) {
      const q = qs('#ptq', root);
      q.addEventListener('input', () => {
        filter.q = q.value;
        const sel = q.selectionStart;
        const fresh = U.mountView(this);
        const nq = qs('#ptq', fresh); nq.focus(); nq.setSelectionRange(sel, sel);
      });
      qs('#fFunder', root).addEventListener('change', e => {
        filter.funder = e.target.value; U.mountView(this);
      });
      on(root, 'click', 'tbody tr', (e, t) => {
        if (e.target.closest('.row-actions')) return;
        location.hash = `#/patient/${t.dataset.id}`;
      });
      on(root, 'keydown', 'tbody tr', (e, t) => {
        if (e.key === 'Enter') location.hash = `#/patient/${t.dataset.id}`;
      });
      on(root, 'click', '[data-letter]', (e, t) => { e.stopPropagation(); location.hash = `#/letter/new?pt=${t.dataset.letter}`; });
      on(root, 'click', '[data-book]', (e, t) => { e.stopPropagation(); location.hash = '#/appointments'; });
      on(root, 'click', '[data-more]', (e, t) => {
        e.stopPropagation();
        const id = t.dataset.more;
        U.menu(t, [
          { label: K.ptName(id) },
          { icon: 'user',    label: 'Open workspace', action: () => location.hash = `#/patient/${id}` },
          { icon: 'billing', label: 'Create invoice', action: () => { location.hash = '#/billing'; setTimeout(() => window.Views.billing.openCreate(), 260); } },
          { icon: 'send',    label: 'Email patient',  action: () => U.toast('Email', 'Compose window would open here.', 'info') },
          '-',
          { icon: 'copy',    label: 'Copy NHI',       action: () => { navigator.clipboard && navigator.clipboard.writeText(K.pt(id).nhi); U.toast('NHI copied', K.pt(id).nhi, 'ok'); } },
        ]);
      });
      on(root, 'click', '[data-act="new"]', () => U.toast('New patient', 'Registration form would open here.', 'info'));
    },
  };
})();
