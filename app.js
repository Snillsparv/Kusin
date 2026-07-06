/* ═══════════════ Kusinsemestern 2026, app.js ═══════════════ */
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
  { id: 'manne',   name: 'Manne',    note: 'Båda veckorna',          presence: [8, 22],  cook: [8, 21] },
  { id: 'my',      name: 'My',       note: 'Hedersgäst & maskot',    presence: [8, 22],  cook: [8, 21],
    inDraw: false, baby: true, rnote: 'Dispens beviljad: 1,5 år. Chef för avsmakning.' },
  { id: 'jonas',   name: 'Jonas',    note: 'Anadasama! 🤸🥳',        presence: [8, 22],  cook: [8, 21] },
  { id: 'jessica', name: 'Jessica',  note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'kalle',   name: 'Kalle',    note: 'Hedersgäst & maskot',    presence: [8, 22],  cook: [8, 21],
    inDraw: false, baby: true, rnote: 'Dispens beviljad: 0 år. Får röra i grytan under uppsikt.' },
  { id: 'jakob',   name: 'Jakob',    note: 'Flyger via CPH ✈️',      presence: [8, 22],  cook: [8, 21] },
  { id: 'hannes',  name: 'Hannes',   note: 'Båda veckorna',          presence: [8, 22],  cook: [8, 21] },
  { id: 'ivan',    name: 'Ivan',     note: 'Båda veckorna',          presence: [8, 22],  cook: [8, 21] },
  { id: 'alice',   name: 'Alice',    note: 'Andra halvan 🤠',        presence: [15, 22], cook: [15, 21] },
  { id: 'theo',    name: 'Theo',     note: 'Andra halvan 🤠',        presence: [15, 22], cook: [15, 21] },
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
  } catch (e) { /* privat läge m.m., sidan funkar ändå */ }
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
  } catch (e) { /* korrupt lagring, börja om från början */ }
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
    const babyEmoji = p.baby ? ' 👶' : '';
    html += '<div role="row" style="display: contents">' +
      `<div class="cell pname${rowClass}" role="rowheader">${p.name}${babyEmoji}` +
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

/* ─────────────── Actionkartan ─────────────── */

const HOME_POS = [56.633, 8.345]; // Helligsø Strand, ort-nivå

const ACTION_CATS = {
  motor:  { label: '🏎️ Gokart & motor', color: '#b0503c' },
  vatten: { label: '🌊 Vatten & vind',  color: '#12556e' },
  luft:   { label: '🪂 Luft & höjd',    color: '#4d8f6a' },
};

// Positioner på ort-/anläggningsnivå; exakta adresser står i listan nedanför kartan.
const ACTION_SPOTS = [
  { name: 'Skive Gokart & Paintball', cat: 'motor', emoji: '🏎️', pos: [56.548, 9.020],
    dist: 'ca 80 km · 1 h 10 från huset', url: 'https://skivegokart.dk/',
    desc: 'Inomhusgokart 250+ m, paintball och lasergame. Från 8 år och 140 cm.' },
  { name: 'Herning Go-Kart Center', cat: 'motor', emoji: '🏁', pos: [56.118, 8.930],
    dist: 'ca 95 km · 1 h 15 från huset', url: 'https://www.herninggokart.dk/',
    desc: 'Inomhusbana 350 m. Familjerace från 8 år och 120 cm.' },
  { name: 'Action House, Løkken', cat: 'motor', emoji: '🏆', pos: [57.362, 9.722],
    dist: 'ca 130 km · 1 h 50 från huset', url: 'https://actionhouse.dk/',
    desc: 'Nordeuropas största inomhusgokartbana: 1,1 km, upp till 70 km/h.' },
  { name: 'Quad Nord, Thisted', cat: 'motor', emoji: '🛞', pos: [56.950, 8.660],
    dist: 'ca 50 km · 45 min från huset', url: 'https://quadnord.dk/',
    desc: 'Fyrhjulingar i grusgrav, från 16 år. Exakt plats fås vid bokning.' },
  { name: 'Thy Cablepark · Cold Hawaii Inland', cat: 'vatten', emoji: '🏄', pos: [56.945, 8.725],
    dist: 'ca 30 km · 30 min från huset', url: 'https://thycablepark.dk/',
    desc: 'Kabelwakeboard vid Synopal Havn. Nybörjarkurs 400 DKK.' },
  { name: 'Westwind, Klitmøller', cat: 'vatten', emoji: '🪁', pos: [57.038, 8.516],
    dist: 'ca 45 km · 40 min från huset', url: 'https://westwind.dk/',
    desc: 'Windsurf-, kite-, wing- och SUP-kurser i Cold Hawaii.' },
  { name: 'HP Kajak, Hanstholm', cat: 'vatten', emoji: '🛶', pos: [57.116, 8.615],
    dist: 'ca 45 km · 45 min från huset', url: 'http://hpkajak.dk/',
    desc: 'Surfkajak i vågorna och havskajak på Limfjorden.' },
  { name: 'MTB-spår, Tvorup Klitplantage', cat: 'vatten', emoji: '🚵', pos: [56.996, 8.435],
    dist: 'ca 30 km · 35 min från huset', url: 'https://nationalparkthy.dk/',
    desc: 'Gratis MTB-spår: Tvorup 9,6 km och Vandet 9,9 km (tekniskt).' },
  { name: 'Tandemhopp NJFK, Aars', cat: 'luft', emoji: '🪂', pos: [56.847, 9.458],
    dist: 'ca 100 km · 1 h 20 från huset', url: 'https://www.njfk.dk/',
    desc: 'Fallskärmshopp från 4 000 m, 2 600 DKK.' },
  { name: 'Skydive Viborg', cat: 'luft', emoji: '🛩️', pos: [56.407, 9.408],
    dist: 'ca 105 km · 1 h 25 från huset', url: 'https://skydiveviborg.dk/',
    desc: 'Tandemhopp, 2 795 DKK.' },
  { name: 'Fårup Sommerland, Blokhus', cat: 'luft', emoji: '🎢', pos: [57.262, 9.632],
    dist: 'ca 110 km · 1 h 30 från huset', url: 'https://www.faarupsommerland.dk/',
    desc: 'Fønix, Lynet, Orkanen, Falken och aquapark. Öppet t.o.m. 23 aug.' },
  { name: 'Klatreparken Aalborg', cat: 'luft', emoji: '🧗', pos: [57.027, 9.903],
    dist: 'ca 120 km · 1 h 40 från huset', url: 'https://klatreparken.dk/',
    desc: 'Höghöjdsbanor och 25+ ziplines, den längsta 250 m.' },
];

function initActionMap() {
  const el = $('#action-map');
  if (!el) return;
  if (typeof L === 'undefined') {
    el.innerHTML = '<p class="map-fallback">Kartan kunde inte laddas just nu. Alla platser, avstånd och länkar finns i listan nedanför.</p>';
    return;
  }

  const map = L.map(el, { scrollWheelZoom: false });
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  // rullhjulszoom först efter klick, så att sidan går att skrolla förbi kartan
  map.on('click focus', () => map.scrollWheelZoom.enable());

  const pin = (emoji, color) => L.divIcon({
    className: 'pin-wrap',
    html: `<div class="pin" style="border-color:${color}">${emoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -20],
  });

  L.marker(HOME_POS, { icon: pin('⛱️', '#c9821e'), zIndexOffset: 500 })
    .bindPopup('<strong>Huset ⛱️</strong><br>Helligsøvej 2D, Helligsø Strand<br><span class="popup-meta">Här bor vi 8–22 augusti</span>')
    .addTo(map);

  const groups = {};
  for (const key of Object.keys(ACTION_CATS)) groups[key] = L.layerGroup().addTo(map);

  const bounds = [HOME_POS];
  for (const s of ACTION_SPOTS) {
    const marker = L.marker(s.pos, { icon: pin(s.emoji, ACTION_CATS[s.cat].color) })
      .bindPopup(
        `<strong>${s.name}</strong><br>${s.desc}<br>` +
        `<span class="popup-meta">${s.dist}</span>` +
        (s.url ? `<br><a href="${s.url}" target="_blank" rel="noopener">Webbplats ↗</a>` : '')
      );
    groups[s.cat].addLayer(marker);
    bounds.push(s.pos);
  }
  map.fitBounds(bounds, { padding: [34, 34] });

  const legend = $('#map-legend');
  for (const [key, cat] of Object.entries(ACTION_CATS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'legend-chip on';
    btn.style.setProperty('--chip', cat.color);
    btn.textContent = cat.label;
    btn.setAttribute('aria-pressed', 'true');
    btn.addEventListener('click', () => {
      const on = btn.classList.toggle('on');
      btn.setAttribute('aria-pressed', String(on));
      if (on) groups[key].addTo(map);
      else map.removeLayer(groups[key]);
    });
    legend.appendChild(btn);
  }
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
    $('#draw-status').textContent = 'Förteckningen har ändrats. Lottningen behöver förrättas på nytt.';
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
        // Ingen med pass kvar. Låt någon ta ett extrapass hellre än att dagen står tom.
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
      if (s === 0) break; // perfekt utfall, lotten är nöjd
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
    '📜 PROTOKOLL: 2026 ÅRS STORA MATLAGSLOTTNING',
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
    : '⚠️ Ännu ej fastställt (se § 4).');
  return lines.join('\n');
}

/* ─────────────── Larven från helvetet 🐛🔥 ───────────────
   »Larven fra helvede« (ekprocessionsspinnaren) härjar enligt rapporterna
   i Odense. Då och då kryper en in på sidan. Klicka på den: eldkastare. */

const LARV_KEY = 'kusinlarver2026';

function setupLarv() {
  if (reducedMotion) return;
  let timer = null;
  let active = false;

  const schedule = (first) => {
    clearTimeout(timer);
    const delay = first
      ? 12000 + Math.random() * 23000
      : 50000 + Math.random() * 70000;
    timer = setTimeout(spawn, delay);
  };

  function spawn() {
    if (active || document.hidden) { schedule(false); return; }
    active = true;

    const dir = Math.random() < 0.5 ? 1 : -1;
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'larv';
    el.setAttribute('aria-label', 'Larven från helvetet! Klicka för att elda upp den.');
    // huvudet läggs sist och hamnar längst fram i färdriktningen
    el.style.flexDirection = dir === 1 ? 'row' : 'row-reverse';
    for (let i = 0; i < 10; i++) {
      const seg = document.createElement('span');
      seg.className = 'larv-seg' + (i === 9 ? ' larv-head' : '');
      el.appendChild(seg);
    }
    document.body.appendChild(el);

    // Slingrande bana tvärs över skärmen på slumpad höjd.
    const margin = 180;
    const fromX = dir === 1 ? -margin : window.innerWidth + margin;
    const toX = dir === 1 ? window.innerWidth + margin : -margin;
    const baseY = window.innerHeight * (0.15 + Math.random() * 0.6);
    const amp = 18 + Math.random() * 30;
    const waves = 1.5 + Math.random() * 2;
    const duration = 20000 + Math.random() * 15000;
    const t0 = performance.now();
    let burned = false;
    let raf = 0;

    function step(t) {
      if (burned) return;
      const k = Math.min(1, (t - t0) / duration);
      const x = fromX + (toX - fromX) * k;
      const y = baseY + Math.sin(k * waves * 2 * Math.PI) * amp;
      // vrid kroppen så att den följer banans lutning
      const slope = (Math.cos(k * waves * 2 * Math.PI) * amp * waves * 2 * Math.PI) / (toX - fromX);
      const deg = Math.atan(slope) * 180 / Math.PI;
      el.style.transform = `translate(${x}px, ${y}px) rotate(${deg}deg)`;
      if (k < 1) {
        raf = requestAnimationFrame(step);
      } else {
        el.remove();
        active = false;
        schedule(false);
      }
    }
    raf = requestAnimationFrame(step);

    el.addEventListener('click', () => {
      if (burned) return;
      burned = true;
      cancelAnimationFrame(raf);
      el.disabled = true;
      el.classList.add('burning');
      const r = el.getBoundingClientRect();
      torch(r.left + r.width / 2, r.top + r.height / 2);
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: 300, fill: 'forwards' })
        .onfinish = () => {
          el.remove();
          active = false;
          schedule(false);
        };
    }, { once: true });
  }

  function torch(cx, cy) {
    // Eldklotet: ett stort "PFFF" som blossar upp och slocknar.
    const ball = document.createElement('div');
    ball.className = 'fireball';
    ball.setAttribute('aria-hidden', 'true');
    ball.style.left = `${cx - 40}px`;
    ball.style.top = `${cy - 40}px`;
    document.body.appendChild(ball);
    ball.animate(
      [
        { transform: 'scale(0.2)', opacity: 0.95 },
        { transform: 'scale(4.5)', opacity: 0.9, offset: 0.35 },
        { transform: 'scale(6)', opacity: 0 },
      ],
      { duration: 650, easing: 'cubic-bezier(0.15, 0.75, 0.3, 1)' }
    ).onfinish = () => ball.remove();

    const pfff = document.createElement('div');
    pfff.className = 'pfff';
    pfff.textContent = 'PFFF!';
    pfff.setAttribute('aria-hidden', 'true');
    pfff.style.left = `${cx}px`;
    pfff.style.top = `${cy}px`;
    document.body.appendChild(pfff);
    pfff.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.3) rotate(-8deg)', opacity: 0 },
        { transform: 'translate(-50%, -50%) scale(1.35) rotate(3deg)', opacity: 1, offset: 0.3 },
        { transform: 'translate(-50%, -55%) scale(1.6) rotate(-2deg)', opacity: 0 },
      ],
      { duration: 850, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' }
    ).onfinish = () => pfff.remove();

    // Eldpartiklar åt alla håll, plus rök som stiger efteråt.
    const emojis = ['🔥', '🔥', '🔥', '🔥', '🔥', '💥', '✨'];
    for (let i = 0; i < 44; i++) {
      const p = document.createElement('span');
      p.className = 'flame-p';
      p.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      p.setAttribute('aria-hidden', 'true');
      p.style.fontSize = `${22 + Math.random() * 44}px`;
      p.style.left = `${cx + (Math.random() * 90 - 45)}px`;
      p.style.top = `${cy + (Math.random() * 30 - 15)}px`;
      document.body.appendChild(p);
      const dx = Math.random() * 340 - 170;
      const dy = -(40 + Math.random() * 220) + (Math.random() < 0.2 ? 120 : 0);
      const rot = Math.random() * 320 - 160;
      p.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${0.3 + Math.random() * 0.6})`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 700, easing: 'cubic-bezier(0.2, 0.6, 0.3, 1)' }
      ).onfinish = () => p.remove();
    }
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('span');
      s.className = 'flame-p';
      s.textContent = '💨';
      s.setAttribute('aria-hidden', 'true');
      s.style.fontSize = `${26 + Math.random() * 22}px`;
      s.style.left = `${cx + (Math.random() * 70 - 35)}px`;
      s.style.top = `${cy - 10}px`;
      document.body.appendChild(s);
      s.animate(
        [
          { transform: 'translate(0, 0) scale(0.6)', opacity: 0 },
          { transform: `translate(${Math.random() * 40 - 20}px, -60px) scale(1)`, opacity: 0.8, offset: 0.4 },
          { transform: `translate(${Math.random() * 80 - 40}px, -140px) scale(1.4)`, opacity: 0 },
        ],
        { duration: 1400 + Math.random() * 600, delay: 250 + i * 90, easing: 'ease-out' }
      ).onfinish = () => s.remove();
    }

    let n = 1;
    try {
      n = (parseInt(localStorage.getItem(LARV_KEY), 10) || 0) + 1;
      localStorage.setItem(LARV_KEY, String(n));
    } catch (e) { /* räknaren är inte livsviktig */ }

    const toast = document.createElement('div');
    toast.className = 'larv-toast';
    toast.textContent = `🔥 FRÄS! Larv nr ${n} från helvetet: neutraliserad. Odense tackar.`;
    document.body.appendChild(toast);
    const w = toast.offsetWidth;
    toast.style.left = `${Math.min(Math.max(cx - w / 2, 8), Math.max(8, window.innerWidth - w - 8))}px`;
    toast.style.top = `${Math.min(Math.max(cy - 110, 12), window.innerHeight - 60)}px`;
    toast.animate(
      [
        { opacity: 0, transform: 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)', offset: 0.15 },
        { opacity: 1, transform: 'translateY(0)', offset: 0.8 },
        { opacity: 0, transform: 'translateY(-6px)' },
      ],
      { duration: 2600 }
    ).onfinish = () => toast.remove();
  }

  // Odokumenterad krok så att testerna kan mana fram en larv direkt.
  window.__larv = spawn;

  schedule(true);
}

/* ─────────────── Start ─────────────── */

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setupLarv();

  // Varje sida har bara sina egna byggstenar. Kör det som faktiskt finns.
  if ($('#countdown')) {
    renderCountdown();
    setInterval(renderCountdown, 1000);
  }
  if ($('#narvaro-chart')) renderChart();
  if ($('#action-map')) initActionMap();

  if ($('#roster')) {
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
  }
});
