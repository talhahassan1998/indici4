/* Kora Health — Appointment calendar (day / week, drag to reschedule) */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa } = U;
  window.Views = window.Views || {};

  const START_H = 8, END_H = 18, PX = 1;           // 1 minute = 1px
  const HOURS = END_H - START_H;
  const NOW = 10 * 60 + 22;

  let view = { mode: 'day', clinic: 'all', panel: false, panelPt: null, day: 3 }; // day: Thu index
  const DAYNAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const DAYDATES = ['14 Sep', '15 Sep', '16 Sep', '17 Sep', '18 Sep'];

  const top = m => (m - START_H * 60) * PX;
  const snap = m => Math.round(m / 5) * 5;

  function columns() {
    if (view.mode === 'week') {
      return DAYNAMES.map((d, i) => ({ id: `d${i}`, title: d, sub: DAYDATES[i], day: i }));
    }
    return K.clinicians
      .filter(c => view.clinic === 'all' || K.appts.some(a => a.cl === c.id && a.clinic === view.clinic))
      .map(c => ({ id: c.id, title: c.name, sub: `${c.spec} · ${K.cln(K.appts.find(a => a.cl === c.id).clinic).short}` }));
  }

  function apptsFor(col) {
    if (view.mode === 'week') {
      // spread today's list across the week for a single clinician (demo data)
      return K.appts.filter(a => a.cl === 'u1' && (hashDay(a.id) === col.day));
    }
    return K.appts.filter(a => a.cl === col.id && (view.clinic === 'all' || a.clinic === view.clinic));
  }
  function hashDay(id) { let s = 0; for (const c of id) s += c.charCodeAt(0); return s % 5; }

  function blocksFor(col) {
    if (view.mode === 'week') return K.blocks.filter(b => b.cl === 'u1' && hashDay(b.label) === col.day);
    return K.blocks.filter(b => b.cl === col.id && (view.clinic === 'all' || b.clinic === view.clinic));
  }

  /* --------------------------------------------------------- render */
  function toolbar() {
    return `<div class="cal-toolbar">
      <div class="row g-2">
        <button class="btn btn-secondary btn-icon btn-sm" aria-label="Previous">${ic('chevronLeft', 15)}</button>
        <button class="btn btn-secondary btn-sm">Today</button>
        <button class="btn btn-secondary btn-icon btn-sm" aria-label="Next">${ic('chevronRight', 15)}</button>
      </div>
      <div class="col" style="gap:0">
        <b class="t-h4">${view.mode === 'day' ? U.fmtLongDate(K.TODAY) : '14 – 18 September 2026'}</b>
        <span class="t-xs subtle">${view.mode === 'day' ? `${K.appts.length} appointments across ${K.clinicians.length} clinicians` : 'Week 38 · Dr Alice Fenwick'}</span>
      </div>
      <span class="spacer"></span>
      <div class="segmented" role="group" aria-label="Calendar view">
        <button aria-pressed="${view.mode === 'day'}" data-mode="day">${ic('list', 13)} Day</button>
        <button aria-pressed="${view.mode === 'week'}" data-mode="week">${ic('kanban', 13)} Week</button>
      </div>
      <select class="select" id="calClinic" style="max-width:210px" aria-label="Clinic location">
        <option value="all">All locations</option>
        ${K.clinics.map(c => `<option value="${c.id}" ${view.clinic === c.id ? 'selected' : ''}>${esc(c.short)}</option>`).join('')}
      </select>
      <button class="btn btn-primary btn-sm" data-act="book">${ic('plus', 14)} Book</button>
    </div>`;
  }

  function legend() {
    const types = [
      ['consult', 'New consultation'], ['followup', 'Follow-up'], ['acc', 'ACC review'],
      ['procedure', 'Procedure'], ['telehealth', 'Telehealth'],
    ];
    return `<div class="row g-4 wrap" style="padding:9px var(--s-5);border-bottom:1px solid var(--line);background:var(--surface-2)">
      ${types.map(([t, l]) => `<span class="row g-2 t-xs muted">
        <i style="width:9px;height:9px;border-radius:3px;background:var(--appt-${t})"></i>${l}</span>`).join('')}
      <span class="row g-2 t-xs muted"><i style="width:9px;height:9px;border-radius:3px;background:repeating-linear-gradient(135deg,var(--line) 0 3px,transparent 3px 6px),var(--surface-2)"></i>Leave / blocked</span>
      <span class="spacer"></span>
      <span class="t-xs subtle">Drag an appointment to reschedule it</span>
    </div>`;
  }

  function grid() {
    const cols = columns();
    const tpl = `62px repeat(${cols.length}, minmax(190px, 1fr))`;
    return `<div class="cal-scroll" id="calScroll">
      <div class="cal-grid" style="grid-template-columns:${tpl}">
        <div class="cal-head" style="grid-column:1 / -1;grid-template-columns:${tpl}">
          <div class="cal-gutter" style="border-bottom:0"></div>
          ${cols.map(c => `<div class="cal-col-head"><b class="truncate">${esc(c.title)}</b><span class="truncate">${esc(c.sub || '')}</span></div>`).join('')}
        </div>

        <div class="cal-gutter">
          ${Array.from({ length: HOURS }).map((_, i) =>
            `<div class="cal-hour-label">${U.fmtTime((START_H + i) * 60)}</div>`).join('')}
        </div>

        ${cols.map(c => `<div class="cal-col" data-col="${c.id}" style="height:${HOURS * 60 * PX}px">
          ${Array.from({ length: HOURS * 2 }).map((_, i) =>
            `<div class="cal-slot ${i % 2 === 0 ? '' : 'half'}"></div>`).join('')}
          ${blocksFor(c).map(b => `<div class="blocked" style="top:${top(b.start)}px;height:${b.mins * PX}px">${esc(b.label)}</div>`).join('')}
          ${apptsFor(c).map(a => apptEl(a)).join('')}
          ${view.mode === 'day' ? `<div class="cal-now" style="top:${top(NOW)}px"></div>` : ''}
        </div>`).join('')}
      </div>
    </div>`;
  }

  function apptEl(a) {
    const p = K.pt(a.pt), t = K.at(a.type);
    const short = t.mins <= 20;
    return `<div class="appt" draggable="true" data-appt="${a.id}" data-type="${t.type}" tabindex="0"
      role="button" aria-label="${esc(p.first)} ${esc(p.last)}, ${U.fmtTime(a.start)}, ${esc(t.name)}"
      style="top:${top(a.start)}px;height:${Math.max(a.status === 'cancelled' ? 18 : 24, t.mins * PX - 3)}px;
             ${a.status === 'dna' ? 'opacity:.65;' : ''}${a.status === 'done' ? 'opacity:.8;' : ''}">
      <b class="truncate">${U.fmtTime(a.start)} ${esc(p.first)} ${esc(p.last)}</b>
      ${!short ? `<span class="appt-meta truncate">${esc(t.name)} · ${esc(p.nhi)}</span>` : ''}
      ${!short && t.mins >= 45 ? `<span class="appt-meta truncate">${esc(a.note)}</span>` : ''}
      <span class="appt-flag row g-1">
        ${p.alerts.length ? `<span style="color:var(--bad-fg)">${ic('alert', 12)}</span>` : ''}
        ${a.status !== 'booked' ? chip(a.status) : ''}
      </span>
    </div>`;
  }

  /* --------------------------------------------------------- booking panel */
  function bookingPanel() {
    const p = view.panelPt ? K.pt(view.panelPt) : null;
    return `<aside class="cal-panel" aria-label="Book appointment">
      <div class="drawer-hd">
        <div class="grow"><h3 class="t-h4">New booking</h3><p class="t-xs muted">Thu 17 Sep 2026 · Newmarket</p></div>
        <button class="btn btn-ghost btn-icon btn-sm" data-act="closepanel" aria-label="Close">${ic('x', 15)}</button>
      </div>
      <div class="drawer-bd col g-5">
        <div class="field">
          <label class="label" for="bkPt">Patient <span class="req">*</span></label>
          ${p ? `<div class="row g-3 card card-flat" style="padding:10px 12px">
                  ${avatar(p.id, 'sm', p.tone)}
                  <span class="grow"><b class="t-sm">${esc(p.first)} ${esc(p.last)}</b>
                  <span class="t-xs subtle">${esc(p.nhi)} · ${U.age(p.dob)}y · ${esc(p.phone)}</span></span>
                  ${U.funderChip(p.funder)}
                  <button class="btn btn-ghost btn-icon btn-sm" data-act="clearpt" aria-label="Change patient">${ic('x', 14)}</button>
                </div>`
              : `<div class="input-group"><span class="ic-lead">${ic('search', 15)}</span>
                  <input class="input" id="bkPt" placeholder="Name, NHI or phone…" autocomplete="off" data-autofocus>
                  <div class="search-results" id="bkResults" hidden></div></div>`}
        </div>

        <div class="field"><label class="label" for="bkType">Appointment type <span class="req">*</span></label>
          <select class="select" id="bkType">
            ${K.apptTypes.map(t => `<option value="${t.id}">${esc(t.name)} — ${t.mins} min · ${t.price ? U.money(t.price) : 'No charge'}</option>`).join('')}
          </select></div>

        <div class="grid" style="grid-template-columns:1fr 1fr">
          <div class="field"><label class="label" for="bkCl">Clinician</label>
            <select class="select" id="bkCl">${K.clinicians.map(c => `<option>${esc(c.name)}</option>`).join('')}</select></div>
          <div class="field"><label class="label" for="bkLoc">Location</label>
            <select class="select" id="bkLoc">${K.clinics.map(c => `<option>${esc(c.short)}</option>`).join('')}</select></div>
        </div>

        <div class="grid" style="grid-template-columns:1fr 1fr">
          <div class="field"><label class="label" for="bkDate">Date</label>
            <input class="input" id="bkDate" type="date" value="2026-09-17"></div>
          <div class="field"><label class="label" for="bkTime">Start time</label>
            <input class="input" id="bkTime" type="time" value="11:00"></div>
        </div>

        <div class="field"><label class="label">Available today</label>
          <div class="row g-2 wrap">
            ${['11:00am', '11:45am', '1:00pm', '2:30pm', '4:45pm'].map((t, i) =>
              `<button class="btn ${i === 0 ? 'btn-soft' : 'btn-secondary'} btn-sm" data-slot="${t}">${t}</button>`).join('')}
          </div>
          <span class="hint">Gaps are calculated from the clinician’s timetable and leave.</span>
        </div>

        <div class="field"><label class="label" for="bkNote">Booking note</label>
          <textarea class="textarea" id="bkNote" rows="3" placeholder="Reason for visit, interpreter needs, mobility…"></textarea></div>

        <div class="banner"><span class="b-ic">${ic('info', 15)}</span>
          <span class="t-sm">A text reminder is sent 24 hours before. ${p && p.funder === 'ACC' ? 'ACC claim details will be attached to the invoice automatically.' : ''}</span></div>
      </div>
      <div class="drawer-ft">
        <button class="btn btn-ghost grow" data-act="closepanel">Cancel</button>
        <button class="btn btn-primary grow" data-act="confirmbook">${ic('check', 15)} Book appointment</button>
      </div>
    </aside>`;
  }

  /* --------------------------------------------------------- view */
  window.Views.appointments = {
    title: () => 'Appointments',
    skeleton: () => `<div class="page"><div class="sk" style="height:56px;border-radius:12px"></div>
      <div class="sk mt-4" style="height:520px;border-radius:16px"></div></div>`,

    render() {
      return `<div class="cal-shell ${view.panel ? 'with-panel' : ''}">
        <div class="cal-main">
          ${toolbar()}
          ${legend()}
          ${grid()}
        </div>
        ${view.panel ? bookingPanel() : ''}
      </div>`;
    },

    openBooking(ptId) {
      view.panel = true; view.panelPt = ptId || null;
      U.mountView(this);
    },

    mount(root) {
      const rerender = () => U.mountView(this);

      // scroll so the working day is in view
      const sc = qs('#calScroll', root);
      if (sc) sc.scrollTop = Math.max(0, top(NOW) - 220);

      on(root, 'click', '[data-mode]', (e, t) => { view.mode = t.dataset.mode; rerender(); });
      const clinicSel = qs('#calClinic', root);
      if (clinicSel) clinicSel.addEventListener('change', e => { view.clinic = e.target.value; rerender(); });
      on(root, 'click', '[data-act="book"]', () => { view.panel = true; rerender(); });
      on(root, 'click', '[data-act="closepanel"]', () => { view.panel = false; view.panelPt = null; rerender(); });
      on(root, 'click', '[data-act="clearpt"]', () => { view.panelPt = null; rerender(); });
      on(root, 'click', '[data-slot]', (e, t) => {
        qsa('[data-slot]', root).forEach(b => { b.className = 'btn btn-secondary btn-sm'; });
        t.className = 'btn btn-soft btn-sm';
        const [hm, ap] = [t.dataset.slot.slice(0, -2), t.dataset.slot.slice(-2)];
        let [h, m] = hm.split(':').map(Number);
        if (ap === 'pm' && h !== 12) h += 12;
        qs('#bkTime', root).value = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      });
      on(root, 'click', '[data-act="confirmbook"]', () => {
        if (!view.panelPt) { U.toast('Choose a patient first', 'Search by name, NHI or phone number.', 'warn'); return; }
        const p = K.pt(view.panelPt);
        const t = K.at(qs('#bkType', root).value);
        const [h, m] = qs('#bkTime', root).value.split(':').map(Number);
        K.appts.push({ id: 'new' + Date.now(), pt: p.id, cl: 'u1', clinic: 'c1', start: h * 60 + m, type: t.id, status: 'booked', note: qs('#bkNote', root).value || t.name, invoiced: false });
        view.panel = false; view.panelPt = null; rerender();
        U.toast('Appointment booked', `${p.first} ${p.last} · ${U.fmtTime(h * 60 + m)} · ${t.name}`, 'ok');
      });

      // patient search inside the panel
      const bkPt = qs('#bkPt', root);
      if (bkPt) {
        const box = qs('#bkResults', root);
        bkPt.addEventListener('input', () => {
          const s = bkPt.value.trim().toLowerCase();
          if (!s) { box.hidden = true; return; }
          const hits = K.patients.filter(p => `${p.first} ${p.last} ${p.nhi} ${p.phone}`.toLowerCase().includes(s)).slice(0, 6);
          box.innerHTML = hits.length ? hits.map(p => `<button class="search-hit" data-pick="${p.id}">
              ${avatar(p.id, 'sm', p.tone)}<span class="hit-main"><b>${esc(p.first)} ${esc(p.last)}</b>
              <span>${esc(p.nhi)} · ${U.age(p.dob)}y · ${esc(p.phone)}</span></span>${U.funderChip(p.funder)}</button>`).join('')
            : `<div class="empty" style="padding:22px"><h4 class="t-sm">No match</h4>
               <p class="t-xs">Register a new patient from the command palette.</p></div>`;
          box.hidden = false;
        });
        on(box, 'mousedown', '[data-pick]', (e, t) => { view.panelPt = t.dataset.pick; rerender(); });
      }

      /* ---- appointment interactions ---- */
      on(root, 'click', '.appt', (e, t) => openAppt(t.dataset.appt, rerender));
      on(root, 'keydown', '.appt', (e, t) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openAppt(t.dataset.appt, rerender); } });

      /* ---- drag to reschedule ---- */
      let dragId = null;
      on(root, 'dragstart', '.appt', (e, t) => {
        dragId = t.dataset.appt; t.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragId);
      });
      on(root, 'dragend', '.appt', (e, t) => { t.classList.remove('dragging'); dragId = null; });
      on(root, 'dragover', '.cal-col', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
      on(root, 'drop', '.cal-col', (e, col) => {
        e.preventDefault();
        const id = dragId || e.dataTransfer.getData('text/plain');
        const a = K.appts.find(x => x.id === id);
        if (!a) return;
        const rect = col.getBoundingClientRect();
        const mins = snap(Math.max(0, e.clientY - rect.top) / PX + START_H * 60);
        const from = U.fmtTime(a.start);
        a.start = Math.min(mins, END_H * 60 - K.at(a.type).mins);
        if (view.mode === 'day' && col.dataset.col !== a.cl && K.st(col.dataset.col)) a.cl = col.dataset.col;
        rerender();
        U.toast('Appointment moved', `${K.ptName(a.pt)} · ${from} → ${U.fmtTime(a.start)}`, 'ok');
      });
    },
  };

  /* --------------------------------------------------------- appt modal */
  function openAppt(id, rerender) {
    const a = K.appts.find(x => x.id === id);
    if (!a) return;
    const p = K.pt(a.pt), t = K.at(a.type), cl = K.st(a.cl);

    U.modal({
      title: `${p.first} ${p.last}`,
      sub: `${U.fmtTime(a.start)} – ${U.fmtTime(a.start + t.mins)} · ${t.name} · ${cl.name}`,
      body: `<div class="col g-4">
        <div class="row g-3 wrap">
          ${chip(a.status, { lg: true })}
          ${U.funderChip(p.funder)}
          ${p.alerts.map(x => `<span class="alert-badge">${ic('alert', 13)}${esc(x)}</span>`).join('')}
        </div>
        <dl class="kv">
          <dt>NHI</dt><dd class="t-mono">${esc(p.nhi)}</dd>
          <dt>Date of birth</dt><dd>${U.fmtDate(p.dob)} (${U.age(p.dob)})</dd>
          <dt>Phone</dt><dd>${esc(p.phone)}</dd>
          <dt>Location</dt><dd>${esc(K.cln(a.clinic).name)}</dd>
          <dt>Reason</dt><dd>${esc(a.note)}</dd>
          ${p.claim ? `<dt>ACC claim</dt><dd class="t-mono">${esc(p.claim)}</dd>` : ''}
          <dt>Fee</dt><dd>${t.price ? `${U.money(t.price)} + GST` : 'No charge (ACC funded)'}</dd>
        </dl>
        <div class="divider"></div>
        <span class="t-eyebrow">Quick actions</span>
        <div class="row g-2 wrap">
          <button class="btn btn-soft btn-sm" data-s="arrived">${ic('check', 14)} Arrived</button>
          <button class="btn btn-secondary btn-sm" data-s="consult">${ic('stethoscope', 14)} In consult</button>
          <button class="btn btn-secondary btn-sm" data-s="done">${ic('check', 14)} Done</button>
          <button class="btn btn-danger btn-sm" data-s="dna">${ic('x', 14)} DNA</button>
        </div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-cancel>${ic('x', 14)} Cancel booking</button>
        <span class="spacer"></span>
        <a class="btn btn-secondary" href="#/patient/${p.id}">${ic('user', 15)} Open patient</a>
        <button class="btn btn-primary" data-invoice>${ic('billing', 15)} Invoice</button>`,
      onMount(panel, close) {
        on(panel, 'click', '[data-s]', (e, b) => {
          a.status = b.dataset.s; close(); rerender();
          U.toast(`Marked as ${U.STATUS[a.status].label.toLowerCase()}`, `${p.first} ${p.last} · ${U.fmtTime(a.start)}`, a.status === 'dna' ? 'warn' : 'ok');
        });
        qs('[data-invoice]', panel).addEventListener('click', () => {
          close(); location.hash = '#/billing';
          setTimeout(() => window.Views.billing.openCreate(a.id), 300);
        });
        qs('[data-cancel]', panel).addEventListener('click', () => { close(); cancelFlow(a, rerender); });
      }
    });
  }

  function cancelFlow(a, rerender) {
    U.modal({
      title: 'Cancel this appointment?',
      sub: `${K.ptName(a.pt)} · ${U.fmtTime(a.start)}`,
      icon: 'alert', tone: 'bad',
      body: `<div class="col g-4">
        <div class="field"><label class="label" for="rsn">Reason <span class="req">*</span></label>
          <select class="select" id="rsn" data-autofocus>
            <option>Patient requested — rebooking</option>
            <option>Patient unwell</option>
            <option>Clinician unavailable</option>
            <option>Clinical — no longer required</option>
            <option>Administrative error</option>
          </select>
          <span class="hint">The reason is recorded on the patient’s timeline and used in DNA reporting.</span></div>
        <label class="row g-3"><span class="switch"><input type="checkbox" checked><span class="track"></span><span class="thumb"></span></span>
          <span class="t-sm">Text the patient to let them know</span></label>
        <label class="row g-3"><span class="switch"><input type="checkbox"><span class="track"></span><span class="thumb"></span></span>
          <span class="t-sm">Offer the freed slot to the waitlist</span></label>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Keep booking</button>
               <button class="btn btn-danger" data-go>${ic('x', 15)} Cancel appointment</button>`,
      onMount(panel, close) {
        qs('[data-go]', panel).addEventListener('click', () => {
          const reason = qs('#rsn', panel).value;
          const i = K.appts.indexOf(a); if (i > -1) K.appts.splice(i, 1);
          close(); rerender();
          U.toast('Appointment cancelled', reason, 'warn');
        });
      }
    });
  }
})();
