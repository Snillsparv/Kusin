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
  { id: 'george',  name: 'Jojje',    note: '9–13 aug',               presence: [9, 13],  cook: [9, 12],
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

  // Lottningen förrättas endast av behörig förrättare. Lösenordet (skrivs med
  // VERSALER) kontrolleras mot sin SHA-256-hash och gäller sedan hela besöket.
  const LOSEN_HASH = '049d9cbeae34cbc4d6f5243eb7306d4ce3315f3779ac86c346aa85349390cbbf';
  const LOSEN_SS = 'kusinLosenOK';
  const losenOK = () => {
    try { return sessionStorage.getItem(LOSEN_SS) === '1'; } catch (e) { return false; }
  };
  const sha256hex = async (text) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  let losenBox = null;
  const askLosen = () => {
    if (losenBox) { losenBox.querySelector('input').focus(); return; }
    losenBox = document.createElement('form');
    losenBox.className = 'losen-box';
    losenBox.innerHTML = `
      <p class="losen-text">🔐 Lottningen förrättas endast av behörig förrättare.
        Ange kommissionens lösenord för att bryta sigillet:</p>
      <div class="losen-row">
        <input type="password" class="losen-input" placeholder="LÖSENORD"
          autocomplete="off" aria-label="Kommissionens lösenord">
        <button type="submit" class="btn btn-small">Bryt sigillet</button>
      </div>
      <p class="losen-fel" aria-live="polite"></p>`;
    const status = $('#draw-status');
    status.parentNode.insertBefore(losenBox, status);
    const input = losenBox.querySelector('input');
    const fel = losenBox.querySelector('.losen-fel');
    losenBox.addEventListener('submit', async (e) => {
      e.preventDefault();
      const svar = input.value.trim();
      if (!svar) { input.focus(); return; }
      let hash = '';
      try { hash = await sha256hex(svar); } catch (err) { /* utan WebCrypto blir det nej */ }
      if (hash === LOSEN_HASH) {
        try { sessionStorage.setItem(LOSEN_SS, '1'); } catch (err) { /* privat läge, gäller ändå nu */ }
        losenBox.remove();
        losenBox = null;
        performDraw();
      } else {
        fel.textContent = 'Fel lösenord. Kommissionen påminner: VERSALER gäller.';
        input.select();
      }
    });
    input.focus();
  };

  const gateDraw = () => {
    if (state.locked || ceremonyActive) return;
    if (losenOK()) { performDraw(); return; }
    askLosen();
  };

  drawBtn.addEventListener('click', gateDraw);
  redrawBtn.addEventListener('click', () => {
    if (state.locked) return;
    gateDraw();
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

/* ─────────────── Surfande släktingar 🏄 ───────────────
   Släktens huvuden ur ANSIKTEEN, monterade på professionella surfarkroppar,
   rider på vågen i sidhuvudet. Surfarna följer exakt samma bezierkurva som
   vågens svg-path är ritad med. */

// [id, namn, kropp] – kroppen avgör vilken surfarkropp huvudet monteras på.
const SURF_FACES = [
  ['ak', 'A-K', 'dam'], ['alice', 'Alice', 'dam'], ['ann', 'Ann', 'dam'],
  ['ellen', 'Ellen', 'dam'], ['hakan', 'Håkan', 'man'], ['hannes', 'Hannes', 'man'],
  ['ivan', 'Ivan', 'man'], ['jakob', 'Jakob', 'man'], ['jessica', 'Jessica', 'dam'],
  ['jojje', 'Jojje', 'man'], ['jonas', 'Jonas', 'man'], ['kalle', 'Kalle', 'man'],
  ['la', 'Lars-Åke', 'man'], ['lena', 'Lena', 'dam'], ['manne', 'Manne', 'man'],
  ['my', 'My', 'dam'], ['nora', 'Nora', 'dam'], ['otto', 'Otto', 'man'],
  ['theo', 'Theo', 'man'],
];

function setupSurfers() {
  const header = document.querySelector('.hero, .page-header');
  const wave = header ? header.querySelector('.wave') : null;
  if (!header || !wave || reducedMotion) return;

  // Vågens svg-path i viewBox 1440x90 (y räknas uppifrån):
  // M0,48 C240,88 480,8 720,40 C960,72 1200,20 1440,52
  function waveViewY(xv) {
    let t;
    let ys;
    if (xv <= 720) { t = xv / 720; ys = [48, 88, 8, 40]; }
    else { t = (xv - 720) / 720; ys = [40, 72, 20, 52]; }
    t = Math.min(1, Math.max(0, t));
    const u = 1 - t;
    return u * u * u * ys[0] + 3 * u * u * t * ys[1] + 3 * u * t * t * ys[2] + t * t * t * ys[3];
  }
  // Vattenytans höjd över sidhuvudets nederkant vid skärmposition x.
  function surfaceB(xPx, w) {
    return 90 - waveViewY((xPx / w) * 1440);
  }

  let queue = [];
  let lastFace = null;
  const nextFace = () => {
    if (!queue.length) {
      // Fisher-Yates-blandning
      queue = SURF_FACES.slice();
      for (let i = queue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [queue[i], queue[j]] = [queue[j], queue[i]];
      }
      // samma ansikte ska inte kunna komma två gånger i rad över köskarven
      if (queue[queue.length - 1] === lastFace) {
        [queue[0], queue[queue.length - 1]] = [queue[queue.length - 1], queue[0]];
      }
    }
    lastFace = queue.pop();
    return lastFace;
  };

  const surfers = [];
  let raf = 0;

  // På stora skärmar surfar de i det öppna blåa vattnet i heron, större och
  // utspridda på olika höjder (bakom texten). På mobil och undersidor rider
  // de på vågkanten som vanligt.
  const oppetHav = () =>
    header.classList.contains('hero') && window.innerWidth >= 900 && header.clientHeight >= 460;

  function spawn() {
    const face = nextFace();
    const stor = oppetHav();
    const el = document.createElement('div');
    el.className = 'surfer' + (stor ? ' surfer-stor' : '');
    el.setAttribute('aria-hidden', 'true');
    const body = document.createElement('img');
    body.className = 'surfer-body';
    body.src = `img/surf/surf-${face[2]}.webp`;
    body.alt = '';
    const img = document.createElement('img');
    img.className = 'surfer-face';
    img.src = `img/ansikten/${face[0]}.webp`;
    img.alt = '';
    const spray = document.createElement('span');
    spray.className = 'surfer-spray';
    spray.textContent = '💦';
    el.appendChild(body);
    el.appendChild(img);
    el.appendChild(spray);
    header.appendChild(el);

    const dir = Math.random() < 0.5 ? 1 : -1;
    // kropparna är fotograferade på väg åt höger; åt vänster speglas de
    if (dir === -1) el.classList.add('vand');
    // svallvågorna hamnar bakom surfaren
    spray.style[dir === 1 ? 'left' : 'right'] = '-6px';

    surfers.push({
      el,
      dir,
      t0: performance.now(),
      duration: stor ? 20000 + Math.random() * 14000 : 16000 + Math.random() * 12000,
      bobSeed: Math.random() * Math.PI * 2,
      stor,
      baseB: stor ? 150 + Math.random() * Math.max(80, header.clientHeight - 470) : 0,
      amp: stor ? 24 + Math.random() * 36 : 0,
      vag: 1 + Math.random() * 1.5,
    });
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick(t) {
    const w = header.clientWidth;
    for (let i = surfers.length - 1; i >= 0; i--) {
      const s = surfers[i];
      const k = (t - s.t0) / s.duration;
      if (k >= 1) {
        s.el.remove();
        surfers.splice(i, 1);
        continue;
      }
      const margin = s.stor ? 200 : 120;
      const x = s.dir === 1
        ? -margin + (w + margin * 2) * k
        : w + margin - (w + margin * 2) * k;
      let b;
      let tilt;
      const bob = Math.sin(t / 260 + s.bobSeed) * 2;
      if (s.stor) {
        // fri dyning ute på öppet vatten
        const fas = k * s.vag * 2 * Math.PI + s.bobSeed;
        b = s.baseB + Math.sin(fas) * s.amp;
        tilt = Math.max(-14, Math.min(14, -Math.cos(fas) * 7 * s.dir + Math.sin(t / 300 + s.bobSeed) * 3));
      } else {
        b = surfaceB(x, w);
        // mjuk kompression av de högsta topparna så surfarna inte når upp i texten
        if (b > 56) b = 56 + (b - 56) * 0.35;
        // luta brädan efter vågens lutning, plus lite gung
        const slopeDeg = Math.atan2(-(surfaceB(x + 8, w) - surfaceB(x - 8, w)), 16) * 180 / Math.PI;
        tilt = Math.max(-16, Math.min(16, slopeDeg + Math.sin(t / 300 + s.bobSeed) * 3));
      }
      const half = s.stor ? 88 : 56;
      const lyft = b + bob - 8; // höjd över sidhuvudets nederkant
      // Perspektiv: ju längre ner på skärmen, desto närmare betraktaren.
      // Närmare surfare ritas framför överlappande surfare längre bort och
      // blir på öppet hav dessutom större (mindre ju högre upp de rider).
      let skala = 1;
      if (s.stor) {
        const djup = Math.min(1, Math.max(0, (lyft - 80) / Math.max(120, header.clientHeight - 350)));
        skala = 1.15 - 0.5 * djup;
        s.el.style.zIndex = Math.max(1, Math.min(99, 99 - Math.round(lyft / 8)));
      } else {
        s.el.style.zIndex = Math.max(101, Math.min(199, 199 - Math.round(lyft)));
      }
      s.el.style.transform = `translate(${x - half}px, ${-lyft}px) rotate(${tilt}deg) scale(${skala})`;
    }
    raf = surfers.length ? requestAnimationFrame(tick) : 0;
  }

  const scheduleNext = () => {
    setTimeout(() => {
      const max = oppetHav() ? 3 : 2;
      if (!document.hidden && surfers.length < max) spawn();
      scheduleNext();
    }, oppetHav() ? 6000 + Math.random() * 7000 : 9000 + Math.random() * 9000);
  };

  // Odokumenterad krok så att testerna kan skicka ut en surfare direkt.
  window.__surf = spawn;

  setTimeout(() => { if (!document.hidden) spawn(); }, 1200 + Math.random() * 1500);
  scheduleNext();
}

/* ─────────────── Jojjes danskskola 🕶️🎤 ───────────────
   MC Jojje lär släkten gadedansk: uppläsning med dansk röst via
   webbläsarens talsyntes, boom bap-beat byggd i WebAudio och en
   högtidlig eksamen med sex frågor. Körs bara på danskskolan.html. */

function setupDanskskolan() {
  if (!document.querySelector('.dansk-header')) return;
  setupDanskTal();
  setupDanskBeat();
  setupDanskEksamen();
}

function setupDanskTal() {
  const btns = document.querySelectorAll('.say-btn');
  if (!btns.length) return;
  if (!('speechSynthesis' in window)) {
    btns.forEach((b) => { b.hidden = true; });
    return;
  }
  // Rösterna laddas asynkront i vissa webbläsare; frågar därför vid varje klick.
  const danskRoest = () => {
    const voices = speechSynthesis.getVoices();
    return voices.find((v) => /^da([-_]|$)/i.test(v.lang)) || null;
  };
  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(btn.dataset.say || '');
      u.lang = 'da-DK';
      const voice = danskRoest();
      if (voice) u.voice = voice;
      u.rate = 0.92;
      btn.classList.add('sjunger');
      u.onend = () => btn.classList.remove('sjunger');
      u.onerror = () => btn.classList.remove('sjunger');
      speechSynthesis.speak(u);
    });
  });
}

function setupDanskBeat() {
  const btn = $('#beat-btn');
  if (!btn) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) { btn.hidden = true; return; }

  const BPM = 88; // huvudet gungar i samma tempo via .bumpar i css
  let ctx = null;
  let timer = null;
  let steg = 0;
  let nextAt = 0;

  const kick = (t) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
    g.gain.setValueAtTime(0.85, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 0.26);
  };
  const brus = (t, dur, freq, typ, vol) => {
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = typ;
    f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + dur);
  };
  const snare = (t) => brus(t, 0.16, 1800, 'bandpass', 0.5);
  const hihat = (t) => brus(t, 0.05, 7000, 'highpass', 0.16);

  // 16 sextondelar klassisk boom bap, signerad MC Jojje.
  const KICKS = [0, 7, 10];
  const SNARES = [4, 12];

  const tickBeat = () => {
    const stegTid = 60 / BPM / 4;
    while (nextAt < ctx.currentTime + 0.12) {
      const s = steg % 16;
      if (KICKS.includes(s)) kick(nextAt);
      if (SNARES.includes(s)) snare(nextAt);
      if (s % 2 === 0) hihat(nextAt);
      if (s === 14) hihat(nextAt + stegTid / 2); // liten släng i svängen
      steg += 1;
      nextAt += stegTid;
    }
  };

  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? '🎧 Beat: på' : '🎧 Beat: av';
    document.querySelector('.dansk-header').classList.toggle('bumpar', on && !reducedMotion);
    if (on) {
      if (!ctx) ctx = new Ctx();
      ctx.resume();
      steg = 0;
      nextAt = ctx.currentTime + 0.06;
      timer = setInterval(tickBeat, 40);
    } else {
      clearInterval(timer);
      timer = null;
      if (ctx) ctx.suspend();
    }
  });
}

const DANSK_EKSAMEN = [
  {
    q: 'Din kusin pekar på softicemaskinen och utbrister »Hold kæft, hvor er det fedt!«. Vad menar kusinen?',
    svar: ['»Håll käften, den är trasig«', '»Wow, det där är ju grymt!«', '»Stäng locket, det luktar fett«', '»Jag är laktosintolerant«'],
    ratt: 1,
    fakta: '»Hold kæft« är ordagrant »håll käften« men betyder oftast bara »wow«. Ju mer upprörd man låter, desto mer imponerad är man.',
  },
  {
    q: 'Det regnar sidledes över Limfjorden för tredje dagen i rad. Det är, med ett ord …',
    svar: ['fedt', 'lækkert', 'nederen', 'hyggeligt'],
    ratt: 2,
    fakta: '»Nederen« = trist, dåligt, bottenkänsla. (Fast en dansk skulle förstås tända ett ljus och kalla regnet hyggeligt ändå.)',
  },
  {
    q: 'Du vill hälsa på en lokal surfare i Klitmøller med full gatukredd. Du säger:',
    svar: ['»Goddag, hr. surfare«', '»Eow, hva’ så?«', '»Kalaba-longa!«', '»Hej hej med dig, du«'],
    ratt: 1,
    fakta: '»Eow, hva’ så?« är hälsningen. »Goddag« placerar dig omedelbart i en bussresegrupp med paraply.',
  },
  {
    q: 'Fjorden håller 16 grader. En badande dansk beskriver den som:',
    svar: ['pissekold, men skidegod', 'sindssygt tropisk', 'en varm kartoffel', 'helt umulig'],
    ratt: 0,
    fakta: 'Prefixen pisse- och skide- förstärker allt. Vattnet är pissekoldt och det är skidegodt för cirkulationen. Logik? Nej. Danska? Ja.',
  },
  {
    q: 'Vad är »para«?',
    svar: ['ett paraply', 'pengar', 'två kusiner', 'en dansk bakelse'],
    ratt: 1,
    fakta: '»Para« = pengar på gadedansk, inlånat via Nørrebro. Ingen para, ingen softice.',
  },
  {
    q: 'En dansk föreslår »en rolig aften«. Vad är det som väntar?',
    svar: ['Standup och partyhattar', 'En lugn kväll i soffan', 'Karaoke till klockan tre', 'Berg- och dalbana i mörker'],
    ratt: 1,
    fakta: '»Rolig« betyder lugn på danska. Falska vänner! Vill man ha kul säger man »sjov«.',
  },
];

function setupDanskEksamen() {
  const el = $('#eksamen');
  if (!el) return;
  const resultat = $('#eksamen-resultat');
  let besvarade = 0;
  let antalRatt = 0;

  function visaBetyg() {
    let rank;
    let ord;
    if (antalRatt <= 2) {
      rank = '🥔 Kogt kartoffel';
      ord = 'Du uttalar fortfarande alla bokstäver i orden. Tillbaka till spår 01 – och behåll solbrillorna på under läsningen.';
    } else if (antalRatt <= 4) {
      rank = '🌭 Halvdansker';
      ord = 'Godkänt! Du får beställa i softicekön på egen hand. Men wallah, det finns mer att ge.';
    } else {
      rank = '🕶️ Ægte gadedansker';
      ord = 'Hold kæft, hvor er du fedt! MC Jojje bugar. Du är härmed klass-ettan i danskskolan. Eow!';
    }
    resultat.innerHTML =
      `<p class="eksamen-rank">${rank}</p>` +
      `<p class="eksamen-poang">${antalRatt} av ${DANSK_EKSAMEN.length} rätt</p>` +
      `<p class="eksamen-ord">${ord}</p>` +
      '<button type="button" class="btn btn-ghost eksamen-igen" id="eksamen-igen">🔁 Tag eksamen igen</button>';
    resultat.hidden = false;
    $('#eksamen-igen').addEventListener('click', render);
    if (antalRatt > 4 && !reducedMotion && $('#confetti')) fireConfetti();
  }

  function render() {
    el.innerHTML = '';
    resultat.hidden = true;
    besvarade = 0;
    antalRatt = 0;
    DANSK_EKSAMEN.forEach((fr, i) => {
      const div = document.createElement('div');
      div.className = 'eksamen-fraga';
      const q = document.createElement('p');
      q.className = 'eksamen-q';
      q.innerHTML = `<span class="eksamen-nr">${i + 1}.</span> ${esc(fr.q)}`;
      div.appendChild(q);
      const svar = document.createElement('div');
      svar.className = 'eksamen-svar';
      fr.svar.forEach((s, j) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'eksamen-alt';
        b.textContent = s;
        b.addEventListener('click', () => {
          if (div.classList.contains('klar')) return;
          div.classList.add('klar');
          besvarade += 1;
          if (j === fr.ratt) {
            antalRatt += 1;
            b.classList.add('ratt');
          } else {
            b.classList.add('fel');
            svar.children[fr.ratt].classList.add('ratt');
          }
          const facit = document.createElement('p');
          facit.className = 'eksamen-fakta';
          facit.textContent = (j === fr.ratt ? '✅ Nemlig! ' : '❌ Nej, nej. ') + fr.fakta;
          div.appendChild(facit);
          if (besvarade === DANSK_EKSAMEN.length) visaBetyg();
        });
        svar.appendChild(b);
      });
      div.appendChild(svar);
      el.appendChild(div);
    });
  }

  render();
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
    toast.textContent = 'JA TIL MENNESKER, NEJ TIL LARVER';
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

/* ─────────────── Personalisera: redigera texter direkt på sidan ✏️ ───────────────
   Textändringar nycklas på ursprungstextens hash och sparas i anpassningar.json.
   Utkast ligger i webbläsaren (localStorage); med en GitHub-nyckel kan de
   publiceras för alla (sajten committar filen och GitHub Pages deployar om). */

const EDIT_FILE = 'anpassningar.json';
const EDIT_REPO = 'Snillsparv/Kusin';
const EDIT_BRANCH = 'claude/cousin-vacation-website-8d4bac';
const EDIT_LS = 'kusinAnpassningar';
const EDIT_TOKEN_LS = 'kusinGithubNyckel';
// Lösenordsläget: GitHub-nyckeln ligger krypterad i repot (nyckel.json),
// låst med familjens lösenord via PBKDF2 + AES-GCM. Då räcker lösenordet
// för att publicera; själva lösenordet finns aldrig i koden.
const NYCKEL_FILE = 'nyckel.json';
const PUB_SS = 'kusinPubToken';
const PBKDF_ITER = 600000;

const normText = (s) => String(s).replace(/\s+/g, ' ').trim();

function editHash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return 'k' + h.toString(36);
}

function setupEditor() {
  const page = location.pathname.split('/').pop() || 'index.html';
  const SEL = 'main p, main h2, main h3, main figcaption, main td, main th, main .g-sv, ' +
    '.page-header h1, .page-header .ph-sub, .hero .hero-sub, .hero .hero-dates, ' +
    '.hero .hero-kicker, .doc-preamble, .jojje-bubble, .footer p';
  const SKIP = '#roster, #result, #tally, #narvaro-chart, .section-nav, .countdown, ' +
    '#map-legend, #korsika-dagar, .draw-status, .finalize-status, form, .larv-toast, .edit-panel';
  const els = [...document.querySelectorAll(SEL)].filter((el) =>
    !el.closest(SKIP) &&
    !el.querySelector('a, br, img, button, input, select, svg') &&
    normText(el.textContent));
  if (!els.length) return;

  // Nyckel + ursprungstext per element, beräknat FÖRE eventuella ändringar.
  const keyOf = new Map();
  const defaultOf = new Map();
  for (const el of els) {
    const def = normText(el.textContent);
    keyOf.set(el, editHash(page + '|' + def));
    defaultOf.set(el, def);
  }

  let published = {};
  let draft = {};
  try { draft = JSON.parse(localStorage.getItem(EDIT_LS)) || {}; } catch (e) { draft = {}; }

  const applyTexts = () => {
    for (const el of els) {
      const k = keyOf.get(el);
      const t = draft[k] !== undefined && draft[k] !== null ? draft[k]
        : (draft[k] === null ? defaultOf.get(el) : published[k]);
      if (t !== undefined && normText(el.textContent) !== normText(t)) el.textContent = t;
    }
  };

  fetch(`${EDIT_FILE}?v=${Date.now()}`)
    .then((r) => (r.ok ? r.json() : {}))
    .then((json) => {
      if (json && typeof json === 'object' && !Array.isArray(json)) published = json;
      applyTexts();
    })
    .catch(() => { /* offline: standardtexterna duger */ });
  applyTexts();

  // ── UI: penna + panel ──
  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'edit-fab';
  fab.textContent = '✏️';
  fab.setAttribute('aria-label', 'Personalisera texterna på sidan');

  const panel = document.createElement('div');
  panel.className = 'edit-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<h4>✏️ Personalisera</h4>' +
    '<p>Slå på redigeringsläget, klicka på en text och skriv om den. ' +
    '<span class="edit-status" data-count></span></p>' +
    '<div class="edit-row">' +
    '<button type="button" class="btn btn-secondary" data-toggle>Slå på redigering</button>' +
    '<button type="button" class="btn btn-secondary" data-save hidden>💾 Spara utkast</button>' +
    '</div>' +
    '<div class="edit-row">' +
    '<button type="button" class="btn btn-gold" data-publish hidden>🚀 Publicera för alla</button>' +
    '</div>' +
    '<p class="edit-status" data-status aria-live="polite"></p>' +
    '<div class="edit-row" data-losen-row hidden>' +
    '<input type="password" data-losen placeholder="LÖSENORD" autocomplete="off" ' +
    'aria-label="Lösenord för att publicera">' +
    '<button type="button" class="btn btn-secondary" data-unlock>🔓 Lås upp</button>' +
    '</div>' +
    '<details><summary>Avancerat: GitHub-nyckel &amp; lösenordsläge</summary>' +
    '<p>Publiceringen sker med en GitHub-nyckel. Är lösenordsläget aktiverat räcker det att ' +
    'skriva familjens lösenord i rutan ovanför. Annars: skapa en <em>fine-grained token</em> ' +
    'på github.com (Settings → Developer settings → Personal access tokens) med skrivrätt ' +
    'till <strong>Contents</strong> i just ' + EDIT_REPO + '. Nyckeln sparas bara i din webbläsare.</p>' +
    '<input type="password" data-token placeholder="github_pat_..." autocomplete="off">' +
    '<p><strong>Aktivera lösenordsläget</strong> (engångssteg, kräver nyckeln ovan): nyckeln ' +
    'krypteras med lösenordet och läggs i repot, så att resten av släkten bara behöver lösenordet.</p>' +
    '<input type="password" data-nytt-losen placeholder="Välj lösenord (VERSALER)" autocomplete="off">' +
    '<div class="edit-row">' +
    '<button type="button" class="btn btn-secondary" data-aktivera>Aktivera lösenordsläget</button>' +
    '</div>' +
    '</details>' +
    '<p>Utkast syns bara i din webbläsare tills du publicerar. Formatering (fetstil m.m.) ' +
    'försvinner i stycken du skriver om. Pyt.</p>' +
    '<button type="button" class="edit-reset" data-reset>Rensa mina utkast på alla sidor</button>';

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const $$ = (sel) => panel.querySelector(sel);
  const tokenInput = $$('[data-token]');
  try { tokenInput.value = localStorage.getItem(EDIT_TOKEN_LS) || ''; } catch (e) { /* ok */ }
  tokenInput.addEventListener('change', () => {
    try { localStorage.setItem(EDIT_TOKEN_LS, tokenInput.value.trim()); } catch (e) { /* ok */ }
  });

  // ── Lösenordsläget ──
  const losenRow = $$('[data-losen-row]');
  const losenInput = $$('[data-losen]');
  let nyckelBlob = null;
  const sessionToken = () => {
    try { return sessionStorage.getItem(PUB_SS) || ''; } catch (e) { return ''; }
  };
  const getToken = () => sessionToken() || tokenInput.value.trim();
  const refreshLosenUi = () => {
    losenRow.hidden = !(nyckelBlob && !sessionToken());
  };

  const b64e = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
  const deriveKey = async (losen, salt, iter) => {
    const base = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(losen), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  };

  fetch(`${NYCKEL_FILE}?v=${Date.now()}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((j) => {
      if (j && j.v === 1 && j.salt && j.iv && j.data) { nyckelBlob = j; refreshLosenUi(); }
    })
    .catch(() => { /* utan blob gäller nyckel som vanligt */ });

  $$('[data-unlock]').addEventListener('click', async () => {
    const status = $$('[data-status]');
    const losen = losenInput.value.trim();
    if (!losen) { losenInput.focus(); return; }
    status.textContent = 'Låser upp …';
    try {
      const key = await deriveKey(losen, b64d(nyckelBlob.salt), nyckelBlob.iter || PBKDF_ITER);
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64d(nyckelBlob.iv) }, key, b64d(nyckelBlob.data));
      const token = new TextDecoder().decode(plain);
      try { sessionStorage.setItem(PUB_SS, token); } catch (e) { tokenInput.value = token; }
      losenInput.value = '';
      refreshLosenUi();
      status.textContent = 'Upplåst! 🔓 Nu kan du publicera.';
    } catch (err) {
      status.textContent = 'Fel lösenord (VERSALER gäller). Försök igen.';
    }
  });
  losenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $$('[data-unlock]').click(); }
  });

  $$('[data-aktivera]').addEventListener('click', async () => {
    const status = $$('[data-status]');
    const token = tokenInput.value.trim();
    const losen = $$('[data-nytt-losen]').value.trim();
    if (!token) { status.textContent = 'Klistra in GitHub-nyckeln först, det är den som krypteras. 🔑'; return; }
    if (losen.length < 6) { status.textContent = 'Välj ett lösenord på minst 6 tecken.'; return; }
    status.textContent = 'Krypterar och lägger i repot …';
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(losen, salt, PBKDF_ITER);
      const data = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, new TextEncoder().encode(token));
      const blob = { v: 1, iter: PBKDF_ITER, salt: b64e(salt), iv: b64e(iv), data: b64e(data) };
      const api = `https://api.github.com/repos/${EDIT_REPO}/contents/${NYCKEL_FILE}`;
      const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
      const getRes = await fetch(`${api}?ref=${encodeURIComponent(EDIT_BRANCH)}`, { headers });
      let sha;
      if (getRes.ok) sha = (await getRes.json()).sha;
      else if (getRes.status !== 404) throw new Error(`GitHub svarade ${getRes.status} vid läsning`);
      const body = {
        message: 'Aktivera lösenordsläget: krypterad publiceringsnyckel',
        content: btoa(unescape(encodeURIComponent(JSON.stringify(blob, null, 2) + '\n'))),
        branch: EDIT_BRANCH,
      };
      if (sha) body.sha = sha;
      const putRes = await fetch(api, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (!putRes.ok) throw new Error(`GitHub svarade ${putRes.status} vid skrivning`);
      nyckelBlob = blob;
      $$('[data-nytt-losen]').value = '';
      refreshLosenUi();
      status.textContent = 'Lösenordsläget aktiverat! ✅ Efter nästa deploy räcker lösenordet.';
    } catch (err) {
      status.textContent = `Det gick inte: ${err.message}.`;
    }
  });

  const draftCount = () => Object.keys(draft).length;
  const refreshUi = () => {
    $$('[data-count]').innerHTML = draftCount()
      ? `<span class="edit-count">${draftCount()}</span> osparade/lokala ändringar.` : '';
    $$('[data-save]').hidden = !editing && !draftCount();
    $$('[data-publish]').hidden = !draftCount();
  };

  let editing = false;
  const setEditing = (on) => {
    editing = on;
    document.body.classList.toggle('edit-mode', on);
    $$('[data-toggle]').textContent = on ? 'Stäng av redigering' : 'Slå på redigering';
    for (const el of els) {
      if (on) {
        el.setAttribute('contenteditable', 'plaintext-only');
        if (!el.isContentEditable) el.setAttribute('contenteditable', 'true');
        el.dataset.editable = '1';
      } else {
        el.removeAttribute('contenteditable');
        delete el.dataset.editable;
      }
    }
    refreshUi();
  };

  const collectDraft = () => {
    for (const el of els) {
      const k = keyOf.get(el);
      const cur = normText(el.textContent);
      if (cur === defaultOf.get(el)) {
        // åter till original: radera utkast, markera radering om publicerad text finns
        if (published[k] !== undefined) draft[k] = null;
        else delete draft[k];
      } else if (published[k] !== undefined && cur === normText(published[k])) {
        delete draft[k];
      } else {
        draft[k] = cur;
      }
    }
  };

  const saveLocal = () => {
    collectDraft();
    try { localStorage.setItem(EDIT_LS, JSON.stringify(draft)); } catch (e) { /* ok */ }
    refreshUi();
    $$('[data-status]').textContent = draftCount()
      ? 'Utkast sparat i din webbläsare. 💾' : 'Inga ändringar kvar att spara.';
  };

  fab.addEventListener('click', () => { panel.hidden = !panel.hidden; });
  $$('[data-toggle]').addEventListener('click', () => setEditing(!editing));
  $$('[data-save]').addEventListener('click', saveLocal);
  document.addEventListener('focusout', (ev) => {
    if (editing && ev.target instanceof Element && ev.target.dataset && ev.target.dataset.editable) {
      collectDraft();
      refreshUi();
    }
  });

  $$('[data-reset]').addEventListener('click', () => {
    if (!window.confirm('Rensa alla dina lokala utkast (på alla sidor)? Publicerade texter påverkas inte.')) return;
    draft = {};
    try { localStorage.removeItem(EDIT_LS); } catch (e) { /* ok */ }
    window.location.reload();
  });

  $$('[data-publish]').addEventListener('click', async () => {
    collectDraft();
    const token = getToken();
    const status = $$('[data-status]');
    if (!draftCount()) { status.textContent = 'Inga ändringar att publicera.'; return; }
    if (!token) {
      status.textContent = nyckelBlob
        ? 'Skriv familjens lösenord ovan och klicka Lås upp först. 🔐'
        : 'Klistra in en GitHub-nyckel först (se nedan). 🔑';
      return;
    }
    status.textContent = 'Publicerar …';
    try {
      const api = `https://api.github.com/repos/${EDIT_REPO}/contents/${EDIT_FILE}`;
      const headers = {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      };
      const getRes = await fetch(`${api}?ref=${encodeURIComponent(EDIT_BRANCH)}`, { headers });
      let sha;
      let current = {};
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
        try { current = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))); } catch (e) { current = {}; }
      } else if (getRes.status !== 404) {
        throw new Error(`GitHub svarade ${getRes.status} vid läsning`);
      }
      const merged = { ...(published || {}), ...(current || {}) };
      for (const [k, v] of Object.entries(draft)) {
        if (v === null) delete merged[k];
        else merged[k] = v;
      }
      const body = {
        message: 'Personalisera: textändringar via redigeringsläget på sajten',
        content: btoa(unescape(encodeURIComponent(JSON.stringify(merged, null, 2) + '\n'))),
        branch: EDIT_BRANCH,
      };
      if (sha) body.sha = sha;
      const putRes = await fetch(api, { method: 'PUT', headers, body: JSON.stringify(body) });
      if (!putRes.ok) throw new Error(`GitHub svarade ${putRes.status} vid skrivning`);
      published = merged;
      draft = {};
      try { localStorage.removeItem(EDIT_LS); } catch (e) { /* ok */ }
      refreshUi();
      status.textContent = 'Publicerat! ✅ Syns för alla inom någon minut.';
    } catch (err) {
      status.textContent = `Det gick inte: ${err.message}. Kontrollera nyckeln och försök igen.`;
    }
  });

  refreshUi();
}

/* ─────────────── Släktkontrollen 🛂 ───────────────
   Första besöket i en ny webbläsare möts av gränskontrollen: tre slumpade
   frågor ur släktens gemensamma minne. Alla rätt bevisar släktskap en gång
   för alla — beviset sparas i localStorage och gäller enheten för evigt. */

const SLAKT_LS = 'kusinSlaktBevisad';

// Första alternativet är alltid det rätta; ordningen blandas vid visning.
const SLAKT_FRAGOR = [
  { q: 'Vad av följande ska du absolut inte ha i maten på kusinsemestern?',
    alt: ['Jordnötter', 'Koriander', 'Gluten', 'Räkor'] },
  { q: 'Angående [ … ]. Jag satte mig på ditt [ … ].', lucka: true,
    alt: ['Flygplan', 'Tåg', 'Paraply', 'Visitkort'] },
  { q: 'Vilket tv-program är bäst?',
    alt: ['SvampBob', 'Bolibompa', 'Paradise Hotel', 'Antikrundan'] },
  { q: 'Ett [ … ] är väl inget [ … ].', lucka: true,
    alt: ['Ägg', 'Päron', 'Löfte', 'Problem'] },
  { q: 'Who is the wife of [ … ]?',
    alt: ['Hakan', 'Håkan', 'Haakan', 'Ann'] },
  { q: 'Med på semestern är familjen …',
    alt: ['Tofu', 'Halloumi', 'Seitan', 'Quorn'] },
];

function setupSlakttest() {
  try {
    if (localStorage.getItem(SLAKT_LS) === '1') return;
  } catch (e) { /* privat läge: beviset kan inte sparas, men testet funkar */ }

  const blanda = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const overlay = document.createElement('div');
  overlay.className = 'slakt-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Släktkontroll');
  document.body.appendChild(overlay);
  document.body.classList.add('slakt-sperr');

  let valda = [];

  const nyOmgang = (felmedd) => {
    valda = blanda(SLAKT_FRAGOR.slice()).slice(0, 3).map((f) => ({
      ...f, ratt: f.alt[0], alt: blanda(f.alt.slice()),
    }));
    overlay.innerHTML = `
      <form class="slakt-kort">
        <div class="slakt-emblem" aria-hidden="true">🛂</div>
        <h2 tabindex="-1">Släktkontroll</h2>
        <p class="slakt-ingress">Det här är kusinsemesterns webbplats — endast för släkten.
          Styrk din släkttillhörighet genom att besvara tre frågor ur släktens gemensamma minne.
          Godkänt prov gäller för all framtid.</p>
        ${valda.map((f, i) => `
          <fieldset class="slakt-fraga">
            <legend>${f.lucka ? '<span class="slakt-lucka">Lucktext</span> ' : ''}${esc(f.q)}</legend>
            <div class="slakt-alt">
              ${f.alt.map((a) => `
                <label><input type="radio" name="f${i}" value="${esc(a)}"><span>${esc(a)}</span></label>`).join('')}
            </div>
          </fieldset>`).join('')}
        <p class="slakt-fel" aria-live="assertive">${felmedd ? esc(felmedd) : ''}</p>
        <button type="submit" class="btn slakt-knapp">Jag tillhör släkten</button>
      </form>`;
    const form = overlay.querySelector('form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const svar = valda.map((f, i) => data.get(`f${i}`));
      if (svar.some((s) => s === null)) {
        form.querySelector('.slakt-fel').textContent =
          'Kontrollen kräver svar på alla tre frågorna.';
        return;
      }
      if (valda.every((f, i) => svar[i] === f.ratt)) godkann();
      else nyOmgang('Hmm. Det där lät inte som släkten. Vakten blandar nya frågor — försök igen!');
    });
    if (felmedd) form.querySelector('h2').focus();
  };

  const godkann = () => {
    try { localStorage.setItem(SLAKT_LS, '1'); } catch (e) { /* privat läge */ }
    overlay.innerHTML = `
      <div class="slakt-kort slakt-valkommen">
        <div class="slakt-emblem" aria-hidden="true">🏖️</div>
        <h2>Godkänd — välkommen hem, släkting!</h2>
        <p>Släktskapet är härmed styrkt och intygat för all framtid på den här enheten.
          Softicen står i Hurup.</p>
      </div>`;
    document.body.classList.remove('slakt-sperr');
    setTimeout(() => overlay.classList.add('borta'), reducedMotion ? 1200 : 2200);
    setTimeout(() => overlay.remove(), reducedMotion ? 1300 : 2900);
  };

  nyOmgang();
}

/* ─────────────── Start ─────────────── */

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  setupSlakttest();
  setupLarv();
  setupSurfers();
  setupEditor();
  setupDanskskolan();

  // Varje sida har bara sina egna byggstenar. Kör det som faktiskt finns.
  if ($('#countdown')) {
    renderCountdown();
    setInterval(renderCountdown, 1000);
  }
  if ($('#narvaro-chart')) renderChart();
  if ($('#action-map')) initActionMap();

  const korsika = $('#korsika-dagar');
  if (korsika) {
    const dagar = Math.ceil((new Date(2027, 7, 1) - new Date()) / 86400000);
    if (dagar > 0) korsika.textContent = `Drömmen ligger ungefär ${dagar} dagar bort (preliminärt)`;
  }

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
