/* Small presentational pieces shared across screens. */
import K from '../data/sample.js';
import { STATUS, FUNDER_CLS } from '../lib/format.js';

export function Chip({ status, label, tone, lg, children }) {
  const s = STATUS[status] || {};
  const cls = tone ? `chip-${tone}` : (s.cls || '');
  return (
    <span className={`chip ${cls} ${lg ? 'chip-lg' : ''}`}>
      {children || label || s.label || status}
    </span>
  );
}

/* "No value recorded" in a cell. An em-dash here reads as content and carries
   no accessible name; this is lighter and announces itself as "None". */
export function Nil({ label = 'None' }) {
  return <span className="nil"><span className="sr-only">{label}</span></span>;
}

export function FunderChip({ funder }) {
  return <span className={`chip ${FUNDER_CLS[funder] || ''}`}>{funder}</span>;
}

export function Avatar({ id, name, size, tone, className = '' }) {
  const rec = K.st(id) || K.pt(id);
  const initials = rec
    ? (rec.initials || (rec.first[0] + rec.last[0]))
    : String(name || '?').split(/\s+/).map(w => w[0]).slice(0, 2).join('');
  const t = tone != null ? tone : (rec && rec.tone) || 1;
  const title = rec ? (rec.name || `${rec.first} ${rec.last}`) : name;
  return (
    <span className={`avatar ${size ? `avatar-${size}` : ''} tone-${t} ${className}`} title={title} aria-hidden="true">
      {String(initials).toUpperCase()}
    </span>
  );
}

export function Banner({ tone = '', icon, children }) {
  return (
    <div className={`banner ${tone}`}>
      {icon && <span className="b-ic">{icon}</span>}
      <span className="grow">{children}</span>
    </div>
  );
}

export function Empty({ icon, title, body, children }) {
  return (
    <div className="empty">
      {icon && <span className="e-ic">{icon}</span>}
      <h4>{title}</h4>
      <p>{body}</p>
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}

export function Card({ title, actions, footer, pad = true, className = '', children }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-hd">
          {title && <h3>{title}</h3>}
          <span className="spacer" />
          {actions}
        </div>
      )}
      {pad ? <div className="card-bd">{children}</div> : children}
      {footer && <div className="card-ft">{footer}</div>}
    </section>
  );
}

export function RuleLabel({ children }) {
  return <div className="rule-label"><span className="t-eyebrow">{children}</span></div>;
}

export function Skeleton({ rows = 4 }) {
  return (
    <div className="col g-3 card-bd">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="row g-3" key={i}>
          <div className="sk sk-circle" style={{ width: 30, height: 30 }} />
          <div className="grow col g-2">
            <div className="sk sk-title" /><div className="sk sk-line" style={{ width: '70%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, id, label }) {
  return (
    <span className="switch">
      <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} aria-label={label} />
      <span className="track" /><span className="thumb" />
    </span>
  );
}
