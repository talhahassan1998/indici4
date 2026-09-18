import { useState, useRef, useEffect } from 'react';
import { User, Eye, Lock, ChevronLeft, TriangleAlert, Check, Moon, Sun } from 'lucide-react';
import K from '../data/sample.js';
import BrandScene from '../components/BrandScene.jsx';
import { Avatar, Switch } from '../components/Primitives.jsx';
import { useUi } from '../lib/ui.jsx';
import { useTheme } from '../lib/theme.js';

const PRACTICES = [
  { id: 'prac-1', name: 'Kora Specialists', meta: 'HPI ORG-G3K291 · 3 locations', locs: ['c1', 'c2', 'c3'] },
  { id: 'prac-2', name: 'Sandycove Medical', meta: 'HPI ORG-B8T740 · 1 location', locs: ['c2'] },
];

export default function Login() {
  const { toast } = useUi();
  const [theme, toggleTheme] = useTheme();
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
  useEffect(() => { if (!prac.locs.includes(ctx.location)) setCtx(c => ({ ...c, location: prac.locs[0] })); }, [ctx.practice]);

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
    if (next.join('').length === 6) verify(next.join(''));
  };

  const verify = value => {
    setBusy(true);
    setTimeout(() => { setBusy(false); setStep('practice'); }, 650);
  };

  return (
    <main className="auth">
      <section className="auth-brand">
        <BrandScene />
        <div className="auth-wordmark">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 4v16M7 12l7.5-8M7 12l7.5 8" /></svg>
          </span>
          <span><b>Kora Health</b><span>Practice Management</span></span>
        </div>

        <div className="auth-pitch"><h1>The clinic day, in one place.</h1></div>

        <div className="notice-stack" aria-label="Notices">
          <article className="notice is-alert">
            <div className="n-head"><b>Authenticator app required from 29 April</b></div>
            <p>A username and password alone will no longer be enough. Set up your authenticator
               now so you are not locked out on the day.</p>
            <div className="n-links"><a href="#">Set up two-factor</a><a href="#">What changes</a></div>
          </article>
          <article className="notice">
            <div className="n-head"><span className="n-new">New</span><b>Cervical Screening History Summary</b></div>
            <p>View screening summaries from the National Cervical Screening Register in real time,
               inside the patient record.</p>
            <div className="n-links"><a href="#">Register your organisation</a><a href="#">Watch the walkthrough</a></div>
          </article>
        </div>

        <div className="auth-foot">
          <span>© 2026 Kora Health Ltd</span><a href="#">Privacy</a><a href="#">Security</a>
          <span className="t-mono">Version 3.0.114</span>
        </div>
      </section>

      <section className="auth-form-col">
        <div className="auth-card">
          {step === 'creds' && (
            <form id="stepCreds" onSubmit={submitCreds} noValidate>
              <div className="auth-step" aria-hidden="true"><i className="on" /><i /><i /></div>
              <h2>Login</h2>
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
                <label className="row g-3">
                  <Switch checked={remember} onChange={setRemember} id="remember" label="Remember this device" />
                  <span className="grow"><b className="t-sm">Remember this device for 30 days</b><br />
                    <span className="t-xs subtle">Only on a clinic machine, never a shared or public one.</span></span>
                </label>
                <button className="btn btn-primary btn-lg btn-block" id="btnSignIn" type="submit" disabled={busy}>
                  {busy ? <><span className="spinner" /> Checking…</> : 'Login'}</button>
                <div className="or-rule"><span>or</span></div>
                <button className="btn btn-secondary btn-sso btn-block" type="button" data-sso="work"
                  onClick={() => toast('Redirecting to Microsoft', 'You will come back here once Microsoft confirms who you are.', 'info')}>
                  <span className="ms-tile" aria-hidden="true">
                    <i style={{ background: '#F25022' }} /><i style={{ background: '#7FBA00' }} />
                    <i style={{ background: '#00A4EF' }} /><i style={{ background: '#FFB900' }} /></span>
                  <span>Continue with Microsoft</span></button>
                <button className="btn btn-ghost btn-sm btn-block" type="button"
                  onClick={() => toast('Opening Microsoft sign-on', 'A new window will open.', 'info')}>
                  Open Microsoft single sign-on in a new window</button>
              </div>
            </form>
          )}

          {step === 'mfa' && (
            <form id="stepMfa" onSubmit={e => { e.preventDefault(); verify(code.join('')); }} noValidate>
              <div className="auth-step" aria-hidden="true"><i className="on" /><i className="on" /><i /></div>
              <button type="button" className="btn btn-ghost btn-sm" style={{ marginLeft: -10 }}
                onClick={() => setStep('creds')}><ChevronLeft size={14} /> Back</button>
              <h2 className="mt-2">Verification</h2>
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
                          if (next.join('').length === 6) verify(next.join(''));
                        }} />
                    ))}
                  </div>
                  <span className="hint">Codes refresh every 30 seconds.</span>
                </div>
                <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={busy}>
                  {busy ? <><span className="spinner" /> Verifying…</> : 'Verify and sign in'}</button>
              </div>
            </form>
          )}

          {step === 'practice' && (
            <form id="stepPractice" onSubmit={e => {
              e.preventDefault();
              toast(`Signed in to ${prac.name}`, `${K.cln(ctx.location).short} · taking you to your dashboard`, 'ok');
              setTimeout(() => { window.location.href = './index.html#/dashboard'; }, 700);
            }} noValidate>
              <div className="auth-step" aria-hidden="true"><i className="on" /><i className="on" /><i className="on" /></div>
              <h2>Select practice</h2>
              <p className="auth-sub">You have access to more than one. This sets which records and calendars you see.</p>
              <div className="col g-5 mt-5">
                <div className="field"><span className="label">Practice</span>
                  <div className="col g-2" id="practiceList" role="radiogroup" aria-label="Practice">
                    {PRACTICES.map(x => (
                      <button type="button" className="ctx-option" role="radio" key={x.id}
                        aria-checked={ctx.practice === x.id} data-pick={x.id}
                        onClick={() => setCtx(c => ({ ...c, practice: x.id }))}>
                        <Avatar name={x.name} size="sm" tone={ctx.practice === x.id ? 1 : 4} />
                        <span className="co-main"><b>{x.name}</b><span>{x.meta}</span></span>
                        <span className="co-tick"><Check size={16} /></span>
                      </button>
                    ))}
                  </div></div>
                <div className="field"><span className="label">Location</span>
                  <div className="col g-2" id="locationList" role="radiogroup" aria-label="Location">
                    {prac.locs.map(lid => { const c = K.cln(lid); return (
                      <button type="button" className="ctx-option" role="radio" key={lid}
                        aria-checked={ctx.location === lid} data-pick={lid}
                        onClick={() => setCtx(x => ({ ...x, location: lid }))}>
                        <Avatar name={c.short} size="sm" tone={ctx.location === lid ? 1 : 4} />
                        <span className="co-main"><b>{c.short}</b><span>{c.addr}</span></span>
                        <span className="co-tick"><Check size={16} /></span>
                      </button>
                    ); })}
                  </div></div>
                <button className="btn btn-primary btn-lg btn-block" id="btnContinue" type="submit">Continue</button>
                <button className="btn btn-ghost btn-sm btn-block" type="button" onClick={() => setStep('mfa')}>Cancel</button>
              </div>
            </form>
          )}

          <div className="auth-legal">
            <p>This system holds patient health information. Access is logged against your name
               under the Health Information Privacy Code.</p>
            <div className="row mt-3">
              <a href="#">Contact IT support</a><a href="#">Accessibility</a>
              <span className="spacer" />
              <button className="btn btn-ghost btn-sm" onClick={toggleTheme} aria-label="Toggle dark mode">
                {theme === 'dark' ? <><Sun size={14} /> Light</> : <><Moon size={14} /> Dark</>}</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
