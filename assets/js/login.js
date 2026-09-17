/* Kora Health — sign-in flow: credentials → verification.
   Demo credentials: any username, password "kora". Code: 123456 (or any 6 digits). */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { qs, qsa, on, esc } = U;

  /* ---------------------------------------------------------- theme */
  const theme = localStorage.getItem('kora.theme') || 'light';
  document.documentElement.setAttribute('data-theme', theme);
  const tb = qs('#themeBtn');
  const paintTheme = () => {
    const t = document.documentElement.getAttribute('data-theme');
    tb.innerHTML = `${ic(t === 'dark' ? 'sun' : 'moon', 14)} ${t === 'dark' ? 'Light' : 'Dark'}`;
  };
  tb.addEventListener('click', () => {
    const t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('kora.theme', t);
    paintTheme();
  });
  paintTheme();

  qs('#backIcon').innerHTML = ic('chevronLeft', 14);
  qs('#pwToggle').innerHTML = ic('eye', 15);
  qs('#userIcon').innerHTML = ic('user', 15);

  /* ---------------------------------------------------------- single sign-on */
  on(document, 'click', '[data-sso]', (e, t) => {
    U.toast(
      t.dataset.sso === 'spa' ? 'Opening Microsoft sign-on' : 'Redirecting to Microsoft',
      'You will come back here once Microsoft confirms who you are.', 'info');
  });

  /* ---------------------------------------------------------- password reveal */
  qs('#pwToggle').addEventListener('click', () => {
    const f = qs('#password'), shown = f.type === 'text';
    f.type = shown ? 'password' : 'text';
    qs('#pwToggle').setAttribute('aria-pressed', String(!shown));
    qs('#pwToggle').setAttribute('aria-label', shown ? 'Show password' : 'Hide password');
    qs('#pwToggle').innerHTML = ic(shown ? 'eye' : 'lock', 15);
    f.focus();
  });

  /* ---------------------------------------------------------- validation */
  function setErr(fieldId, errId, msg) {
    const f = qs('#' + fieldId), e = qs('#' + errId);
    if (msg) {
      f.setAttribute('aria-invalid', 'true');
      e.innerHTML = `${ic('alert', 12)} ${esc(msg)}`;
      e.hidden = false;
    } else {
      f.removeAttribute('aria-invalid');
      e.hidden = true;
    }
  }

  let attempts = 0;

  /* ---------------------------------------------------------- step 1 */
  qs('#stepCreds').addEventListener('submit', ev => {
    ev.preventDefault();
    const user = qs('#username').value.trim();
    const pw = qs('#password').value;
    let bad = false;

    if (!user) { setErr('username', 'userErr', 'Enter your username or email address.'); bad = true; }
    else setErr('username', 'userErr', null);

    if (!pw) { setErr('password', 'pwErr', 'Enter your password.'); bad = true; }
    else setErr('password', 'pwErr', null);
    if (bad) { qs(bad && !user ? '#username' : '#password').focus(); return; }

    const btn = qs('#btnSignIn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Checking…`;

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Continue';

      if (pw.toLowerCase() !== 'kora') {
        attempts++;
        const left = 5 - attempts;
        setErr('password', 'pwErr',
          left > 0
            ? `That password is not right. ${left} ${left === 1 ? 'attempt' : 'attempts'} left before the account locks.`
            : 'Account locked. Ask your practice administrator to unlock it.');
        qs('#password').select();
        if (left <= 0) qs('#btnSignIn').disabled = true;
        return;
      }

      qs('#mfaAccount').textContent = user;
      qs('#stepCreds').hidden = true;
      qs('#stepMfa').hidden = false;
      qs('#code1').focus();
      U.toast('Code sent', 'Check your authenticator app for a 6-digit code.', 'info');
    }, 700);
  });

  qs('#backToCreds').addEventListener('click', () => {
    qs('#stepMfa').hidden = true;
    qs('#stepCreds').hidden = false;
    qs('#password').focus();
  });

  qs('#forgot').addEventListener('click', e => {
    e.preventDefault();
    U.toast('Reset link sent', 'If that account exists, a reset link is on its way.', 'ok');
  });
  qs('#useBackup').addEventListener('click', () => {
    U.toast('Backup codes', 'Enter one of the codes issued when you set up two-factor.', 'info');
  });


  /* ---------------------------------------------------------- practice & location */
  // Two practices here so the choice is a real one, not a single greyed row.
  const PRACTICES = [
    { id: 'prac-1', name: 'Kora Specialists', meta: 'HPI ORG-G3K291 · 3 locations', locs: ['c1', 'c2', 'c3'] },
    { id: 'prac-2', name: 'Sandycove Medical', meta: 'HPI ORG-B8T740 · 1 location', locs: ['c2'] },
  ];
  let ctx = { practice: 'prac-1', location: 'c1' };

  function row(id, name, meta, checked) {
    return `<button type="button" class="ctx-option" role="radio" aria-checked="${checked}" data-pick="${esc(id)}">
      <span class="avatar avatar-sm tone-${checked ? 1 : 4}" aria-hidden="true">${esc(name.slice(0, 2).toUpperCase())}</span>
      <span class="co-main"><b>${esc(name)}</b><span>${esc(meta)}</span></span>
      <span class="co-tick">${ic('check', 16)}</span>
    </button>`;
  }

  function paintContext() {
    const prac = PRACTICES.find(x => x.id === ctx.practice);
    if (!prac.locs.includes(ctx.location)) ctx.location = prac.locs[0];

    qs('#practiceList').innerHTML = PRACTICES
      .map(x => row(x.id, x.name, x.meta, x.id === ctx.practice)).join('');

    qs('#locationList').innerHTML = prac.locs
      .map(id => { const c = K.cln(id); return row(id, c.short, c.addr, id === ctx.location); }).join('');
  }

  on(document, 'click', '[data-pick]', (e, t) => {
    const id = t.dataset.pick;
    if (PRACTICES.some(x => x.id === id)) ctx.practice = id; else ctx.location = id;
    paintContext();
  });

  qs('#backToMfa').addEventListener('click', () => {
    qs('#stepPractice').hidden = true;
    qs('#stepMfa').hidden = false;
  });

  qs('#stepPractice').addEventListener('submit', ev => {
    ev.preventDefault();
    const btn = qs('#btnContinue');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Opening…`;
    const prac = PRACTICES.find(x => x.id === ctx.practice);
    const loc = K.cln(ctx.location);
    U.toast(`Signed in to ${prac.name}`, `${loc.short} · taking you to your dashboard`, 'ok');
    setTimeout(() => { location.href = 'index.html#/dashboard'; }, 750);
  });

  /* ---------------------------------------------------------- step 2: code boxes */
  const boxes = qsa('#codeRow input');
  const code = () => boxes.map(b => b.value).join('');

  boxes.forEach((b, i) => {
    b.addEventListener('input', () => {
      b.value = b.value.replace(/\D/g, '').slice(0, 1);
      b.classList.toggle('filled', !!b.value);
      if (b.value && i < boxes.length - 1) boxes[i + 1].focus();
      setErr('code1', 'codeErr', null);
      if (code().length === 6) qs('#stepMfa').requestSubmit();
    });
    b.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !b.value && i > 0) { boxes[i - 1].focus(); boxes[i - 1].value = ''; boxes[i - 1].classList.remove('filled'); }
      if (e.key === 'ArrowLeft' && i > 0) boxes[i - 1].focus();
      if (e.key === 'ArrowRight' && i < boxes.length - 1) boxes[i + 1].focus();
    });
    // Paste the whole code into any box and it distributes
    b.addEventListener('paste', e => {
      e.preventDefault();
      const digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6).split('');
      digits.forEach((d, n) => { if (boxes[n]) { boxes[n].value = d; boxes[n].classList.add('filled'); } });
      boxes[Math.min(digits.length, 5)].focus();
      if (code().length === 6) qs('#stepMfa').requestSubmit();
    });
  });

  qs('#stepMfa').addEventListener('submit', ev => {
    ev.preventDefault();
    if (code().length < 6) { setErr('code1', 'codeErr', 'Enter all six digits.'); return; }

    const btn = qs('#btnVerify');
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner"></span> Verifying…`;

    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = 'Verify and sign in';
      if (!/^\d{6}$/.test(code())) {
        setErr('code1', 'codeErr', 'That code is not valid. Codes are six digits.');
        return;
      }
      qs('#stepMfa').hidden = true;
      qs('#stepPractice').hidden = false;
      paintContext();
    }, 700);
  });
})();
