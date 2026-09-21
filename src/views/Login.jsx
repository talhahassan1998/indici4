/* Sign-in.

   Two panels: the form on a light ground, the brand on green. Most of the
   people who sign in here are over fifty and doing it at 7.50am on a shared
   machine at the front desk, so the type runs a step larger than the app's,
   the controls are taller, and there is one thing to do per screen. */
import { useState, useRef, useEffect } from 'react';
import {
  User, Eye, Lock, ChevronLeft, TriangleAlert, Check, Building2, MapPin, LifeBuoy,
} from 'lucide-react';
import K from '../data/sample.js';
import BrandScene from '../components/BrandScene.jsx';
import ClinicIllustration from '../components/ClinicIllustration.jsx';
import { Switch } from '../components/Primitives.jsx';
import { useUi } from '../lib/ui.jsx';

/* Test accounts. One per role, so the prototype can be opened as any of the
   four people the app is designed around, and the role follows you in. */
export const TEST_PASSWORD = 'kora2026';
export const ACCOUNTS = [
  { u: 'afenwick',  role: 'clinician', name: 'Dr Alice Fenwick', job: 'Clinician' },
  { u: 'mhopa',     role: 'reception', name: 'Mereana Hopa',     job: 'Reception' },
  { u: 'jpetersen', role: 'typist',    name: 'Josh Petersen',    job: 'Typist' },
  { u: 'lbeckett',  role: 'manager',   name: 'Lorraine Beckett', job: 'Manager' },
];

const PRACTICES = [
  { id: 'prac-1', name: 'Kora Specialists', hpi: 'ORG-G3K291', locs: ['c1', 'c2', 'c3'] },
  { id: 'prac-2', name: 'Sandycove Medical', hpi: 'ORG-B8T740', locs: ['c2'] },
];

const STEPS = [
  { id: 'creds', n: '1', label: 'Sign in' },
  { id: 'mfa', n: '2', label: 'Verify' },
  { id: 'practice', n: '3', label: 'Practice' },
];

export default function Login({ onDone }) {
  const { toast } = useUi();
  const [step, setStep] = useState('creds');
  const [user, setUser] = useState(ACCOUNTS[0].u);
  const [pw, setPw] = useState(TEST_PASSWORD);
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [errs, setErrs] = useState({});
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [ctx, setCtx] = useState({ practice: 'prac-1', location: 'c1' });
  const [acct, setAcct] = useState(ACCOUNTS[0]);
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
    const account = ACCOUNTS.find(a => a.u === user.trim().toLowerCase());
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      if (!account) {
        setErrs({ user: 'No account with that username. Pick one from the list below.' });
        return;
      }
      if (pw !== TEST_PASSWORD) {
        const a = attempts + 1; setAttempts(a);
        const left = 5 - a;
        setErrs({ pw: left > 0
          ? `That password is not right. ${left} ${left === 1 ? 'attempt' : 'attempts'} left before the account locks.`
          : 'Account locked. Ask your practice administrator to unlock it.' });
        return;
      }
      setErrs({}); setAcct(account); setStep('mfa');
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
    toast(`Signed in as ${acct.name}`, `${prac.name} · ${loc.short} · opening today's appointments`, 'ok');
    setTimeout(() => onDone({ role: acct.role, practice: prac.name, location: loc.short }), 620);
  };

  return (
    <main className="auth" id="view" tabIndex={-1}>
      {/* ------------------------------------------------------ left: form */}
      <div className="auth-form">
        <span className="auth-mark">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4v16M7 12l7.5-8M7 12l7.5 8" /></svg>
          </span>
          <b>Kora Health</b>
        </span>

        <div className="auth-body auth-panel">
          <ol className="auth-steps">
            {STEPS.map((s, i) => (
              <li key={s.id} data-state={i < stepIndex ? 'done' : i === stepIndex ? 'now' : 'todo'}>
                <span className="s-n">{i < stepIndex ? <Check size={13} /> : s.n}</span>
                <span className="s-l">{s.label}</span>
              </li>
            ))}
          </ol>

          {step === 'creds' && (
            <form id="stepCreds" onSubmit={submitCreds} noValidate className="auth-fields">
              <div>
                <h1>Sign in</h1>
                <p className="auth-sub">Use the account your practice administrator set up for you.</p>
              </div>

              <div className="field">
                <label className="label" htmlFor="username">Username</label>
                <div className="input-group"><span className="ic-lead"><User size={18} /></span>
                  <input className="input" id="username" value={user} placeholder="afenwick" autoComplete="username"
                    aria-invalid={!!errs.user} autoFocus onChange={e => setUser(e.target.value)} /></div>
                {errs.user && <span className="err" id="userErr"><TriangleAlert size={14} /> {errs.user}</span>}
              </div>

              <div className="field">
                <label className="label" htmlFor="password">Password</label>
                <div className="pw-wrap">
                  <input className="input" id="password" type={showPw ? 'text' : 'password'} value={pw}
                    placeholder="Your password" autoComplete="current-password" aria-invalid={!!errs.pw}
                    onChange={e => setPw(e.target.value)} />
                  <button type="button" className="pw-toggle" aria-pressed={showPw}
                    aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw(s => !s)}>
                    {showPw ? <Lock size={18} /> : <Eye size={18} />}</button>
                </div>
                {errs.pw && <span className="err" id="pwErr"><TriangleAlert size={14} /> {errs.pw}</span>}
              </div>

              <div className="auth-row">
                <label htmlFor="remember">
                  <Switch checked={remember} onChange={setRemember} id="remember" label="Remember this device" />
                  Remember this device
                </label>
                <a href="#" onClick={e => { e.preventDefault(); toast('Reset link sent', 'If that account exists, a reset link is on its way.', 'ok'); }}>Forgot password?</a>
              </div>

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

              <div className="acct-board">
                <div className="acct-head">
                  <b>Test accounts</b>
                  <span>password {TEST_PASSWORD}</span>
                </div>
                {ACCOUNTS.map(a => (
                  <button type="button" key={a.u}
                    className={`acct-row ${user.trim().toLowerCase() === a.u ? 'is-on' : ''}`}
                    onClick={() => { setUser(a.u); setPw(TEST_PASSWORD); setErrs({}); }}>
                    <span className="a-u">{a.u}</span>
                    <span>{a.name}</span>
                    <span className="a-job">{a.job}</span>
                  </button>
                ))}
              </div>
            </form>
          )}

          {step === 'mfa' && (
            <form id="stepMfa" onSubmit={e => { e.preventDefault(); verify(); }} noValidate className="auth-fields">
              <div>
                <button type="button" className="auth-back" onClick={() => setStep('creds')}>
                  <ChevronLeft size={16} /> Back</button>
                <h1>Verification</h1>
                <p className="auth-sub">Enter the 6-digit code from your authenticator app for <b>{acct.name}</b>.</p>
              </div>

              <div className="field">
                <label className="label" htmlFor="code0">Verification code</label>
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
                <span className="hint">The code changes every 30 seconds. Any six digits will do here.</span>
              </div>

              <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
                {busy ? <><span className="spinner" /> Verifying…</> : 'Verify and continue'}</button>
            </form>
          )}

          {step === 'practice' && (
            <form id="stepPractice" onSubmit={enter} noValidate className="auth-fields">
              <div>
                <h1>Where are you today?</h1>
                <p className="auth-sub">This sets the records, calendars and billing you will see.</p>
              </div>

              <div className="field">
                <span className="label">Practice</span>
                <div id="practiceList" role="radiogroup" aria-label="Practice">
                  {PRACTICES.map(x => (
                    <button type="button" className="ctx-option" role="radio" key={x.id}
                      aria-checked={ctx.practice === x.id} data-pick={x.id}
                      onClick={() => setCtx(c => ({ ...c, practice: x.id }))}>
                      <span className="co-ic"><Building2 size={18} /></span>
                      <span className="co-main"><b>{x.name}</b><span>HPI {x.hpi}</span></span>
                      <span className="co-tick"><Check size={20} /></span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span className="label">Location</span>
                <div id="locationList" role="radiogroup" aria-label="Location">
                  {prac.locs.map(lid => { const c = K.cln(lid); return (
                    <button type="button" className="ctx-option" role="radio" key={lid}
                      aria-checked={ctx.location === lid} data-pick={lid}
                      onClick={() => setCtx(x => ({ ...x, location: lid }))}>
                      <span className="co-ic"><MapPin size={18} /></span>
                      <span className="co-main"><b>{c.short}</b><span>{c.addr}</span></span>
                      <span className="co-tick"><Check size={20} /></span>
                    </button>
                  ); })}
                </div>
              </div>

              <button className="btn btn-primary btn-lg btn-block" id="btnContinue" type="submit">
                Start the day</button>
            </form>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------- right: brand */}
      <aside className="auth-brand">
        <BrandScene />

        <a className="brand-help" href="#" onClick={e => { e.preventDefault(); toast('IT support', 'Weekdays 7am to 6pm · 0800 567 200', 'info'); }}>
          <LifeBuoy size={18} /> Support
        </a>

        <div className="brand-body">
          <ClinicIllustration />
          <div className="brand-note">
            <h2>The whole clinic day, in one place</h2>
            <p>Bookings, the patient record, letters and billing all sit together,
               so nothing has to be typed twice.</p>
          </div>
        </div>

        <p className="brand-strip">
          <TriangleAlert size={18} />
          <span>Authenticator app required from 29 April.
            {' '}<a href="#" onClick={e => { e.preventDefault(); toast('Set up two-factor', 'Your administrator can walk you through it.', 'info'); }}>Set it up</a></span>
        </p>
      </aside>
    </main>
  );
}
