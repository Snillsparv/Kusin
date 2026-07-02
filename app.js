/* ═══════════════ Kusinsemestern 2026 – app.js ═══════════════ */
'use strict';

/* ─────────────── Grunddata ─────────────── */

const YEAR = 2026;
const MONTH = 7; // augusti (0-indexerad)
const TRIP_START = 8;
const TRIP_END = 22;
const COOK_START = 8;  // första middagen lagas på ankomstdagen
const COOK_END = 21;   // avresedagen 22:a är frukostfri

// Så som gruppchatten ser ut just nu. presence = på plats, cook = kan stå i matlag.
const PEOPLE = [
  { id: 'hakan',   name: 'Håkan',    note: 'Färjegeneral ⛴️',        presence: [8, 22],  cook: [8, 21] },
  { id: 'ak',      name: 'A-K',      note: 'Minnesansvarig 🤩',      presence: [8, 22],  cook: [8, 21] },
  { id: 'otto',    name: 'Otto',     note: '»Jag är nog med hela!«', presence: [8, 22],  cook: [8, 21] },
  { id: 'lena',    name: 'Lena',     note: 'Har bokat! 😀',          presence: [8, 22],  cook: [8, 21] },
  { id: 'larsake', name: 'Lars-Åke', note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'nora',    name: 'Nora',     note: 'Båda veckorna 🤩',       presence: [8, 22],  cook: [8, 21] },
  { id: 'jonas',   name: 'Jonas',    note: 'Anadasama! 🤸🥳',        presence: [8, 22],  cook: [8, 21] },
  { id: 'jessica', name: 'Jessica',  note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'kalle',   name: 'Kalle',    note: 'Hedersgäst & maskot 👶', presence: [8, 22],  cook: [8, 21],
    inDraw: false, rnote: 'Dispens beviljad: 0 år. Får röra i grytan under uppsikt.' },
  { id: 'jakob',   name: 'Jakob',    note: 'Flyger via CPH ✈️',      presence: [8, 22],  cook: [8, 21] },
  { id: 'hannes',  name: 'Hannes',   note: 'Båda veckorna',          presence: [8, 22],  cook: [8, 21] },
  { id: 'ivan',    name: 'Ivan',     note: 'Båda veckorna',          presence: [8, 22],  cook: [8, 21] },
  { id: 'alice',   name: 'Alice',    note: 'Andra halvan 🤠',        presence: [15, 22], cook: [15, 21] },
  { id: 'george',  name: 'George',   note: '9–13 aug',               presence: [9, 13],  cook: [9, 12],
    rnote: 'Reser hem den 13:e' },
  { id: 'ellen',   name: 'Ellen',    note: '9–13 aug',               presence: [9, 13],  cook: [9, 12],
    rnote: 'Reser hem den 13:e' },
];

const STORAGE_KEY = 'kusinsemestern2026';

/* ─────────────── Hjälpfunktioner ─────────────── */

const $ = (sel) => document.querySelector(sel);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COOK_DAYS = range(COOK_START, COOK_END);

const dowFmt = new Intl.DateTimeFormat('sv-SE', { weekday: 'short' });
const dow = (d) => dowFmt.format(new Date(YEAR, MONTH, d));
const fmtDay = (d) => `${d} aug`;
const fmtDateTime = (iso) => new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(iso));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─────────────── Tillstånd & lagring ─────────────── */

let state = {
  roster: {},   // id -> { included, from, to }
  custom: [],   // [{ id, name, from, to }]
  result: null, // { days: { '8': ['Namn', 'Namn'], ... }, drawnAt }
  locked: false,
  lockedAt: null,
};

function defaultRoster() {
  const r = {};
  for (const p of PEOPLE) {
    r[p.id] = { included: p.inDraw !== false, from: p.cook[0], to: p.cook[1] };
  }
  return r;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) { /* privat läge m.m. – sidan funkar ändå */ }
}

function loadState() {
  state.roster = defaultRoster();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved && typeof saved === 'object') {
      for (const [id, entry] of Object.entries(saved.roster || {})) {
        if (state.roster[id] && entry && typeof entry === 'object') {
          state.roster[id] = {
            included: !!entry.included,
            from: clampDay(entry.from, state.roster[id].from),
            to: clampDay(entry.to, state.roster[id].to),
          };
        }
      }
      for (const c of saved.custom || []) {
        if (c && c.id && c.name) {
          const from = clampDay(c.from, COOK_START);
          const to = clampDay(c.to, COOK_END);
          state.custom.push({ id: String(c.id), name: String(c.name).slice(0, 30), from, to });
          state.roster[c.id] = {
            included: saved.roster?.[c.id]?.included !== false,
            from: clampDay(saved.roster?.[c.id]?.from, from),
            to: clampDay(saved.roster?.[c.id]?.to, to),
          };
        }
      }
      if (saved.result && saved.result.days) state.result = saved.result;
      state.locked = !!saved.locked;
      state.lockedAt = saved.lockedAt || null;
    }
  } catch (e) { /* korrupt lagring – börja om från början */ }
}

function clampDay(value, fallback) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < COOK_START || n > COOK_END) return fallback;
  return n;
}

function allParticipants() {
  return [
    ...PEOPLE.map((p) => ({ id: p.id, name: p.name, rnote: p.rnote || '', custom: false })),
    ...state.custom.map((c) => ({ id: c.id, name: c.name, rnote: '', custom: true })),
  ];
}

function activeEntrants() {
  return allParticipants()
    .map((p) => {
      const r = state.roster[p.id];
      if (!r || !r.included) return null;
      const from = Math.min(r.from, r.to);
      const to = Math.max(r.from, r.to);
      return { id: p.id, name: p.name, days: new Set(range(from, to)) };
    })
    .filter((e) => e && e.days.size > 0);
}

/* ─────────────── Nedräkning ─────────────── */

function renderCountdown() {
  const el = $('#countdown');
  const start = new Date(YEAR, MONTH, TRIP_START);
  const end = new Date(YEAR, MONTH, TRIP_END, 23, 59, 59);
  const now = new Date();

  if (now >= start && now <= end) {
    el.innerHTML = '<div class="cd-box cd-here">🏖️ SEMESTERN PÅGÅR!</div>';
    return;
  }
  if (now > end) {
    el.innerHTML = '<div class="cd-box cd-here">Another summer… nästa år! 💛</div>';
    return;
  }
  const ms = start - now;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const box = (num, label) =>
    `<div class="cd-box"><span class="cd-num">${num}</span><span class="cd-label">${label}</span></div>`;
  el.innerHTML = box(d, 'dagar') + box(h, 'timmar') + box(m, 'min') + box(s, 'sek');
}

/* ─────────────── Närvaroschema ─────────────── */

function renderChart() {
  const el = $('#narvaro-chart');
  const days = range(TRIP_START, TRIP_END);
  el.style.gridTemplateColumns = `minmax(130px, auto) repeat(${days.length}, 1fr)`;

  let html = '<div role="row" style="display: contents">' +
    '<div class="cell head" role="columnheader">Namn</div>';
  for (const d of days) {
    html += `<div class="cell head" role="columnheader">${d}<span class="dow">${dow(d)}</span></div>`;
  }
  html += '</div>';
  PEOPLE.forEach((p, i) => {
    const rowClass = i % 2 === 0 ? ' row-even' : '';
    const kalleEmoji = p.id === 'kalle' ? ' 👶' : '';
    html += '<div role="row" style="display: contents">' +
      `<div class="cell pname${rowClass}" role="rowheader">${p.name}${kalleEmoji}` +
      (p.note ? `<span class="pnote">${p.note}</span>` : '') + '</div>';
    for (const d of days) {
      const on = d >= p.presence[0] && d <= p.presence[1];
      const travelClass = on && (d === p.presence[0] || d === p.presence[1]) ? ' travel' : '';
      const label = on
        ? `${p.name} ${d === p.presence[0] ? 'anländer' : d === p.presence[1] ? 'reser hem' : 'är på plats'} ${fmtDay(d)}`
        : `${p.name} är inte på plats ${fmtDay(d)}`;
      html += `<div class="cell day${rowClass} ${on ? 'on' : 'off'}${on ? travelClass : ''}" role="cell" aria-label="${label}" title="${label}"></div>`;
    }
    html += '</div>';
  });
  el.innerHTML = html;
}

/* ─────────────── Deltagarförteckning (§ 1) ─────────────── */

function dayOptions(selected) {
  return COOK_DAYS
    .map((d) => `<option value="${d}"${d === selected ? ' selected' : ''}>${fmtDay(d)}</option>`)
    .join('');
}

function renderRoster() {
  const el = $('#roster');
  el.innerHTML = '';
  const frozen = state.locked || ceremonyActive;
  for (const p of allParticipants()) {
    const r = state.roster[p.id];
    if (!r) continue;
    const row = document.createElement('div');
    row.className = 'roster-row' + (r.included ? '' : ' excluded');
    const name = esc(p.name);
    row.innerHTML =
      `<input type="checkbox" id="chk-${p.id}" ${r.included ? 'checked' : ''} ${frozen ? 'disabled' : ''} aria-label="${name} deltar i lottningen">` +
      `<label class="roster-name" for="chk-${p.id}">${name}` +
      (p.rnote ? `<span class="roster-note">${esc(p.rnote)}</span>` : '') + '</label>' +
      `<span class="roster-dates">lagar mat
        <select data-id="${p.id}" data-edge="from" ${frozen ? 'disabled' : ''} aria-label="Första möjliga dag för ${name}">${dayOptions(r.from)}</select> –
        <select data-id="${p.id}" data-edge="to" ${frozen ? 'disabled' : ''} aria-label="Sista möjliga dag för ${name}">${dayOptions(r.to)}</select>
      </span>` +
      (p.custom ? `<button type="button" class="roster-remove" data-remove="${p.id}" ${frozen ? 'disabled' : ''} title="Ta bort ${name}">✕</button>` : '');
    el.appendChild(row);

    row.querySelector('input[type="checkbox"]').addEventListener('change', (ev) => {
      state.roster[p.id].included = ev.target.checked;
      onRosterChanged();
    });
    row.querySelectorAll('select').forEach((sel) => {
      sel.addEventListener('change', () => {
        const edge = sel.dataset.edge;
        state.roster[p.id][edge] = clampDay(sel.value, edge === 'from' ? COOK_START : COOK_END);
        onRosterChanged();
      });
    });
    const removeBtn = row.querySelector('[data-remove]');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        state.custom = state.custom.filter((c) => c.id !== p.id);
        delete state.roster[p.id];
        onRosterChanged();
      });
    }
  }
}

function onRosterChanged() {
  if (!state.locked && state.result) {
    cancelCeremony();
    state.result = null;
    $('#result-section').hidden = true;
    $('#finalize-section').hidden = true;
    $('#draw-btn').disabled = false;
    $('#draw-status').textContent = 'Förteckningen har ändrats – lottningen behöver förrättas på nytt.';
  }
  saveState();
  renderRoster();
}

function setupAddPerson() {
  $('#new-from').innerHTML = dayOptions(COOK_START);
  $('#new-to').innerHTML = dayOptions(COOK_END);
  let counter = state.custom.reduce((max, c) => {
    const n = Number(String(c.id).split('-')[1]);
    return Number.isFinite(n) ? Math.max(max, n) : max;
  }, 0);
  $('#add-person').addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (state.locked || ceremonyActive) return;
    const name = $('#new-name').value.trim().slice(0, 30);
    if (!name) return;
    counter += 1;
    const slug = name.toLowerCase().replace(/[^a-zåäö0-9]/gi, '');
    let id = `egen-${counter}-${slug}`;
    while (state.roster[id]) {
      counter += 1;
      id = `egen-${counter}-${slug}`;
    }
    const from = clampDay($('#new-from').value, COOK_START);
    const to = clampDay($('#new-to').value, COOK_END);
    state.custom.push({ id, name, from, to });
    state.roster[id] = { included: true, from, to };
    $('#new-name').value = '';
    onRosterChanged();
  });
}

/* ─────────────── Lottningsalgoritmen ─────────────── */
/* Slumpad tilldelning med omtag: många försök görs, det bästa utfallet vinner.
   Hårda mål: alla dagar bemannas med två, var och en lagar sitt rättvist
   uträknade antal pass. Mjuka mål (poängavdrag): inga pass två dagar i rad
   och inga upprepade par. */

function computeTargets(entrants, totalSlots) {
  // Jämnt antal pass per person: ingen får sitt tredje pass innan alla fått
  // sitt andra, osv. Den som är på plats färre dagar än sitt mål tar så
  // många pass som ryms. Uddapass lottas ut.
  const t = new Map(entrants.map((e) => [e.id, 0]));
  let left = totalSlots;
  let guard = totalSlots * 6;
  while (left > 0 && guard-- > 0) {
    const cands = entrants.filter((e) => t.get(e.id) < e.days.size);
    if (!cands.length) break;
    const minCount = Math.min(...cands.map((e) => t.get(e.id)));
    const lowest = cands.filter((e) => t.get(e.id) === minCount);
    const pick = lowest[Math.floor(Math.random() * lowest.length)];
    t.set(pick.id, t.get(pick.id) + 1);
    left -= 1;
  }
  return t;
}

function attemptSchedule(entrants, days, targets) {
  const remaining = new Map(targets);
  const availCount = (d) => entrants.filter((e) => e.days.has(d)).length;
  const order = [...days].sort((a, b) => availCount(a) - availCount(b) || Math.random() - 0.5);
  const processed = new Set();
  const sched = new Map();
  const personDays = new Map(entrants.map((e) => [e.id, new Set()]));

  for (const day of order) {
    processed.add(day);
    const team = [];
    for (let k = 0; k < 2; k++) {
      let cands = entrants.filter((e) =>
        e.days.has(day) && !team.includes(e.id) && (remaining.get(e.id) || 0) > 0);
      if (!cands.length) {
        // Ingen med pass kvar – låt någon ta ett extrapass hellre än att dagen står tom.
        cands = entrants.filter((e) => e.days.has(day) && !team.includes(e.id));
      }
      if (!cands.length) break;
      const scored = cands.map((e) => {
        const futureDays = [...e.days].filter((d) => !processed.has(d)).length + 1;
        let w = ((remaining.get(e.id) || 0) + 0.3) / futureDays;
        if (personDays.get(e.id).has(day - 1) || personDays.get(e.id).has(day + 1)) w *= 0.12;
        w *= 0.7 + Math.random() * 0.6;
        return { e, w };
      }).sort((a, b) => b.w - a.w);
      const pick = scored[0].e;
      team.push(pick.id);
      remaining.set(pick.id, (remaining.get(pick.id) || 0) - 1);
      personDays.get(pick.id).add(day);
    }
    sched.set(day, team);
  }
  return sched;
}

function scoreSchedule(sched, entrants, targets, days) {
  let score = 0;
  const counts = new Map(entrants.map((e) => [e.id, 0]));
  const pairs = new Set();
  for (const day of days) {
    const team = sched.get(day) || [];
    if (team.length < 2) score -= 500 * (2 - team.length);
    for (const id of team) counts.set(id, (counts.get(id) || 0) + 1);
    if (team.length === 2) {
      const key = [...team].sort().join('|');
      if (pairs.has(key)) score -= 60;
      pairs.add(key);
    }
  }
  for (const e of entrants) {
    score -= Math.abs((counts.get(e.id) || 0) - (targets.get(e.id) || 0)) * 120;
    const ds = [...e.days]
      .filter((d) => (sched.get(d) || []).includes(e.id))
      .sort((a, b) => a - b);
    for (let i = 1; i < ds.length; i++) if (ds[i] - ds[i - 1] === 1) score -= 30;
  }
  return score;
}

function runDraw(entrants) {
  let best = null;
  let bestScore = -Infinity;
  for (let i = 0; i < 900; i++) {
    const targets = computeTargets(entrants, COOK_DAYS.length * 2);
    const sched = attemptSchedule(entrants, COOK_DAYS, targets);
    const s = scoreSchedule(sched, entrants, targets, COOK_DAYS);
    if (s > bestScore) {
      bestScore = s;
      best = sched;
      if (s === 0) break; // perfekt utfall – lotten är nöjd
    }
  }
  const names = new Map(entrants.map((e) => [e.id, e.name]));
  const daysOut = {};
  for (const d of COOK_DAYS) {
    daysOut[d] = (best.get(d) || []).map((id) => names.get(id) || id);
  }
  return { days: daysOut, drawnAt: new Date().toISOString() };
}

/* ─────────────── Ceremonin ─────────────── */

let ceremonyTimer = null;
let ceremonyActive = false;

function cancelCeremony() {
  if (ceremonyTimer) clearTimeout(ceremonyTimer);
  ceremonyTimer = null;
  ceremonyActive = false;
  const skip = $('#skip-btn');
  skip.hidden = true;
  skip.onclick = null;
}

function teamHtml(team) {
  if (!team || team.length === 0) return '<em>Gemensamt knytkalas 🍞</em>';
  if (team.length === 1) return `${esc(team[0])} <span class="amp">&amp;</span> <em>frivillig sökes</em>`;
  return `${esc(team[0])} <span class="amp">&amp;</span> ${esc(team[1])}`;
}

function renderResult(result, { animate = false } = {}) {
  cancelCeremony();
  const el = $('#result');
  el.innerHTML = '';
  $('#result-section').hidden = false;

  const rows = [];
  for (const d of COOK_DAYS) {
    const row = document.createElement('div');
    row.className = 'result-row';
    row.innerHTML =
      `<div class="result-date">${fmtDay(d)}<span class="result-dow">${dow(d)}${d === COOK_START ? ' · ankomstdag' : ''}</span></div>` +
      `<div class="result-team">${animate ? '🥁 …' : teamHtml(result.days[d])}</div>`;
    if (!animate) row.classList.add('revealed');
    el.appendChild(row);
    rows.push(row);
  }

  if (!animate) {
    renderTally(result);
    $('#finalize-section').hidden = false;
    return;
  }

  // Högtidligt avslöjande, en dag i taget. Under tiden fryses förteckningen.
  ceremonyActive = true;
  renderRoster();
  $('#skip-btn').hidden = false;
  $('#draw-status').textContent = 'Trumvirvel … lotten arbetar under övervakning av kommissionen. 🥁';
  let i = 0;
  const stepMs = reducedMotion ? 120 : 850;

  const revealNext = () => {
    if (i > 0) {
      const prev = rows[i - 1];
      prev.classList.remove('drumming');
      prev.querySelector('.result-team').innerHTML = teamHtml(result.days[COOK_DAYS[i - 1]]);
      prev.classList.add('revealed');
    }
    if (i >= rows.length) {
      finishCeremony(result);
      return;
    }
    rows[i].classList.add('drumming');
    rows[i].scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
    i += 1;
    ceremonyTimer = setTimeout(revealNext, stepMs);
  };
  revealNext();

  $('#skip-btn').onclick = () => {
    clearTimeout(ceremonyTimer);
    rows.forEach((row, idx) => {
      row.classList.remove('drumming');
      row.querySelector('.result-team').innerHTML = teamHtml(result.days[COOK_DAYS[idx]]);
      row.classList.add('revealed');
    });
    finishCeremony(result);
  };
}

function finishCeremony(result) {
  cancelCeremony();
  renderRoster();
  $('#redraw-btn').disabled = state.locked;
  $('#finalize-btn').disabled = state.locked || !state.result;
  $('#draw-status').textContent =
    `Lottningen förrättades inför öppen ridå den ${fmtDateTime(result.drawnAt)}. Lotten har talat. ⚖️`;
  renderTally(result);
  $('#finalize-section').hidden = false;
  if (!reducedMotion) fireConfetti();
}

function renderTally(result) {
  const counts = {};
  for (const team of Object.values(result.days)) {
    for (const name of team) counts[name] = (counts[name] || 0) + 1;
  }
  const chips = Object.entries(counts)
    .sort((a, b) => a[0].localeCompare(b[0], 'sv'))
    .map(([name, n]) => `<span class="tally-chip">${esc(name)} × ${n}</span>`)
    .join('');
  $('#tally').innerHTML = chips ? `<strong>Passfördelning:</strong><br>${chips}` : '';
}

/* ─────────────── Konfetti ─────────────── */

function fireConfetti() {
  const canvas = $('#confetti');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const colors = ['#e8a63c', '#9a7b2d', '#12556e', '#2e7d9b', '#d9534f', '#4d8f6a', '#fdf9ee'];
  const parts = Array.from({ length: 180 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    w: 6 + Math.random() * 6,
    h: 8 + Math.random() * 8,
    vy: 2 + Math.random() * 3.5,
    vx: -1.5 + Math.random() * 3,
    rot: Math.random() * Math.PI,
    vr: -0.1 + Math.random() * 0.2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  function tick(t) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let alive = false;
    for (const p of parts) {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y < canvas.height + 20) alive = true;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive && t - t0 < 6000) {
      requestAnimationFrame(tick);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  requestAnimationFrame(tick);
}

/* ─────────────── Knappar & flöde ─────────────── */

function setupDrawFlow() {
  const drawBtn = $('#draw-btn');
  const redrawBtn = $('#redraw-btn');
  const finalizeBtn = $('#finalize-btn');
  const copyBtn = $('#copy-btn');
  const resetBtn = $('#reset-btn');

  const performDraw = () => {
    if (state.locked || ceremonyActive) return;
    const entrants = activeEntrants();
    if (entrants.length < 2) {
      $('#draw-status').textContent =
        'Kommissionen anmärker: minst två (2) deltagare krävs för lottning (§ 1).';
      return;
    }
    drawBtn.disabled = true;
    redrawBtn.disabled = true;
    finalizeBtn.disabled = true;
    state.result = runDraw(entrants);
    saveState();
    // finishCeremony väcker knapparna och tinar förteckningen igen
    renderResult(state.result, { animate: true });
  };

  drawBtn.addEventListener('click', performDraw);
  redrawBtn.addEventListener('click', () => {
    if (state.locked) return;
    performDraw();
  });

  finalizeBtn.addEventListener('click', () => {
    if (!state.result || state.locked) return;
    state.locked = true;
    state.lockedAt = new Date().toISOString();
    saveState();
    applyLockedUi();
    if (!reducedMotion) fireConfetti();
  });

  copyBtn.addEventListener('click', async () => {
    const text = protocolText();
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { ok = document.execCommand('copy'); } catch (e2) { /* utan stöd */ }
      ta.remove();
    }
    copyBtn.textContent = ok ? '✅ Kopierat!' : '📋 Kopiera till gruppchatten';
    setTimeout(() => { copyBtn.textContent = '📋 Kopiera till gruppchatten'; }, 2500);
  });

  resetBtn.addEventListener('click', () => {
    const sure = window.confirm(
      'Riva upp det fastställda protokollet? Detta kräver enligt § 4 enhällighet i gruppchatten. Är den inhämtad?');
    if (!sure) return;
    state.locked = false;
    state.lockedAt = null;
    state.result = null;
    saveState();
    window.location.reload();
  });
}

function applyLockedUi() {
  const doc = $('.official-doc');
  doc.classList.add('locked');
  $('#draw-btn').disabled = true;
  $('#redraw-btn').disabled = true;
  $('#finalize-btn').disabled = true;
  $('#reset-btn').hidden = false;
  $('#finalize-status').textContent =
    `Härmed fastställt i vederbörlig ordning den ${fmtDateTime(state.lockedAt)}. ` +
    'Protokollet äger laga kraft. Må äran fördelas jämnt och disken likaså. 🖋️⚖️';
  renderRoster();
}

function protocolText() {
  if (!state.result) return '';
  const lines = [
    '📜 PROTOKOLL – 2026 ÅRS STORA MATLAGSLOTTNING',
    'Kusinsemestern · Helligsø Strand · 8–22 augusti 2026',
    '',
  ];
  for (const d of COOK_DAYS) {
    const team = state.result.days[d] || [];
    const label = `${dow(d)} ${fmtDay(d)}`;
    lines.push(`${label}: ${team.length ? team.join(' & ') : 'gemensamt knytkalas'}`);
  }
  lines.push('');
  lines.push(state.locked
    ? `🖋️ Fastställt den ${fmtDateTime(state.lockedAt)}. Lotten har talat. ⚖️`
    : '⚠️ Ännu ej fastställt – se § 4.');
  return lines.join('\n');
}

/* ─────────────── Start ─────────────── */

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderCountdown();
  setInterval(renderCountdown, 1000);
  renderChart();
  renderRoster();
  setupAddPerson();
  setupDrawFlow();

  if (state.result) {
    renderResult(state.result, { animate: false });
    $('#draw-btn').disabled = true;
    $('#draw-status').textContent =
      `Lottningen förrättades den ${fmtDateTime(state.result.drawnAt)}.`;
    if (state.locked) applyLockedUi();
  }
});
