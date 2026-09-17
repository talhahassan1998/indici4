/* Kora Health — Tasks: kanban + list */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa } = U;
  window.Views = window.Views || {};

  let mode = 'board', who = 'all';
  const COLS = [
    { id: 'todo',  label: 'To do',       tone: '' },
    { id: 'doing', label: 'In progress', tone: 'chip-warn' },
    { id: 'done',  label: 'Done',        tone: 'chip-ok' },
  ];

  const visible = () => K.tasks.filter(t => who === 'all' || t.who === who);

  window.Views.tasks = {
    title: () => 'Tasks',
    skeleton: () => `<div class="page"><div class="kanban">${[1,2,3].map(() =>
      `<div class="kb-col"><div class="sk sk-line mb-3" style="width:40%"></div>
       <div class="sk sk-block mb-2"></div><div class="sk sk-block"></div></div>`).join('')}</div></div>`,

    render() {
      const list = visible();
      const overdue = list.filter(t => t.col !== 'done' && U.daysOverdue(t.due) > 0).length;
      return `<div class="page">
        <div class="page-hd">
          <div class="page-title"><h1>Tasks</h1>
            <span class="page-sub">${list.filter(t => t.col !== 'done').length} open${overdue ? ` · <span class="bad-t">${overdue} overdue</span>` : ''}</span></div>
          <div class="page-actions">
            <div class="segmented" role="group" aria-label="View">
              <button aria-pressed="${mode === 'board'}" data-m="board">${ic('kanban', 13)} Board</button>
              <button aria-pressed="${mode === 'list'}" data-m="list">${ic('list', 13)} List</button>
            </div>
            <button class="btn btn-primary btn-sm" data-act="new">${ic('plus', 14)} New task</button>
          </div>
        </div>

        <div class="toolbar">
          <span class="t-eyebrow">Assignee</span>
          <div class="pill-nav" role="group" aria-label="Filter by assignee">
            <button aria-pressed="${who === 'all'}" data-who="all">Everyone</button>
            ${K.staff.filter(s => K.tasks.some(t => t.who === s.id)).map(s =>
              `<button aria-pressed="${who === s.id}" data-who="${s.id}">${esc(s.name.split(' ')[0])}</button>`).join('')}
          </div>
          <span class="spacer"></span>
          <span class="t-xs subtle">Drag cards between columns to change status</span>
        </div>

        ${mode === 'board' ? board(list) : listView(list)}
      </div>`;
    },

    openNew(ptId) { newTask(ptId); },

    mount(root) {
      const re = () => U.mountView(this);
      on(root, 'click', '[data-m]', (e, t) => { mode = t.dataset.m; re(); });
      on(root, 'click', '[data-who]', (e, t) => { who = t.dataset.who; re(); });
      on(root, 'click', '[data-act="new"]', () => newTask());
      on(root, 'click', '.kb-card, [data-task]', (e, t) => {
        const id = t.dataset.task || t.dataset.id;
        if (id) openTask(K.tasks.find(x => x.id === id), re);
      });

      let dragId = null;
      on(root, 'dragstart', '.kb-card', (e, t) => { dragId = t.dataset.task; t.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
      on(root, 'dragend', '.kb-card', (e, t) => t.classList.remove('dragging'));
      on(root, 'dragover', '.kb-col', (e, t) => { e.preventDefault(); t.classList.add('drag-over'); });
      on(root, 'dragleave', '.kb-col', (e, t) => t.classList.remove('drag-over'));
      on(root, 'drop', '.kb-col', (e, t) => {
        e.preventDefault(); t.classList.remove('drag-over');
        const task = K.tasks.find(x => x.id === dragId);
        if (!task) return;
        const from = task.col; task.col = t.dataset.col;
        re();
        if (from !== task.col) U.toast('Task moved', `${task.title} → ${COLS.find(c => c.id === task.col).label}`, task.col === 'done' ? 'ok' : 'info');
      });
    },
  };

  function board(list) {
    return `<div class="kanban">
      ${COLS.map(c => {
        const items = list.filter(t => t.col === c.id);
        return `<div class="kb-col" data-col="${c.id}">
          <div class="kb-hd"><b>${c.label}</b><span class="chip ${c.tone}">${items.length}</span>
            <span class="spacer"></span>
            <button class="btn btn-ghost btn-icon btn-sm" data-act="new" aria-label="Add to ${c.label}">${ic('plus', 14)}</button></div>
          <div class="kb-cards">
            ${items.length ? items.map(card).join('')
              : `<div class="empty" style="padding:26px 12px"><p class="t-xs">Nothing here. Drag a card across, or add one.</p></div>`}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  function card(t) {
    const p = t.pt ? K.pt(t.pt) : null;
    const od = t.col !== 'done' && U.daysOverdue(t.due) > 0;
    return `<div class="kb-card" draggable="true" data-task="${t.id}" tabindex="0" role="button">
      <div class="row between g-2 mb-2">
        <span class="chip ${t.pri === 'high' ? 'chip-bad' : t.pri === 'low' ? '' : 'chip-warm'}">${esc(t.tag)}</span>
        ${t.col === 'done' ? `<span class="ok-t">${ic('check', 15)}</span>` : ''}
      </div>
      <div class="kb-title">${esc(t.title)}</div>
      ${p ? `<div class="kb-pt mt-2">${ic('user', 12)} ${esc(p.first)} ${esc(p.last)} · ${esc(p.nhi)}</div>` : ''}
      <div class="row between mt-3">
        <span class="row g-2">${avatar(t.who, 'xs')}<span class="t-xs subtle">${esc(K.st(t.who).name.split(' ')[0])}</span></span>
        <span class="chip ${od ? 'chip-bad' : ''}">${ic('clock', 11)} ${od ? `${U.daysOverdue(t.due)}d late` : U.fmtDateShort(t.due)}</span>
      </div>
    </div>`;
  }

  function listView(list) {
    return `<section class="card"><div class="table-wrap"><table class="tbl">
      <thead><tr><th style="width:38px"></th><th>Task</th><th>Patient</th><th>Assignee</th>
        <th>Tag</th><th>Due</th><th>Status</th></tr></thead>
      <tbody>${list.map(t => {
        const p = t.pt ? K.pt(t.pt) : null;
        const od = t.col !== 'done' && U.daysOverdue(t.due) > 0;
        return `<tr data-id="${t.id}" tabindex="0">
          <td><span class="check" role="checkbox" aria-checked="${t.col === 'done'}">${ic('check', 11)}</span></td>
          <td><b class="t-sm ${t.col === 'done' ? 'subtle' : ''}" style="${t.col === 'done' ? 'text-decoration:line-through' : ''}">${esc(t.title)}</b></td>
          <td class="t-sm">${p ? `${esc(p.first)} ${esc(p.last)}` : '<span class="subtle">—</span>'}</td>
          <td><span class="row g-2">${avatar(t.who, 'xs')}<span class="t-sm">${esc(K.st(t.who).name)}</span></span></td>
          <td><span class="chip">${esc(t.tag)}</span></td>
          <td class="t-sm ${od ? 'bad-t' : ''}">${U.fmtDate(t.due)}${od ? `<br><span class="t-xs">${U.daysOverdue(t.due)} days late</span>` : ''}</td>
          <td>${chip(t.col)}</td>
        </tr>`;
      }).join('')}</tbody></table></div></section>`;
  }

  function newTask(ptId) {
    U.modal({
      title: 'New task', sub: 'Assign work to yourself or a colleague', icon: 'tasks',
      body: `<div class="col g-4">
        <div class="field"><label class="label" for="tkTitle">What needs doing? <span class="req">*</span></label>
          <input class="input" id="tkTitle" placeholder="e.g. Chase MRI report" data-autofocus></div>
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <div class="field"><label class="label" for="tkWho">Assign to</label>
            <select class="select" id="tkWho">${K.staff.map(s => `<option value="${s.id}">${esc(s.name)} — ${esc(s.role)}</option>`).join('')}</select></div>
          <div class="field"><label class="label" for="tkDue">Due</label>
            <input class="input" id="tkDue" type="date" value="2026-09-18"></div>
        </div>
        <div class="grid" style="grid-template-columns:1fr 1fr">
          <div class="field"><label class="label" for="tkPt">Link to patient</label>
            <select class="select" id="tkPt"><option value="">No patient</option>
              ${K.patients.map(p => `<option value="${p.id}" ${ptId === p.id ? 'selected' : ''}>${esc(p.first)} ${esc(p.last)} — ${esc(p.nhi)}</option>`).join('')}</select></div>
          <div class="field"><label class="label" for="tkTag">Tag</label>
            <select class="select" id="tkTag">${['Imaging','ACC','Theatre','Billing','Letters','Admin','Clinical','Recall'].map(x => `<option>${x}</option>`).join('')}</select></div>
        </div>
        <div class="field"><label class="label">Priority</label>
          <div class="segmented"><button aria-pressed="false" data-pri="low">Low</button>
            <button aria-pressed="true" data-pri="normal">Normal</button>
            <button aria-pressed="false" data-pri="high">High</button></div></div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button>
               <button class="btn btn-primary" data-go>${ic('plus', 15)} Create task</button>`,
      onMount(panel, close) {
        let pri = 'normal';
        on(panel, 'click', '[data-pri]', (e, b) => {
          qsa('[data-pri]', panel).forEach(x => x.setAttribute('aria-pressed', 'false'));
          b.setAttribute('aria-pressed', 'true'); pri = b.dataset.pri;
        });
        qs('[data-go]', panel).addEventListener('click', () => {
          const title = qs('#tkTitle', panel).value.trim();
          if (!title) { qs('#tkTitle', panel).setAttribute('aria-invalid', 'true'); U.toast('Give the task a name', 'A short description is enough.', 'warn'); return; }
          K.tasks.unshift({ id: 'k' + Date.now(), title, pt: qs('#tkPt', panel).value || null,
            who: qs('#tkWho', panel).value, due: qs('#tkDue', panel).value, col: 'todo', pri, tag: qs('#tkTag', panel).value });
          close();
          U.mountView(window.Views.tasks);
          U.toast('Task created', title, 'ok');
        });
      }
    });
  }

  function openTask(t, re) {
    if (!t) return;
    const p = t.pt ? K.pt(t.pt) : null;
    U.modal({
      title: t.title, sub: `${t.tag} · due ${U.fmtDate(t.due)}`, icon: 'tasks',
      body: `<div class="col g-4">
        <div class="row g-3 wrap">${chip(t.col)}
          <span class="chip ${t.pri === 'high' ? 'chip-bad' : ''}">${t.pri} priority</span>
          <span class="row g-2">${avatar(t.who, 'sm')}<span class="t-sm">${esc(K.st(t.who).name)}</span></span></div>
        ${p ? `<a class="row g-3 card card-flat" style="padding:11px;text-decoration:none;color:inherit" href="#/patient/${p.id}">
          ${avatar(p.id, 'sm', p.tone)}<span class="grow"><b class="t-sm">${esc(p.first)} ${esc(p.last)}</b>
          <span class="t-xs subtle" style="display:block">${esc(p.nhi)} · ${esc(p.funder)}</span></span>${ic('chevronRight', 15)}</a>` : ''}
        <div class="field"><label class="label" for="tkNote">Notes</label>
          <textarea class="textarea" id="tkNote" rows="3" placeholder="Add a note for whoever picks this up…"></textarea></div>
        <div class="divider"></div>
        <span class="t-eyebrow">Move to</span>
        <div class="row g-2">${COLS.map(c => `<button class="btn ${t.col === c.id ? 'btn-soft' : 'btn-secondary'} btn-sm" data-col="${c.id}">${c.label}</button>`).join('')}</div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Close</button><span class="spacer"></span>
               <button class="btn btn-primary" data-done>${ic('check', 15)} Mark done</button>`,
      onMount(panel, close) {
        on(panel, 'click', '[data-col]', (e, b) => { t.col = b.dataset.col; close(); re(); U.toast('Task updated', `Moved to ${COLS.find(c => c.id === t.col).label}`, 'ok'); });
        qs('[data-done]', panel).addEventListener('click', () => { t.col = 'done'; close(); re(); U.toast('Task done', t.title, 'ok'); });
      }
    });
  }
})();
