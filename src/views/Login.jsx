/* Sign-in.

   A clinic sign-in is not a marketing moment. It is the first ten seconds of
   a shift, usually on a shared machine at the front desk, and the things
   someone needs to settle before they start are: who am I signed in as, which
   practice and room am I about to be in, and are the systems the clinic leans
   on actually up. So the canvas carries a systems board rather than a pitch,
   and it changes with the step instead of sitting there as wallpaper. */
import { useState, useRef, useEffect } from 'react';
import {
  User, Eye, Lock, ChevronLeft, TriangleAlert, Check, Building2, MapPin,
} from 'lucide-react';
import K from '../data/sample.js';
import { fmtLongDate, fmtTime } from '../lib/format.js';
import BrandScene from '../components/BrandScene.jsx';
import { Switch } from '../components/Primitives.jsx';
import { useUi } from '../lib/ui.jsx';

const PRACTICES = [
  { id: 'prac-1', name: 'Kora Specialists', hpi: 'ORG-G3K291', locs: ['c1', 'c2', 'c3'] },
  { id: 'prac-2', name: 'Sandycove Medical', hpi: 'ORG-B8T740', locs: ['c2'] },
];

/* What a practice manager checks before the first patient walks in. */
const SYSTEMS = [
  { name: 'Healthlink', state: 'up', note: 'last message 3 min ago' },
  { name: 'ACC gateway', state: 'up', note: 'claims submitting' },
  { name: 'NHI lookup', state: 'up', note: 'Te Whatu Ora' },
  { name: 'Xero', state: 'slow', note: 'sync running behind, 14 min' },
  { name: 'Cervical register', state: 'up', note: 'new, read only' },
];

const STEPS = [
  { id: 'creds', n: '01', label: 'Identify' },
  { id: 'mfa', n: '02', label: 'Verify' },
  { id: 'practice', n: '03', label: 'Practice' },
];

const NOW = 7 * 60 + 52;

export default function Login({ onDone }) {
  const { toast } = useUi();
  const [step, setStep] = useState('creds');
  const [user, setUser] = useState('');
  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errs, setErrs] = useState({});
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [ctx, setCtx] = useState({ practice: 'prac-1', location: 'c1' });
  const boxes = useRef([]);

  const prac = PRACTICES.find(x => x.id === ctx.practice);
  const stepIndex = STEPS.findIndex(s => s.id === step);

  useEffect(() => {
    if (!prac.locs.includes(ctx.location)) setCtx(c => ({ ...c, location: prac.locs[0] }));
  }, [ctx.practice]);

  const submitCreds = e => {
    e.preventDefault();
    const next = {};
    if (!user.trim()) next.user = 'Enter your username.';
    if (!pw) next.pw = 'Enter your password.';
    setErrs(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (pw.toLowerCase() !== 'kora') {
        const a = attempts + 1; setAttempts(a);
        const left = 5 - a;
        setErrs({ pw: left > 0
          ? `That password is not right. ${left} ${left === 1 ? 'attempt' : 'attempts'} left before the account locks.`
          : 'Account locked. Ask your practice administrator to unlock it.' });
        return;
      }
      setErrs({}); setStep('mfa');
      toast('Code sent', 'Check your authenticator app for a 6-digit code.', 'info');
      setTimeout(() => boxes.current[0]?.focus(), 60);
    }, 650);
  };

  const setDigit = (i, v) => {
    const d = v.replace(/\D/g, '').slice(0, 1);
    const next = [...code]; next[i] = d; setCode(next);
    if (d && i < 5) boxes.current[i + 1]?.focus();
    if (next.join('').length === 6) verify();
  };

  const verify = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); setStep('practice'); }, 650);
  };

  const enter = e => {
    e.preventDefault();
    const loc = K.cln(ctx.location);
    toast(`Signed in to ${prac.name}`, `${loc.short} · opening today's appointments`, 'ok');
    setTimeout(() => onDone({ practice: prac.name, location: loc.short }), 620);
  };

  return (
    <main className="auth" id="view" tabIndex={-1}>
      <BrandScene />

      <header className="auth-bar">
        <span className="auth-mark">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4v16M7 12l7.5-8M7 12l7.5 8" /></svg>
          </span>
          <b>Kora Health</b>
        </span>
        <span className="auth-when">
          <b>{fmtLongDate(K.TODAY)}</b>
          <span className="t-mono">{fmtTime(NOW)}</span>
        </span>
      </header>

      <div className="auth-stage">
        <section className="auth-panel" aria-label="Sign in">
          <ol className="auth-steps">
            {STEPS.map((s, i) => (
              <li key={s.id} data-state={i < stepIndex ? 'done' : i === stepIndex ? 'now' : 'todo'}>
                <span className="s-n">{i < stepIndex ? <Check size={11} /> : s.n}</span>
                <span className="s-l">{s.label}</span>
              </li>
            ))}
          </ol>

          {step === 'creds' && (
            <form id="stepCreds" onSubmit={submitCreds} noValidate>
              <h1>Sign in</h1>
              <p className="auth-sub">Use the account your practice administrator set up for you.</p>
              <div className="col g-4 mt-5">
                <div className="field">
                  <label className="label" htmlFor="username">Username</label>
                  <div className="input-group"><span className="ic-lead"><User size={15} /></span>
                    <input className="input" id="username" value={user} placeholder="mmadmin" autoComplete="username"
                      aria-invalid={!!errs.user} autoFocus onChange={e => setUser(e.target.value)} /></div>
                  {errs.user && <span className="err" id="userErr"><TriangleAlert size={12} /> {errs.user}</span>}
                </div>
                <div className="field">
                  <div className="row between"><label className="label" htmlFor="password">Password</label>
                    <a className="t-xs" href="#" onClick={e => { e.preventDefault(); toast('Reset link sent', 'If that account exists, a reset link is on its way.', 'ok'); }}>Forgot password?</a></div>
                  <div className="pw-wrap">
                    <input className="input" id="password" type={showPw ? 'text' : 'password'} value={pw}
                      placeholder="••••••••••••" autoComplete="current-password" aria-invalid={!!errs.pw}
                      onChange={e => setPw(e.target.value)} />
                    <button type="button" className="pw-toggle" aria-pressed={showPw}
                      aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(s => !s)}>
                      {showPw ? <Lock size={15} /> : <Eye size={15} />}</button>
                  </div>
                  {errs.pw && <span className="err" id="pwErr"><TriangleAlert size={12} /> {errs.pw}</span>}
                </div>
                <label className="row g-3 auth-remember">
                  <Switch checked={remember} onChange={setRemember} id="remember" label="Remember this device" />
                  <span className="grow"><b className="t-sm">Remember this device for 30 days</b><br />
                    <span className="t-xs subtle">Only on a clinic machine, never a shared or public one.</span></span>
                </label>
                <button className="btn btn-primary btn-lg btn-block" id="btnSignIn" type="submit" disabled={busy}>
                  {busy ? <><span className="spinner" /> Checking…</> : 'Sign in'}</button>
                <div className="or-rule"><span>or</span></div>
                <button className="btn btn-secondary btn-sso btn-block" type="button" data-sso="work"
                  onClick={() => toast('Redirecting to Microsoft', 'You will come back here once Microsoft confirms who you are.', 'info')}>
                  <span className="ms-tile" aria-hidden="true">
                    <i style={{ background: '#F25022' }} /><i style={{ background: '#7FBA00' }} />
                    <i style={{ background: '#00A4EF' }} /><i style={{ background: '#FFB900' }} />
                  </span>
                  Continue with Microsoft</button>
                <p className="auth-demo">Prototype: any username, password <b className="t-mono">kora</b></p>
              </div>
            </form>
          )}

          {step === 'mfa' && (
            <form id="stepMfa" onSubmit={e => { e.preventDefault(); verify(); }} noValidate>
              <button type="button" className="auth-back" onClick={() => setStep('creds')}>
                <ChevronLeft size={14} /> Back</button>
              <h1>Verification</h1>
              <p className="auth-sub">Enter the 6-digit code from your authenticator app for <b>{user}</b>.</p>
              <div className="col g-4 mt-5">
                <div className="field"><label className="label" htmlFor="code0">Verification code</label>
                  <div className="code-row">
                    {code.map((d, i) => (
                      <input key={i} id={`code${i}`} ref={el => (boxes.current[i] = el)} value={d}
                        className={d ? 'filled' : ''} inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
                        onChange={e => setDigit(i, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Backspace' && !d && i > 0) boxes.current[i - 1]?.focus();
                          if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus();
                          if (e.key === 'ArrowRight' && i < 5) boxes.current[i + 1]?.focus();
                        }}
                        onPaste={e => {
                          e.preventDefault();
                          const ds = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6).split('');
                          const next = [...code]; ds.forEach((x, n) => { if (n < 6) next[n] = x; });
                          setCode(next);
                          if (next.join('').length === 6) verify();
                        }} />
                    ))}
                  </div>
                  <span className="hint">Codes refresh every 30 seconds.</span>
                </div>
                <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
                  {busy ? <><span className="spinner" /> Verifying…</> : 'Verify and continue'}</button>
              </div>
            </form>
          )}

          {step === 'practice' && (
            <form id="stepPractice" onSubmit={enter} noValidate>
              <h1>Where are you today?</h1>
              <p className="auth-sub">This sets the records, calendars and billing you will see.</p>
              <div className="col g-5 mt-5">
                <div className="field"><span className="label">Practice</span>
                  <div className="col g-2" id="practiceList" role="radiogroup" aria-label="Practice">
                    {PRACTICES.map(x => (
                      <button type="button" className="ctx-option" role="radio" key={x.id}
                        aria-checked={ctx.practice === x.id} data-pick={x.id}
                        onClick={() => setCtx(c => ({ ...c, practice: x.id }))}>
                        <span className="co-ic"><Building2 size={15} /></span>
                        <span className="co-main"><b>{x.name}</b>
                          <span className="t-mono">HPI {x.hpi}</span></span>
                        <span className="co-tick"><Check size={15} /></span>
                      </button>
                    ))}
                  </div></div>
                <div className="field"><span className="label">Location</span>
                  <div className="col g-2" id="locationList" role="radiogroup" aria-label="Location">
                    {prac.locs.map(lid => { const c = K.cln(lid); return (
                      <button type="button" className="ctx-option" role="radio" key={lid}
                        aria-checked={ctx.location === lid} data-pick={lid}
                        onClick={() => setCtx(x => ({ ...x, location: lid }))}>
                        <span className="co-ic"><MapPin size={15} /></span>
                        <span className="co-main"><b>{c.short}</b><span>{c.addr}</span></span>
                        <span className="co-tick"><Check size={15} /></span>
                      </button>
                    ); })}
                  </div></div>
                <button className="btn btn-primary btn-lg btn-block" id="btnContinue" type="submit">
                  Start the day</button>
              </div>
            </form>
          )}
        </section>

        <aside className="auth-aside" aria-label="Practice status">
          {step === 'practice' ? (
            <div className="aside-practice">
              <span className="t-eyebrow">You are signing in to</span>
              <h2>{prac.name}</h2>
              <p className="t-mono t-xs">HPI {prac.hpi}</p>
              <div className="aside-locs">
                {prac.locs.map(lid => { const c = K.cln(lid); return (
                  <div className={`aside-loc ${ctx.location === lid ? 'is-on' : ''}`} key={lid}>
                    <b>{c.short}</b><span>{c.addr}</span><span className="t-mono">{c.phone}</span>
                  </div>
                ); })}
              </div>
            </div>
          ) : (
            <>
              <div className="sys-board">
                <div className="sys-head">
                  <span className="t-eyebrow">Systems</span>
                  <span className="t-mono t-2xs">checked {fmtTime(NOW - 4)}</span>
                </div>
                {SYSTEMS.map(s => (
                  <div className="sys-row" key={s.name} data-state={s.state}>
                    <i aria-hidden="true" />
                    <b>{s.name}</b>
                    <span>{s.note}</span>
                  </div>
                ))}
              </div>

              <article className="auth-notice">
                <b><TriangleAlert size={13} /> Authenticator app required from 29 April</b>
                <p>A username and password alone will no longer be enough. Set yours up now so you
                   are not locked out on the day.</p>
                <a href="#" onClick={e => e.preventDefault()}>Set up two-factor</a>
              </article>
            </>
          )}
        </aside>
      </div>

      <footer className="auth-foot">
        <p>This system holds patient health information. Access is logged against your name
           under the Health Information Privacy Code.</p>
        <span className="spacer" />
        <a href="#" onClick={e => e.preventDefault()}>IT support</a>
        <a href="#" onClick={e => e.preventDefault()}>Accessibility</a>
        <span className="t-mono t-2xs">3.0.114</span>
      </footer>
    </main>
  );
}
