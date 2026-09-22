/* Formatting helpers. Kept framework-free so they stay testable. */
import K from '../data/sample.js';

const nzd = new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' });
export const money = n => nzd.format(n || 0);
export const money0 = n => nzd.format(n || 0).replace(/\.00$/, '');

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const d = v => (v instanceof Date ? v : new Date(v));

export const fmtDate = v => { const x = d(v); return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`; };
export const fmtDateShort = v => { const x = d(v); return `${x.getDate()} ${MONTHS[x.getMonth()]}`; };
export const fmtDateDMY = v => { const x = d(v);
  return `${String(x.getDate()).padStart(2, '0')}-${String(x.getMonth() + 1).padStart(2, '0')}-${x.getFullYear()}`; };
export const fmtLongDate = v => { const x = d(v); return `${DAYS[x.getDay()]} ${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`; };

export function fmtTime(mins) {
  const h24 = Math.floor(mins / 60), m = mins % 60;
  const ap = h24 >= 12 ? 'pm' : 'am';
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(m).padStart(2, '0')}${ap}`;
}
export const fmtClock = iso => { const x = d(iso); return fmtTime(x.getHours() * 60 + x.getMinutes()); };

export function age(dob) {
  const b = d(dob), t = K.TODAY;
  let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a;
}

export function relTime(iso) {
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

export const daysOverdue = due => Math.round((K.TODAY - d(due)) / 86400e3);

export function invoiceTotals(inv) {
  const excl = inv.items.reduce((s, i) => s + i.q * i.p, 0);
  const gst = excl * K.GST;
  return { excl, gst, incl: excl + gst };
}

export const STATUS = {
  booked:    { label: 'Booked',      cls: '' },
  arrived:   { label: 'Arrived',     cls: 'chip-ok' },
  consult:   { label: 'In consult',  cls: 'chip-info' },
  done:      { label: 'Done',        cls: 'chip-ok' },
  dna:       { label: 'DNA',         cls: 'chip-bad' },
  cancelled: { label: 'Cancelled',   cls: '' },
  draft:     { label: 'Draft',       cls: '' },
  pending:   { label: 'Pending',     cls: 'chip-warn' },
  approved:  { label: 'Approved',    cls: 'chip-accent' },
  sent:      { label: 'Sent',        cls: 'chip-info' },
  paid:      { label: 'Paid',        cls: 'chip-ok' },
  overdue:   { label: 'Overdue',     cls: 'chip-bad' },
  todo:      { label: 'To do',       cls: '' },
  doing:     { label: 'In progress', cls: 'chip-warn' },
};

export const FUNDER_CLS = {
  'ACC': 'chip-warm', 'Southern Cross': 'chip-info', 'Private': 'chip-accent', 'Hospital': '',
};
