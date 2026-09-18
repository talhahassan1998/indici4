/* Overlays and toasts. Dialogs trap focus, close on Escape and restore focus,
   which is the part that regressed most often when this was hand-rolled. */
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, TriangleAlert, Info, X } from 'lucide-react';

const UiCtx = createContext(null);
export const useUi = () => useContext(UiCtx);

let seq = 0;

export function UiProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [layers, setLayers] = useState([]);

  const toast = useCallback((title, body, kind = 'ok') => {
    const id = ++seq;
    setToasts(t => [...t, { id, title, body, kind }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4200);
  }, []);

  const open = useCallback(node => {
    const id = ++seq;
    setLayers(l => [...l, { id, node }]);
    return () => setLayers(l => l.filter(x => x.id !== id));
  }, []);

  const closeTop = useCallback(() => setLayers(l => l.slice(0, -1)), []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && layers.length) { e.preventDefault(); closeTop(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [layers.length, closeTop]);

  return (
    <UiCtx.Provider value={{ toast, open, closeTop }}>
      {children}
      {layers.map((l, i) => (
        <Layer key={l.id} onClose={closeTop} isTop={i === layers.length - 1}>{l.node(closeTop)}</Layer>
      ))}
      <div className="toast-host" aria-live="polite">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div key={t.id} className={`toast ${t.kind}`} role="status"
              initial={{ opacity: 0, y: 8, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6 }} transition={{ duration: .22, ease: [.16, 1, .3, 1] }}>
              <span className="t-ic">
                {t.kind === 'bad' || t.kind === 'warn' ? <TriangleAlert size={13} />
                  : t.kind === 'info' ? <Info size={13} /> : <Check size={13} />}
              </span>
              <span className="grow">
                <span className="t-title">{t.title}</span>
                {t.body && <span className="t-body">{t.body}</span>}
              </span>
              <button className="btn btn-ghost btn-icon btn-sm" aria-label="Dismiss"
                onClick={() => setToasts(x => x.filter(y => y.id !== t.id))}><X size={14} /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </UiCtx.Provider>
  );
}

function Layer({ children, onClose, isTop }) {
  const ref = useRef(null);
  const restore = useRef(null);

  useEffect(() => {
    restore.current = document.activeElement;
    const el = ref.current;
    const first = el && el.querySelector('[data-autofocus],input,select,textarea,button');
    if (first) setTimeout(() => first.focus(), 30);
    return () => { if (restore.current && document.body.contains(restore.current)) restore.current.focus(); };
  }, []);

  // Tab wrap, plus a focusin backstop for composite controls like input[type=date].
  useEffect(() => {
    if (!isTop) return;
    const el = ref.current;
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
    const onKey = e => {
      if (e.key !== 'Tab') return;
      const f = Array.from(el.querySelectorAll(sel)).filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const guard = e => { if (el && !el.contains(e.target)) {
      const f = Array.from(el.querySelectorAll(sel)).filter(x => x.offsetParent !== null);
      (f[0] || el).focus();
    }};
    el.addEventListener('keydown', onKey);
    document.addEventListener('focusin', guard, true);
    return () => { el.removeEventListener('keydown', onKey); document.removeEventListener('focusin', guard, true); };
  }, [isTop]);

  return createPortal(
    <>
      <motion.div className="scrim" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: .18 }} />
      <div ref={ref} tabIndex={-1}>{children}</div>
    </>, document.body);
}

export function Modal({ title, sub, icon, tone, wide, footer, onClose, children }) {
  return (
    <motion.div className={`modal ${wide ? 'modal-lg' : ''}`} role="dialog" aria-modal="true" aria-label={title}
      initial={{ opacity: 0, y: 10, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: .24, ease: [.16, 1, .3, 1] }}>
      <div className="modal-hd">
        {icon && <span className={`stat-ic ${tone || ''}`}>{icon}</span>}
        <div className="grow">
          <h3 className="t-h4">{title}</h3>
          {sub && <p className="t-sm muted mt-1">{sub}</p>}
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><X size={15} /></button>
      </div>
      <div className="modal-bd">{children}</div>
      {footer && <div className="modal-ft">{footer}</div>}
    </motion.div>
  );
}

export function Drawer({ title, sub, wide, footer, onClose, children }) {
  return (
    <motion.aside className={`drawer ${wide ? 'drawer-lg' : ''}`} role="dialog" aria-modal="true" aria-label={title}
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ duration: .28, ease: [.16, 1, .3, 1] }}>
      <div className="drawer-hd">
        <div className="grow">
          <h3 className="t-h4">{title}</h3>
          {sub && <p className="t-xs muted">{sub}</p>}
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><X size={15} /></button>
      </div>
      <div className="drawer-bd">{children}</div>
      {footer && <div className="drawer-ft">{footer}</div>}
    </motion.aside>
  );
}

/* Anchored menu, positioned against the trigger and dismissed on outside click. */
export function Menu({ anchor, items, onClose }) {
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: -9999, left: -9999 });

  useEffect(() => {
    if (!anchor || !ref.current) return;
    const r = anchor.getBoundingClientRect();
    const el = ref.current;
    setPos({
      top: Math.min(r.bottom + 6, window.innerHeight - el.offsetHeight - 10),
      left: Math.max(8, Math.min(r.left, window.innerWidth - el.offsetWidth - 10)),
    });
    const away = e => { if (!el.contains(e.target) && e.target !== anchor) onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', away), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', away); };
  }, [anchor, onClose]);

  return createPortal(
    <div className="menu" role="menu" ref={ref} style={{ top: pos.top, left: pos.left }}>
      {items.map((it, i) =>
        it === '-' ? <div className="menu-sep" key={i} />
        : it.heading ? <div className="menu-label" key={i}>{it.heading}</div>
        : (
          <button className={`menu-item ${it.danger ? 'danger' : ''}`} role="menuitem" key={i}
            onClick={() => { onClose(); it.action && it.action(); }}>
            {it.icon}<span className="grow">{it.label}</span>
            {it.kbd && <span className="kbd">{it.kbd}</span>}
          </button>
        ))}
    </div>, document.body);
}

/* Autosave indicator: call bump() on every edit. */
export function useAutosave() {
  const [state, setState] = useState('idle');
  const timer = useRef(null);
  const bump = useCallback(() => {
    clearTimeout(timer.current);
    setState('saving');
    timer.current = setTimeout(() => setState('saved'), 620);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return [state, bump];
}

export function SavedIndicator({ state }) {
  return (
    <span className={`saved ${state === 'saving' ? 'is-saving' : state === 'saved' ? 'is-saved' : ''}`}>
      {state === 'saving'
        ? <><span className="spinner" style={{ width: 11, height: 11 }} /> Saving…</>
        : <><Check size={13} /> {state === 'saved' ? 'Saved' : 'All changes saved'}</>}
    </span>
  );
}
