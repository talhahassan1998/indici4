/* Kora Health — UI primitives & formatting helpers */
(function () {
  const K = window.KORA;

  /* ------------------------------------------------------------ format */
  const nzd = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' });
  const money = n => nzd.format(n || 0);
  const money0 = n => nzd.format(n || 0).replace(/\.00$/, '');

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function d(v) { return v instanceof Date ? v : new Date(v); }
  function fmtDate(v)     { const x = d(v); return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`; }
  function fmtDateShort(v){ const x = d(v); return `${x.getDate()} ${MONTHS[x.getMonth()]}`; }
  function fmtLongDate(v) { const x = d(v); return `${DAYS[x.getDay()]} ${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`; }
  function fmtTime(mins) {
    const h24 = Math.floor(mins / 60), m = mins % 60;
    const ap = h24 >= 12 ? 'pm' : 'am';
    const h = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h}:${String(m).padStart(2, '0')}${ap}`;
  }
  function fmtClock(iso) { const x = d(iso); return fmtTime(x.getHours() * 60 + x.getMinutes()); }
  function age(dob) {
    const b = d(dob), t = K.TODAY;
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  }
  function relTime(iso) {
    const mins = Math.round((K.TODAY.getTime() + 10 * 3600e3 - d(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const h = Math.round(mins / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.round(h / 24);
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days}d ago`;
    return fmtDateShort(iso);
  }
  function daysOverdue(due) { return Math.round((K.TODAY - d(due)) / 86400e3); }

  function gstSplit(total) {
    const excl = total / (1 + K.GST);
    return { excl, gst: total - excl, incl: total };
  }
  function invoiceTotals(inv) {
    const excl = inv.items.reduce((s, i) => s + i.q * i.p, 0);
    const gst = excl * K.GST;
    return { excl, gst, incl: excl + gst };
  }

  const esc = s => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ------------------------------------------------------------ chips */
  const STATUS = {
    booked:    { label: 'Booked',     cls: '' },
    arrived:   { label: 'Arrived',    cls: 'chip-ok' },
    consult:   { label: 'In consult', cls: 'chip-info' },
    done:      { label: 'Done',       cls: 'chip-ok' },
    dna:       { label: 'DNA',        cls: 'chip-bad' },
    cancelled: { label: 'Cancelled',  cls: '' },
    draft:     { label: 'Draft',      cls: '' },
    pending:   { label: 'Pending',    cls: 'chip-warn' },
    approved:  { label: 'Approved',   cls: 'chip-accent' },
    sent:      { label: 'Sent',       cls: 'chip-info' },
    paid:      { label: 'Paid',       cls: 'chip-ok' },
    overdue:   { label: 'Overdue',    cls: 'chip-bad' },
    todo:      { label: 'To do',      cls: '' },
    doing:     { label: 'In progress',cls: 'chip-warn' },
  };
  function chip(status, opts) {
    const s = STATUS[status] || { label: status, cls: '' };
    const o = opts || {};
    return `<span class="chip ${s.cls} ${o.lg ? 'chip-lg' : ''}">${o.dot !== false ? '<i class="dot"></i>' : ''}${esc(o.label || s.label)}</span>`;
  }
  function funderChip(f) {
    const map = { 'ACC': 'chip-warm', 'Southern Cross': 'chip-info', 'Private': 'chip-accent' };
    return `<span class="chip ${map[f] || ''}">${esc(f)}</span>`;
  }
  function avatar(nameOrId, size, tone) {
    const s = K.st(nameOrId) || K.pt(nameOrId);
    const initials = s
      ? (s.initials || (s.first[0] + s.last[0]))
      : String(nameOrId).split(/\s+/).map(w => w[0]).slice(0, 2).join('');
    const t = tone != null ? tone : (s && s.tone) || 1;
    const cls = size ? `avatar-${size}` : '';
    const title = s ? (s.name || `${s.first} ${s.last}`) : nameOrId;
    return `<span class="avatar ${cls} tone-${t}" title="${esc(title)}" aria-hidden="true">${esc(initials.toUpperCase())}</span>`;
  }

  /* ------------------------------------------------------------ DOM */
  function h(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function on(root, evt, sel, fn) {
    root.addEventListener(evt, e => {
      const t = e.target.closest(sel);
      if (t && root.contains(t)) fn(e, t);
    });
  }

  /* ------------------------------------------------------------ toast */
  function toast(title, body, kind) {
    const host = qs('#toasts');
    const ic = { ok: 'check', bad: 'alert', warn: 'alert', info: 'info' }[kind || 'ok'];
    const el = h(`<div class="toast ${kind || 'ok'}" role="status">
      <span class="t-ic">${window.icon(ic, 13)}</span>
      <span class="grow"><span class="t-title">${esc(title)}</span>${body ? `<span class="t-body">${esc(body)}</span>` : ''}</span>
      <button class="btn btn-ghost btn-icon btn-sm" aria-label="Dismiss">${window.icon('x', 14)}</button>
    </div>`);
    const kill = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 220); };
    el.querySelector('button').addEventListener('click', kill);
    host.appendChild(el);
    setTimeout(kill, 4200);
  }

  /* ------------------------------------------------------- overlays */
  let openLayers = [];
  function closeTop() {
    const top = openLayers.pop();
    if (!top) return false;
    top.nodes.forEach(n => {
      n.dispatchEvent(new CustomEvent('kora:teardown'));
      n.remove();
    });
    if (top.restore && document.body.contains(top.restore)) top.restore.focus();
    return true;
  }
  function closeAllOverlays() { while (openLayers.length) closeTop(); }

  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),' +
                   'textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  function focusablesIn(container) {
    return qsa(FOCUSABLE, container).filter(x => x.offsetParent !== null);
  }

  /* Keeps focus inside an open dialog. The keydown wrap gives natural ordering;
     the focusin guard is the backstop for anything the wrap cannot see (a
     composite control such as input[type=date], a click on the scrim, or focus
     moved programmatically from outside). */
  function trapFocus(container) {
    container.addEventListener('keydown', e => {
      if (e.key !== 'Tab') return;
      const f = focusablesIn(container);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    const guard = e => {
      // Only the topmost layer guards, so stacked dialogs do not fight each other.
      const top = openLayers[openLayers.length - 1];
      if (!top || !top.nodes.includes(container)) return;
      if (container.contains(e.target)) return;
      const f = focusablesIn(container);
      (f[0] || container).focus();
    };
    document.addEventListener('focusin', guard, true);
    container.addEventListener('kora:teardown', () => document.removeEventListener('focusin', guard, true));
  }

  function overlay(kind, html, opts) {
    const o = opts || {};
    const restore = document.activeElement;
    const scrim = h('<div class="scrim"></div>');
    const panel = h(html);
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
    document.body.append(scrim, panel);
    const layer = { nodes: [scrim, panel], restore, kind };
    openLayers.push(layer);
    scrim.addEventListener('click', () => { if (o.dismissible !== false) closeTop(); });
    trapFocus(panel);
    const focusable = panel.querySelector('[data-autofocus],input,select,textarea,button');
    if (focusable) setTimeout(() => focusable.focus(), 30);
    if (o.onMount) o.onMount(panel, () => closeTop());
    return { el: panel, close: () => closeTop() };
  }

  function modal(opts) {
    const body = `<div class="modal ${opts.wide ? 'modal-lg' : ''}" aria-labelledby="mdl-t">
      <div class="modal-hd">
        ${opts.icon ? `<span class="stat-ic ${opts.tone || ''}">${window.icon(opts.icon, 15)}</span>` : ''}
        <div class="grow"><h3 class="t-h4" id="mdl-t">${esc(opts.title)}</h3>
        ${opts.sub ? `<p class="t-sm muted mt-1">${esc(opts.sub)}</p>` : ''}</div>
        <button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Close">${window.icon('x', 15)}</button>
      </div>
      <div class="modal-bd">${opts.body || ''}</div>
      ${opts.footer ? `<div class="modal-ft">${opts.footer}</div>` : ''}
    </div>`;
    return overlay('modal', body, {
      onMount(panel, close) {
        on(panel, 'click', '[data-close]', close);
        if (opts.onMount) opts.onMount(panel, close);
      }
    });
  }

  function drawer(opts) {
    const body = `<aside class="drawer ${opts.wide ? 'drawer-lg' : ''}" aria-labelledby="drw-t">
      <div class="drawer-hd">
        <div class="grow"><h3 class="t-h4" id="drw-t">${esc(opts.title)}</h3>
        ${opts.sub ? `<p class="t-xs muted">${esc(opts.sub)}</p>` : ''}</div>
        <button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Close">${window.icon('x', 15)}</button>
      </div>
      <div class="drawer-bd">${opts.body || ''}</div>
      ${opts.footer ? `<div class="drawer-ft">${opts.footer}</div>` : ''}
    </aside>`;
    return overlay('drawer', body, {
      onMount(panel, close) {
        on(panel, 'click', '[data-close]', close);
        if (opts.onMount) opts.onMount(panel, close);
      }
    });
  }

  /* ---- lightweight anchored menu ---- */
  function menu(anchor, items) {
    qsa('.menu[data-pop]').forEach(m => m.remove());
    const html = `<div class="menu" data-pop role="menu">${items.map(it => {
      if (it === '-') return '<div class="menu-sep"></div>';
      if (it.label && !it.action && !it.href) return `<div class="menu-label">${esc(it.label)}</div>`;
      return `<button class="menu-item ${it.danger ? 'danger' : ''}" role="menuitem" data-act="${esc(it.id || '')}">
        ${it.icon ? window.icon(it.icon, 15) : '<span style="width:15px"></span>'}
        <span class="grow">${esc(it.label)}</span>
        ${it.kbd ? `<span class="kbd">${esc(it.kbd)}</span>` : ''}
      </button>`;
    }).join('')}</div>`;
    const el = h(html);
    document.body.appendChild(el);
    const r = anchor.getBoundingClientRect();
    const w = el.offsetWidth;
    el.style.top = `${Math.min(r.bottom + 6, window.innerHeight - el.offsetHeight - 10)}px`;
    el.style.left = `${Math.max(8, Math.min(r.left, window.innerWidth - w - 10))}px`;
    const away = e => { if (!el.contains(e.target) && e.target !== anchor) { el.remove(); document.removeEventListener('mousedown', away); } };
    setTimeout(() => document.addEventListener('mousedown', away), 0);
    on(el, 'click', '.menu-item', (e, t) => {
      const item = items.filter(i => i !== '-' && (i.action || i.href))[
        Array.from(el.querySelectorAll('.menu-item')).indexOf(t)];
      el.remove();
      if (item && item.action) item.action();
      if (item && item.href) location.hash = item.href;
    });
    return el;
  }

  /* ------------------------------------------------------------ misc */
  function skeletonList(rows) {
    return `<div class="col g-3 card-bd">${Array.from({ length: rows || 4 }).map(() =>
      `<div class="row g-3"><div class="sk sk-circle" style="width:32px;height:32px"></div>
       <div class="grow col g-2"><div class="sk sk-title"></div><div class="sk sk-line" style="width:70%"></div></div></div>`
    ).join('')}</div>`;
  }

  function empty(icon, title, body, cta) {
    return `<div class="empty">
      <span class="e-ic">${window.icon(icon, 22)}</span>
      <h4>${esc(title)}</h4><p>${esc(body)}</p>
      ${cta ? `<div class="mt-2">${cta}</div>` : ''}
    </div>`;
  }

  /* Autosave indicator: call bump() on any edit */
  function autosave(el) {
    let t;
    return function bump() {
      clearTimeout(t);
      el.className = 'saved is-saving';
      el.innerHTML = `<span class="spinner" style="width:11px;height:11px"></span> Saving…`;
      t = setTimeout(() => {
        el.className = 'saved is-saved';
        el.innerHTML = `${window.icon('check', 13)} Saved`;
        setTimeout(() => { el.className = 'saved'; el.innerHTML = `${window.icon('check', 13)} Saved just now`; }, 1600);
      }, 620);
    };
  }

  /* Views attach delegated listeners to the #view container. Reusing that node
     would stack a new set of listeners on every render, so each render gets a
     fresh node and the old listeners die with the old one. */
  let lastParams = {};
  function mountView(view, params) {
    const old = document.getElementById('view');
    const fresh = document.createElement('main');
    fresh.id = 'view';
    fresh.tabIndex = -1;
    if (params) lastParams = params;
    const pr = params || lastParams;
    old.replaceWith(fresh);
    fresh.innerHTML = view.render(pr);
    if (view.mount) view.mount(fresh, pr);
    return fresh;
  }
  function renderSkeleton(view) {
    const el = document.getElementById('view');
    el.innerHTML = view.skeleton ? view.skeleton() : '';
  }

  window.UI = {
    mountView, renderSkeleton,
    money, money0, fmtDate, fmtDateShort, fmtLongDate, fmtTime, fmtClock, age, relTime,
    daysOverdue, gstSplit, invoiceTotals, esc, chip, funderChip, avatar, STATUS,
    h, qs, qsa, on, toast, modal, drawer, menu, overlay, closeTop, closeAllOverlays,
    skeletonList, empty, autosave, openLayers,
  };
})();
