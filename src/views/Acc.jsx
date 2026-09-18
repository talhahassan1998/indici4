import { useState } from 'react';
import { RefreshCw, Send, TriangleAlert, Check, Lock, Download, ShieldCheck, List, Clock } from 'lucide-react';
import K from '../data/sample.js';
import { money, fmtDate, fmtDateShort, fmtClock } from '../lib/format.js';
import { Chip, Avatar, Banner } from '../components/Primitives.jsx';
import { useUi, Modal } from '../lib/ui.jsx';

export default function Acc() {
  const { toast, open } = useUi();
  const [tab, setTab] = useState('queue');
  const [sel, setSel] = useState(new Set());
  const [, force] = useState(0);
  const [checking, setChecking] = useState(false);

  const bad = K.accQueue.filter(a => !a.valid);
  const ok = K.accQueue.filter(a => a.valid);
  const total = ok.reduce((s, a) => s + a.amount, 0);

  const fix = (row, field) => open(close => (
    <FixModal close={close} row={row} field={field} toast={toast} onDone={() => force(n => n + 1)} />
  ));

  const submit = () => open(close => {
    const batch = K.accQueue.filter(a => a.valid && (!sel.size || sel.has(a.id)));
    const value = batch.reduce((s, a) => s + a.amount, 0);
    return (
      <Modal title={`Submit ${batch.length} invoices to ACC`} sub={`${money(value)} · batch BATCH-2026-0917`}
        icon={<Send size={15} />} tone="ok" onClose={close}
        footer={<>
          <button className="btn btn-ghost" onClick={close}>Cancel</button>
          <button className="btn btn-primary" data-go onClick={() => {
            K.accHistory.unshift({ batch: 'BATCH-2026-0917', at: '2026-09-17T10:30', count: batch.length,
              total: value, accepted: batch.length, rejected: 0, status: 'Submitted' });
            batch.forEach(a => { const i = K.accQueue.indexOf(a); if (i > -1) K.accQueue.splice(i, 1); });
            setSel(new Set()); close(); force(n => n + 1);
            toast('Batch submitted', `${batch.length} invoices · ${money(value)} sent to ACC.`, 'ok');
          }}><Send size={15} /> Submit batch</button>
        </>}>
        <div className="col g-4">
          <div className="list-rows card card-flat" style={{ maxHeight: 230, overflow: 'auto' }}>
            {batch.map(a => (
              <div className="work-row" style={{ padding: '9px 14px' }} key={a.id}>
                <span className="grow t-sm"><b>{K.ptName(a.pt)}</b><br />
                  <span className="t-xs subtle t-mono">{a.inv} · {K.pt(a.pt).claim} · {a.code}</span></span>
                <span className="num t-sm">{money(a.amount)}</span></div>
            ))}
          </div>
          <div className="row between"><span className="t-h4">Batch total</span><span className="t-h3 num">{money(value)}</span></div>
          <Banner><span className="t-sm">ACC usually responds within two working days.</span></Banner>
        </div>
      </Modal>
    );
  });

  return (
    <div className="page">
      <div className="page-hd">
        <div className="page-title"><h1>ACC submissions</h1>
          <span className="page-sub">Validated against ACC business rules before they leave Kora</span></div>
        <div className="page-actions">
          <span className={`sync-pill ${bad.length ? 'off' : ''}`}><ShieldCheck size={13} /> ACC gateway {bad.length ? 'blocked' : 'ready'}</span>
          <button className="btn btn-secondary btn-sm" data-act="revalidate" disabled={checking}
            onClick={() => { setChecking(true); setTimeout(() => { setChecking(false);
              toast('Validation complete', `${K.accQueue.filter(a => !a.valid).length} rows still need attention.`,
                K.accQueue.some(a => !a.valid) ? 'warn' : 'ok'); }, 800); }}>
            {checking ? <><span className="spinner" /> Checking…</> : <><RefreshCw size={14} /> Re-validate all</>}</button>
          <button className="btn btn-primary btn-sm" data-act="submit" disabled={!ok.length} onClick={submit}>
            <Send size={14} /> Submit {sel.size || ok.length} invoices</button>
        </div>
      </div>

      {bad.length ? (
        <Banner tone="bad" icon={<TriangleAlert size={17} />}>
          <b>{bad.length} submissions will be rejected as they are</b><br />
          <span className="t-sm">Each one is missing something ACC requires. Use <b>Fix now</b> to jump straight to the field.
          fixing a patient record usually clears more than one row.</span>
        </Banner>
      ) : (
        <Banner tone="ok" icon={<Check size={17} />}>
          <b>Everything validates</b><br />
          <span className="t-sm">{ok.length} invoices totalling {money(total)} are ready to send to ACC.</span>
        </Banner>
      )}

      <div className="tabs mt-4 mb-4" role="tablist">
        <button role="tab" aria-selected={tab === 'queue'} onClick={() => setTab('queue')}>
          <List size={15} /> Ready to submit <span className="badge-count quiet">{K.accQueue.length}</span></button>
        <button role="tab" aria-selected={tab === 'history'} onClick={() => setTab('history')}>
          <Clock size={15} /> Submission history</button>
      </div>

      {tab === 'queue' ? (
        <section className="card">
          <div className="card-hd"><h3>Invoices awaiting submission</h3><span className="spacer" />
            {sel.size > 0 && <span className="chip chip-accent">{sel.size} selected</span>}
            <button className="btn btn-ghost btn-sm" onClick={() =>
              setSel(s => s.size === ok.length ? new Set() : new Set(ok.map(a => a.id)))}>
              {sel.size === ok.length && ok.length ? 'Clear selection' : 'Select all valid'}</button></div>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th style={{ width: 38 }} /><th>Submission</th><th>Patient</th><th>Claim</th>
              <th>Service date</th><th>Code</th><th className="num-cell">Amount</th><th>Validation</th></tr></thead>
            <tbody>{K.accQueue.map(a => { const p = K.pt(a.pt); return (
              <tr key={a.id} className={a.valid ? '' : 'row-err'}>
                <td>{a.valid ? (
                  <span className="check" role="checkbox" tabIndex={0} aria-checked={sel.has(a.id)}
                    aria-label={`Select ${a.id}`} onClick={() => setSel(s => {
                      const n = new Set(s); n.has(a.id) ? n.delete(a.id) : n.add(a.id); return n; })}>
                    <Check size={11} /></span>
                ) : <span className="tip" data-tip="Cannot be submitted yet" style={{ color: 'var(--bad-fg)' }}><Lock size={15} /></span>}</td>
                <td className="t-mono t-sm"><b>{a.id}</b><br /><span className="t-xs subtle">{a.inv}</span></td>
                <td><span className="row g-2"><Avatar id={p.id} size="xs" />
                  <span className="t-sm">{p.first} {p.last}<br /><span className="t-xs subtle t-mono">{p.nhi}</span></span></span></td>
                <td className="t-mono t-sm">{p.claim || <span className="bad-t">missing</span>}</td>
                <td className="t-sm">{fmtDateShort(a.svc)}</td>
                <td className="t-mono t-sm">{a.code}</td>
                <td className="num-cell"><b>{money(a.amount)}</b></td>
                <td style={{ minWidth: 300 }}>
                  {a.valid ? <Chip status="approved" label="Passes ACC checks" /> : (
                    <div className="col g-2">{a.errors.map(er => (
                      <div className="row g-2 t-sm" style={{ color: 'var(--bad-fg)' }} key={er.field}>
                        <TriangleAlert size={14} />
                        <span className="grow"><b>{er.label}</b><br />
                          <span className="t-xs" style={{ color: 'var(--text-muted)' }}>{er.fix}</span></span>
                        <button className="btn btn-danger btn-sm" data-fix onClick={() => fix(a, er.field)}>Fix now</button>
                      </div>
                    ))}</div>
                  )}
                </td>
              </tr>
            ); })}</tbody>
          </table></div>
          <div className="card-ft row g-3">
            <span className="t-sm muted">{ok.length} of {K.accQueue.length} ready · {money(total)}</span>
            <span className="spacer" />
            <span className="t-xs subtle">ACC pays approved submissions on the 20th of the following month.</span>
          </div>
        </section>
      ) : (
        <section className="card">
          <div className="card-hd"><h3>Submission history</h3><span className="spacer" />
            <button className="btn btn-ghost btn-sm"><Download size={14} /> Export remittances</button></div>
          <div className="table-wrap"><table className="tbl">
            <thead><tr><th>Batch</th><th>Submitted</th><th className="num-cell">Invoices</th>
              <th className="num-cell">Value</th><th className="num-cell">Accepted</th>
              <th className="num-cell">Rejected</th><th>Status</th></tr></thead>
            <tbody>{K.accHistory.map(b => (
              <tr key={b.batch}><td className="t-mono t-sm"><b>{b.batch}</b></td>
                <td className="t-sm">{fmtDate(b.at.slice(0, 10))}<br /><span className="t-xs subtle">{fmtClock(b.at)}</span></td>
                <td className="num-cell">{b.count}</td><td className="num-cell"><b>{money(b.total)}</b></td>
                <td className="num-cell ok-t">{b.accepted}</td>
                <td className={`num-cell ${b.rejected ? 'bad-t' : 'subtle'}`}>{b.rejected}</td>
                <td><Chip status={b.rejected ? 'pending' : 'paid'} label={b.status} /></td></tr>
            ))}</tbody>
          </table></div>
        </section>
      )}
    </div>
  );
}

function FixModal({ close, row, field, toast, onDone }) {
  const p = K.pt(row.pt);
  const isClaim = field === 'claim', isProvider = field === 'provider';
  const [v, setV] = useState(isClaim ? (p.claim || '') : isProvider ? '' : '2026-07-28');
  return (
    <Modal title={isProvider ? 'Add ACC provider ID' : isClaim ? 'Check the claim number' : 'Add date of injury'}
      sub={`${p.first} ${p.last} · ${row.id}`} icon={<ShieldCheck size={15} />} tone="bad" onClose={close}
      footer={<>
        <button className="btn btn-ghost" onClick={close}>Cancel</button>
        <button className="btn btn-primary" data-go onClick={() => {
          if (!v) { toast('Still empty', 'ACC needs a value here before submitting.', 'warn'); return; }
          const clear = (a, f) => { a.errors = a.errors.filter(e => e.field !== f); a.valid = a.errors.length === 0; };
          if (field === 'injury') { p.injury = v; K.accQueue.forEach(a => { if (a.pt === p.id) clear(a, 'injury'); }); }
          if (field === 'claim') { p.claim = v; K.accQueue.forEach(a => { if (a.pt === p.id) clear(a, 'claim'); }); }
          if (field === 'provider') { K.st(row.cl).accId = v; K.accQueue.forEach(a => { if (a.cl === row.cl) clear(a, 'provider'); }); }
          close(); onDone();
          toast('Fixed', `${K.accQueue.filter(a => a.valid).length} submissions now pass validation.`, 'ok');
        }}><Check size={15} /> Save and re-validate</button>
      </>}>
      <div className="col g-4">
        <Banner tone="warn"><span className="t-sm">
          {isProvider ? 'ACC matches every submission to a registered provider. Without this ID the whole batch is held.'
            : isClaim ? 'ACC did not recognise this claim number. Check it against the ACC45.'
            : 'ACC rejects invoices without an injury date. Adding it here fixes every queued row for this patient.'}
        </span></Banner>
        <div className="field">
          <label className="label" htmlFor="fx">
            {isProvider ? `ACC provider ID for ${K.st(row.cl).name}` : isClaim ? 'Claim number' : 'Date of injury'}</label>
          <input className={`input ${isProvider || isClaim ? 't-mono' : ''}`} id="fx"
            type={isProvider || isClaim ? 'text' : 'date'} value={v} onChange={e => setV(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
