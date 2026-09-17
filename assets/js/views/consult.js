/* Kora Health — Consult.
   SOAP notes in the middle, patient-note functions on the left, prompts and
   timeline on the right. The two rows of unlabelled icons in the old screen
   are replaced by a labelled rail plus the command palette. */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa, money } = U;
  window.Views = window.Views || {};

  const SOAP = [
    { k: 's', label: 'Subjective', ph: 'What the patient reports, in their words.' },
    { k: 'o', label: 'Objective',  ph: 'Examination findings and observations. Include the normals.' },
    { k: 'a', label: 'Assessment', ph: 'Working diagnosis and differentials.' },
    { k: 'p', label: 'Plan',       ph: 'Investigations, treatment, follow-up, what the patient was told.' },
  ];

  /* Grouped, because a flat list of twenty-three is a wall to read. */
  const FUNCTIONS = [
    { group: 'This consult', items: [
      { id: 'notes',    icon: 'file',        label: 'Notes' },
      { id: 'coding',   icon: 'tasks',       label: 'Diagnosis / coding' },
      { id: 'meas',     icon: 'wave',        label: 'Measurements' },
      { id: 'meds',     icon: 'rx',          label: 'Medications' },
      { id: 'invest',   icon: 'flask',       label: 'Investigations' },
    ]},
    { group: 'Record', items: [
      { id: 'allergy',  icon: 'alert',       label: 'Allergies & warnings', tone: 'bad' },
      { id: 'problems', icon: 'heart',       label: 'Problems' },
      { id: 'immun',    icon: 'shield',      label: 'Immunisations' },
      { id: 'recall',   icon: 'bell',        label: 'Recalls', tone: 'warn' },
      { id: 'docs',     icon: 'copy',        label: 'Letters & documents' },
      { id: 'photos',   icon: 'eye',         label: 'Photos & PACS' },
    ]},
    { group: 'Send', items: [
      { id: 'referral', icon: 'referral',    label: 'Referrals' },
      { id: 'acc',      icon: 'acc',         label: 'ACC / WINZ' },
      { id: 'careplan', icon: 'template',    label: 'Care plan', badge: '0' },
      { id: 'tasks',    icon: 'tasks',       label: 'Tasks' },
    ]},
  ];

  const PANELS = ['Prompts', 'Timeline', 'Problems', 'Inbox', 'Transcribe'];

  let c = null;

  function init(ptId) {
    if (c && c.pt === ptId) return;
    const appt = K.appts.find(a => a.pt === ptId && (a.status === 'consult' || a.status === 'arrived'))
              || K.appts.find(a => a.pt === ptId);
    c = {
      pt: ptId, appt: appt ? appt.id : null,
      elapsed: 0, timer: null, running: true,
      type: 'Face to face', number: 1,
      note: { s: '', o: '', a: '', p: '' },
      confidential: false, hidePortal: false,
      fn: 'notes', panel: 'Prompts',
      codes: [], services: [],
      vitals: { bp: '', hr: '', temp: '', wt: '', ht: '', spo2: '' },
    };
  }

  const bmi = v => {
    const w = parseFloat(v.wt), h = parseFloat(v.ht);
    return (!w || !h) ? null : (w / Math.pow(h / 100, 2)).toFixed(1);
  };
  const bmiBand = n => n < 18.5 ? ['Underweight', 'chip-warn']
    : n < 25 ? ['Healthy range', 'chip-ok'] : n < 30 ? ['Overweight', 'chip-warn'] : ['Obese', 'chip-bad'];

  /* ------------------------------------------------------------ banner */
  function banner(p) {
    const st = K.ENROL_STATUS[p.status];
    const bal = K.balance(p.id);
    return `<div class="consult-banner">
      <div class="cb-row">
        ${avatar(p.id, 'lg', p.tone)}
        <div class="cb-id">
          <a class="cb-name" href="#/patient/${p.id}">${esc(K.displayName(p))}</a>
          <div class="cb-sub">
            <span>${U.fmtDate(p.dob)}</span><span class="dot-sep">·</span>
            <span>${U.age(p.dob)} yrs ${p.sex === 'F' ? 'Female' : 'Male'}</span><span class="dot-sep">·</span>
            <span>${esc(p.ethnicity)}</span>
          </div>
        </div>

        <dl class="cb-facts">
          <div><dt>NHI</dt><dd class="t-mono">${esc(p.nhi)}
            <span class="chip chip-ok">${esc(p.enrol)}</span></dd></div>
          <div><dt>Chart</dt><dd class="t-mono">${esc(p.chart)}</dd></div>
          <div><dt>Provider</dt><dd>${esc(K.st(p.provider).name)}</dd></div>
          <div><dt>Enrolment</dt><dd><span class="chip ${st.chip}">${esc(st.label)}</span></dd></div>
          <div><dt>GMS</dt><dd>${esc(p.gms)}
            ${p.fund === 'F' ? '<span class="chip chip-ok">Funded</span>' : '<span class="chip chip-warn">Not funded</span>'}</dd></div>
          <div><dt>Balance</dt><dd class="${bal > 0 ? 'bad-t' : ''}"><b>${money(bal)}</b></dd></div>
          <div><dt>Quintile</dt><dd>${p.quintile} <span class="subtle">· DHB ${esc(p.dhb)}</span></dd></div>
          <div><dt>Portal</dt><dd>${p.portal ? 'Registered' : '<span class="subtle">Not registered</span>'}</dd></div>
        </dl>

        <div class="cb-alerts">
          ${p.alerts.map(a => `<span class="alert-badge">${ic('alert', 12)}${esc(a)}</span>`).join('')}
          ${p.warn.map(a => `<span class="alert-badge warn">${ic('info', 12)}${esc(a)}</span>`).join('')}
          ${p.claim ? `<span class="chip chip-warm">${ic('acc', 11)} ${esc(p.claim)}</span>` : ''}
          <a class="t-xs" href="#/patient/${p.id}">Full record ${ic('chevronRight', 11)}</a>
        </div>
      </div>

      <div class="cb-strip">
        <label class="cb-ctl"><span class="t-eyebrow">Consult type</span>
          <select class="select" id="cType">
            ${K.consultTypes.map(t => `<option ${c.type === t ? 'selected' : ''}>${esc(t)}</option>`).join('')}
          </select></label>
        <label class="cb-ctl"><span class="t-eyebrow">Consult</span>
          <select class="select" id="cNum"><option>Consult 1</option><option>Consult 2</option></select></label>

        <span class="chip ${c.running ? 'chip-ok' : ''}" id="consultTimer">
          <i class="dot"></i><span class="t-mono" id="timerText">00:00</span></span>
        <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="${c.running ? 'Pause timer' : 'Resume timer'}"
          data-act="toggle-timer" aria-label="${c.running ? 'Pause' : 'Resume'} consult timer">${ic('clock', 15)}</button>

        <span class="spacer"></span>
        <button class="btn btn-secondary btn-sm" data-act="services">
          ${ic('billing', 14)} Services for invoicing
          ${c.services.length ? `<span class="badge-count warm">${c.services.length}</span>` : ''}</button>
        <span class="saved" id="consultSaved">${ic('check', 13)} Saved</span>
      </div>
    </div>`;
  }

  /* ------------------------------------------------------------ left rail */
  function functionRail(p) {
    const counts = {
      allergy: p.alerts.length,
      recall: K.recalls.filter(r => r.pt === p.id && r.status !== 'future').length,
      problems: K.problems.filter(x => x.pt === p.id && x.status === 'active').length,
      meds: K.prescriptions.filter(r => r.pt === p.id).length,
      invest: K.testRequests.filter(r => r.pt === p.id).length,
    };
    return `<nav class="fn-rail" aria-label="Patient note functions">
      ${FUNCTIONS.map(g => `
        <div class="fn-group">
          <div class="nav-group-label">${esc(g.group)}</div>
          ${g.items.map(it => `<button class="fn-item ${it.tone || ''}" data-fn="${it.id}"
              aria-current="${c.fn === it.id ? 'true' : 'false'}">
            ${ic(it.icon, 16)}<span class="grow">${esc(it.label)}</span>
            ${counts[it.id] ? `<span class="badge-count ${it.tone === 'bad' ? '' : 'quiet'}">${counts[it.id]}</span>`
              : it.badge ? `<span class="badge-count quiet">${it.badge}</span>` : ''}
          </button>`).join('')}
        </div>`).join('')}
    </nav>`;
  }

  /* ------------------------------------------------------------ note */
  function noteEditor() {
    return `<section class="card">
      <div class="card-hd">
        <h3>Notes</h3>
        <span class="spacer"></span>
        <select class="select" id="noteTpl" style="max-width:210px" aria-label="Notes template">
          <option>Select notes template…</option>
          <option>Orthopaedic assessment</option>
          <option>Post-operative review</option>
          <option>ACC review</option>
        </select>
        <button class="btn btn-ghost btn-sm" data-act="prev-note">${ic('copy', 14)} Copy last consult</button>
      </div>

      <div class="card-bd-tight row g-4 wrap" style="border-bottom:1px solid var(--line-faint)">
        <label class="row g-2 t-sm"><span class="check" role="checkbox" aria-checked="${c.confidential}"
          data-flag="confidential">${ic('check', 11)}</span> Confidential</label>
        <label class="row g-2 t-sm"><span class="check" role="checkbox" aria-checked="${c.hidePortal}"
          data-flag="hidePortal">${ic('check', 11)}</span> Hide from patient portal</label>
        ${c.confidential ? `<span class="chip chip-bad">${ic('lock', 11)} Restricted to the care team</span>` : ''}
      </div>

      <div class="card-bd col g-5">
        ${SOAP.map(sx => `
          <div class="field soap-field">
            <div class="row between">
              <label class="label" for="soap-${sx.k}">${esc(sx.label)}</label>
              <button class="btn btn-ghost btn-sm" data-dots="${sx.k}">${ic('plus', 12)} Go to dots</button>
            </div>
            <textarea class="textarea" id="soap-${sx.k}" data-soap="${sx.k}" rows="4"
              placeholder="${esc(sx.ph)}">${esc(c.note[sx.k])}</textarea>
          </div>`).join('')}
      </div>
    </section>`;
  }

  function measurements() {
    const v = c.vitals, b = bmi(v), band = b ? bmiBand(Number(b)) : null;
    const F = [
      { k: 'bp', label: 'Blood pressure', unit: 'mmHg', ph: '128/82', w: '112px' },
      { k: 'hr', label: 'Pulse', unit: 'bpm', ph: '72', w: '82px' },
      { k: 'temp', label: 'Temp', unit: '°C', ph: '36.8', w: '86px' },
      { k: 'spo2', label: 'SpO₂', unit: '%', ph: '98', w: '78px' },
      { k: 'wt', label: 'Weight', unit: 'kg', ph: '78', w: '86px' },
      { k: 'ht', label: 'Height', unit: 'cm', ph: '168', w: '86px' },
    ];
    return `<section class="card">
      <div class="card-hd"><h3>Measurements</h3><span class="spacer"></span>
        <span class="t-xs subtle">Recorded this consult</span></div>
      <div class="card-bd row g-4 wrap" style="align-items:flex-end">
        ${F.map(x => `<div class="field" style="width:${x.w}">
          <label class="label" for="v-${x.k}">${x.label}</label>
          <input class="input input-money" id="v-${x.k}" data-vital="${x.k}" value="${esc(v[x.k])}" placeholder="${x.ph}" inputmode="decimal">
          <span class="hint">${x.unit}</span></div>`).join('')}
        <div class="field" style="min-width:150px"><span class="label">BMI</span>
          <div class="row g-2" id="bmiOut" style="height:36px;align-items:center">
            ${b ? `<b class="t-h4 num">${b}</b><span class="chip ${band[1]}">${band[0]}</span>`
                : '<span class="t-sm subtle">Weight and height</span>'}</div></div>
      </div>
    </section>`;
  }

  function codingCard() {
    const S = ['Meniscal tear of knee', 'Knee pain', 'Osteoarthritis of knee', 'Work-related injury'];
    return `<section class="card">
      <div class="card-hd"><h3>Diagnosis / coding</h3><span class="spacer"></span>
        <span class="t-xs subtle">SNOMED CT · drives recalls, reporting and ACC</span></div>
      <div class="card-bd col g-3">
        <div class="recip-chips">
          ${c.codes.length ? c.codes.map(x => `<span class="chip chip-accent chip-lg chip-removable">${esc(x)}
            <button class="x" data-rmcode="${esc(x)}" aria-label="Remove ${esc(x)}">${ic('x', 11)}</button></span>`).join('')
            : '<span class="t-sm subtle">Nothing coded yet.</span>'}
        </div>
        <div class="row g-2 wrap">
          ${S.filter(x => !c.codes.includes(x)).map(x =>
            `<button class="btn btn-secondary btn-sm" data-addcode="${esc(x)}">${ic('plus', 12)} ${esc(x)}</button>`).join('')}
        </div>
      </div>
    </section>`;
  }

  /* ------------------------------------------------------------ right panel */
  function rightPanel(p) {
    return `<section class="card" style="position:sticky;top:calc(var(--topbar-h) + 8px)">
      <nav class="tabs" role="tablist" style="padding:0 var(--s-3)">
        ${PANELS.map(t => `<button role="tab" aria-selected="${c.panel === t}" data-panel="${esc(t)}">${esc(t)}</button>`).join('')}
      </nav>
      <div class="card-bd">${
        c.panel === 'Prompts' ? prompts(p)
        : c.panel === 'Timeline' ? timeline(p)
        : c.panel === 'Problems' ? problemsMeds(p)
        : c.panel === 'Transcribe' ? transcribe()
        : inboxPanel(p)
      }</div>
    </section>`;
  }

  function prompts(p) {
    const rs = K.recalls.filter(r => r.pt === p.id);
    const overdue = rs.filter(r => r.status === 'overdue');
    return `<div class="col g-4">
      ${overdue.length ? `<div class="banner bad"><span class="b-ic">${ic('alert', 15)}</span>
        <span class="grow"><b>${overdue.length} overdue</b><br>
        <span class="t-xs">Raise these before the patient leaves.</span></span></div>` : ''}
      ${rs.length ? rs.map(r => `<div class="row-t g-3 card card-flat" style="padding:11px">
        <span class="work-ic" style="width:28px;height:28px;background:${
          r.status === 'overdue' ? 'var(--bad-bg)' : r.status === 'due' ? 'var(--warn-bg)' : 'var(--surface-3)'};color:${
          r.status === 'overdue' ? 'var(--bad-fg)' : r.status === 'due' ? 'var(--warn-fg)' : 'var(--text-muted)'}">
          ${ic('bell', 14)}</span>
        <span class="grow" style="min-width:0">
          <b class="t-sm">${esc(r.text)}</b>
          <span class="t-xs subtle" style="display:block">${esc(r.kind)} · due ${U.fmtDate(r.due)}</span>
          <span class="row g-2 mt-2">
            <button class="btn btn-soft btn-sm" data-recall="${esc(r.text)}">${ic('check', 12)} Action</button>
            <button class="btn btn-ghost btn-sm" data-defer="${esc(r.text)}">Defer</button>
          </span>
        </span>
        ${r.status === 'overdue' ? chip('overdue', { label: 'Overdue' })
          : r.status === 'due' ? chip('pending', { label: 'Due' }) : chip('draft', { label: 'Future' })}
      </div>`).join('') : U.empty('check', 'No prompts', 'Nothing is due for this patient.')}
    </div>`;
  }

  function timeline(p) {
    const ev = (K.timeline[p.id] || []).slice(0, 6);
    return `<div class="col g-3">
      <div class="t-eyebrow">${U.fmtLongDate(K.TODAY)}</div>
      ${ev.length ? ev.map(e => `<button class="list-row" style="padding:9px 0;border-bottom:1px solid var(--line-faint)">
        <span class="feed-ic ${e.kind}" style="width:26px;height:26px">${ic(
          { note: 'file', letter: 'letters', rx: 'rx', result: 'flask', invoice: 'billing' }[e.kind] || 'file', 13)}</span>
        <span class="grow" style="text-align:left;min-width:0">
          <b class="t-xs" style="display:block">${esc(e.title)}</b>
          <span class="t-xs subtle">${U.fmtDateShort(e.at.slice(0, 10))} · ${U.fmtClock(e.at)}</span></span>
      </button>`).join('') : '<span class="t-sm subtle">Nothing recorded yet.</span>'}
    </div>`;
  }

  function problemsMeds(p) {
    const probs = K.problems.filter(x => x.pt === p.id);
    const rx = K.prescriptions.filter(r => r.pt === p.id);
    return `<div class="col g-5">
      <div class="col g-2">
        <span class="t-eyebrow">Problems</span>
        ${probs.length ? probs.map(x => `<div class="row between g-2">
          <span class="t-sm ${x.status === 'resolved' ? 'subtle' : ''}">${esc(x.text)}
            ${x.acc ? '<span class="chip chip-warm">ACC</span>' : ''}</span>
          <span class="t-xs subtle">${U.fmtDateShort(x.onset)}</span>
        </div>`).join('') : '<span class="t-sm subtle">None recorded.</span>'}
      </div>
      <div class="divider"></div>
      <div class="col g-2">
        <span class="t-eyebrow">Current medicines</span>
        ${rx.length ? rx.map(r => `<div class="t-sm">${esc(K.med(r.med).name)}
          <span class="subtle">${esc(K.med(r.med).form)}</span></div>`).join('')
          : '<span class="t-sm subtle">Nothing active.</span>'}
      </div>
      <div class="divider"></div>
      <div class="col g-2">
        <span class="t-eyebrow">Allergies</span>
        ${p.alerts.length ? p.alerts.map(a => `<span class="alert-badge">${ic('alert', 12)}${esc(a)}</span>`).join('')
          : '<span class="t-sm subtle">None recorded — confirm with the patient.</span>'}
      </div>
    </div>`;
  }

  function transcribe() {
    return `<div class="col g-4">
      <div class="mic-state off"><span class="mic-dot"></span>
        <span class="t-sm"><b>Microphone ready</b><br><span class="t-xs subtle">Consult room 2</span></span>
        <span class="mic-timer">00:00</span></div>
      <button class="btn btn-primary btn-block" data-act="transcribe">${ic('mic', 15)} Start transcribing</button>
      <div class="ai-flag">${ic('alert', 14)} Draft only — you review before it enters the note</div>
      <p class="t-xs subtle">The transcript fills Subjective and Objective. Audio is deleted once the
        note is signed. Tell the patient a scribe is in use.</p>
    </div>`;
  }

  function inboxPanel(p) {
    const items = K.inbox.filter(i => i.pt === p.id);
    return `<div class="col g-3">
      ${items.length ? items.map(i => `<div class="card card-flat" style="padding:10px">
        <b class="t-sm">${esc(i.subj)}</b>
        <div class="t-xs subtle">${esc(i.from)} · ${U.relTime(i.at)}</div>
      </div>`).join('') : U.empty('inbox', 'Nothing filed', 'No results or messages waiting for this patient.')}
    </div>`;
  }

  /* ------------------------------------------------------------ view */
  window.Views.consult = {
    title: pr => { const p = K.pt(pr.id); return p ? `Consult — ${p.first} ${p.last}` : 'Consult'; },
    skeleton: () => `<div class="sk" style="height:132px"></div>
      <div class="page"><div class="sk sk-block" style="height:420px"></div></div>`,

    render(pr) {
      const p = K.pt(pr.id) || K.patients[0];
      init(p.id);
      const centre = c.fn === 'meas' ? measurements() + noteEditor()
                   : c.fn === 'coding' ? codingCard() + noteEditor()
                   : noteEditor() + measurements() + codingCard();
      return `${banner(p)}
        <div class="consult-body">
          ${functionRail(p)}
          <div class="col g-4" style="min-width:0">${centre}</div>
          <div style="min-width:0">${rightPanel(p)}</div>
        </div>

        <div class="ed-bar consult-foot">
          <span class="t-xs subtle">Autosaves as you type · signing locks the note against your name</span>
          <span class="spacer"></span>
          <button class="btn btn-ghost btn-sm" data-act="park">${ic('clock', 14)} Park</button>
          <button class="btn btn-secondary btn-sm" data-act="sign">${ic('check', 14)} Sign and file</button>
          <button class="btn btn-primary btn-sm" data-act="sign-letter">${ic('letters', 14)} Sign and write letter</button>
        </div>`;
    },

    mount(root, pr) {
      const p = K.pt(pr.id) || K.patients[0];
      const bump = U.autosave(qs('#consultSaved', root));

      const paintTimer = () => {
        const el = qs('#timerText', root);
        if (!el) { clearInterval(c.timer); return; }
        el.textContent = `${String(Math.floor(c.elapsed / 60)).padStart(2, '0')}:${String(c.elapsed % 60).padStart(2, '0')}`;
      };
      clearInterval(c.timer);
      if (c.running) c.timer = setInterval(() => { c.elapsed++; paintTimer(); }, 1000);
      paintTimer();

      on(root, 'click', '[data-act="toggle-timer"]', () => {
        c.running = !c.running; clearInterval(c.timer);
        if (c.running) c.timer = setInterval(() => { c.elapsed++; paintTimer(); }, 1000);
        qs('#consultTimer', root).className = `chip ${c.running ? 'chip-ok' : ''}`;
      });

      on(root, 'input', '[data-soap]', (e, t) => { c.note[t.dataset.soap] = t.value; bump(); });
      on(root, 'input', '[data-vital]', (e, t) => {
        c.vitals[t.dataset.vital] = t.value; bump();
        const b = bmi(c.vitals), out = qs('#bmiOut', root);
        if (!out) return;
        out.innerHTML = b ? (() => { const band = bmiBand(Number(b));
          return `<b class="t-h4 num">${b}</b><span class="chip ${band[1]}">${band[0]}</span>`; })()
          : '<span class="t-sm subtle">Weight and height</span>';
      });

      on(root, 'click', '[data-flag]', (e, t) => {
        c[t.dataset.flag] = t.getAttribute('aria-checked') !== 'true';
        U.mountView(this, pr); bump();
      });
      on(root, 'click', '[data-fn]', (e, t) => { c.fn = t.dataset.fn; U.mountView(this, pr); });
      on(root, 'click', '[data-panel]', (e, t) => { c.panel = t.dataset.panel; U.mountView(this, pr); });
      on(root, 'click', '[data-addcode]', (e, t) => { c.codes.push(t.dataset.addcode); U.mountView(this, pr); bump(); });
      on(root, 'click', '[data-rmcode]', (e, t) => {
        e.stopPropagation(); c.codes = c.codes.filter(x => x !== t.dataset.rmcode); U.mountView(this, pr); bump();
      });
      on(root, 'click', '[data-dots]', (e, t) => U.menu(t, [
        { label: 'Insert a dot phrase' },
        { icon: 'plus', label: '.normalknee — normal knee examination', action: () => dot(t.dataset.dots, 'Full range of movement. No effusion. Ligaments stable. Neurovascularly intact.', pr, bump) },
        { icon: 'plus', label: '.noredflags — no red flags', action: () => dot(t.dataset.dots, 'No night pain, no weight loss, no fevers, no bladder or bowel disturbance.', pr, bump) },
        { icon: 'plus', label: '.adviceacc — ACC advice given', action: () => dot(t.dataset.dots, 'ACC45 updated. Fit for selected duties. Review in six weeks.', pr, bump) },
      ]));
      on(root, 'click', '[data-act="prev-note"]', () => {
        const prev = (K.timeline[p.id] || []).find(e => e.kind === 'note');
        if (!prev) { U.toast('No earlier consult', 'Nothing to copy forward.', 'warn'); return; }
        c.note.s = prev.body; U.mountView(this, pr); bump();
        U.toast('Copied forward', 'Pasted into Subjective — edit before signing.', 'ok');
      });

      const tpl = qs('#noteTpl', root);
      if (tpl) tpl.addEventListener('change', e => {
        const T = {
          'Orthopaedic assessment': { s: 'Right knee pain following a fall at work.',
            o: 'Antalgic gait. Small effusion. Range 0–120°. Medial joint line tenderness. McMurray positive medially.',
            a: 'Medial meniscal tear.', p: 'MRI right knee. Review with result in four weeks. Selected duties.' },
          'Post-operative review': { s: 'Routine post-operative review.', o: 'Wound clean and dry. Sutures intact.',
            a: 'Satisfactory progress.', p: 'Remove sutures at 14 days. Physiotherapy.' },
          'ACC review': { s: 'ACC review — work capacity.', o: 'Improving range of movement.',
            a: 'Progressing as expected.', p: 'ACC45 updated. Fit for selected duties. Review six weeks.' },
        }[e.target.value];
        if (!T) return;
        Object.assign(c.note, T); U.mountView(this, pr); bump();
        U.toast('Template applied', 'Edit the wording before signing.', 'ok');
      });

      const cType = qs('#cType', root);
      if (cType) cType.addEventListener('change', e => { c.type = e.target.value; bump(); });

      on(root, 'click', '[data-act="services"]', () => servicesModal(p, pr));
      on(root, 'click', '[data-recall]', (e, t) => {
        U.toast('Recall actioned', t.dataset.recall, 'ok');
      });
      on(root, 'click', '[data-defer]', (e, t) => U.toast('Recall deferred', `${t.dataset.defer} — pushed out three months.`, 'info'));
      on(root, 'click', '[data-act="transcribe"]', () => U.toast('Transcribing', 'Recording started. Tell the patient a scribe is in use.', 'ok'));

      on(root, 'click', '[data-act="park"]', () => {
        U.toast('Parked', 'The consult stays open in your queue.', 'ok');
        location.hash = '#/dashboard';
      });
      on(root, 'click', '[data-act="sign"]', () => signFlow(p, false));
      on(root, 'click', '[data-act="sign-letter"]', () => signFlow(p, true));
    },
  };

  function dot(section, text, pr, bump) {
    c.note[section] = (c.note[section] ? c.note[section] + ' ' : '') + text;
    U.mountView(window.Views.consult, pr); bump && bump();
  }

  function servicesModal(p, pr) {
    const codes = K.billingCodes.filter(b => b.active);
    U.modal({
      title: 'Services for invoicing', sub: `${p.first} ${p.last} · bills to ${p.funder}`,
      icon: 'billing', wide: true,
      body: `<div class="col g-3">
        <p class="t-sm muted">Tick what was delivered. The invoice is raised when you sign the consult.</p>
        <div class="list-rows card card-flat">
          ${codes.map(b => `<label class="work-row" style="padding:9px var(--s-4);cursor:pointer">
            <span class="check" role="checkbox" aria-checked="${c.services.includes(b.code)}"
              data-svc="${esc(b.code)}">${ic('check', 11)}</span>
            <span class="grow"><b class="t-sm">${esc(b.name)}</b>
              <span class="t-xs subtle" style="display:block">${esc(b.code)}${b.acc ? ` · ACC ${esc(b.acc)}` : ''}</span></span>
            <span class="num t-sm">${money(b.price)}</span>
          </label>`).join('')}
        </div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button>
               <button class="btn btn-primary" data-go>${ic('check', 15)} Attach to consult</button>`,
      onMount(panel, close) {
        on(panel, 'click', '[data-svc]', (e, t) => {
          const code = t.dataset.svc, onNow = t.getAttribute('aria-checked') === 'true';
          t.setAttribute('aria-checked', String(!onNow));
          c.services = onNow ? c.services.filter(x => x !== code) : [...c.services, code];
        });
        qs('[data-go]', panel).addEventListener('click', () => {
          close(); U.mountView(window.Views.consult, pr);
          U.toast('Services attached', `${c.services.length} item${c.services.length === 1 ? '' : 's'} will bill on sign-off.`, 'ok');
        });
      }
    });
  }

  function signFlow(p, thenLetter) {
    const empty = SOAP.filter(sx => !c.note[sx.k].trim());
    const overdue = K.recalls.filter(r => r.pt === p.id && r.status === 'overdue');
    U.modal({
      title: thenLetter ? 'Sign, file and write a letter' : 'Sign and file this consult',
      sub: `${p.first} ${p.last} · ${p.nhi}`,
      icon: 'check', tone: empty.length || overdue.length ? 'warn' : 'ok',
      body: `<div class="col g-4">
        ${overdue.length ? `<div class="banner warn"><span class="b-ic">${ic('bell', 15)}</span>
          <span class="grow"><b>${overdue.length} recall still overdue</b><br>
          <span class="t-sm">${overdue.map(r => esc(r.text)).join(', ')}. Action it now or it carries to the next visit.</span></span></div>` : ''}
        ${empty.length ? `<div class="banner warn"><span class="b-ic">${ic('alert', 15)}</span>
          <span class="t-sm"><b>${empty.map(x => x.label).join(', ')}</b> ${empty.length === 1 ? 'is' : 'are'} empty.
          You can still sign — the note records what you wrote.</span></div>`
        : `<div class="banner ok"><span class="b-ic">${ic('check', 15)}</span>
          <span class="t-sm">All four SOAP sections completed.</span></div>`}
        <dl class="kv">
          <dt>Consult type</dt><dd>${esc(c.type)}</dd>
          <dt>Duration</dt><dd class="num">${Math.max(1, Math.round(c.elapsed / 60))} min</dd>
          <dt>Signed by</dt><dd>${esc(K.st('u1').name)} · MCNZ ${esc(K.st('u1').mcnz)}</dd>
          <dt>Coding</dt><dd>${c.codes.length ? c.codes.map(esc).join(', ') : '<span class="subtle">None</span>'}</dd>
          <dt>Services</dt><dd>${c.services.length ? `${c.services.length} to invoice` : '<span class="subtle">None attached</span>'}</dd>
          ${c.confidential ? '<dt>Visibility</dt><dd><span class="chip chip-bad">Confidential</span></dd>' : ''}
        </dl>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Keep editing</button>
        <button class="btn btn-primary" data-go>${ic('check', 15)} ${thenLetter ? 'Sign and write letter' : 'Sign and file'}</button>`,
      onMount(panel, close) {
        qs('[data-go]', panel).addEventListener('click', () => {
          clearInterval(c.timer);
          const appt = c.appt ? K.appts.find(a => a.id === c.appt) : null;
          if (appt) appt.status = 'done';
          (K.timeline[p.id] = K.timeline[p.id] || []).unshift({
            at: '2026-09-17T10:22', kind: 'note', by: 'u1', title: `${c.type} consult`,
            body: c.note.a || c.note.s || 'Consultation recorded.', signed: true,
          });
          close();
          U.toast('Note signed and filed', `${Math.max(1, Math.round(c.elapsed / 60))} min · locked to ${K.st('u1').name}`, 'ok');
          c = null;
          location.hash = thenLetter ? `#/letter/new?pt=${p.id}` : `#/patient/${p.id}/timeline`;
        });
      }
    });
  }
})();
