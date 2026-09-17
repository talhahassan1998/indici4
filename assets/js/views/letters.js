/* Kora Health — Letters list + letter editor (split view, templates, AI scribe) */
(function () {
  const K = window.KORA, U = window.UI, ic = window.icon;
  const { esc, chip, avatar, on, qs, qsa } = U;
  window.Views = window.Views || {};

  /* =================================================== Letters list */
  let lf = 'all';
  window.Views.letters = {
    title: () => 'Letters',
    skeleton: () => `<div class="page"><div class="card">${U.skeletonList(6)}</div></div>`,
    render() {
      const list = K.letters.filter(l => lf === 'all' || l.status === lf);
      const counts = s => K.letters.filter(l => l.status === s).length;
      return `<div class="page">
        <div class="page-hd">
          <div class="page-title"><h1>Letters</h1>
            <span class="page-sub">${counts('pending')} awaiting approval · ${counts('draft')} in draft · ${counts('sent')} sent this week</span></div>
          <div class="page-actions">
            <a class="btn btn-secondary btn-sm" href="#/admin">${ic('template', 14)} Templates</a>
            <a class="btn btn-primary btn-sm" href="#/letter/new">${ic('plus', 14)} New letter</a>
          </div>
        </div>
        <div class="toolbar">
          <div class="pill-nav" role="group" aria-label="Filter letters">
            ${[['all','All'],['draft','Draft'],['pending','Awaiting approval'],['approved','Approved'],['sent','Sent']]
              .map(([id,l]) => `<button aria-pressed="${lf===id}" data-f="${id}">${l}${id!=='all'?` <span class="num">${counts(id)}</span>`:''}</button>`).join('')}
          </div>
          <span class="spacer"></span>
          <button class="btn btn-ghost btn-sm">${ic('filter', 14)} More filters</button>
        </div>
        <section class="card">
          ${list.length ? `<div class="table-wrap"><table class="tbl">
            <thead><tr><th>Letter</th><th>Patient</th><th>Recipient</th><th>Clinician</th>
              <th>Typed by</th><th>Channel</th><th>Updated</th><th>Status</th><th></th></tr></thead>
            <tbody>${list.map(l => { const p = K.pt(l.pt);
              return `<tr data-open="${l.id}" tabindex="0">
                <td><b>${esc(l.title)}</b> ${l.aiAssisted ? `<span class="chip chip-warm">${ic('sparkle',11)} AI draft</span>` : ''}
                  <br><span class="t-xs subtle">${l.words} words</span></td>
                <td><span class="row g-2">${avatar(p.id,'xs',p.tone)}<span class="t-sm">${esc(p.first)} ${esc(p.last)}<br>
                  <span class="t-xs subtle t-mono">${esc(p.nhi)}</span></span></span></td>
                <td class="t-sm">${esc(K.gp(l.to).name)}<br><span class="t-xs subtle">${esc(K.gp(l.to).practice)}</span></td>
                <td class="t-sm">${esc(K.st(l.cl).name)}</td>
                <td class="t-sm">${l.typedBy ? esc(K.st(l.typedBy).name) : '<span class="subtle">—</span>'}</td>
                <td class="t-sm">${esc(l.channel)}</td>
                <td class="t-sm">${U.relTime(l.updated)}</td>
                <td>${chip(l.status)}</td>
                <td><span class="row-actions"><button class="btn btn-ghost btn-icon btn-sm" aria-label="Open letter">${ic('chevronRight',14)}</button></span></td>
              </tr>`; }).join('')}</tbody></table></div>`
            : U.empty('letters', 'No letters here', 'Nothing matches this filter yet. Letters appear as soon as a draft is started.',
                `<a class="btn btn-primary btn-sm" href="#/letter/new">${ic('plus',14)} New letter</a>`)}
        </section>
      </div>`;
    },
    mount(root) {
      on(root, 'click', '[data-f]', (e, t) => { lf = t.dataset.f; U.mountView(this); });
      on(root, 'click', '[data-open]', (e, t) => location.hash = `#/letter/${t.dataset.open}`);
      on(root, 'keydown', '[data-open]', (e, t) => { if (e.key === 'Enter') location.hash = `#/letter/${t.dataset.open}`; });
    },
  };

  /* =================================================== Letter editor */
  let ed = null;   // editor state

  function initEditor(id) {
    const key = id || 'new';
    if (ed && ed.key === key) return;   // keep the in-progress draft across re-renders
    const existing = id && id !== 'new' ? K.ltr(id) : null;
    const ptFromHash = (location.hash.match(/pt=(\w+)/) || [])[1];
    const pt = existing ? K.pt(existing.pt) : (ptFromHash ? K.pt(ptFromHash) : K.pt('p1'));
    ed = {
      key,
      id: existing ? existing.id : 'new',
      pt,
      title: existing ? existing.title : 'Initial specialist assessment',
      status: existing ? existing.status : 'draft',
      cl: existing ? K.st(existing.cl) : K.st('u1'),
      to: existing ? K.gp(existing.to) : K.gp(pt.gp),
      cc: existing ? existing.cc.slice() : (pt.funder === 'ACC' ? ['ACC'] : []),
      channel: existing ? existing.channel : 'Healthlink',
      ai: { recording: false, seconds: 0, timer: null, draft: null, template: 'tp1' },
      aiOpen: true,
      body: existing && existing.status !== 'draft' ? sampleBody(pt) : starterBody(pt),
    };
  }

  function starterBody(p) {
    return `<p>Dear ${K.gp(p.gp).name.replace('Dr ', 'Dr ')},</p>
      <p><b>Re: ${p.first} ${p.last}, NHI <span class="merge">${p.nhi}</span>, DOB <span class="merge">${U.fmtDate(p.dob)}</span></b></p>
      <p>Thank you for referring this ${U.age(p.dob)} year old ${p.sex === 'F' ? 'woman' : 'man'}, whom I saw today.</p>
      <p><i>Start typing, insert a template, or use the AI scribe to draft from your consultation recording.</i></p>`;
  }

  function sampleBody(p) {
    return `<p>Dear ${K.gp(p.gp).name},</p>
      <p><b>Re: ${p.first} ${p.last}, NHI <span class="merge">${p.nhi}</span>, DOB <span class="merge">${U.fmtDate(p.dob)}</span></b></p>
      <p>Thank you for referring ${p.first}, whom I reviewed in clinic today. ${p.sex === 'F' ? 'She' : 'He'} is a ${U.age(p.dob)} year old
      who sustained a right knee injury in a fall at work on ${p.injury ? U.fmtDate(p.injury) : '28 July 2026'}, lodged under ACC claim
      <span class="merge">${p.claim || 'ACC-2026-44817'}</span>.</p>
      <h2>History</h2>
      <p>Ongoing medial joint line pain with mechanical symptoms of locking and giving way. Pain is worse on stairs
      and after prolonged standing. No red flags. Currently taking naproxen with partial benefit.</p>
      <h2>Examination</h2>
      <p>Small effusion. Full extension, flexion to 120 degrees. Tenderness over the medial joint line.
      McMurray’s test positive medially. Ligaments stable.</p>
      <h2>Impression and plan</h2>
      <p>Clinically a medial meniscal tear. I have arranged an MRI and will review with the result in four weeks.
      ${p.first} remains fit for selected sedentary duties in the meantime, and I have updated the ACC45 accordingly.</p>
      <p>Thank you again for the referral. Please contact me if anything changes before ${p.first}’s next review.</p>`;
  }

  function recipientsBlock() {
    return `<div class="ed-recipients">
      <div class="recip-row">
        <span class="label">To</span>
        <div class="recip-chips">
          <span class="chip chip-accent chip-lg chip-removable">${ic('user', 12)} ${esc(ed.to.name)} — ${esc(ed.to.practice)}
            <button class="x" aria-label="Remove recipient">${ic('x', 11)}</button></span>
          <button class="btn btn-ghost btn-sm" data-act="pickto">${ic('chevronDown', 13)} Change</button>
        </div>
      </div>
      <div class="recip-row">
        <span class="label">CC</span>
        <div class="recip-chips">
          ${ed.cc.map(c => `<span class="chip chip-lg chip-removable" data-cc="${esc(c)}">${esc(c)}
            <button class="x" data-rmcc="${esc(c)}" aria-label="Remove ${esc(c)}">${ic('x', 11)}</button></span>`).join('')}
          <button class="btn btn-ghost btn-sm" data-act="addcc">${ic('plus', 13)} Add CC</button>
        </div>
      </div>
      <div class="recip-row">
        <span class="label">Send via</span>
        <div class="recip-chips">
          ${['Healthlink', 'Email', 'Print'].map(c => `<button class="chip chip-lg ${ed.channel === c ? 'chip-accent' : ''}" data-ch="${c}">
            ${ic(c === 'Print' ? 'print' : c === 'Email' ? 'send' : 'link', 12)} ${c}</button>`).join('')}
        </div>
      </div>
    </div>`;
  }

  function aiPanel() {
    const a = ed.ai;
    const mm = String(Math.floor(a.seconds / 60)).padStart(2, '0');
    const ss = String(a.seconds % 60).padStart(2, '0');
    return `<aside class="ai-panel" aria-label="AI scribe">
      <div class="ai-hd row g-2">
        <span class="stat-ic" style="background:var(--warm-soft);color:var(--warm-text)">${ic('sparkle', 15)}</span>
        <div class="grow"><b class="t-sm">AI scribe</b><br><span class="t-xs subtle">Draft from your consultation</span></div>
        <button class="btn btn-ghost btn-icon btn-sm" data-act="closeai" aria-label="Hide AI scribe">${ic('x', 15)}</button>
      </div>
      <div class="drawer-bd col g-4">
        <div class="mic-state ${a.recording ? 'recording' : 'off'}" role="status">
          <span class="mic-dot"></span>
          <span class="t-sm"><b>${a.recording ? 'Recording' : 'Microphone ready'}</b><br>
            <span class="t-xs subtle">${a.recording ? 'Yeti Nano · input good' : 'Yeti Nano · muted'}</span></span>
          ${a.recording ? `<span class="wave" aria-hidden="true">${
            [8,14,6,18,11,16,9,13].map((h, i) => `<i style="height:${h}px;animation-delay:${i * .09}s"></i>`).join('')}</span>` : ''}
          <span class="mic-timer">${mm}:${ss}</span>
        </div>

        <div class="row g-2">
          ${a.recording
            ? `<button class="btn btn-danger btn-block" data-act="stop">${ic('micOff', 15)} Stop recording</button>`
            : `<button class="btn btn-primary btn-block" data-act="start">${ic('mic', 15)} Start recording</button>`}
        </div>

        <div class="field"><label class="label" for="aiTpl">Draft using template</label>
          <select class="select" id="aiTpl">
            ${K.letterTemplates.map(t => `<option value="${t.id}" ${a.template === t.id ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
          </select></div>

        <button class="btn btn-warm btn-block ${a.seconds < 3 ? '' : ''}" data-act="generate" ${a.seconds < 3 && !a.draft ? 'aria-disabled="true" disabled' : ''}>
          ${ic('sparkle', 15)} Generate draft</button>
        ${a.seconds < 3 && !a.draft ? '<span class="hint">Record at least a few seconds, or paste a dictation, to generate.</span>' : ''}

        ${a.draft ? `
          <div class="ai-flag">${ic('alert', 14)} AI draft — review before use</div>
          <div class="ai-draft">${a.draft}</div>
          <div class="row g-2">
            <button class="btn btn-primary grow" data-act="insert">${ic('download', 14)} Insert into letter</button>
            <button class="btn btn-secondary btn-icon" data-act="regen" aria-label="Regenerate">${ic('refresh', 15)}</button>
          </div>
          <p class="t-xs subtle">Generated from 2 min 14 s of audio. The recording is deleted once the letter is approved.
             Nothing is sent to the patient until a clinician approves it.</p>`
          : `<div class="card card-flat card-bd col g-2" style="background:var(--surface)">
              <span class="t-eyebrow">How it works</span>
              <p class="t-xs muted">Record the consultation, pick a template, and the scribe produces a structured draft:
                history, examination, impression and plan. You stay in control — nothing is inserted until you say so.</p>
            </div>`}
      </div>
    </aside>`;
  }

  function pdfPreview() {
    const p = ed.pt, c = ed.cl;
    return `<div class="ed-preview-scroll">
      <article class="pdf-page" aria-label="Letter preview">
        <div class="pdf-brand">
          <div>
            <h3>Kora Health</h3>
            <div style="font-size:10px;color:#5D584E;letter-spacing:.06em;text-transform:uppercase;font-weight:700">Specialist Clinic</div>
          </div>
          <div class="pdf-org">212 Broadway, Newmarket<br>Auckland 1023, New Zealand<br>
            09 523 8840 · admin@korahealth.nz<br>GST 123-456-789</div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:22px;font-size:11.5px">
          <div><b>${esc(ed.to.name)}</b><br>${esc(ed.to.practice)}<br>${esc(ed.to.email)}</div>
          <div style="text-align:right">${U.fmtDate(K.TODAY)}<br>
            ${ed.cc.length ? `CC: ${ed.cc.map(esc).join(', ')}` : ''}</div>
        </div>
        <div id="pdfBody">${ed.body}</div>
        <div class="pdf-sig">
          <div class="sig-mark">${esc(c.signature || c.name)}</div>
          <div style="font-size:11px;margin-top:6px"><b>${esc(c.name)}</b><br>
            ${esc(c.spec)}<br>MCNZ ${esc(c.mcnz || '—')} · HPI ${esc(c.hpi || '—')}</div>
        </div>
        <div class="pdf-ft">
          <span>${esc(p.first)} ${esc(p.last)} · NHI ${esc(p.nhi)}</span>
          <span>Page 1 of 1 · Generated by Kora Health</span>
        </div>
      </article>
    </div>`;
  }

  window.Views.letter = {
    title: () => 'Letter editor',
    skeleton: () => `<div class="ed-shell"><div class="ed-pane"><div class="sk" style="height:44px"></div>
      <div class="card-bd col g-3"><div class="sk sk-title"></div><div class="sk sk-line"></div>
      <div class="sk sk-line" style="width:88%"></div><div class="sk sk-line" style="width:74%"></div></div></div>
      <div class="ed-pane"><div class="sk" style="height:100%"></div></div></div>`,

    render(pr) {
      initEditor(pr.id);
      const p = ed.pt;
      return `<div class="ed-shell ${ed.aiOpen ? 'with-ai' : ''}">
        <!-- editor -->
        <section class="ed-pane">
          <div class="ed-bar">
            <a class="btn btn-ghost btn-icon btn-sm" href="#/letters" aria-label="Back to letters">${ic('chevronLeft', 16)}</a>
            <div class="grow" style="min-width:0">
              <input class="input" id="letterTitle" value="${esc(ed.title)}" aria-label="Letter title"
                style="border:0;background:none;font-weight:700;font-size:var(--fs-md);padding:2px 4px">
              <a class="t-xs" href="#/patient/${p.id}" style="padding-left:5px">${esc(p.first)} ${esc(p.last)} · ${esc(p.nhi)} · ${U.age(p.dob)}y</a>
            </div>
            ${chip(ed.status)}
            <span class="saved" id="edSaved">${ic('check', 13)} Saved 2 min ago</span>
          </div>

          <div class="ed-bar" style="border-bottom:1px solid var(--line-faint)">
            <button class="btn btn-secondary btn-sm" data-act="template">${ic('template', 14)} Insert template ${ic('chevronDown', 13)}</button>
            <div class="divider-v" style="height:20px"></div>
            <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Bold" data-fmt="bold" aria-label="Bold"><b style="font-size:13px">B</b></button>
            <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Italic" data-fmt="italic" aria-label="Italic"><i style="font-size:13px">I</i></button>
            <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Heading" data-fmt="h2" aria-label="Heading">H</button>
            <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Bullet list" data-fmt="ul" aria-label="Bullet list">${ic('list', 15)}</button>
            <div class="divider-v" style="height:20px"></div>
            <button class="btn btn-ghost btn-sm" data-act="merge">${ic('plus', 13)} Merge field</button>
            <span class="spacer"></span>
            ${!ed.aiOpen ? `<button class="btn btn-warm btn-sm" data-act="openai">${ic('sparkle', 14)} AI scribe</button>` : ''}
          </div>

          ${recipientsBlock()}

          <div class="ed-body">
            <div class="ed-doc" id="edDoc" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Letter body" spellcheck="true">${ed.body}</div>
          </div>

          <div class="ed-bar" style="border-top:1px solid var(--line);border-bottom:0">
            <button class="btn btn-ghost btn-sm" data-act="save">${ic('check', 14)} Save draft</button>
            <span class="spacer"></span>
            <button class="btn btn-secondary btn-sm" data-act="submit">${ic('send', 14)} Submit for approval</button>
            <button class="btn btn-primary btn-sm" data-act="approve">${ic('check', 14)} Approve &amp; send</button>
          </div>
        </section>

        <!-- preview -->
        <section class="ed-pane preview">
          <div class="ed-bar">
            <span class="t-eyebrow">Live preview</span>
            <span class="chip">A4 · Kora letterhead</span>
            <span class="spacer"></span>
            <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Print" data-act="print" aria-label="Print">${ic('print', 15)}</button>
            <button class="btn btn-ghost btn-icon btn-sm tip" data-tip="Download PDF" aria-label="Download PDF">${ic('download', 15)}</button>
          </div>
          ${pdfPreview()}
        </section>

        ${ed.aiOpen ? aiPanel() : ''}
      </div>`;
    },

    mount(root) {
      const rerenderAI = () => {
        const old = qs('.ai-panel', root);
        if (!ed.aiOpen) { if (old) old.remove(); qs('.ed-shell', root).classList.remove('with-ai'); return; }
        const el = U.h(aiPanel());
        if (old) old.replaceWith(el); else { qs('.ed-shell', root).appendChild(el); qs('.ed-shell', root).classList.add('with-ai'); }
      };
      const bump = U.autosave(qs('#edSaved', root));
      const doc = qs('#edDoc', root);
      const pdfBody = qs('#pdfBody', root);

      /* live preview + autosave */
      doc.addEventListener('input', () => { ed.body = doc.innerHTML; pdfBody.innerHTML = ed.body; bump(); });
      qs('#letterTitle', root).addEventListener('input', e => { ed.title = e.target.value; bump(); });

      on(root, 'click', '[data-fmt]', (e, t) => {
        const m = { bold: 'bold', italic: 'italic', h2: 'formatBlock', ul: 'insertUnorderedList' }[t.dataset.fmt];
        document.execCommand(m, false, t.dataset.fmt === 'h2' ? 'H2' : null);
        doc.focus(); ed.body = doc.innerHTML; pdfBody.innerHTML = ed.body; bump();
      });

      on(root, 'click', '[data-ch]', (e, t) => { ed.channel = t.dataset.ch; U.mountView(this, { id: ed.key }); });
      on(root, 'click', '[data-rmcc]', (e, t) => {
        e.stopPropagation();
        ed.cc = ed.cc.filter(c => c !== t.dataset.rmcc);
        qs('.ed-recipients', root).replaceWith(U.h(recipientsBlock())); bump();
      });
      on(root, 'click', '[data-act="addcc"]', (e, t) => U.menu(t, [
        { label: 'Add a CC recipient' },
        ...['ACC', 'Southern Cross', 'Patient', 'Physiotherapist', K.gp('g3').name].filter(x => !ed.cc.includes(x)).map(x => ({
          icon: 'user', label: x, action: () => { ed.cc.push(x); qs('.ed-recipients', root).replaceWith(U.h(recipientsBlock())); bump(); }
        }))
      ]));
      on(root, 'click', '[data-act="pickto"]', (e, t) => U.menu(t, [
        { label: 'Suggested from the patient record' },
        ...K.gps.map(g => ({
          icon: g.id === ed.pt.gp ? 'check' : 'user',
          label: `${g.name} — ${g.practice}`,
          action: () => { ed.to = g; U.mountView(this, { id: ed.key }); U.toast('Recipient changed', g.practice, 'ok'); }
        }))
      ]));

      on(root, 'click', '[data-act="merge"]', (e, t) => U.menu(t, [
        { label: 'Insert merge field' },
        ...[['Patient name', `${ed.pt.first} ${ed.pt.last}`], ['NHI', ed.pt.nhi], ['Date of birth', U.fmtDate(ed.pt.dob)],
            ['ACC claim', ed.pt.claim || '—'], ['Today’s date', U.fmtDate(K.TODAY)], ['Clinician', ed.cl.name]]
          .map(([l, v]) => ({ icon: 'plus', label: l, action: () => {
            doc.focus();
            document.execCommand('insertHTML', false, `<span class="merge">${esc(v)}</span> `);
            ed.body = doc.innerHTML; pdfBody.innerHTML = ed.body; bump();
          }}))
      ]));

      on(root, 'click', '[data-act="template"]', (e, t) => U.menu(t, [
        { label: 'Pinned templates' },
        ...K.letterTemplates.filter(x => x.pinned).map(x => ({ icon: 'pin', label: x.name, action: () => templateForm(x, doc, pdfBody, bump) })),
        '-',
        { label: 'All templates' },
        ...K.letterTemplates.filter(x => !x.pinned).map(x => ({ icon: 'template', label: x.name, action: () => templateForm(x, doc, pdfBody, bump) })),
      ]));

      on(root, 'click', '[data-act="openai"]', () => { ed.aiOpen = true; rerenderAI(); });
      on(root, 'click', '[data-act="closeai"]', () => { ed.aiOpen = false; rerenderAI(); });
      on(root, 'click', '[data-act="start"]', () => {
        ed.ai.recording = true; ed.ai.seconds = 0;
        ed.ai.timer = setInterval(() => { ed.ai.seconds++; const el = qs('.mic-timer', root);
          if (el) el.textContent = `${String(Math.floor(ed.ai.seconds / 60)).padStart(2, '0')}:${String(ed.ai.seconds % 60).padStart(2, '0')}`;
          else clearInterval(ed.ai.timer);
        }, 1000);
        rerenderAI(); U.toast('Recording started', 'The patient has been told a scribe is in use.', 'ok');
      });
      on(root, 'click', '[data-act="stop"]', () => {
        ed.ai.recording = false; clearInterval(ed.ai.timer);
        if (ed.ai.seconds < 3) ed.ai.seconds = 134;
        rerenderAI(); U.toast('Recording stopped', `${ed.ai.seconds}s captured — ready to generate.`, 'ok');
      });
      on(root, 'click', '[data-act="generate"], [data-act="regen"]', () => {
        const btn = qs('[data-act="generate"]', root);
        if (btn) { btn.innerHTML = `<span class="spinner"></span> Generating…`; btn.disabled = true; }
        setTimeout(() => { ed.ai.draft = aiDraftHtml(ed.pt); rerenderAI(); U.toast('Draft ready', 'Review carefully before inserting.', 'info'); }, 1100);
      });
      on(root, 'click', '[data-act="insert"]', () => {
        doc.focus();
        document.execCommand('insertHTML', false, `<hr>${ed.ai.draft}`);
        ed.body = doc.innerHTML; pdfBody.innerHTML = ed.body; bump();
        U.toast('Draft inserted', 'Marked as AI-assisted on the audit trail.', 'ok');
      });
      root.addEventListener('change', e => { if (e.target.id === 'aiTpl') ed.ai.template = e.target.value; });

      on(root, 'click', '[data-act="save"]', () => { bump(); U.toast('Draft saved', `${ed.title} · ${ed.pt.first} ${ed.pt.last}`, 'ok'); });
      on(root, 'click', '[data-act="print"]', () => window.print());
      on(root, 'click', '[data-act="submit"]', () => {
        ed.status = 'pending';
        U.toast('Sent for approval', `${ed.cl.name} will be notified.`, 'ok');
        U.mountView(this, { id: ed.key });
      });
      on(root, 'click', '[data-act="approve"]', () => approveFlow(root, this));
    },
  };

  function aiDraftHtml(p) {
    return `<h2>History</h2>
      <p>${p.first} reports ongoing right knee pain since the injury, with mechanical locking and episodes of
      giving way. Pain is worse descending stairs. Simple analgesia gives partial relief. No night pain,
      no systemic symptoms.</p>
      <h2>Examination</h2>
      <p>Antalgic gait. Small effusion. Range of movement 0–120 degrees. Medial joint line tenderness.
      McMurray’s positive medially. Collaterals and cruciates stable.</p>
      <h2>Impression</h2>
      <p>Likely medial meniscal tear on a background of early medial compartment change.</p>
      <h2>Plan</h2>
      <p>MRI right knee, review with result in four weeks. Continue physiotherapy. Selected duties at work.
      ACC45 updated today.</p>`;
  }

  function templateForm(tpl, doc, pdfBody, bump) {
    if (!tpl.fields.length) {
      doc.focus();
      document.execCommand('insertHTML', false, `<h2>${esc(tpl.name)}</h2><p>…</p>`);
      pdfBody.innerHTML = doc.innerHTML; bump();
      U.toast('Template inserted', tpl.name, 'ok');
      return;
    }
    U.modal({
      title: tpl.name, sub: 'Fill these in and the template writes itself into the letter',
      icon: 'template',
      body: `<div class="col g-4">${tpl.fields.map(f => `
        <div class="field"><label class="label" for="tf-${f.k}">${esc(f.label)}</label>
        ${f.type === 'select'
          ? `<select class="select" id="tf-${f.k}">${f.opts.map(o => `<option>${esc(o)}</option>`).join('')}</select>`
          : f.type === 'date'
          ? `<input class="input" id="tf-${f.k}" type="date" value="2026-07-28">`
          : `<input class="input" id="tf-${f.k}" placeholder="${esc(f.label)}">`}
        </div>`).join('')}</div>`,
      footer: `<button class="btn btn-ghost" data-close>Cancel</button>
               <button class="btn btn-primary" data-ins>${ic('plus', 15)} Insert into letter</button>`,
      onMount(panel, close) {
        qs('[data-ins]', panel).addEventListener('click', () => {
          const vals = tpl.fields.map(f => `<b>${esc(f.label)}:</b> <span class="merge">${esc(qs(`#tf-${f.k}`, panel).value || '—')}</span>`);
          close();
          doc.focus();
          document.execCommand('insertHTML', false, `<h2>${esc(tpl.name)}</h2><p>${vals.join('<br>')}</p>`);
          pdfBody.innerHTML = doc.innerHTML; bump();
          U.toast('Template inserted', tpl.name, 'ok');
        });
      }
    });
  }

  function approveFlow(root, view) {
    U.modal({
      title: 'Approve and send',
      sub: `${ed.title} · ${ed.pt.first} ${ed.pt.last}`,
      icon: 'check', tone: 'ok',
      body: `<div class="col g-4">
        <div class="card card-flat card-bd col g-3">
          <div class="row between"><span class="t-eyebrow">To</span><span class="t-sm"><b>${esc(ed.to.name)}</b> — ${esc(ed.to.practice)}</span></div>
          ${ed.cc.length ? `<div class="row between"><span class="t-eyebrow">CC</span><span class="t-sm">${ed.cc.map(esc).join(', ')}</span></div>` : ''}
          <div class="row between"><span class="t-eyebrow">Channel</span><span class="t-sm">${esc(ed.channel)}</span></div>
          <div class="row between"><span class="t-eyebrow">Signed by</span><span class="t-sm">${esc(ed.cl.name)} · MCNZ ${esc(ed.cl.mcnz)}</span></div>
        </div>
        <label class="row g-3"><span class="switch"><input type="checkbox" checked><span class="track"></span><span class="thumb"></span></span>
          <span class="t-sm">Attach to the patient’s timeline</span></label>
        <label class="row g-3"><span class="switch"><input type="checkbox" checked><span class="track"></span><span class="thumb"></span></span>
          <span class="t-sm">Mark the linked task as done</span></label>
        <div class="banner"><span class="b-ic">${ic('info', 15)}</span>
          <span class="t-sm">Your signature and registration details are applied from your consultant profile in Admin.</span></div>
      </div>`,
      footer: `<button class="btn btn-ghost" data-close>Not yet</button>
               <button class="btn btn-primary" data-go>${ic('send', 15)} Approve and send via ${esc(ed.channel)}</button>`,
      onMount(panel, close) {
        qs('[data-go]', panel).addEventListener('click', () => {
          ed.status = 'sent'; close();
          U.toast('Letter sent', `Delivered to ${ed.to.practice} via ${ed.channel}.`, 'ok');
          U.mountView(view, { id: ed.key });
        });
      }
    });
  }
})();
