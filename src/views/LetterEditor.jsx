import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, LayoutTemplate, ChevronDown, Plus, X, Sparkles, Mic, MicOff, Printer,
  Download, Send, Check, TriangleAlert, RefreshCw, Link2,
} from 'lucide-react';
import K from '../data/sample.js';
import { fmtDate, age } from '../lib/format.js';
import { Chip, Banner } from '../components/Primitives.jsx';
import { useUi, Modal, Menu, useAutosave, SavedIndicator } from '../lib/ui.jsx';

export default function LetterEditor() {
  const { id } = useParams();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const { toast, open } = useUi();
  const existing = id && id !== 'new' ? K.ltr(id) : null;
  const pt = existing ? K.pt(existing.pt) : (sp.get('pt') ? K.pt(sp.get('pt')) : K.pt('p1'));
  const cl = existing ? K.st(existing.cl) : K.st('u1');

  const [title, setTitle] = useState(existing ? existing.title : 'Initial specialist assessment');
  const [status, setStatus] = useState(existing ? existing.status : 'draft');
  const [to, setTo] = useState(existing ? K.gp(existing.to) : K.gp(pt.gp));
  const [cc, setCc] = useState(existing ? [...existing.cc] : (pt.funder === 'ACC' ? ['ACC'] : []));
  const [channel, setChannel] = useState(existing ? existing.channel : 'Healthlink');
  const [body, setBody] = useState(() => starter(pt));
  const [aiOpen, setAiOpen] = useState(true);
  const [rec, setRec] = useState(false);
  const [secs, setSecs] = useState(0);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [menu, setMenu] = useState(null);
  const [saveState, bump] = useAutosave();
  const docRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => {
    if (!rec) return;
    timer.current = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [rec]);

  const insert = html => {
    const el = docRef.current;
    el.focus();
    document.execCommand('insertHTML', false, html);
    setBody(el.innerHTML); bump();
  };

  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');

  return (
    <div className={`ed-shell ${aiOpen ? 'with-ai' : ''}`}>
      <section className="ed-pane">
        <div className="ed-bar">
          <button className="btn btn-ghost btn-icon btn-sm" onClick={() => nav('/letters')} aria-label="Back to letters"><ChevronLeft size={16} /></button>
          <div className="grow" style={{ minWidth: 0 }}>
            <input className="input" id="letterTitle" value={title} aria-label="Letter title"
              style={{ border: 0, background: 'none', fontWeight: 700, fontSize: 'var(--fs-md)', padding: '2px 4px' }}
              onChange={e => { setTitle(e.target.value); bump(); }} />
            <a className="t-xs" style={{ paddingLeft: 5 }} href={`#/patient/${pt.id}`}>{pt.first} {pt.last} · {pt.nhi} · {age(pt.dob)}y</a>
          </div>
          <Chip status={status} />
          <SavedIndicator state={saveState} />
        </div>

        <div className="ed-bar" style={{ borderBottom: '1px solid var(--line-faint)' }}>
          <button className="btn btn-secondary btn-sm" data-act="template" onClick={e => setMenu({ anchor: e.currentTarget, items: [
            { heading: 'Pinned templates' },
            ...K.letterTemplates.filter(t => t.pinned).map(t => ({
              label: t.name, icon: <LayoutTemplate size={15} />,
              action: () => open(close => <TemplateModal close={close} tpl={t} onInsert={insert} toast={toast} />),
            })),
          ]})}><LayoutTemplate size={14} /> Insert template <ChevronDown size={13} /></button>
          <div className="divider-v" style={{ height: 20 }} />
          {[['bold', <b key="b" style={{ fontSize: 13 }}>B</b>], ['italic', <i key="i" style={{ fontSize: 13 }}>I</i>]].map(([cmd, node]) => (
            <button className="btn btn-ghost btn-icon btn-sm" key={cmd} aria-label={cmd}
              onClick={() => { document.execCommand(cmd); docRef.current.focus(); setBody(docRef.current.innerHTML); bump(); }}>{node}</button>
          ))}
          <div className="divider-v" style={{ height: 20 }} />
          <button className="btn btn-ghost btn-sm" onClick={e => setMenu({ anchor: e.currentTarget, items: [
            { heading: 'Insert merge field' },
            ...[['Patient name', `${pt.first} ${pt.last}`], ['NHI', pt.nhi], ['Date of birth', fmtDate(pt.dob)],
                ['ACC claim', pt.claim || 'not recorded'], ['Today’s date', fmtDate(K.TODAY)]].map(([l, v]) => ({
              label: l, icon: <Plus size={15} />, action: () => insert(`<span class="merge">${v}</span> `),
            })),
          ]})}><Plus size={13} /> Merge field</button>
          <span className="spacer" />
          {!aiOpen && <button className="btn btn-warm btn-sm" onClick={() => setAiOpen(true)}><Sparkles size={14} /> AI scribe</button>}
        </div>

        <div className="ed-recipients">
          <div className="recip-row"><span className="label">To</span>
            <div className="recip-chips">
              <span className="chip chip-accent chip-lg chip-removable">{to.name} · {to.practice}</span>
              <button className="btn btn-ghost btn-sm" data-act="pickto" onClick={e => setMenu({ anchor: e.currentTarget, items: [
                { heading: 'Suggested from the patient record' },
                ...K.gps.map(g => ({ label: `${g.name} · ${g.practice}`, icon: <Check size={15} />,
                  action: () => { setTo(g); bump(); toast('Recipient changed', g.practice, 'ok'); } })),
              ]})}><ChevronDown size={13} /> Change</button>
            </div></div>
          <div className="recip-row"><span className="label">CC</span>
            <div className="recip-chips">
              {cc.map(c => (
                <span className="chip chip-lg chip-removable" key={c}>{c}
                  <button className="x" aria-label={`Remove ${c}`} onClick={() => { setCc(x => x.filter(y => y !== c)); bump(); }}><X size={11} /></button></span>
              ))}
              <button className="btn btn-ghost btn-sm" onClick={e => setMenu({ anchor: e.currentTarget, items: [
                { heading: 'Add a CC recipient' },
                ...['ACC', 'Southern Cross', 'Patient', 'Physiotherapist'].filter(x => !cc.includes(x))
                  .map(x => ({ label: x, icon: <Plus size={15} />, action: () => { setCc(c => [...c, x]); bump(); } })),
              ]})}><Plus size={13} /> Add CC</button>
            </div></div>
          <div className="recip-row"><span className="label">Send via</span>
            <div className="recip-chips">
              {['Healthlink', 'Email', 'Print'].map(c => (
                <button className={`chip chip-lg ${channel === c ? 'chip-accent' : ''}`} key={c} data-ch={c}
                  onClick={() => { setChannel(c); bump(); }}>{c}</button>
              ))}
            </div></div>
        </div>

        <div className="ed-body">
          <div className="ed-doc" id="edDoc" ref={docRef} contentEditable role="textbox" aria-multiline="true"
            aria-label="Letter body" suppressContentEditableWarning
            onInput={e => { setBody(e.currentTarget.innerHTML); bump(); }}
            dangerouslySetInnerHTML={{ __html: body }} />
        </div>

        <div className="ed-bar" style={{ borderTop: '1px solid var(--line)', borderBottom: 0 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => { bump(); toast('Draft saved', title, 'ok'); }}><Check size={14} /> Save draft</button>
          <span className="spacer" />
          <button className="btn btn-secondary btn-sm" data-act="submit" onClick={() => {
            setStatus('pending'); toast('Sent for approval', `${cl.name} will be notified.`, 'ok');
          }}><Send size={14} /> Submit for approval</button>
          <button className="btn btn-primary btn-sm" onClick={() => open(close => (
            <Modal title="Approve and send" sub={`${title} · ${pt.first} ${pt.last}`} icon={<Check size={15} />} tone="ok" onClose={close}
              footer={<><button className="btn btn-ghost" onClick={close}>Not yet</button>
                <button className="btn btn-primary" onClick={() => { setStatus('sent'); close();
                  toast('Letter sent', `Delivered to ${to.practice} via ${channel}.`, 'ok'); }}>
                  <Send size={15} /> Approve and send via {channel}</button></>}>
              <div className="col g-4">
                <div className="card card-flat card-bd col g-3">
                  <div className="row between"><span className="t-eyebrow">To</span><span className="t-sm"><b>{to.name}</b> · {to.practice}</span></div>
                  <div className="row between"><span className="t-eyebrow">Channel</span><span className="t-sm">{channel}</span></div>
                  <div className="row between"><span className="t-eyebrow">Signed by</span><span className="t-sm">{cl.name} · MCNZ {cl.mcnz}</span></div>
                </div>
              </div>
            </Modal>
          ))}><Check size={14} /> Approve &amp; send</button>
        </div>
      </section>

      <section className="ed-pane preview">
        <div className="ed-bar">
          <span className="t-eyebrow">Live preview</span><span className="chip">A4 · Kora letterhead</span>
          <span className="spacer" />
          <button className="btn btn-ghost btn-icon btn-sm tip" data-tip="Print" aria-label="Print" onClick={() => window.print()}><Printer size={15} /></button>
          <button className="btn btn-ghost btn-icon btn-sm tip" data-tip="Download PDF" aria-label="Download PDF"><Download size={15} /></button>
        </div>
        <div className="ed-preview-scroll">
          <article className="pdf-page" aria-label="Letter preview">
            <div className="pdf-brand">
              <div><h3>Kora Health</h3>
                <div style={{ fontSize: 13, color: '#4E5852', letterSpacing: '.06em', textTransform: 'uppercase', fontWeight: 700 }}>Specialist Clinic</div></div>
              <div className="pdf-org">{K.clinics[0].addr}<br />{K.org.phone} · {K.org.email}<br />GST {K.org.gst}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 22, fontSize: 11.5 }}>
              <div><b>{to.name}</b><br />{to.practice}<br />{to.email}</div>
              <div style={{ textAlign: 'right' }}>{fmtDate(K.TODAY)}<br />{cc.length ? `CC: ${cc.join(', ')}` : ''}</div>
            </div>
            <div id="pdfBody" dangerouslySetInnerHTML={{ __html: body }} />
            <div className="pdf-sig">
              <div className="sig-mark">{cl.signature || cl.name}</div>
              <div style={{ fontSize: 11, marginTop: 6 }}><b>{cl.name}</b><br />{cl.spec}<br />MCNZ {cl.mcnz} · HPI {cl.hpi}</div>
            </div>
            <div className="pdf-ft"><span>{pt.first} {pt.last} · NHI {pt.nhi}</span><span>Page 1 of 1</span></div>
          </article>
        </div>
      </section>

      {aiOpen && (
        <aside className="ai-panel" aria-label="AI scribe">
          <div className="ai-hd row g-2">
            <span className="stat-ic" style={{ background: 'var(--warm-soft)', color: 'var(--warm-text)' }}><Sparkles size={15} /></span>
            <div className="grow"><b className="t-sm">AI scribe</b><br /><span className="t-xs subtle">Draft from your consultation</span></div>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setAiOpen(false)} aria-label="Hide AI scribe"><X size={15} /></button>
          </div>
          <div className="drawer-bd col g-4">
            <div className={`mic-state ${rec ? 'recording' : 'off'}`} role="status">
              <span className="mic-dot" />
              <span className="t-sm"><b>{rec ? 'Recording' : 'Microphone ready'}</b><br />
                <span className="t-xs subtle">Yeti Nano · {rec ? 'input good' : 'muted'}</span></span>
              {rec && <span className="wave" aria-hidden="true">
                {[8, 14, 6, 18, 11, 16, 9, 13].map((h, i) => (
                  <i key={i} style={{ height: h, animationDelay: `${i * .09}s` }} />))}</span>}
              <span className="mic-timer">{mm}:{ss}</span>
            </div>
            {rec ? (
              <button className="btn btn-danger btn-block" data-act="stop" onClick={() => {
                setRec(false); if (secs < 3) setSecs(134);
                toast('Recording stopped', 'Ready to generate.', 'ok');
              }}><MicOff size={15} /> Stop recording</button>
            ) : (
              <button className="btn btn-primary btn-block" data-act="start" onClick={() => { setRec(true); setSecs(0);
                toast('Recording started', 'The patient has been told a scribe is in use.', 'ok'); }}>
                <Mic size={15} /> Start recording</button>
            )}
            <div className="field"><label className="label" htmlFor="aiTpl">Draft using template</label>
              <select className="select" id="aiTpl">{K.letterTemplates.map(t => <option key={t.id}>{t.name}</option>)}</select></div>
            <button className="btn btn-warm btn-block" data-act="generate" disabled={secs < 3 && !draft || busy}
              onClick={() => { setBusy(true); setTimeout(() => { setBusy(false); setDraft(aiDraft(pt));
                toast('Draft ready', 'Review carefully before inserting.', 'info'); }, 900); }}>
              {busy ? <><span className="spinner" /> Generating…</> : <><Sparkles size={15} /> Generate draft</>}</button>
            {secs < 3 && !draft && <span className="hint">Record at least a few seconds to generate.</span>}
            {draft && (
              <>
                <div className="ai-flag"><TriangleAlert size={14} /> AI draft. Review before use</div>
                <div className="ai-draft" dangerouslySetInnerHTML={{ __html: draft }} />
                <div className="row g-2">
                  <button className="btn btn-primary grow" data-act="insert" onClick={() => {
                    insert(`<hr>${draft}`); toast('Draft inserted', 'Marked as AI-assisted on the audit trail.', 'ok');
                  }}><Download size={14} /> Insert into letter</button>
                  <button className="btn btn-secondary btn-icon" aria-label="Regenerate" onClick={() => setDraft(aiDraft(pt))}><RefreshCw size={15} /></button>
                </div>
                <p className="t-xs subtle">The recording is deleted once the letter is approved.</p>
              </>
            )}
          </div>
        </aside>
      )}
      {menu && <Menu anchor={menu.anchor} items={menu.items} onClose={() => setMenu(null)} />}
    </div>
  );
}

function starter(p) {
  return `<p>Dear ${K.gp(p.gp).name},</p>
    <p><b>Re: ${p.first} ${p.last}, NHI <span class="merge">${p.nhi}</span>, DOB <span class="merge">${fmtDate(p.dob)}</span></b></p>
    <p>Thank you for referring this ${age(p.dob)} year old ${p.sex === 'F' ? 'woman' : 'man'}, whom I saw today.</p>
    <p><i>Start typing, insert a template, or use the AI scribe to draft from your consultation recording.</i></p>`;
}

function aiDraft(p) {
  return `<h2>History</h2><p>${p.first} reports ongoing pain since the injury, with mechanical locking and
    episodes of giving way. Simple analgesia gives partial relief. No red flags.</p>
    <h2>Examination</h2><p>Antalgic gait. Small effusion. Range of movement 0–120 degrees. Medial joint line
    tenderness. McMurray’s positive medially.</p>
    <h2>Impression</h2><p>Likely medial meniscal tear.</p>
    <h2>Plan</h2><p>MRI, review with result in four weeks. Continue physiotherapy. ACC45 updated today.</p>`;
}

function TemplateModal({ close, tpl, onInsert, toast }) {
  const [vals, setVals] = useState({});
  if (!tpl.fields.length) {
    onInsert(`<h2>${tpl.name}</h2><p>…</p>`); close();
    toast('Template inserted', tpl.name, 'ok');
    return null;
  }
  return (
    <Modal title={tpl.name} sub="Fill these in and the template writes itself into the letter"
      icon={<LayoutTemplate size={15} />} onClose={close}
      footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button>
        <button className="btn btn-primary" data-ins onClick={() => {
          const rows = tpl.fields.map(f => `<b>${f.label}:</b> <span class="merge">${vals[f.k] || 'not recorded'}</span>`);
          onInsert(`<h2>${tpl.name}</h2><p>${rows.join('<br>')}</p>`);
          close(); toast('Template inserted', tpl.name, 'ok');
        }}><Plus size={15} /> Insert into letter</button></>}>
      <div className="col g-4">
        {tpl.fields.map(f => (
          <div className="field" key={f.k}>
            <label className="label" htmlFor={`tf-${f.k}`}>{f.label}</label>
            {f.type === 'select'
              ? <select className="select" id={`tf-${f.k}`} onChange={e => setVals(v => ({ ...v, [f.k]: e.target.value }))}>
                  {f.opts.map(o => <option key={o}>{o}</option>)}</select>
              : <input className="input" id={`tf-${f.k}`} type={f.type === 'date' ? 'date' : 'text'}
                  defaultValue={f.type === 'date' ? '2026-07-28' : ''} placeholder={f.label}
                  onChange={e => setVals(v => ({ ...v, [f.k]: e.target.value }))} />}
          </div>
        ))}
      </div>
    </Modal>
  );
}
