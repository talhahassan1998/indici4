import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, Mail, CalendarDays, ReceiptText, SquareCheckBig, User, LayoutDashboard,
  Users, Inbox, ShieldCheck, Settings, RefreshCw, Send, Moon, Sun, Search, Lock,
} from 'lucide-react';
import K from '../data/sample.js';
import { age } from '../lib/format.js';

export default function CommandPalette({ onClose, nav, theme, toggleTheme, toast }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const paneRef = useRef(null);

  const all = useMemo(() => {
    const go = (label, sub, Icon, to) => ({ g: 'Go to', label, sub, Icon, run: () => nav(to) });
    const list = [
      { g: 'Create', label: 'New letter', sub: 'Open the letter editor with a blank draft', Icon: Mail, run: () => nav('/letter/new') },
      { g: 'Create', label: 'Book appointment', sub: 'Open the booking panel on the calendar', Icon: CalendarDays, run: () => nav('/appointments?book=1') },
      { g: 'Create', label: 'Create invoice', sub: 'New invoice from an appointment', Icon: ReceiptText, run: () => nav('/billing?create=1') },
      { g: 'Create', label: 'New task', sub: 'Assign work to a colleague', Icon: SquareCheckBig, run: () => nav('/tasks?new=1') },
      { g: 'Create', label: 'Register new patient', sub: 'Add a patient record', Icon: User, run: () => toast('New patient', 'Registration form would open here.', 'info') },
      go('Dashboard', 'Your role home', LayoutDashboard, '/dashboard'),
      go('Appointments', 'Day and week views', CalendarDays, '/appointments'),
      go('Patients', 'Search the register', Users, '/patients'),
      go('Inbox & approvals', 'Results, referrals, letters', Inbox, '/inbox'),
      go('Billing', 'Invoices and payments', ReceiptText, '/billing'),
      go('ACC submissions', 'Validate and submit', ShieldCheck, '/acc'),
      go('Admin settings', 'Clinic, users, templates', Settings, '/admin'),
      { g: 'Go to', label: 'Design system', sub: 'Palette, type, components', Icon: Sparkles, run: () => nav('/styleguide') },
      { g: 'Go to', label: 'Sign-in screen', sub: 'View the authentication design', Icon: Lock, run: () => { window.location.href = './login.html'; } },
      { g: 'Actions', label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode', sub: 'Toggle appearance', Icon: theme === 'dark' ? Sun : Moon, run: toggleTheme },
      { g: 'Actions', label: 'Sync items to Xero', sub: 'Push today’s invoices', Icon: RefreshCw, run: () => toast('Xero sync started', '5 invoices queued for sync.', 'info') },
      { g: 'Actions', label: 'Submit ACC batch', sub: '3 invoices ready', Icon: Send, run: () => nav('/acc') },
    ];
    K.patients.slice(0, 6).forEach(p => list.push({
      g: 'Patients', label: `${p.first} ${p.last}`,
      sub: `${p.nhi} · ${age(p.dob)}y · ${p.funder}`, Icon: User, run: () => nav(`/patient/${p.id}`),
    }));
    return list;
  }, [nav, theme, toggleTheme, toast]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return !s ? all : all.filter(c => `${c.label} ${c.sub} ${c.g}`.toLowerCase().includes(s));
  }, [q, all]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  /* Escape closes from anywhere in the dialog, and Tab stays inside it —
     not just while the search field happens to hold focus. */
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const el = paneRef.current;
      if (!el) return;
      const f = Array.from(el.querySelectorAll('input,button,[tabindex]:not([tabindex="-1"])'))
        .filter(x => x.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !el.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !el.contains(document.activeElement))) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  useEffect(() => { setActive(0); }, [q]);
  useEffect(() => {
    const el = listRef.current?.querySelector('[data-active="true"]');
    el?.scrollIntoView({ block: 'nearest' });
  }, [active, filtered]);

  const run = i => { const c = filtered[i]; if (!c) return; onClose(); setTimeout(c.run, 40); };

  let lastGroup = null;
  return createPortal(
    <>
      <motion.div className="cmdk-scrim" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .16 }} />
      <motion.div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette" ref={paneRef}
        initial={{ opacity: 0, y: 10, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: .24, ease: [.16, 1, .3, 1] }}>
        <div className="cmdk-input-wrap">
          <Sparkles size={18} className="ic" />
          <input className="cmdk-input" ref={inputRef} value={q} placeholder="Type a command or search…"
            aria-label="Command" autoComplete="off" spellCheck={false}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => (a + 1) % filtered.length); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => (a - 1 + filtered.length) % filtered.length); }
              else if (e.key === 'Enter') { e.preventDefault(); run(active); }
            }} />
          <span className="kbd">Esc</span>
        </div>
        <div className="cmdk-list" ref={listRef} role="listbox">
          {filtered.length ? filtered.map((c, i) => {
            const head = c.g !== lastGroup ? <div className="cmdk-group-label" key={`g${i}`}>{c.g}</div> : null;
            lastGroup = c.g;
            const Icon = c.Icon;
            return (
              <div key={i}>
                {head}
                <button className="cmdk-item" role="option" aria-selected={i === active} data-active={i === active}
                  onClick={() => run(i)} onMouseMove={() => i !== active && setActive(i)}>
                  <Icon size={17} className="ic" />
                  <span className="ci-main"><b>{c.label}</b><span>{c.sub}</span></span>
                  {i === active && <span className="kbd">↵</span>}
                </button>
              </div>
            );
          }) : (
            <div className="empty" style={{ padding: '30px 16px' }}>
              <span className="e-ic"><Search size={20} /></span>
              <h4 className="t-sm">Nothing matched</h4>
              <p className="t-xs">Try “letter”, “invoice”, “ACC” or a patient name.</p>
            </div>
          )}
        </div>
        <div className="cmdk-ft">
          <span><span className="kbd">↑</span> <span className="kbd">↓</span> navigate</span>
          <span><span className="kbd">↵</span> run</span>
          <span className="spacer" /><span>Kora Health</span>
        </div>
      </motion.div>
    </>, document.body);
}
