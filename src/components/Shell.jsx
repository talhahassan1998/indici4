import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Users, Inbox, Mail, SquareCheckBig, ReceiptText,
  ShieldCheck, ChartColumn, Settings, Search, PanelLeftClose, PanelLeftOpen, Bell, Moon, Sun, Sparkles,
  ChevronDown, User, LogOut,
} from 'lucide-react';
import K from '../data/sample.js';
import { age, fmtDate } from '../lib/format.js';
import { Avatar, FunderChip } from './Primitives.jsx';
import { Menu } from '../lib/ui.jsx';

export const ROLES = {
  clinician: { user: 'u1', label: 'Clinician',        desc: 'Dr Alice Fenwick · Orthopaedics' },
  reception: { user: 'u5', label: 'Reception',        desc: 'Mereana Hopa · Front of house' },
  typist:    { user: 'u6', label: 'Typist',           desc: 'Josh Petersen · Medical typist' },
  manager:   { user: 'u7', label: 'Practice Manager', desc: 'Lorraine Beckett · Operations' },
};

const NAV = [
  { group: 'Today', items: [
    { to: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
    { to: '/appointments', label: 'Appointments', Icon: CalendarDays, badge: () => K.appts.filter(a => a.status === 'arrived').length },
    { to: '/patients',     label: 'Patients',     Icon: Users },
    { to: '/inbox',        label: 'Inbox',        Icon: Inbox, badge: () => K.inbox.filter(i => i.unread).length },
  ]},
  { group: 'Clinical', items: [
    { to: '/letters', label: 'Letters', Icon: Mail, badge: () => K.letters.filter(l => l.status === 'pending').length },
    { to: '/tasks',   label: 'Tasks',   Icon: SquareCheckBig, badge: () => K.tasks.filter(t => t.col !== 'done').length },
  ]},
  { group: 'Money', items: [
    { to: '/billing', label: 'Billing', Icon: ReceiptText },
    { to: '/acc',     label: 'ACC',     Icon: ShieldCheck, badge: () => K.accQueue.filter(a => !a.valid).length },
  ]},
  { group: 'Practice', items: [
    { to: '/reports', label: 'Reports', Icon: ChartColumn },
    { to: '/admin',   label: 'Admin',   Icon: Settings },
  ]},
];

/* g-then-letter jumps, in sidebar order. */
const GO_TO = {
  d: '/dashboard', a: '/appointments', p: '/patients', i: '/inbox',
  l: '/letters', t: '/tasks', b: '/billing', c: '/acc',
  r: '/reports', s: '/admin',
};

export default function Shell({ role, setRole, theme, toggleTheme, rail, setRail, onPalette, onSignOut, children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const user = K.st(ROLES[role].user);
  const [menu, setMenu] = useState(null);
  const [q, setQ] = useState('');
  const [openSearch, setOpenSearch] = useState(false);
  const [active, setActive] = useState(0);
  const searchRef = useRef(null);

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return K.patients.filter(p =>
      `${p.first} ${p.last}`.toLowerCase().includes(s) ||
      p.nhi.toLowerCase().includes(s) ||
      p.phone.replace(/\s/g, '').includes(s.replace(/\s/g, '')) ||
      p.dob.includes(s)
    ).slice(0, 7);
  }, [q]);

  useEffect(() => {
    let goPending = null;
    const onKey = e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); onPalette(); return; }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); return; }
      if (e.key === '[') { setRail(r => !r); return; }
      // "g" then a letter jumps to a section, the way the sidebar is ordered.
      if (goPending) {
        clearTimeout(goPending); goPending = null;
        const to = GO_TO[e.key.toLowerCase()];
        if (to) { e.preventDefault(); nav(to); }
        return;
      }
      if (e.key === 'g') { goPending = setTimeout(() => { goPending = null; }, 1200); }
    };
    document.addEventListener('keydown', onKey);
    return () => { clearTimeout(goPending); document.removeEventListener('keydown', onKey); };
  }, [onPalette, setRail, nav]);

  const goPatient = id => { setQ(''); setOpenSearch(false); nav(`/patient/${id}`); };
  const unread = K.inbox.filter(i => i.unread).length;

  return (
    <div className="app" data-rail={String(rail)}>
      <nav className="app-sidebar" aria-label="Main">
        {/* The control that collapses the sidebar belongs to the sidebar, not
            to the bar above it: it is the only thing on screen whose whole
            job is that panel. */}
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4v16M7 12l7.5-8M7 12l7.5 8" />
            </svg>
          </span>
          <span className="brand-name"><b>Kora Health</b><span>Newmarket</span></span>
          <button className="rail-toggle tip" data-tip={rail ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={() => setRail(r => !r)} aria-label="Toggle sidebar" aria-expanded={!rail}>
            {rail ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>
        </div>

        <div className="nav">
          {NAV.map(g => (
            <div className="nav-group" key={g.group}>
              <div className="nav-group-label">{g.group}</div>
              {g.items.map(({ to, label, Icon, badge }) => {
                const n = badge ? badge() : 0;
                return (
                  <NavLink to={to} key={to} className="nav-item"
                    aria-current={loc.pathname.startsWith(to) ? 'page' : undefined}>
                    <Icon size={18} className="ic" />
                    <span className="nav-label">{label}</span>
                    {n > 0 && <span className="badge-count nav-badge">{n}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-ft">
          <span className="sf-org">Kora Specialists</span>
          <span className="sf-ver">Newmarket · v2.4</span>
        </div>
      </nav>

      <div className="app-main">
        <header className="app-topbar">
          <div className="global-search" role="search">
            <span className="ic-lead"><Search size={16} /></span>
            <input className="input" ref={searchRef} type="search" value={q} autoComplete="off"
              placeholder="Search patients by name, NHI, DOB or phone…" aria-label="Search patients"
              role="combobox" aria-expanded={openSearch}
              onChange={e => { setQ(e.target.value); setOpenSearch(!!e.target.value.trim()); setActive(0); }}
              onFocus={() => setOpenSearch(!!q.trim())}
              onBlur={() => setTimeout(() => setOpenSearch(false), 160)}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, hits.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
                else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); goPatient(hits[active].id); }
                else if (e.key === 'Escape') { setQ(''); setOpenSearch(false); e.currentTarget.blur(); }
              }} />
            <span className="kbd">/</span>
            {openSearch && (
              <div className="search-results" role="listbox">
                {hits.length ? hits.map((p, i) => (
                  <button className={`search-hit ${i === active ? 'active' : ''}`} key={p.id} role="option"
                    aria-selected={i === active} onMouseDown={() => goPatient(p.id)}>
                    <Avatar id={p.id} size="sm" />
                    <span className="hit-main">
                      <b>{p.first} {p.last}</b>
                      <span>{p.nhi} · {fmtDate(p.dob)} ({age(p.dob)}) · {p.phone || 'no phone'}</span>
                    </span>
                    <FunderChip funder={p.funder} />
                  </button>
                )) : (
                  <div className="empty" style={{ padding: '26px 16px' }}>
                    <span className="e-ic"><Search size={20} /></span>
                    <h4 className="t-sm">No patient found</h4>
                    <p className="t-xs">Try an NHI (e.g. JKL8407), a surname, or a date of birth.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="topbar-actions">
            <button className="btn btn-secondary btn-sm" onClick={onPalette}>
              <Sparkles size={15} /><span>Actions</span><span className="kbd">Ctrl K</span>
            </button>
            <button className="role-switch tip" data-tip="Switch role view" onClick={e => setMenu({
              anchor: e.currentTarget,
              items: [
                { heading: 'View the app as' },
                ...Object.entries(ROLES).map(([k, r]) => ({
                  icon: <User size={15} />, label: `${r.label} · ${r.desc.split(' · ')[0]}`,
                  action: () => setRole(k),
                })),
              ],
            })}>
              <span className="role-dot" /><span className="role-name">{ROLES[role].label}</span>
              <ChevronDown size={13} className="ic" />
            </button>
            <button className="btn btn-ghost btn-icon tip" data-tip="Inbox" aria-label="Inbox"
              style={{ position: 'relative' }} onClick={() => nav('/inbox')}>
              <Bell size={17} />
              {unread > 0 && <span className="badge-count" style={{ position: 'absolute', top: 1, right: 1 }}>{unread}</span>}
            </button>
            <button className="btn btn-ghost btn-icon tip" data-tip={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              onClick={toggleTheme} aria-label="Toggle dark mode">
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <span className="tb-divider" aria-hidden="true" />

            {/* Who you are signed in as, in the corner people look for it.
                Below 1180px the name drops and the avatar carries it. */}
            <button className="u-card" aria-label={`Account: ${user.name}`} onClick={e => setMenu({
              anchor: e.currentTarget,
              items: [
                { heading: `${user.name} · ${user.spec}` },
                { icon: <User size={15} />, label: 'My profile & signature', action: () => nav('/admin/users') },
                { icon: theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />, label: theme === 'dark' ? 'Light mode' : 'Dark mode', action: toggleTheme },
                '-',
                { icon: <LogOut size={15} />, label: 'Sign out', danger: true, action: onSignOut },
              ],
            })}>
              <Avatar id={user.id} size="sm" />
              <span className="u-meta"><b>{user.name}</b><span>{user.spec}</span></span>
              <ChevronDown size={15} className="ic" />
            </button>
          </div>
        </header>

        <main id="view" tabIndex={-1}>{children}</main>
      </div>

      {menu && <Menu anchor={menu.anchor} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}
