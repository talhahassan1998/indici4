import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search, Plus, RefreshCw, Check, TriangleAlert, ReceiptText, Send, CreditCard,
  EllipsisVertical, Download, Trash2, Printer, Copy, Eye, Pencil,
} from 'lucide-react';
import K from '../data/sample.js';
import { money, fmtDate, fmtDateShort, fmtClock, invoiceTotals, daysOverdue } from '../lib/format.js';
import { Chip, FunderChip, Avatar, Banner, Empty, Switch, Nil } from '../components/Primitives.jsx';
import { useUi, Drawer, Modal, Menu } from '../lib/ui.jsx';

export default function Billing() {
  const { toast, open } = useUi();
  const [sp, setSp] = useSearchParams();
  const [f, setF] = useState({ q: '', status: 'all', payer: 'all', cl: 'all' });
  const [, force] = useState(0);
  const [menu, setMenu] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const list = useMemo(() => K.invoices.filter(i =>
    (f.status === 'all' || i.status === f.status) &&
    (f.payer === 'all' || i.payer === f.payer) &&
    (f.cl === 'all' || i.cl === f.cl) &&
    (!f.q || `${i.id} ${K.ptName(i.pt)}`.toLowerCase().includes(f.q.toLowerCase()))
  ), [f, K.invoices.length]);

  const sum = s => K.invoices.filter(i => !s || i.status === s).reduce((a, i) => a + invoiceTotals(i).incl, 0);
  const count = s => K.invoices.filter(i => i.status === s).length;
  const todayInv = K.invoices.filter(i => i.date === '2026-09-17');
  const todayTotal = todayInv.reduce((a, i) => a + invoiceTotals(i).incl, 0);

  const openCreate = apptId => open(close =>
    <CreateInvoice close={close} apptId={apptId} toast={toast} onDone={() => force(n => n + 1)} />);

  const openInvoice = inv => open(close =>
    <InvoiceDrawer close={close} inv={inv} toast={toast} onDone={() => force(n => n + 1)}
      onPay={() => open(c2 => <PayModal close={c2} inv={inv} toast={toast} onDone={() => force(n => n + 1)} />)} />);

  if (sp.get('create')) { sp.delete('create'); setSp(sp, { replace: true }); setTimeout(() => openCreate(), 0); }

  const doSync = () => {
    setSyncing(true);
    setTimeout(() => {
      const reconciled = K.invoices.filter(i => i.status === 'sent' || i.status === 'overdue').slice(0, 2);
      reconciled.forEach(i => { i.status = 'paid'; i.paid = invoiceTotals(i).incl; i.reconciled = true; });
      setSyncing(false); force(n => n + 1);
      toast('Xero sync complete',
        `${reconciled.length} invoices matched in the bank feed and marked paid · ${K.billingCodes.length} billing codes refreshed`, 'ok');
    }, 1100);
  };

  return (
    <div className="page">
      <div className="page-hd">
        <div className="page-title"><h1>Billing</h1>
          <span className="page-sub">All amounts in NZD and include 15% GST unless shown otherwise</span></div>
        <div className="page-actions">
          <span className="sync-pill tip" data-tip={`Last synced ${fmtClock(K.XERO_SYNC)}`}><RefreshCw size={13} /> Xero connected</span>
          <button className="btn btn-secondary btn-sm" data-act="sync" onClick={doSync} disabled={syncing}>
            {syncing ? <><span className="spinner" /> Syncing…</> : <><RefreshCw size={14} /> Sync items</>}</button>
          <button className="btn btn-primary btn-sm" data-act="create" onClick={() => openCreate()}><Plus size={14} /> Create invoice</button>
        </div>
      </div>

      {/* One divided line of figures rather than four matching tiles. The
          numbers are what the page is about, so they are the only thing set
          large; the colour says which one you have to do something about. */}
      <div className="fig-row mb-5">
        {[{ l: 'Invoiced today', v: money(todayTotal), s: `${todayInv.length} invoices`, tone: '' },
          { l: 'Paid', v: money(sum('paid')), s: `${count('paid')} settled`, tone: 'is-ok' },
          { l: 'Awaiting payment', v: money(sum('sent')), s: `${count('sent')} sent`, tone: 'is-warn' },
          { l: 'Overdue', v: money(sum('overdue')), s: `${count('overdue')} past due`, tone: 'is-bad' },
        ].map(f => (
          <div className={`fig ${f.tone}`} key={f.l}>
            <b>{f.v}</b><span>{f.l}</span><small>{f.s}</small>
          </div>
        ))}
      </div>

      <Banner icon={<RefreshCw size={16} />}>
        <b>Reconcile in Xero only</b><br />
        <span className="t-sm">Billing codes and prices are mastered in Xero and synced into Kora. When a payment
        lands in the bank and is matched in Xero, the invoice is marked paid here automatically.</span>
      </Banner>

      <div className="toolbar mt-4">
        <div className="input-group" style={{ maxWidth: 250 }}>
          <span className="ic-lead"><Search size={15} /></span>
          <input className="input" value={f.q} placeholder="Invoice number or patient…" aria-label="Search invoices"
            onChange={e => setF(p => ({ ...p, q: e.target.value }))} />
        </div>
        <select className="select" style={{ maxWidth: 160 }} aria-label="Status" value={f.status}
          onChange={e => setF(p => ({ ...p, status: e.target.value }))}>
          <option value="all">All statuses</option>
          {['draft', 'sent', 'paid', 'overdue'].map(s => <option value={s} key={s}>{s}</option>)}
        </select>
        <select className="select" style={{ maxWidth: 180 }} aria-label="Payer" value={f.payer}
          onChange={e => setF(p => ({ ...p, payer: e.target.value }))}>
          <option value="all">All payers</option>
          {['ACC', 'Southern Cross', 'Private', 'Hospital'].map(s => <option key={s}>{s}</option>)}
        </select>
        <span className="spacer" />
        <span className="t-xs subtle">{list.length} invoices</span>
      </div>

      <section className="card">
        {list.length ? <div className="table-wrap"><table className="tbl">
          <thead><tr><th>Invoice</th><th>Patient</th><th>Date</th><th>Payer</th><th>Clinician</th>
            <th className="num-cell">Excl GST</th><th className="num-cell">GST</th><th className="num-cell">Total</th>
            <th>Status</th><th /></tr></thead>
          <tbody>{list.map(i => {
            const t = invoiceTotals(i), p = K.pt(i.pt);
            const od = i.status === 'overdue' ? daysOverdue(i.due) : 0;
            return (
              <tr key={i.id} className={`row-link ${i.status === 'overdue' ? 'row-err' : ''}`} tabIndex={0}
                onClick={e => { if (!e.target.closest('.row-actions')) openInvoice(i); }}
                onKeyDown={e => { if (e.key === 'Enter') openInvoice(i); }}>
                <td className="t-mono t-sm"><b>{i.id}</b></td>
                <td><span className="row g-2"><Avatar id={p.id} size="xs" />
                  <span className="t-sm">{p.first} {p.last}</span></span></td>
                <td className="t-sm">{fmtDateShort(i.date)}{od > 0 && <><br /><span className="t-xs bad-t">{od} days late</span></>}</td>
                <td><FunderChip funder={i.payer} /></td>
                <td className="t-sm">{K.st(i.cl).name}</td>
                <td className="num-cell">{money(t.excl)}</td>
                <td className="num-cell subtle">{money(t.gst)}</td>
                <td className="num-cell"><b>{money(t.incl)}</b></td>
                <td><Chip status={i.status} />
                  {i.reconciled && <><br /><span className="t-xs subtle">matched in Xero</span></>}</td>
                <td><span className="row-actions">
                  {i.status !== 'paid' && (
                    <button className="btn btn-ghost btn-icon btn-sm tip" data-tip="Record payment" data-pay
                      aria-label={`Record payment for ${i.id}`}
                      onClick={() => open(close => <PayModal close={close} inv={i} toast={toast} onDone={() => force(n => n + 1)} />)}>
                      <CreditCard size={14} /></button>
                  )}
                  <button className="btn btn-ghost btn-icon btn-sm tip" data-tip="Send" aria-label={`Send ${i.id}`}
                    onClick={() => { if (i.status === 'draft') i.status = 'sent'; force(n => n + 1); toast('Invoice sent', i.id, 'ok'); }}>
                    <Send size={14} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm" aria-label={`More for ${i.id}`}
                    onClick={e => setMenu({ anchor: e.currentTarget, items: [
                      { heading: i.id },
                      { icon: <Eye size={15} />, label: 'View invoice', action: () => openInvoice(i) },
                      { icon: <Pencil size={15} />, label: 'Edit lines', action: () => openCreate() },
                      { icon: <Printer size={15} />, label: 'Print receipt', action: () => toast('Receipt', 'Sent to the printer.', 'ok') },
                      '-',
                      { icon: <Trash2 size={15} />, label: 'Void invoice', danger: true, action: () => toast('Void', 'Voiding needs a reason and manager approval.', 'warn') },
                    ]})}><EllipsisVertical size={14} /></button>
                </span></td>
              </tr>
            );
          })}</tbody></table></div>
          : <Empty icon={<ReceiptText size={22} />} title="No invoices match"
              body="Try clearing a filter, or raise a new invoice from a completed appointment." />}
      </section>
      {menu && <Menu anchor={menu.anchor} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}

/* Read-only detail for an existing invoice — what a row click should show. */
function InvoiceDrawer({ close, inv, toast, onDone, onPay }) {
  const p = K.pt(inv.pt);
  const t = invoiceTotals(inv);
  const owing = t.incl - (inv.paid || 0);
  const od = inv.status === 'overdue' ? daysOverdue(inv.due) : 0;

  return (
    <Drawer title={inv.id} sub={`${p.first} ${p.last} · ${p.nhi} · ${inv.payer}`} onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Close</button><span className="spacer" />
        <button className="btn btn-secondary" onClick={() => toast('Receipt', 'Sent to the printer.', 'ok')}>
          <Printer size={15} /> Print</button>
        {owing > 0.005 && (
          <button className="btn btn-primary" onClick={() => { close(); onPay(); }}>
            <CreditCard size={15} /> Record payment</button>
        )}
      </>}>
      <div className="col g-5">
        {od > 0 && (
          <Banner tone="bad" icon={<TriangleAlert size={15} />}>
            <b>{od} days overdue.</b> Due {fmtDate(inv.due)}. No reminder has been sent yet.
          </Banner>
        )}
        {inv.reconciled && (
          <Banner tone="ok" icon={<Check size={15} />}>Matched against the bank feed in Xero.</Banner>
        )}

        <div className="card card-flat card-bd row g-3">
          <Avatar id={p.id} size="lg" />
          <div className="grow"><b>{p.first} {p.last}</b>
            <div className="t-xs subtle">{p.nhi} · {p.phone || 'no phone'}</div></div>
          <Chip status={inv.status} />
        </div>

        <dl className="kv">
          <dt>Issued</dt><dd>{fmtDate(inv.date)}</dd>
          <dt>Due</dt><dd>{fmtDate(inv.due)}</dd>
          <dt>Clinician</dt><dd>{K.st(inv.cl).name}</dd>
          <dt>Payer</dt><dd><FunderChip funder={inv.payer} /></dd>
        </dl>

        <div>
          <span className="t-eyebrow">Lines</span>
          <table className="tbl mt-2">
            <thead><tr><th>Item</th><th className="num-cell">Qty</th>
              <th className="num-cell">Unit</th><th className="num-cell">Amount</th></tr></thead>
            <tbody>{inv.items.map((it, n) => (
              <tr key={n}>
                <td className="t-sm">{it.d}{it.code && <><br /><span className="t-xs t-mono subtle">{it.code}</span></>}</td>
                <td className="num-cell">{it.q}</td>
                <td className="num-cell">{money(it.p)}</td>
                <td className="num-cell"><b>{money(it.q * it.p)}</b></td>
              </tr>
            ))}</tbody>
          </table>
        </div>

        <div className="col g-2">
          <div className="row between t-sm"><span className="muted">Subtotal</span><span className="num">{money(t.excl)}</span></div>
          <div className="row between t-sm"><span className="muted">GST 15%</span><span className="num">{money(t.gst)}</span></div>
          <div className="divider" />
          <div className="row between"><span className="t-h4">Total</span><span className="t-h3 num">{money(t.incl)}</span></div>
          {inv.paid > 0 && (
            <div className="row between t-sm"><span className="muted">Paid</span>
              <span className="num ok-t">−{money(inv.paid)}</span></div>
          )}
          {owing > 0.005 && (
            <div className="row between t-sm"><span className="muted">Owing</span>
              <span className="num bad-t"><b>{money(owing)}</b></span></div>
          )}
        </div>
      </div>
    </Drawer>
  );
}

function CreateInvoice({ close, apptId, toast, onDone }) {
  const appt = apptId ? K.appts.find(a => a.id === apptId) : K.appts.find(a => a.status === 'done' && !a.invoiced);
  const pt = appt ? K.pt(appt.pt) : K.pt('p1');
  const type = appt ? K.at(appt.type) : K.apptTypes[0];
  const seed = K.code(type.code) || K.billingCodes[0];
  const [items, setItems] = useState([{ code: seed.code, d: seed.name, q: 1, p: seed.price }]);
  const [payer, setPayer] = useState(pt.funder);
  const [split, setSplit] = useState(false);
  const [pct, setPct] = useState(30);

  const excl = items.reduce((s, i) => s + i.q * i.p, 0);
  const gst = excl * K.GST, incl = excl + gst;
  const patientShare = incl * pct / 100;
  const active = K.billingCodes.filter(b => b.active);

  const setItem = (n, k, v) => setItems(x => x.map((it, i) => i === n ? { ...it, [k]: k === 'd' ? v : Number(v) || 0 } : it));
  const pickCode = (n, code) => setItems(x => x.map((it, i) => {
    if (i !== n) return it;
    if (code === '__custom') return { code: null, d: 'Other item', q: it.q, p: it.p };
    const b = K.code(code); return { code: b.code, d: b.name, q: it.q, p: b.price };
  }));

  return (
    <Drawer title="Create invoice" sub={`${pt.first} ${pt.last} · ${pt.nhi} · ${pt.funder}`} wide onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Cancel</button><span className="spacer" />
        <button className="btn btn-secondary" onClick={() => { close(); toast('Draft saved', money(incl), 'ok'); }}>Save as draft</button>
        <button className="btn btn-primary" data-issue onClick={() => {
          const id = 'INV-' + (10490 + Math.floor(Math.random() * 40));
          if (split) {
            K.invoices.unshift({ id, pt: pt.id, cl: appt ? appt.cl : 'u1', date: '2026-09-17', due: '2026-10-01',
              payer: 'Private', status: 'sent', items: [{ d: `${items[0].d} (patient ${pct}%)`, q: 1, p: excl * pct / 100 }], paid: 0 });
            K.invoices.unshift({ id: id + 'B', pt: pt.id, cl: appt ? appt.cl : 'u1', date: '2026-09-17', due: '2026-10-01',
              payer: payer === 'Private' ? 'Southern Cross' : payer, status: 'sent',
              items: [{ d: `${items[0].d} (third party ${100 - pct}%)`, q: 1, p: excl * (100 - pct) / 100 }], paid: 0 });
          } else {
            K.invoices.unshift({ id, pt: pt.id, cl: appt ? appt.cl : 'u1', date: '2026-09-17', due: '2026-10-01',
              payer, status: 'sent', items: [...items], paid: 0 });
          }
          if (appt) appt.invoiced = true;
          close(); onDone();
          toast(split ? '2 invoices created' : 'Invoice created', `${money(incl)} · ${pt.first} ${pt.last}`, 'ok');
        }}><Send size={15} /> Create {split ? '2 invoices' : 'invoice'}</button>
      </>}>
      <div className="col g-5">
        <div className="card card-flat card-bd row g-3">
          <Avatar id={pt.id} size="lg" />
          <div className="grow"><b>{pt.first} {pt.last}</b>
            <div className="t-xs subtle">{pt.nhi} · {pt.phone || 'no phone'}</div></div>
          <FunderChip funder={pt.funder} />
        </div>
        {appt && <Banner tone="ok" icon={<Check size={15} />}>
          <span className="t-sm">Pre-filled from <b>{type.name}</b> with {K.st(appt.cl).name}.</span></Banner>}

        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className="field"><label className="label" htmlFor="invPayer">Payer</label>
            <select className="select" id="invPayer" value={payer} onChange={e => setPayer(e.target.value)}>
              {['ACC', 'Southern Cross', 'Private', 'Hospital'].map(x => <option key={x}>{x}</option>)}
            </select></div>
          <div className="field"><label className="label" htmlFor="invDue">Payment due</label>
            <input className="input" id="invDue" type="date" defaultValue="2026-10-01" /></div>
        </div>

        <div className="col g-3">
          <div className="row between"><span className="t-eyebrow">Billable items</span>
            <button className="btn btn-ghost btn-sm" onClick={() => {
              const b = active[0]; setItems(x => [...x, { code: b.code, d: b.name, q: 1, p: b.price }]);
            }}><Plus size={13} /> Add item</button></div>
          <table className="inv-lines">
            <thead><tr><th style={{ width: '38%' }}>Billable item</th><th style={{ width: '14%' }}>Code</th>
              <th className="num-cell">Qty</th><th className="num-cell">Unit price</th><th className="num-cell">Amount</th><th /></tr></thead>
            <tbody>{items.map((it, n) => (
              <tr key={n}>
                <td><select className="select" data-li={n} data-k="code" aria-label="Billable item"
                  value={it.code || '__custom'} onChange={e => pickCode(n, e.target.value)}>
                  {active.map(b => <option value={b.code} key={b.code}>{b.name}</option>)}
                  <option value="__custom">Other, describe below</option>
                </select></td>
                <td>{it.code ? <span className="t-mono t-xs">{it.code}</span> : <Nil label="No billing code" />}</td>
                <td className="num-cell" style={{ width: 68 }}>
                  <input className="input input-money" data-li={n} data-k="q" type="number" min="1" value={it.q}
                    aria-label="Quantity" onChange={e => setItem(n, 'q', e.target.value)} /></td>
                <td className="num-cell" style={{ width: 106 }}>
                  <input className="input input-money" data-li={n} data-k="p" type="number" step="0.01" value={it.p}
                    aria-label="Unit price" onChange={e => setItem(n, 'p', e.target.value)} /></td>
                <td className="num-cell"><b>{money(it.q * it.p)}</b></td>
                <td><button className="btn btn-ghost btn-icon btn-sm" aria-label="Remove line"
                  onClick={() => setItems(x => x.filter((_, i) => i !== n))}><Trash2 size={14} /></button></td>
              </tr>
            ))}</tbody>
          </table>
          <p className="hint"><RefreshCw size={12} /> Codes and prices are mastered in Xero and synced into Kora.
            last sync {fmtClock(K.XERO_SYNC)} today.</p>
        </div>

        <div className="col g-2">
          <div className="row between t-sm"><span className="muted">Subtotal (excl GST)</span><span className="num">{money(excl)}</span></div>
          <div className="row between t-sm"><span className="muted">GST 15% <span className="subtle">· GST on Income</span></span><span className="num">{money(gst)}</span></div>
          <div className="divider" />
          <div className="row between"><span className="t-h4">Total</span><span className="t-h3 num">{money(incl)}</span></div>
        </div>

        <div className="card card-flat card-bd col g-2">
          <div className="row g-2"><span className="t-eyebrow">Invoice branding</span><span className="spacer" />
            <span className="chip chip-accent">{K.org.xeroBrand}</span></div>
          <div className="t-xs muted">{K.org.legal} · GST {K.org.gst}<br />
            Payments to <span className="t-mono">{K.org.bank}</span> ({K.org.bankName})<br />{K.org.terms}</div>
        </div>

        <div className="divider" />
        <label className="row g-3">
          <Switch checked={split} onChange={setSplit} id="splitToggle" label="Split this invoice" />
          <span className="grow"><b className="t-sm">Split this invoice</b><br />
            <span className="t-xs subtle">Charge part to the patient and the rest to a third party</span></span>
        </label>

        {split && (
          <div className="col g-4">
            <div className="row between"><span className="t-eyebrow">Patient share</span>
              <span className="row g-2">
                <input className="input input-money" type="number" min="0" max="100" value={pct}
                  style={{ width: 74, height: 30 }} aria-label="Patient share percent"
                  onChange={e => setPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))} />
                <span className="t-sm muted">%</span></span></div>
            <input className="range" type="range" min="0" max="100" value={pct} aria-label="Patient share slider"
              style={{ '--pct': `${pct}%` }} onChange={e => setPct(Number(e.target.value))} />
            <div className="split-bar">
              <span className="sb-a" style={{ width: `${pct}%` }}>{pct >= 14 ? money(patientShare) : ''}</span>
              <span className="sb-b" style={{ width: `${100 - pct}%` }}>{100 - pct >= 14 ? money(incl - patientShare) : ''}</span>
            </div>
            <div className="split-viz">
              <div className="card card-flat card-bd col g-2"><span className="t-eyebrow">Invoice 1 · patient</span>
                <b className="t-h3 num">{money(patientShare)}</b>
                <span className="t-xs subtle">{pt.first} {pt.last} · due in 14 days</span></div>
              <div className="card card-flat card-bd col g-2"><span className="t-eyebrow">Invoice 2 · third party</span>
                <b className="t-h3 num">{money(incl - patientShare)}</b>
                <span className="t-xs subtle">{payer === 'Private' ? 'Southern Cross' : payer}</span></div>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}

function PayModal({ close, inv, toast, onDone }) {
  const t = invoiceTotals(inv), pt = K.pt(inv.pt);
  const [amt, setAmt] = useState(t.incl.toFixed(2));
  const [method, setMethod] = useState('EFTPOS');
  const [emailRcpt, setEmailRcpt] = useState(true);
  return (
    <Modal title="Record payment" sub={`${inv.id} · ${pt.first} ${pt.last}`} icon={<CreditCard size={15} />} tone="ok" onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Cancel</button>
        <button className="btn btn-primary" data-go onClick={() => {
          inv.status = 'paid'; inv.paid = Number(amt); close(); onDone();
          toast('Payment recorded', `${money(Number(amt))} by ${method}${emailRcpt ? ' · receipt emailed' : ''}`, 'ok');
        }}><Check size={15} /> Mark as paid</button>
      </>}>
      <div className="col g-4">
        <div className="card card-flat card-bd row between">
          <span className="col g-1"><span className="t-eyebrow">Amount due</span>
            <span className="t-metric">{money(t.incl)}</span>
            <span className="t-xs subtle">{money(t.excl)} + {money(t.gst)} GST</span></span>
          <FunderChip funder={inv.payer} />
        </div>
        <div className="field"><label className="label" htmlFor="payAmt">Amount received</label>
          <div className="input-group"><input className="input input-money" id="payAmt" type="number" step="0.01"
            value={amt} onChange={e => setAmt(e.target.value)} /><span className="affix">NZD</span></div></div>
        <div className="field"><label className="label">Method</label>
          <div className="row g-2 wrap">{['EFTPOS', 'Cash', 'Bank transfer', 'Credit card'].map(m => (
            <button key={m} className={`btn btn-sm ${method === m ? 'btn-soft' : 'btn-secondary'}`}
              onClick={() => setMethod(m)}>{m}</button>
          ))}</div></div>
        <div className="divider" />
        <label className="row g-3"><Switch checked={emailRcpt} onChange={setEmailRcpt} label="Email receipt" />
          <span className="t-sm">Email receipt to <b>{pt.email}</b></span></label>
      </div>
    </Modal>
  );
}
