/* InfinityCode front end.
   The settings walk-through is driven entirely by the engine: the server sends
   one question at a time and this file only decides which control to draw for
   it, so a question the engine adds shows up here without any change. */

const $  = (s) => document.querySelector(s);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const api = async (path, opts) => {
  const r = await fetch(path, opts);
  return r.json();
};
const wsURL = (path) =>
  (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + path;

let STATE = {};
let chats = [];
let currentChat = null;
let socket = null;
let running = false;
let viewingAgent = null;

/* ======================================================= setup wizard ==== */

let setupSock = null;
let readAnswer = () => '';

function drawControl(field) {
  const box = $('#setupControl');
  box.innerHTML = '';
  $('#setupHint').textContent = field.hint || '';
  $('#setupLabel').textContent = field.label || '';
  const kind = field.kind;

  if (kind === 'tools') {
    const wrap = el('div', 'checks');
    field.tools.forEach((t) => {
      const lab = el('label', 'check');
      const cb = el('input');
      cb.type = 'checkbox';
      cb.value = t.code;
      cb.checked = !!field.default_all;
      const txt = el('div');
      txt.appendChild(el('b', null, t.name));
      txt.appendChild(el('span', null, t.desc));
      lab.append(cb, txt);
      wrap.appendChild(lab);
    });
    box.appendChild(wrap);
    readAnswer = () => {
      const codes = [...wrap.querySelectorAll('input:checked')].map((c) => c.value);
      return codes.length ? codes.join(',') : (field.allow_none ? 'none' : '');
    };
    return true;
  }

  if (kind === 'mcpjson') {
    const area = el('textarea', 'json-box');
    area.rows = 14;
    area.spellcheck = false;
    area.value = field.current || '';
    const note = el('p', 'hint');
    const add = el('button', 'btn btn-ghost btn-sm', '+ add a server');
    add.type = 'button';
    add.onclick = () => {
      let doc;
      try { doc = JSON.parse(area.value || '{}'); } catch (_) { doc = {}; }
      if (!doc.mcpServers || typeof doc.mcpServers !== 'object') doc.mcpServers = {};
      let name = 'new-server', n = 2;
      while (doc.mcpServers[name]) name = 'new-server-' + n++;
      doc.mcpServers[name] = { command: '', args: [] };
      area.value = JSON.stringify(doc, null, 2);
      check();
    };
    const check = () => {
      try {
        JSON.parse(area.value || '{}');
        note.textContent = '';
        $('#setupNext').disabled = false;
      } catch (e) {
        note.textContent = 'not valid json yet — ' + e.message;
        $('#setupNext').disabled = true;
      }
    };
    area.oninput = check;
    box.append(area, add, note);
    // Unchanged means unchanged: the engine keeps the file when nothing is sent.
    readAnswer = () =>
      (area.value.trim() === (field.current || '').trim()) ? '' : area.value.trim();
    return true;
  }

  if (kind === 'path' && field.pick === 'venv') {
    // One box per venv, each holding nothing but a path. The chaining is this
    // side's job: the engine is handed "source a/activate && source b/activate".
    const rows = el('div', 'venv-rows');
    const addRow = () => {
      const row = el('div', 'row');
      const input = el('input');
      input.type = 'text';
      input.placeholder = 'path to a venv activate file';
      const pick = el('button', 'btn btn-ghost', 'Choose venv');
      pick.type = 'button';
      pick.onclick = async () => {
        pick.disabled = true;
        const was = pick.textContent;
        pick.textContent = 'Choosing…';
        try {
          const got = await api('/api/pick', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kind: 'venv' }),
          });
          if (got.error) $('#setupErr').textContent = got.error;
          else if (got.path) input.value = got.path;
        } finally { pick.disabled = false; pick.textContent = was; }
      };
      const drop = el('button', 'btn btn-ghost btn-sm', '−');
      drop.type = 'button';
      drop.title = 'remove this one';
      drop.onclick = () => { if (rows.children.length > 1) row.remove(); };
      row.append(input, pick, drop);
      rows.appendChild(row);
      return input;
    };
    addRow();
    const plus = el('button', 'btn btn-ghost btn-sm', '+ another venv');
    plus.type = 'button';
    plus.onclick = () => addRow().focus();
    box.append(rows, plus);
    readAnswer = () => [...rows.querySelectorAll('input')]
      .map((i) => i.value.trim()).filter(Boolean)
      .map((path) => 'source ' + (/\s/.test(path) ? JSON.stringify(path) : path))
      .join(' && ');
    return true;                       // a venv is optional
  }

  if (kind === 'path') {
    // What each pick kind calls itself. Anything unrecognised falls back to a
    // plain folder, which is what every path question was before gguf existed.
    const PICKS = {
      venv: { label: 'Choose venv', empty: 'path to the venv activate file' },
      gguf: { label: 'Choose .gguf', empty: 'no .gguf chosen yet' },
      jinja: { label: 'Choose Jinja file', empty: 'no chat template chosen yet' },
      folder: { label: 'Choose folder', empty: 'no folder chosen yet' },
    };
    const pickKind = PICKS[field.pick] ? field.pick : 'folder';
    const spec = PICKS[pickKind];
    const row = el('div', 'row');
    const input = el('input');
    input.type = 'text';
    input.placeholder = spec.empty;
    const btn = el('button', 'btn btn-ghost', spec.label);
    btn.type = 'button';
    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = 'Choosing…';
      try {
        const got = await api('/api/pick', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: pickKind }),
        });
        if (got.error) $('#setupErr').textContent = got.error;
        else if (got.path) { input.value = got.path; input.dispatchEvent(new Event('input')); }
      } finally {
        btn.disabled = false;
        btn.textContent = spec.label;
      }
    };
    row.append(input, btn);
    box.appendChild(row);
    input.oninput = () => gate(field, input.value);
    readAnswer = () => input.value.trim();
    setTimeout(() => input.focus(), 30);
    return !!field.optional;
  }

  if (kind === 'select') {
    const sel = el('select');
    // Nothing is picked for you: the first entry is a placeholder, so an
    // answer is only ever sent because it was actually chosen here.
    const head = el('option', null, 'Choose…');
    head.value = '__pick__';
    head.disabled = true;
    head.selected = true;
    sel.appendChild(head);
    (field.options || []).forEach((o) => {
      const opt = el('option', null, o.label);
      opt.value = o.value;
      sel.appendChild(opt);
    });
    box.appendChild(sel);
    let custom = null;
    if (field.allow_custom) {
      custom = el('input');
      custom.type = 'text';
      custom.placeholder = 'or type an id the list does not show';
      box.appendChild(custom);
      custom.oninput = () => {
        $('#setupNext').disabled = !(custom.value.trim() || sel.value !== '__pick__');
      };
    }
    sel.onchange = () => { $('#setupNext').disabled = sel.value === '__pick__'; };
    readAnswer = () => (custom && custom.value.trim()) ||
                       (sel.value === '__pick__' ? '' : sel.value);
    return false;
  }

  const input = el('input');
  input.type = kind === 'password' ? 'password' : (kind === 'number' ? 'number' : 'text');
  if (field.step) input.step = field.step;
  if (field.min !== undefined) input.min = field.min;
  if (field.max !== undefined) input.max = field.max;
  if (field.placeholder) input.placeholder = field.placeholder;
  box.appendChild(input);
  input.oninput = () => gate(field, input.value);
  readAnswer = () => input.value.trim();

  // Leaving a parameter out is not the same as sending its default: the
  // provider then picks for itself. "-" is what the engine reads as that.
  if (field.can_skip) {
    const row = el('label', 'skip-row');
    const box2 = el('input');
    box2.type = 'checkbox';
    row.append(box2, el('span', null, 'do not send this parameter'));
    box.appendChild(row);
    box2.onchange = () => {
      input.disabled = box2.checked;
      input.placeholder = box2.checked ? 'left out of the request' : '';
      $('#setupNext').disabled = false;
    };
    readAnswer = () => (box2.checked ? '-' : input.value.trim());
  }

  setTimeout(() => input.focus(), 30);
  return !!field.optional;
}

function gate(field, value) {
  $('#setupNext').disabled = !(field.optional || String(value).trim());
}

/* The record of what was answered last time. Ordinary answers sit in
   localStorage as they are; anything typed into a password box is held only
   inside an AES-GCM blob whose key is derived from a passphrase the user
   types, so the record on disk is useless without them. */
const REC_KEY = 'infinitycode.setup';
let RECORD = null;        // {v, steps:[{prompt,label,kind,group,answer}], vault}
let SECRETS = {};         // stepIndex -> plaintext, only ever in memory
let VAULT_PASS = null;    // held for this tab only, so a new key can be re-sealed

const encTxt = new TextEncoder(), decTxt = new TextDecoder();
const b64 = (b) => btoa(String.fromCharCode(...new Uint8Array(b)));
const unb64 = (t) => Uint8Array.from(atob(t), (c) => c.charCodeAt(0));

async function vaultKey(pass, salt) {
  const base = await crypto.subtle.importKey('raw', encTxt.encode(pass), 'PBKDF2',
                                             false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function sealSecrets(pass, secrets) {
  // a new salt and a new iv on every write, so no two blobs share key material
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await vaultKey(pass, salt);
  const ct   = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key,
                                           encTxt.encode(JSON.stringify(secrets)));
  return { salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}
async function openSecrets(pass, vault) {
  const key = await vaultKey(pass, unb64(vault.salt));
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(vault.iv) },
                                         key, unb64(vault.ct));
  return JSON.parse(decTxt.decode(pt));      // throws if the passphrase is wrong
}

function loadRecord() {
  try { RECORD = JSON.parse(localStorage.getItem(REC_KEY) || 'null'); }
  catch (_) { RECORD = null; }
}
function saveRecord(steps, vault) {
  RECORD = { v: 1, steps, vault: vault || (RECORD && RECORD.vault) || null };
  localStorage.setItem(REC_KEY, JSON.stringify(RECORD));
}

/* ---- which setting a question belongs to --------------------------------- */
const GROUP_NAME = {
  folder: 'Project folder', venv: 'Virtual environment', web: 'Web', mcp: 'MCP servers',
  nativecall: 'Tool call mode',
  rag: 'Page ranking', tools: 'Tools', orchestrator: 'Orchestrator',
  subagent: 'Subagents', danger: 'Auto-run dangerous commands',
  timeout: 'Command timeout',
};

function sectionFrom(printed, current) {
  if (/---\s*orchestrator provider\s*---/i.test(printed)) return 'orchestrator';
  if (/---\s*subagent provider\s*---/i.test(printed)) return 'subagent';
  if (/web page ranking \(rag\)/i.test(printed)) return 'rag';
  return current;
}
function groupOf(prompt, section) {
  const l = prompt.toLowerCase();
  if (l.includes('enter the folder path')) return 'folder';
  if (l.includes('virtual environment')) return 'venv';
  if (l.includes('how should tools be called')) return 'nativecall';
  if (l.includes('browser playwright should drive')) return 'web';
  if (l.includes('mcp server json')) return 'mcp';
  if (l.includes('choose which allowed tools may run without asking') ||
      l.includes('auto-run tool code:')) return 'danger';
  if (l.includes('choose the tools this agent may use') || l.includes('tool code:'))
    return 'tools';
  if (l.includes('web page engine') || l.includes('web search provider') ||
      l.includes('serpapi') || l.includes('default search engine')) return 'web';
  if (l.includes('maximum number of subagents') ||
      l.includes('same provider and model for subagents') ||
      l.includes('subagent blocks are delimited')) return 'subagent';
  if (l.includes('dangerous commands') || l.includes('how should tools be run'))
    return 'danger';
  if (l.includes('command timeout')) return 'timeout';
  return section || 'orchestrator';
}

/* An answer as a person would read it: the wire value is a list index for a
   select and a code list for the tools, neither of which means anything on
   its own in the settings panel. */
function readableAnswer(answer, field) {
  if (field.kind === 'password') return 'stored, encrypted';
  if (field.kind === 'tools') {
    const codes = String(answer).split(',').map((c) => c.trim()).filter(Boolean);
    if (!codes.length) return 'all of them';
    return (field.tools || []).filter((t) => codes.includes(t.code))
                              .map((t) => t.name).join(', ');
  }
  if (field.kind === 'select') {
    const hit = (field.options || []).find((o) => String(o.value) === String(answer));
    if (hit) return hit.label;
  }
  return String(answer).trim() === '' ? 'left as the default' : String(answer);
}

/* ---- one run of the walk-through, fresh or replayed ---------------------- */
let RUN = null;

function startSetup(plan) {
  // plan === null  -> a first-time run, every question is asked
  // plan           -> {targets:Set, mode:'reuse'|'ask'} and the rest is auto-sent
  RUN = { steps: [], secrets: {}, section: null, ptr: 0, plan: plan || null,
          hitTarget: false, prev: (RECORD && RECORD.steps) || [] };
  $('#setup').hidden = false;
  $('#setupPrinted').hidden = true;
  setupSock = new WebSocket(wsURL('/api/setup'));

  const send = (answer, field, prompt, auto) => {
    const group = groupOf(prompt, RUN.section);
    const secret = field.kind === 'password';
    const at = RUN.steps.length;
    RUN.steps.push({ prompt, label: field.label || '', kind: field.kind, group,
                     shown: readableAnswer(answer, field),
                     answer: secret ? null : answer });
    if (secret && answer) RUN.secrets[at] = answer;
    setupSock.send(JSON.stringify({ answer }));
    if (auto) {
      $('#setupStep').textContent = 'Keeping your other answers…';
      $('#setupControl').innerHTML = '';
      $('#setupLabel').textContent = '';
      $('#setupPrompt').textContent = (field.label || prompt).slice(0, 90);
      $('#setupHint').textContent = '';
      $('#setupNext').disabled = true;
    }
  };

  /* Find the recorded answer for this question, or undefined to ask for it. */
  const reuse = (prompt) => {
    const p = RUN.plan;
    if (!p) return undefined;
    if (p.targets.has(prompt)) { RUN.hitTarget = true; return undefined; }
    if (p.mode === 'ask' && RUN.hitTarget) return undefined;
    for (let i = RUN.ptr; i < RUN.prev.length; i++) {
      if (RUN.prev[i].prompt === prompt) {
        const step = RUN.prev[i];
        RUN.ptr = i + 1;
        if (step.kind === 'password') {
          const got = SECRETS[i];
          return got === undefined ? undefined : got;   // locked: ask instead
        }
        return step.answer;
      }
    }
    return undefined;            // a question this provider did not ask before
  };

  setupSock.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.printed) RUN.section = sectionFrom(msg.printed, RUN.section);

    if (msg.printed && msg.printed.trim() && !RUN.plan &&
        (msg.type !== 'ask' || !(msg.field && msg.field.label))) {
      $('#setupPrinted').hidden = false;
      $('#setupPrinted').textContent = msg.printed.trim();
      $('#setupPrinted').scrollTop = $('#setupPrinted').scrollHeight;
    }

    if (msg.type === 'ask') {
      const canned = reuse(msg.prompt);
      if (canned !== undefined) { send(canned, msg.field, msg.prompt, true); return; }

      $('#setupErr').textContent = '';
      // Recognized questions already have a web label, hint, and purpose-built
      // control. The raw input() wording and CLI output only duplicate them.
      const rawFallback = !(msg.field && msg.field.label);
      $('#setupPrompt').hidden = !rawFallback;
      $('#setupPrompt').textContent = rawFallback ? msg.prompt.trim() : '';
      const showPrinted = rawFallback && msg.printed && msg.printed.trim();
      $('#setupPrinted').hidden = !showPrinted;
      $('#setupPrinted').textContent = showPrinted ? msg.printed.trim() : '';
      const ok = drawControl(msg.field);
      const last = !!msg.field.last;
      $('#setupNext').textContent = (last && !RUN.plan) ? 'Save' : 'Continue';
      $('#setupStep').textContent = RUN.plan
        ? 'Only what you chose to change is asked.'
        : (last ? 'Last one — then everything is set.'
                : 'Choose this, then continue to the next setting.');
      $('#setupNext').disabled = !ok;
      $('#setupNext').onclick = () => send(readAnswer(), msg.field, msg.prompt, false);
      return;
    }

    if (msg.type === 'done') {
      STATE = msg.state || {};
      finishRun();
      return;
    }

    if (msg.type === 'failed') {
      $('#setupErr').textContent = msg.text || 'setup failed';
      $('#setupNext').textContent = 'Start again';
      $('#setupNext').disabled = false;
      $('#setupNext').onclick = () => location.reload();
    }
  };
  setupSock.onclose = () => {
    if ($('#setup').hidden) return;
    $('#setupErr').textContent = 'connection to the server was lost.';
  };
}

/* What the provider quietly stopped supporting, and what it gained. */
function capabilityDiff(before, after) {
  const isParam = (st) => ['orchestrator', 'subagent', 'rag'].includes(st.group) &&
                          ['number', 'select'].includes(st.kind) &&
                          !/provider|^model$/i.test(st.label || '');
  // Compared by label, not prompt: providers word the same setting differently
  // ("sent as num_predict" vs "sent as max_completion_tokens"), and that is not
  // a setting being dropped and re-added.
  const name = (x) => (x.label || x.prompt).toLowerCase();
  const had = new Set(before.map(name));
  const has = new Set(after.map(name));
  return {
    dropped: before.filter((x) => isParam(x) && !has.has(name(x))),
    added:   after.filter((x) => isParam(x) && !had.has(name(x))),
  };
}

async function finishRun() {
  const before = RUN.prev;
  const after = RUN.steps;
  // secrets are keyed by position, and positions may have shifted this run
  SECRETS = {};
  after.forEach((st, i) => {
    if (st.kind === 'password' && RUN.secrets[i] !== undefined) SECRETS[i] = RUN.secrets[i];
  });
  saveRecord(after, RECORD && RECORD.vault);
  if (VAULT_PASS && Object.keys(SECRETS).length) {
    saveRecord(after, await sealSecrets(VAULT_PASS, SECRETS));
  }

  const diff = RUN.plan ? capabilityDiff(before, after) : { dropped: [], added: [] };
  const notes = [];
  if (diff.dropped.length) {
    notes.push(diff.dropped.map((d) => d.label || d.prompt).join(', ') +
      ' — not applied, this provider does not support ' +
      (diff.dropped.length > 1 ? 'them.' : 'it.'));
  }
  if (diff.added.length) {
    notes.push('This provider also has ' +
      diff.added.map((d) => d.label || d.prompt).join(', ') + ', so you were asked for ' +
      (diff.added.length > 1 ? 'those.' : 'that.'));
  }

  const wasReplay = !!RUN.plan;
  const hasSecrets = Object.keys(SECRETS).length > 0;
  $('#setup').hidden = true;
  RUN = null;

  // Also when a change is what first brought a key into the picture.
  if (hasSecrets && !(RECORD && RECORD.vault) && !VAULT_PASS) {
    askPassphrase('save');           // offer to remember the key(s)
  }
  await boot();
  if (notes.length) {
    $('#settingsWarn').hidden = false;
    $('#settingsWarn').textContent = notes.join('  ');
  } else {
    $('#settingsWarn').hidden = true;
  }
  if (wasReplay) { fillSettings(); $('#settings').hidden = false; }
}

/* ---- passphrase panel ---------------------------------------------------- */
let vaultThen = null;

function askPassphrase(mode, then) {
  vaultThen = then || null;
  const saving = mode === 'save';
  $('#vault').hidden = false;
  $('#vaultErr').textContent = '';
  $('#vaultPass').value = '';
  $('#vaultPass2').value = '';
  $('#vaultPass2').hidden = !saving;
  $('#vaultTitle').textContent = saving ? 'Remember your API key?' : 'Unlock your API key';
  $('#vaultWhy').textContent = saving
    ? 'Pick a passphrase and the key is stored encrypted, so changing one setting later does not make you paste it again.'
    : 'Your key is stored encrypted. Type the passphrase to reuse it for this change.';
  $('#vaultHint').textContent = saving
    ? 'AES-GCM, key derived with PBKDF2-SHA256 at 600,000 iterations. The passphrase is never stored, so nothing on disk can be opened without it — and losing it just means typing the key again.'
    : 'If you would rather not, skip and you will simply be asked for the key.';
  $('#vaultGo').textContent = saving ? 'Save encrypted' : 'Unlock';
  $('#vaultPass').focus();
  $('#vault').dataset.mode = mode;
}

async function vaultConfirm() {
  const mode = $('#vault').dataset.mode;
  const pass = $('#vaultPass').value;
  if (!pass) { $('#vaultErr').textContent = 'type a passphrase'; return; }
  if (mode === 'save') {
    if (pass !== $('#vaultPass2').value) {
      $('#vaultErr').textContent = 'the two do not match'; return;
    }
    VAULT_PASS = pass;
    saveRecord(RECORD.steps, await sealSecrets(pass, SECRETS));
    $('#vault').hidden = true;
    return;
  }
  try {
    SECRETS = await openSecrets(pass, RECORD.vault);
  } catch (_) {
    $('#vaultErr').textContent = 'that passphrase does not open it';
    return;
  }
  VAULT_PASS = pass;
  $('#vault').hidden = true;
  const go = vaultThen; vaultThen = null;
  if (go) go();
}

/* ============================================================ telemetry == */

function gauge(key, percent, value, sub) {
  const g = document.querySelector(`.gauge[data-key="${key}"]`);
  if (!g) return;
  g.querySelector('.bar i').style.width = Math.max(0, Math.min(100, percent || 0)) + '%';
  g.querySelector('.gauge-val').textContent = value;
  g.querySelector('.gauge-sub').textContent = sub || '';
}

const TEL_KEY = 'infinitycode.telemetry';
let telemetryOn = localStorage.getItem(TEL_KEY) !== 'off';
let telemetryTimer = null;

/* Off means off: the polling stops, so the server is not asked to read the
   sensors at all while the switch is down. */
function setTelemetry(on) {
  telemetryOn = on;
  localStorage.setItem(TEL_KEY, on ? 'on' : 'off');
  $('#telemetryToggle').setAttribute('aria-pressed', String(on));
  $('#telemetry').classList.toggle('off', !on);
  $('#telemetryOff').hidden = on;
  if (telemetryTimer) { clearInterval(telemetryTimer); telemetryTimer = null; }
  if (on) {
    pollTelemetry();
    telemetryTimer = setInterval(pollTelemetry, 2000);
  }
}

async function pollTelemetry() {
  if (!telemetryOn) return;
  try {
    const t = await api('/api/telemetry');
    const c = t.cpu || {};
    gauge('cpu', c.percent, `${(c.percent ?? 0).toFixed(0)}%`,
      [c.cores ? `${c.cores} cores` : '', c.temp ? `${c.temp.toFixed(0)}°C` : '']
        .filter(Boolean).join(' · '));

    const m = t.memory || {};
    gauge('ram', m.percent, `${(m.percent ?? 0).toFixed(0)}%`,
      m.total_gb ? `${m.used_gb} / ${m.total_gb} GB` : '');

    if (t.gpu) {
      gauge('gpu', t.gpu.percent, `${(t.gpu.percent ?? 0).toFixed(0)}%`,
        [t.gpu.name, t.gpu.temp ? `${t.gpu.temp.toFixed(0)}°C` : '']
          .filter(Boolean).join(' · '));
      // A gpu can report how busy it is and still not report any memory --
      // a mac with no separate vram to speak of, say -- so the reading is
      // shown as unavailable rather than as "null / null GB".
      const hasVram = t.gpu.total_gb != null && t.gpu.used_gb != null;
      const pct = hasVram ? (t.gpu.used_gb / t.gpu.total_gb) * 100 : 0;
      gauge('vram', pct, hasVram ? `${pct.toFixed(0)}%` : 'n/a',
        hasVram ? `${t.gpu.used_gb} / ${t.gpu.total_gb} GB` : '');
    } else {
      gauge('gpu', 0, 'n/a', 'no reporting gpu found');
      gauge('vram', 0, 'n/a', '');
    }
  } catch (_) { /* a poll that fails just waits for the next one */ }
}

/* =========================================================== backgrounds = */

const BG_KEY = 'infinitycode.slideshow';        // 'on' | 'off'
// v2 intentionally ignores the old scale where 50 meant "original". That
// saved value would make an unchanged image look half as bright on this scale.
const BRIGHTNESS_KEY = 'infinitycode.bgbrightness.v2';

/* A literal percentage: 100 is the uploaded image unchanged and 0 is black.
   Write the filter on the layers themselves so there is no inherited state or
   overlay between the slider and the pixels being displayed. */
function applyBrightness(percent) {
  const clamped = Math.max(0, Math.min(100, Number(percent)));
  const filter = `brightness(${clamped / 100})`;
  layers().forEach((layer) => { layer.style.filter = filter; });
  $('#bgOpacityVal').textContent = clamped + '%';
  $('#bgOpacity').value = String(clamped);
  localStorage.setItem(BRIGHTNESS_KEY, String(clamped));
}
let bgList = [], bgIndex = 0, activeLayer = 1, bgTimer = null;

const layers = () => [$('#bgLayer1'), $('#bgLayer2')];

/* Fade whichever layer is idle up over the one on show, then swap which is
   which. Two layers is what makes it a dissolve rather than a cut. */
function showBackground(url) {
  const [one, two] = layers();
  const shown = activeLayer === 1 ? one : two;
  const idle  = activeLayer === 1 ? two : one;
  idle.style.backgroundImage = `url("${url}")`;
  idle.classList.add('active');
  shown.classList.remove('active');
  activeLayer = activeLayer === 1 ? 2 : 1;
  document.querySelectorAll('.thumb').forEach((t) =>
    t.classList.toggle('on', t.dataset.url === url));
}

function nextBackground() {
  if (!bgList.length) return;
  showBackground(bgList[bgIndex % bgList.length].url);
  bgIndex++;
}

function stopTimer() { if (bgTimer) { clearInterval(bgTimer); bgTimer = null; } }

function startSlideshow() {
  stopTimer();
  if (!bgList.length) return;
  nextBackground();
  bgTimer = setInterval(nextBackground, 5000);
  localStorage.setItem(BG_KEY, 'on');
}

function stopSlideshow() {
  stopTimer();
  layers().forEach((l) => { l.classList.remove('active'); l.style.backgroundImage = 'none'; });
  document.querySelectorAll('.thumb').forEach((t) => t.classList.remove('on'));
  localStorage.setItem(BG_KEY, 'off');
}

/* Clicking a thumbnail jumps straight to it and carries on cycling from there. */
function jumpTo(url) {
  const at = bgList.findIndex((b) => b.url === url);
  if (at !== -1) bgIndex = at + 1;
  showBackground(url);
  stopTimer();
  bgTimer = setInterval(nextBackground, 5000);
  localStorage.setItem(BG_KEY, 'on');
}

async function loadBackgrounds({ autostart = false } = {}) {
  const got = await api('/api/backgrounds');
  bgList = got.backgrounds || [];
  const box = $('#thumbs');
  box.innerHTML = '';
  bgList.forEach((b) => {
    const t = el('div', 'thumb');
    t.dataset.url = b.url;
    const img = el('img');
    img.src = b.url;
    img.alt = b.name;
    img.loading = 'lazy';
    const kill = el('span', 'kill', '\u00d7');
    kill.onclick = async (e) => {
      e.stopPropagation();
      await fetch('/api/backgrounds/' + encodeURIComponent(b.name), { method: 'DELETE' });
      await loadBackgrounds({ autostart: bgTimer !== null });
    };
    t.append(img, kill);
    t.onclick = () => jumpTo(b.url);
    box.appendChild(t);
  });
  if (!bgList.length) { stopTimer(); return; }
  if (autostart && localStorage.getItem(BG_KEY) !== 'off') startSlideshow();
}

/* ================================================================ chats == */

async function loadChats() {
  chats = (await api('/api/chats')).chats || [];
  const list = $('#chatList');
  list.innerHTML = '';
  if (!chats.length) list.appendChild(el('p', 'empty-note', 'No chats yet.'));
  chats.forEach((c) => {
    const li = el('li');
    li.className = c.id === currentChat ? 'on' : '';
    li.appendChild(el('span', 'name', c.title));
    li.appendChild(el('span', 'count', c.messages ? String(c.messages) : ''));
    const kill = el('span', 'kill', '×');
    kill.onclick = async (e) => {
      e.stopPropagation();
      await fetch('/api/chats/' + c.id, { method: 'DELETE' });
      if (currentChat === c.id) {
        currentChat = null;
        $('#transcript').innerHTML = '';
        $('#rawBtn').disabled = true;
      }
      await loadChats();
      if (!currentChat && chats.length) selectChat(chats[0].id);
    };
    li.appendChild(kill);
    li.onclick = () => selectChat(c.id);
    list.appendChild(li);
  });
}

async function loadAgents() {
  if (!currentChat) return;
  const got = await api(`/api/chats/${currentChat}/agents`);
  const list = $('#agentList');
  const agents = got.agents || [];
  $('#agentBlock').hidden = !agents.length;
  list.innerHTML = '';
  agents.forEach((a) => {
    const li = el('li');
    li.className = viewingAgent === a.name ? 'on' : '';
    li.appendChild(el('span', 'name', a.name));
    li.appendChild(el('span', 'count', String(a.messages)));
    li.onclick = () => showAgent(a.name);
    list.appendChild(li);
  });
}

/* Every label the trace can show, and the order matters only for lookup. */
const TRACE_LABELS = {
  think:      'thinking...',
  call:       'tool calling...',
  result:     'reading results',
  websearch:  'fetching web results...',
  command:    'executing command...',
  webpg:      'fetching web page...',
  playwright: 'browsing...',
};

/* Cut the raw stream into what it is made of: the answer itself, the model's
   thinking, the tool calls and the tool results. */
function segmentStream(raw) {
  const out = [];
  const push = (kind, body) => { if (body) out.push({ kind, body }); };
  let i = 0;
  while (i < raw.length) {
    const marks = [
      [raw.indexOf('\x01', i), 'think'],
      [raw.indexOf('<tool>', i), 'call'],
      [raw.indexOf('<tool_result>', i), 'result'],
    ].filter(([at]) => at >= 0).sort((a, b) => a[0] - b[0]);

    if (!marks.length) { push('text', raw.slice(i)); break; }
    const [at, kind] = marks[0];
    if (at > i) push('text', raw.slice(i, at));

    let close, width;
    if (kind === 'think')       { close = raw.indexOf('\x02', at + 1); width = 1; }
    else if (kind === 'call')   { close = raw.indexOf('</tool>', at); width = 7; }
    else                        { close = raw.indexOf('</tool_result>', at); width = 14; }

    if (close === -1) {                       // still streaming, take the rest
      push(kind, raw.slice(kind === 'think' ? at + 1 : at));
      break;
    }
    push(kind, raw.slice(kind === 'think' ? at + 1 : at, kind === 'think' ? close : close + width));
    i = close + (kind === 'think' ? 1 : width);
  }
  return out;
}

/* Which of the seven a tool call actually is, from the tag inside it. */
function traceKind(seg, body) {
  if (seg.kind !== 'call') return seg.kind;
  const hit = body.match(/<tool>\s*<([A-Za-z_]+)>/);
  const inner = hit ? hit[1].toLowerCase() : '';
  return TRACE_LABELS[inner] ? inner : 'call';
}

function renderStream(node, raw) {
  if (!node._open) node._open = new Set();   // survives a re-render mid-stream
  node.textContent = '';
  segmentStream(raw).forEach((seg, index) => {
    const body = seg.body.replace(/[\x01\x02\x03]/g, '');
    if (seg.kind === 'text') {
      if (body) node.appendChild(document.createTextNode(body));
      return;
    }
    const kind = traceKind(seg, body);
    const box = el('div', 'trace trace-' + kind);
    const label = el('button', 'trace-label', TRACE_LABELS[kind] || TRACE_LABELS.call);
    label.type = 'button';
    const text = el('pre', 'trace-body');
    text.textContent = body.trim();

    const open = node._open.has(index);       // collapsed unless it was opened
    text.hidden = !open;
    box.classList.toggle('open', open);
    label.onclick = () => {
      const opening = text.hidden;
      text.hidden = !opening;
      box.classList.toggle('open', opening);
      if (opening) node._open.add(index); else node._open.delete(index);
    };
    box.append(label, text);
    node.appendChild(box);
  });
}

function addMessage(role, content) {
  const wrap = el('div', 'msg ' + role);
  wrap.appendChild(el('div', 'msg-role', role === 'user' ? 'You' : 'InfinityCode'));
  const body = el('div', 'msg-body');
  const text = el('div', 'msg-text text-block frame');
  renderStream(text, content || '');
  body.appendChild(text);
  wrap.appendChild(body);
  $('#transcript').appendChild(wrap);
  $('#transcript').scrollTop = $('#transcript').scrollHeight;
  return text;
}

function paint(messages) {
  const t = $('#transcript');
  t.innerHTML = '';
  (messages || []).forEach((m) => addMessage(m.role, m.content));
}

async function selectChat(id) {
  currentChat = id;
  viewingAgent = null;
  $('#backToChat').hidden = true;
  $('#rawBtn').disabled = false;
  const chat = await api('/api/chats/' + id);
  $('#stageTitle').textContent = chat.title || 'Chat';
  $('#stageSub').textContent = STATE.orchestrator || '';
  paint(chat.messages);
  await loadChats();
  await loadAgents();
  openSocket(id);
}

async function showAgent(name) {
  if (!currentChat) return;
  viewingAgent = name;
  const got = await api(`/api/chats/${currentChat}/agents/${encodeURIComponent(name)}`);
  $('#stageTitle').textContent = name;
  $('#stageSub').textContent = 'this agent\'s own history in this chat';
  $('#backToChat').hidden = false;
  paint((got.messages || []).filter((m) => m.role !== 'system'));
  loadAgents();
}

/* ============================================================ streaming == */

function openSocket(id) {
  if (socket) { socket.onclose = null; socket.close(); }
  socket = new WebSocket(wsURL(`/api/chats/${id}/stream`));

  let live = null, raw = '', pending = false;
  // A timer, not requestAnimationFrame: rAF is suspended while the window is
  // hidden, which would freeze the transcript until the turn ended.
  const flush = () => { pending = false; if (live) renderStream(live, raw); };

  socket.onmessage = (e) => {
    const msg = JSON.parse(e.data);

    if (msg.type === 'out') {
      if (viewingAgent) return;
      if (!live) { live = addMessage('assistant', ''); raw = ''; }
      raw += msg.text;
      if (!pending) { pending = true; setTimeout(flush, 60); }
      $('#transcript').scrollTop = $('#transcript').scrollHeight;
      return;
    }

    if (msg.type === 'ask') {
      const wrap = el('div', 'msg ask');
      const inner = el('div', 'ask-inner text-block frame');
      const q = el('div', 'ask-q text-block');
      q.style.padding = '10px 12px';
      q.textContent = msg.prompt;
      const row = el('div', 'ask-row');
      const input = el('input');
      input.type = 'text';
      const send = el('button', 'btn btn-gold', 'Answer');
      send.type = 'button';
      const reply = () => {
        socket.send(JSON.stringify({ type: 'answer', answer: input.value }));
        input.disabled = send.disabled = true;
      };
      send.onclick = reply;
      input.onkeydown = (ev) => { if (ev.key === 'Enter') reply(); };
      row.append(input, send);
      inner.append(q, row);
      wrap.appendChild(inner);
      $('#transcript').appendChild(wrap);
      $('#transcript').scrollTop = $('#transcript').scrollHeight;
      input.focus();
      live = null;
      return;
    }

    if (msg.type === 'error') {
      const wrap = el('div', 'msg assistant');
      const body = el('div', 'msg-body');
      const text = el('div', 'msg-text text-block frame', msg.text);
      text.style.color = 'var(--danger)';
      body.appendChild(text);
      wrap.appendChild(body);
      $('#transcript').appendChild(wrap);
      return;
    }

    if (msg.type === 'done') {
      flush();
      live = null;
      setRunning(false);
      return;
    }

    if (msg.type === 'chat') {
      $('#stageTitle').textContent = msg.title || 'Chat';
      loadChats();
      loadAgents();
    }
  };
}

function setRunning(on) {
  running = on;
  if (!$('#settings').hidden) fillSettings();
  $('#sendBtn').disabled = on;
  $('#stopBtn').hidden = !on;
  $('#promptBox').disabled = on;
  if (!on) $('#promptBox').focus();
}

function send() {
  const box = $('#promptBox');
  const text = box.value.trim();
  if (!text || running || !socket || socket.readyState !== 1) return;
  if (viewingAgent) { $('#backToChat').click(); }
  addMessage('user', text);
  socket.send(JSON.stringify({ type: 'prompt', prompt: text }));
  box.value = '';
  box.style.height = 'auto';
  setRunning(true);
}

/* ================================================================= boot == */

const ROWS = [
  ['Project folder', () => STATE.folder, 'folder'],
  ['Virtual environment', () => STATE.venv, 'venv'],
  ['Orchestrator', () => STATE.orchestrator, 'orchestrator'],
  ['Chat template', () => STATE.chat_template, 'chat_template'],
  ['Subagents', () => (STATE.subagents_enabled ? (STATE.subagent || 'shared') : 'off'), 'subagent'],
  ['Web page engine', () => STATE.webpg_engine, 'web'],
  ['Web search', () => STATE.websearch_provider, 'web'],
  ['Page ranking', () => STATE.rag || 'off', 'rag'],
  ['Command timeout', () => (STATE.command_timeout ? STATE.command_timeout + ' s' : null), 'timeout'],
  ['MCP servers', () => {
    const ok = STATE.mcp_servers || [], bad = STATE.mcp_failed || [];
    if (!ok.length && !bad.length) return null;
    const counts = STATE.mcp_tools || {};
    return ok.map((n) => n + ' (' + (counts[n] || 0) + ' tools)').join(', ') +
           (bad.length ? ' · failed: ' + bad.join(', ') : '');
  }, 'mcp'],
  ['Tool permissions', () => {
    const auto = STATE.auto_tools || [];
    return (STATE.auto_dangerous ? 'dangerous commands run on their own'
                                 : 'dangerous commands ask first') + ' · ' +
           (auto.length ? 'no prompt for: ' + auto.join(', ') : 'every tool asks');
  }, 'danger'],
  ['Tools', () => (STATE.tools || []).map((t) => t.split(':')[0]).join(', '), 'tools'],
];

const stepsIn = (group) =>
  ((RECORD && RECORD.steps) || []).map((st, i) => ({ ...st, i }))
    .filter((st) => st.group === group);

function fillSettings() {
  const box = $('#settingsSummary');
  box.innerHTML = '';
  const known = !!(RECORD && RECORD.steps && RECORD.steps.length);
  ROWS.forEach(([name, get, group]) => {
    const value = get();
    if (!value) return;
    const row = el('div', 'srow');
    row.append(el('dt', null, name), el('dd', null, String(value)));
    const btn = el('button', 'btn btn-ghost btn-sm', 'Change');
    btn.type = 'button';
    btn.disabled = !known || running;
    btn.title = known ? '' : 'run setup once first';
    btn.onclick = () => group === 'chat_template'
      ? openChatTemplatePicker()
      : beginChange(group, name);
    row.appendChild(btn);
    box.appendChild(row);
  });
}

function openChatTemplatePicker() {
  const select = $('#chatTemplateSelect');
  select.innerHTML = '';
  (STATE.chat_template_options || []).forEach((row) => {
    const option = el('option', null, row.label);
    option.value = row.value;
    option.dataset.setupValue = row.setup_value;
    select.appendChild(option);
  });
  select.value = STATE.chat_template_id || 'model';
  $('#chatTemplatePath').value = '';
  $('#chatTemplateErr').textContent = '';
  const toggle = () => {
    $('#chatTemplateFileRow').hidden = select.value !== 'custom';
    $('#chatTemplateSave').disabled = select.value === 'custom' &&
      !$('#chatTemplatePath').value.trim();
  };
  select.onchange = toggle;
  $('#chatTemplatePath').oninput = toggle;
  toggle();
  $('#chatTemplatePicker').hidden = false;
}

function rememberActiveTemplate(selection, path) {
  if (!RECORD || !RECORD.steps) return;
  const option = (STATE.chat_template_options || []).find((o) => o.value === selection);
  const at = RECORD.steps.findIndex((st) => st.label === 'Chat template');
  if (at < 0 || !option) return;
  RECORD.steps[at].answer = option.setup_value;
  RECORD.steps[at].shown = option.label;
  const pathPrompt = 'Path to the custom Jinja chat-template FILE: ';
  let pathAt = RECORD.steps.findIndex((st) => st.prompt === pathPrompt);
  if (selection === 'custom') {
    const step = { prompt: pathPrompt, label: 'Custom chat template', kind: 'path',
                   group: RECORD.steps[at].group, shown: path, answer: path };
    if (pathAt < 0) RECORD.steps.splice(at + 1, 0, step);
    else RECORD.steps[pathAt] = step;
  }
  saveRecord(RECORD.steps, RECORD.vault);
}

/* ---- choosing what inside a setting to change ---------------------------- */
let pickerGroup = null;

function beginChange(group, name) {
  const steps = stepsIn(group);
  if (!steps.length) return;
  if (steps.length === 1) { preflight(steps, name); return; }
  pickerGroup = { steps, name };
  $('#pickerTitle').textContent = 'Change ' + name.toLowerCase();
  $('#pickerNote').textContent =
    'These are the settings ' + name.toLowerCase() + ' actually has — the list comes ' +
    'from what this provider supports, so anything it cannot do is not offered.';
  const list = $('#pickerList');
  list.innerHTML = '';
  steps.forEach((st) => {
    const lab = el('label', 'check');
    const cb = el('input');
    cb.type = 'checkbox';
    cb.dataset.i = st.i;
    const txt = el('div');
    txt.appendChild(el('b', null, st.label || st.prompt.slice(0, 60)));
    txt.appendChild(el('span', null, String(st.shown ?? st.answer ?? '').slice(0, 90)));
    lab.append(cb, txt);
    list.appendChild(lab);
  });
  list.onchange = () => {
    $('#pickerGo').disabled = !list.querySelectorAll('input:checked').length;
  };
  $('#pickerGo').disabled = true;
  $('#picker').hidden = false;
}

/* ---- warn about what comes after, then let them choose ------------------- */
let pendingPlan = null;

function preflight(targets, name) {
  $('#picker').hidden = true;
  const all = (RECORD && RECORD.steps) || [];
  const first = Math.min(...targets.map((t) => t.i));
  const after = all.slice(first + 1).filter((st) => !targets.some((t) => t.prompt === st.prompt));
  const targetPrompts = new Set(targets.map((t) => t.prompt));

  $('#preflightWhat').textContent =
    'Changing ' + (name ? name.toLowerCase() + ' — ' : '') +
    targets.map((t) => (t.label || t.prompt).toLowerCase()).join(', ') + '.';
  const list = $('#preflightList');
  list.innerHTML = '';
  if (!after.length) list.appendChild(el('li', null, 'Nothing comes after it.'));
  after.forEach((st) => {
    list.appendChild(el('li', null, (st.label || st.prompt.slice(0, 48)) + ' — ' +
      String(st.shown ?? st.answer ?? '').slice(0, 48)));
  });

  // Every earlier answer is re-sent to get back to this point, so a key
  // anywhere in the run matters, not just one after the thing being changed.
  const needsKey = all.some((st) => st.kind === 'password');
  const haveKeys = Object.keys(SECRETS).length > 0;
  const locked = needsKey && !haveKeys && !!(RECORD && RECORD.vault);
  $('#preflightWarn').hidden = !needsKey || haveKeys;
  if (needsKey && !haveKeys) {
    $('#preflightWarn').textContent = locked
      ? 'Getting back to this point re-sends your API key. You will be asked for the passphrase — or skip it and paste the key instead.'
      : 'Getting back to this point re-sends your API key, which is not saved, so you will be asked to paste it.';
  }

  pendingPlan = { targets: targetPrompts, after, locked: !!locked };
  $('#preflight').hidden = false;
}

async function launchReplay(mode) {
  const plan = { targets: pendingPlan.targets, mode };
  const locked = pendingPlan.locked;
  $('#preflight').hidden = true;
  pendingPlan = null;
  const go = async () => {
    await api('/api/setup/reset', { method: 'POST' });
    $('#settings').hidden = true;
    $('#settingsWarn').hidden = true;
    startSetup(plan);
  };
  if (locked) askPassphrase('unlock', go); else go();
}

async function boot() {
  STATE = await api('/api/state');
  if (!STATE.configured) { startSetup(); return; }
  $('#app').hidden = false;
  $('#setup').hidden = true;
  fillSettings();
  await loadBackgrounds({ autostart: true });
  await loadChats();
  if (!chats.length) {
    const made = await api('/api/chats', { method: 'POST' });
    await loadChats();
    selectChat(made.id);
  } else {
    selectChat(chats[0].id);
  }
  setTelemetry(telemetryOn);
}

/* --------------------------------------------------------------- wiring - */

$('#newChat').onclick = async () => {
  const made = await api('/api/chats', { method: 'POST' });
  await loadChats();
  selectChat(made.id);
};

$('#backToChat').onclick = () => { if (currentChat) selectChat(currentChat); };

/* One window per chat, named after it: clicking Raw again brings the window
   that is already open back to the front instead of opening a second one. */
$('#rawBtn').onclick = () => {
  if (!currentChat) return;
  const win = window.open('/raw?chat=' + encodeURIComponent(currentChat),
                          'infinitycode-raw-' + currentChat,
                          'width=1080,height=860,noopener=no');
  if (win) win.focus();
};

$('#composer').onsubmit = (e) => { e.preventDefault(); send(); };

$('#promptBox').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
});
$('#promptBox').addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 190) + 'px';
});

$('#stopBtn').onclick = () => {
  if (socket && socket.readyState === 1) socket.send(JSON.stringify({ type: 'stop' }));
};

$('#browseImages').onclick = async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  btn.textContent = 'Choosing…';
  try {
    const got = await api('/api/backgrounds/pick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (got.error) alert(got.error);
    else {
      await loadBackgrounds({ autostart: true });
      if (got.added && got.added.length) jumpTo(got.added[got.added.length - 1].url);
    }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Browse image';
  }
};

$('#clearBg').onclick = () => stopSlideshow();
$('#openSettings').onclick = () => { fillSettings(); $('#settings').hidden = false; };
$('#closeSettings').onclick = () => { $('#settings').hidden = true; };
$('#chatTemplateCancel').onclick = () => { $('#chatTemplatePicker').hidden = true; };
$('#chatTemplateBrowse').onclick = async () => {
  const button = $('#chatTemplateBrowse');
  button.disabled = true;
  try {
    const got = await api('/api/pick', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'jinja' }),
    });
    if (got.error) $('#chatTemplateErr').textContent = got.error;
    else if (got.path) {
      $('#chatTemplatePath').value = got.path;
      $('#chatTemplatePath').dispatchEvent(new Event('input'));
    }
  } finally { button.disabled = false; }
};
$('#chatTemplateSave').onclick = async () => {
  const selection = $('#chatTemplateSelect').value;
  const path = $('#chatTemplatePath').value.trim();
  $('#chatTemplateSave').disabled = true;
  const got = await api('/api/chat-template', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selection, path }),
  });
  if (got.error) {
    $('#chatTemplateErr').textContent = got.error;
    $('#chatTemplateSave').disabled = false;
    return;
  }
  STATE.chat_template = got.name;
  STATE.chat_template_id = got.selection;
  rememberActiveTemplate(got.selection, got.path || path);
  $('#chatTemplatePicker').hidden = true;
  fillSettings();
};
$('#rerunSetup').onclick = async () => {
  await api('/api/setup/reset', { method: 'POST' });
  location.reload();
};

$('#pickerCancel').onclick = () => { $('#picker').hidden = true; };
$('#pickerGo').onclick = () => {
  const chosen = [...$('#pickerList').querySelectorAll('input:checked')]
    .map((c) => pickerGroup.steps.find((st) => String(st.i) === c.dataset.i));
  preflight(chosen, pickerGroup.name);
};
$('#preflightCancel').onclick = () => { $('#preflight').hidden = true; pendingPlan = null; };
$('#preflightReuse').onclick = () => launchReplay('reuse');
$('#preflightAsk').onclick = () => launchReplay('ask');
$('#vaultGo').onclick = () => vaultConfirm();
$('#vaultSkip').onclick = () => {
  $('#vault').hidden = true;
  const go = vaultThen; vaultThen = null;
  if (go) go();
};
$('#vaultPass2').onkeydown = (e) => { if (e.key === 'Enter') vaultConfirm(); };
$('#vaultPass').onkeydown = (e) => {
  if (e.key === 'Enter' && $('#vaultPass2').hidden) vaultConfirm();
};

$('#bgOpacity').oninput = (e) => applyBrightness(e.target.value);
applyBrightness(localStorage.getItem(BRIGHTNESS_KEY) ?? 100);

$('#telemetryToggle').onclick = () => setTelemetry(!telemetryOn);
$('#telemetryToggle').setAttribute('aria-pressed', String(telemetryOn));

loadRecord();
boot();
