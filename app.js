/* ═══════════════ Kusinsemestern 2026, app.js ═══════════════ */
'use strict';

/* ─────────────── Grunddata ─────────────── */

const YEAR = 2026;
const MONTH = 7; // augusti (0-indexerad)
const TRIP_START = 8;
const TRIP_END = 22;

// Så som gruppchatten ser ut just nu. presence = på plats, cook = kan stå i matlag.
const PEOPLE = [
  { id: 'hakan',   name: 'Håkan',    note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'ann',     name: 'Ann',      note: 'Med hela tiden 🌞',      presence: [8, 22],  cook: [8, 21] },
  { id: 'ak',      name: 'A-K',      note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'otto',    name: 'Otto',     note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'tyra',    name: 'Tyra',     note: '8–11 aug',               presence: [8, 11],  cook: [8, 10],
    rnote: 'Ottos flickvän, reser hem tisdagen den 11:e' },
  { id: 'lena',    name: 'Lena',     note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'larsake', name: 'Lars-Åke', note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'nora',    name: 'Nora',     note: 'Båda veckorna 🤩',       presence: [8, 22],  cook: [8, 21] },
  { id: 'manne',   name: 'Manne',    note: 'Båda veckorna',          presence: [8, 22],  cook: [8, 21] },
  { id: 'my',      name: 'My',       note: 'Hedersgäst & maskot',    presence: [8, 22],  cook: [8, 21],
    inDraw: false, baby: true, rnote: 'Dispens beviljad: 1,5 år. Chef för avsmakning.' },
  { id: 'jonas',   name: 'Jonas',    note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'jessica', name: 'Jessica',  note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'kalle',   name: 'Kalle',    note: 'Hedersgäst & maskot',    presence: [8, 22],  cook: [8, 21],
    inDraw: false, baby: true, rnote: 'Dispens beviljad: 0 år. Får röra i grytan under uppsikt.' },
  { id: 'jakob',   name: 'Jakob',    note: '',                       presence: [8, 22],  cook: [8, 21] },
  { id: 'hannes',  name: 'Hannes',   note: 'Båda veckorna',          presence: [8, 22],  cook: [8, 21] },
  { id: 'ivan',    name: 'Ivan',     note: 'Båda veckorna',          presence: [8, 22],  cook: [8, 21] },
  { id: 'alice',   name: 'Alice',    note: 'Från 18 aug 🤠',         presence: [18, 22], cook: [18, 21] },
  { id: 'theo',    name: 'Theo',     note: 'Från 18 aug 🤠',         presence: [18, 22], cook: [18, 21] },
  { id: 'george',  name: 'Jojje',    note: '9–13 aug',               presence: [9, 13],  cook: [9, 12],
    rnote: 'Reser hem den 13:e' },
  { id: 'ellen',   name: 'Ellen',    note: '9–13 aug',               presence: [9, 13],  cook: [9, 12],
    rnote: 'Reser hem den 13:e' },
];

/* ─────────────── Hjälpfunktioner ─────────────── */

const $ = (sel) => document.querySelector(sel);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const dowFmt = new Intl.DateTimeFormat('sv-SE', { weekday: 'short' });
const dow = (d) => dowFmt.format(new Date(YEAR, MONTH, d));
const fmtDay = (d) => `${d} aug`;
const fmtDateTime = (iso) => new Intl.DateTimeFormat('sv-SE', {
  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(iso));

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

/* ─────────────── Surfande släktingar 🏄 ───────────────
   Släktens huvuden ur ANSIKTEEN, monterade på professionella surfarkroppar,
   rider på vågen i sidhuvudet. Surfarna följer exakt samma bezierkurva som
   vågens svg-path är ritad med. */

// Vars och ens catchphrase: klickar man på en surfare hoppar hen till
// och ropar sin klassiker i en pratbubbla.
const SURF_FRASER = {
  hakan: 'Glöm inte att köpa LEVIANBRÖD!',
  ak: 'Har någon sett mina skor?',
  otto: 'Är det inte dags att kolla på Svamp-Bob?',
  lena: 'Hannes! Din idiot!',
  la: 'Är kaffet klart?',
  nora: 'Manne, hämta mina solglasögon!',
  manne: 'Har någon sett mitt korsord?',
  my: 'Mamma!',
  jonas: 'Vilka är med på rutsystem?',
  jessica: 'Jag är ingen melonmänniska!',
  kalle: 'Gaga!',
  jakob: 'HANNES!',
  hannes: 'JAKOB!',
  ivan: '夏日快乐！', // »Glad sommar!«
  alice: 'Foccaccian är klar!',
  theo: '♪ Vi dricker Cava Aperol! ♪',
  jojje: 'Heja kommunismen!',
  ellen: 'Jo!',
  ann: 'Aaaaaaaaah!',
  tyra: 'Kul att vara här! :)',
};

// [id, namn, kropp] – kroppen avgör vilken surfarkropp huvudet monteras på.
const SURF_FACES = [
  ['ak', 'A-K', 'dam'], ['alice', 'Alice', 'dam'], ['ann', 'Ann', 'dam'],
  ['ellen', 'Ellen', 'dam'], ['hakan', 'Håkan', 'man'], ['hannes', 'Hannes', 'man'],
  ['ivan', 'Ivan', 'man'], ['jakob', 'Jakob', 'man'], ['jessica', 'Jessica', 'dam'],
  ['jojje', 'Jojje', 'man'], ['jonas', 'Jonas', 'man'], ['kalle', 'Kalle', 'man'],
  ['la', 'Lars-Åke', 'man'], ['lena', 'Lena', 'dam'], ['manne', 'Manne', 'man'],
  ['my', 'My', 'dam'], ['nora', 'Nora', 'dam'], ['otto', 'Otto', 'man'],
  ['theo', 'Theo', 'man'], ['tyra', 'Tyra', 'dam'],
];

// Nykomlingen som alltid får surfa först, så att ingen missar att hon
// kommit med. Sätt till null när nyhetens behag lagt sig.
const FORST_UT = 'tyra';

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
  const fyllKon = () => {
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
  };
  // Nykomlingen öppnar alltid, och plockas då bort ur det första varvet så
  // att hon inte kommer två gånger på raken.
  let forstUt = SURF_FACES.find((f) => f[0] === FORST_UT) || null;
  const nextFace = () => {
    if (forstUt) {
      lastFace = forstUt;
      forstUt = null;
      fyllKon();
      queue = queue.filter((f) => f !== lastFace);
      return lastFace;
    }
    if (!queue.length) fyllKon();
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
    el.dataset.slakting = face[0]; // partyhatten hittar sin ägare via id:t
    // inre lagret hoppar vid klick, utan att krocka med banans transform på roten
    const inre = document.createElement('div');
    inre.className = 'surfer-inre';
    const body = document.createElement('img');
    body.className = 'surfer-body';
    body.src = `img/surf/surf-${face[2]}.webp`;
    body.alt = '';
    const img = document.createElement('img');
    img.className = 'surfer-face';
    img.src = `img/ansikten/${face[0]}.webp`;
    img.alt = '';
    inre.appendChild(body);
    inre.appendChild(img);
    // Generös osynlig klickyta runt surfaren, så den rörliga figuren blir
    // lätt att träffa. Ligger stilla medan sprajten hoppar.
    const hit = document.createElement('span');
    hit.className = 'surfer-hit';
    const bubbla = document.createElement('span');
    bubbla.className = 'surfer-bubbla';
    bubbla.textContent = SURF_FRASER[face[0]] || 'Another summer!';
    el.appendChild(hit);
    el.appendChild(inre);
    el.appendChild(bubbla);
    header.appendChild(el);
    sattHattPa(el); // dagens tårtjaktvinnare surfar i partyhatt

    // Klick: surfaren hoppar till och ropar sin catchphrase. Klick på hela
    // ytan (även den osynliga marginalen) bubblar upp hit.
    const prata = () => {
      if (el.classList.contains('pratar')) return;
      el.classList.add('hoppar', 'pratar');
      setTimeout(() => el.classList.remove('hoppar'), 650);
      setTimeout(() => el.classList.remove('pratar'), 2800);
    };
    el.addEventListener('click', prata);

    const dir = Math.random() < 0.5 ? 1 : -1;
    // kropparna är fotograferade på väg åt höger; åt vänster speglas de
    if (dir === -1) el.classList.add('vand');

    surfers.push({
      el,
      prata,
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

  // Då och då ropar någon sin catchphrase självmant, så att besökaren
  // förstår att surfarna går att klicka på. Bara surfare som är ordentligt
  // inne på skärmen ropar, så att bubblan syns hel.
  const ropaSjalvmant = (forsta) => {
    setTimeout(() => {
      if (!document.hidden) {
        const synliga = surfers.filter((s) => {
          if (s.el.classList.contains('pratar')) return false;
          const r = s.el.getBoundingClientRect();
          const mitt = r.x + r.width / 2;
          return mitt > 110 && mitt < window.innerWidth - 110 && r.bottom > 0 && r.top < window.innerHeight;
        });
        if (synliga.length) synliga[Math.floor(Math.random() * synliga.length)].prata();
      }
      ropaSjalvmant(false);
    }, forsta ? 6000 + Math.random() * 5000 : 16000 + Math.random() * 14000);
  };

  // Odokumenterad krok så att testerna kan skicka ut en surfare direkt.
  window.__surf = spawn;

  setTimeout(() => { if (!document.hidden) spawn(); }, 1200 + Math.random() * 1500);
  scheduleNext();
  ropaSjalvmant(true);
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
  const kanTala = 'speechSynthesis' in window;
  // Rösterna laddas asynkront i vissa webbläsare; frågar därför vid varje klick.
  const danskRoest = () => {
    const voices = speechSynthesis.getVoices();
    return voices.find((v) => /^da([-_]|$)/i.test(v.lang)) || null;
  };
  // Reserv om ett klipp saknas eller inte kan spelas: webbläsarens talsyntes.
  const talaFallback = (btn) => {
    if (!kanTala) return;
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
  };

  let nuvarande = null; // pågående ljudklipp

  btns.forEach((btn) => {
    btn.addEventListener('click', () => {
      // Stoppa allt som redan spelas.
      if (nuvarande) { try { nuvarande.pause(); } catch (e) { /* ok */ } nuvarande = null; }
      if (kanTala) speechSynthesis.cancel();
      document.querySelectorAll('.say-btn.sjunger').forEach((b) => b.classList.remove('sjunger'));

      const klipp = btn.dataset.clip;
      if (klipp) {
        // MC Jojjes riktiga danska röst (ElevenLabs), förgenererad i dansk/.
        const ljud = new Audio(klipp);
        nuvarande = ljud;
        btn.classList.add('sjunger');
        const klar = () => { btn.classList.remove('sjunger'); if (nuvarande === ljud) nuvarande = null; };
        ljud.addEventListener('ended', klar);
        ljud.addEventListener('error', () => { klar(); talaFallback(btn); });
        const p = ljud.play();
        if (p) p.catch(() => { klar(); talaFallback(btn); });
      } else {
        talaFallback(btn);
      }
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

  const startaBeat = () => {
    if (!ctx) ctx = new Ctx();
    ctx.resume();
    if (!timer) {
      steg = 0;
      nextAt = ctx.currentTime + 0.06;
      timer = setInterval(tickBeat, 40);
    }
  };
  const stoppaBeat = () => {
    clearInterval(timer);
    timer = null;
    if (ctx) ctx.suspend();
  };
  const visaLage = (on) => {
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? '🎧 Beat: på' : '🎧 Beat: av';
    document.querySelector('.dansk-header').classList.toggle('bumpar', on && !reducedMotion);
  };

  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    visaLage(on);
    if (on) startaBeat(); else stoppaBeat();
  });

  // Beat på som standard. Webbläsarna tillåter dock inte ljud förrän besökaren
  // rört sidan (autoplay-policyn), så vi visar »på« direkt och väcker ljudet
  // vid första klicket/trycket/skrollet. Har man stängt av beaten släpps den
  // inte igång av gesten.
  visaLage(true);
  const GESTER = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
  const vackLjud = () => {
    if (btn.getAttribute('aria-pressed') === 'true') startaBeat();
    if (!ctx || ctx.state === 'running') {
      GESTER.forEach((ev) => window.removeEventListener(ev, vackLjud));
    }
  };
  GESTER.forEach((ev) => window.addEventListener(ev, vackLjud, { passive: true }));
  startaBeat(); // försök redan nu; ljudet börjar rulla så fort policyn släpper fram det
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

/* ─────────────── Dagens danska ord 🇩🇰 ───────────────
   Ett nytt ord varje dag, valt efter datumet så att hela släkten ser
   samma ord samma dag. Orden är sådana man faktiskt har nytta av i Thy:
   frallor, pant, blåsväder – och de lömska falska vännerna (frokost är
   lunch, rolig betyder lugn). Klippen läses av samma danska röst som
   danskskolan; saknas de tar webbläsarens danska talsyntes över.
   [ord, uttal, betyder, exempel, översättning, klipp] */

const DANSKA_ORD = [
  ['hyggeligt', 'hygg-eli', 'mysigt, trivsamt – danskarnas favoritord',
    'Det var hyggeligt at se jer!', 'Vad mysigt att ses!', 'ord/01.mp3'],
  ['lækkert', 'läck-ert', 'gott, läckert',
    'Maden er virkelig lækker.', 'Maten är verkligen god.', 'ord/02.mp3'],
  ['frokost', 'fro-kost', 'lunch – alltså INTE frukost',
    'Vi spiser frokost klokken tolv.', 'Vi äter lunch klockan tolv.', 'ord/03.mp3'],
  ['morgenmad', 'morn-madh', 'frukost',
    'Der står morgenmad på bordet.', 'Frukosten står på bordet.', 'ord/04.mp3'],
  ['rolig', 'ro-li', 'lugn – inte rolig!',
    'Tag det nu roligt.', 'Ta det lugnt nu.', 'ord/05.mp3'],
  ['grine', 'gri-ne', 'skratta',
    'Vi grinede hele aftenen.', 'Vi skrattade hela kvällen.', 'ord/06.mp3'],
  ['træls', 'trals', 'tråkigt, jobbigt – äkta jylländska',
    'Hvor er det træls med regnen.', 'Vad tråkigt med regnet.', 'ord/07.mp3'],
  ['fedt', 'fett', 'asgrymt, toppen',
    'Fedt, vi skal på stranden!', 'Toppen, vi ska till stranden!', 'ord/08.mp3'],
  ['slik', 'slick', 'godis',
    'Fredag er slikdag.', 'Fredag är godisdag.', 'ord/09.mp3'],
  ['is', 'is', 'glass',
    'To kugler is, tak.', 'Två kulor glass, tack.', 'ord/10.mp3'],
  ['pølse', 'pöl-se', 'korv',
    'En ristet pølse med det hele.', 'En grillad korv med allt på.', 'ord/11.mp3'],
  ['rundstykker', 'ron-stökker', 'frallor',
    'Jeg henter rundstykker til morgenmaden.', 'Jag hämtar frallor till frukosten.', 'ord/12.mp3'],
  ['købmand', 'köb-man', 'livsmedelsaffär',
    'Købmanden lukker klokken syv.', 'Affären stänger klockan sju.', 'ord/13.mp3'],
  ['pant', 'pant', 'pant på flaskor och burkar',
    'Husk pant på flaskerne!', 'Glöm inte panten på flaskorna!', 'ord/14.mp3'],
  ['regning', 'raj-ning', 'nota, räkning',
    'Må jeg bede om regningen?', 'Kan jag få notan?', 'ord/15.mp3'],
  ['værsgo', 'värs-go', 'varsågod',
    'Værsgo, tag en til.', 'Varsågod, ta en till.', 'ord/16.mp3'],
  ['tak for mad', 'tack for madh', 'tack för maten – sägs alltid',
    'Tak for mad, det var lækkert!', 'Tack för maten, det var gott!', 'ord/17.mp3'],
  ['skål', 'skoal', 'skål',
    'Skål for kusinesommeren!', 'Skål för kusinsommaren!', 'ord/18.mp3'],
  ['undskyld', 'on-skyl', 'förlåt, ursäkta',
    'Undskyld, hvor er toilettet?', 'Ursäkta, var är toaletten?', 'ord/19.mp3'],
  ['hvad koster det', 'va koster de', 'vad kostar det',
    'Hvad koster det for to?', 'Vad kostar det för två?', 'ord/20.mp3'],
  ['strand', 'strann', 'strand',
    'Vi tager på stranden i dag.', 'Vi drar till stranden i dag.', 'ord/21.mp3'],
  ['badevand', 'badhe-van', 'badvatten',
    'Badevandet er sytten grader.', 'Badvattnet är sjutton grader.', 'ord/22.mp3'],
  ['blæsevejr', 'bläse-vajr', 'blåsväder – nyttigt i Thy',
    'Det er noget blæsevejr i dag.', 'Det är rejält blåsväder i dag.', 'ord/23.mp3'],
  ['solskin', 'sol-skin', 'solsken',
    'Endelig solskin over fjorden!', 'Äntligen solsken över fjorden!', 'ord/24.mp3'],
  ['klit', 'klit', 'sanddyn',
    'Vi gik en tur op i klitterne.', 'Vi gick en tur upp i sanddynerna.', 'ord/25.mp3'],
  ['grill', 'grill', 'grill – Håkans favorit',
    'Hvor er grillen henne?', 'Var é grillen?', 'ord/26.mp3'],
  ['flink', 'flink', 'snäll – inte flink!',
    'Naboen er så flink.', 'Grannen är så snäll.', 'ord/27.mp3'],
  ['by', 'by', 'stad – inte by!',
    'Vi kører ind til byen.', 'Vi åker in till stan.', 'ord/28.mp3'],
  ['kæmpe', 'kem-pe', 'jätte-, enorm',
    'Det var en kæmpe fisk!', 'Det var en jättefisk!', 'ord/29.mp3'],
  ['mojn', 'mojn', 'hej – och hejdå, samma ord',
    'Mojn! Vi ses i morgen.', 'Hej! Vi ses i morgon.', 'ord/30.mp3'],
];

function renderDagensOrd() {
  const box = $('#dagens-ord');
  if (!box) return;
  // Dagnummer räknat på det lokala datumet: alla ser samma ord samma dag,
  // och det byts vid midnatt hemma hos var och en.
  const nu = new Date();
  const dagnr = Math.floor(Date.UTC(nu.getFullYear(), nu.getMonth(), nu.getDate()) / 86400000);
  const [ord, uttal, betyder, exempel, sv, klipp] = DANSKA_ORD[
    ((dagnr % DANSKA_ORD.length) + DANSKA_ORD.length) % DANSKA_ORD.length];

  box.innerHTML = `
    <p class="ord-etikett">🇩🇰 Dagens danska ord</p>
    <p class="ord-sjalva">
      <span class="ord-ord">${esc(ord)}</span>
      <button type="button" class="ord-lyssna" aria-label="Hör hur ordet uttalas">🔊</button>
    </p>
    <p class="ord-uttal">uttalas ungefär »${esc(uttal)}«</p>
    <p class="ord-betyder">${esc(betyder)}</p>
    <p class="ord-exempel">»${esc(exempel)}«<br><span class="ord-sv">${esc(sv)}</span></p>
    <a class="ord-lank" href="danskskolan.html">Fler ord i Jojjes danskskola →</a>`;

  const knapp = box.querySelector('.ord-lyssna');
  const tala = () => {
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(`${ord}. ${exempel}`);
      u.lang = 'da-DK';
      const dansk = speechSynthesis.getVoices().find((v) => /^da([-_]|$)/i.test(v.lang));
      if (dansk) u.voice = dansk;
      u.rate = 0.95;
      knapp.classList.add('later');
      u.onend = () => knapp.classList.remove('later');
      u.onerror = () => knapp.classList.remove('later');
      speechSynthesis.speak(u);
    } catch (e) { knapp.classList.remove('later'); }
  };
  knapp.addEventListener('click', () => {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    // Riktig dansk inläsning om klippet finns, annars talsyntesen.
    const ljud = new Audio(klipp);
    knapp.classList.add('later');
    const klar = () => knapp.classList.remove('later');
    ljud.addEventListener('ended', klar);
    ljud.addEventListener('error', () => { klar(); tala(); });
    const p = ljud.play();
    if (p) p.catch(() => { klar(); tala(); });
  });
}

/* ─────────────── Vädret på plats 🌤️ ───────────────
   Live från Open-Meteo (öppet API, ingen nyckel och ingen registrering):
   Helligsø Strand nu och de närmaste dagarna, med Korsika bredvid för
   perspektivets skull. Ett enda anrop hämtar båda platserna. */

const VADER_URL = 'https://api.open-meteo.com/v1/forecast' +
  '?latitude=56.633,41.9192&longitude=8.345,8.7386' +
  '&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m' +
  '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
  '&timezone=auto&forecast_days=6';
const VADER_SS = 'kusinVader';
const VADER_FARSK = 15 * 60 * 1000; // en kvart räcker gott

// WMO-koderna som API:t svarar med, översatta till svenska och emoji.
const VADER_KODER = {
  0: ['☀️', 'Klart'], 1: ['🌤️', 'Mest klart'], 2: ['⛅', 'Halvklart'], 3: ['☁️', 'Mulet'],
  45: ['🌫️', 'Dimma'], 48: ['🌫️', 'Underkyld dimma'],
  51: ['🌦️', 'Lätt duggregn'], 53: ['🌦️', 'Duggregn'], 55: ['🌦️', 'Tätt duggregn'],
  56: ['🌧️', 'Underkylt duggregn'], 57: ['🌧️', 'Underkylt duggregn'],
  61: ['🌧️', 'Lätt regn'], 63: ['🌧️', 'Regn'], 65: ['🌧️', 'Kraftigt regn'],
  66: ['🌧️', 'Underkylt regn'], 67: ['🌧️', 'Underkylt regn'],
  71: ['🌨️', 'Lätt snöfall'], 73: ['🌨️', 'Snöfall'], 75: ['❄️', 'Kraftigt snöfall'],
  77: ['🌨️', 'Snökorn'],
  80: ['🌦️', 'Regnskurar'], 81: ['🌧️', 'Regnskurar'], 82: ['⛈️', 'Kraftiga skurar'],
  85: ['🌨️', 'Snöbyar'], 86: ['❄️', 'Snöbyar'],
  95: ['⛈️', 'Åska'], 96: ['⛈️', 'Åska med hagel'], 99: ['⛈️', 'Åska med hagel'],
};
const vaderKod = (k) => VADER_KODER[k] || ['🌡️', 'Väder'];
const grader = (t) => `${Math.round(t)}°`;

function renderVader() {
  const box = $('#vader');
  if (!box) return;

  const veckodag = new Intl.DateTimeFormat('sv-SE', { weekday: 'short' });

  const rita = (platser) => {
    const [dk, fr] = platser;
    const [dkEmoji, dkText] = vaderKod(dk.current.weather_code);
    // Drömkommissionen har beslutat (§ 7) att det alltid är sol på Korsika.
    // Temperaturen är äkta in i minsta decimal – men vädertecknet fuskar vi
    // glatt med, för att motivera resan 2027 lite extra. Fotnoten under
    // rutan berättar om fusket, så ingen luras på riktigt.
    const [frEmoji, frText] = ['☀️', 'Sol, så klart'];
    // Räkna på de avrundade talen som faktiskt står på skärmen, så att
    // 34° och 19° ger 15° och inte 16° för den som räknar efter.
    const skillnad = Math.round(fr.current.temperature_2m) - Math.round(dk.current.temperature_2m);
    // Danmark får sista ordet de dagar det faktiskt är varmast hemma.
    const kommentar = skillnad > 0
      ? `${skillnad}° varmare än i Thy just nu. 🤌`
      : (skillnad < 0
        ? `Faktiskt ${Math.abs(skillnad)}° <em>kallare</em> än i Thy just nu. Vi säger inget mer. 😎`
        : 'Exakt lika varmt som i Thy just nu. Otroligt. 😌');

    const dagar = dk.daily.time.map((iso, i) => {
      const [e, t] = vaderKod(dk.daily.weather_code[i]);
      const namn = i === 0 ? 'idag' : veckodag.format(new Date(`${iso}T12:00:00`));
      const regn = dk.daily.precipitation_probability_max[i];
      return `
        <div class="vader-dag">
          <span class="vd-namn">${esc(namn)}</span>
          <span class="vd-emoji" title="${esc(t)}" aria-label="${esc(t)}">${e}</span>
          <span class="vd-grad"><strong>${grader(dk.daily.temperature_2m_max[i])}</strong>
            <span class="vd-min">${grader(dk.daily.temperature_2m_min[i])}</span></span>
          <span class="vd-regn">${regn == null ? '' : `💧 ${regn}%`}</span>
        </div>`;
    }).join('');

    box.innerHTML = `
      <div class="vader-nu">
        <p class="vader-plats">🇩🇰 Helligsø Strand</p>
        <p class="vader-stor"><span class="vader-emoji">${dkEmoji}</span>
          <span class="vader-grad">${grader(dk.current.temperature_2m)}</span></p>
        <p class="vader-text">${esc(dkText)} · känns som
          ${grader(dk.current.apparent_temperature)} · ${Math.round(dk.current.wind_speed_10m)} km/h vind</p>
        <div class="vader-dagar">${dagar}</div>
      </div>
      <aside class="vader-korsika">
        <p class="vader-plats">🇫🇷 Korsika</p>
        <p class="vader-stor"><span class="vader-emoji">${frEmoji}</span>
          <span class="vader-grad">${grader(fr.current.temperature_2m)}</span></p>
        <p class="vader-text">${esc(frText)}</p>
        <p class="vader-skillnad">${kommentar}</p>
        <a class="vader-lank" href="korsika.html">Drömmen om 2027 →</a>
      </aside>`;
  };

  const giltig = (d) => Array.isArray(d) && d.length === 2 && d[0] && d[0].current && d[0].daily;

  // Färskt svar i sessionen ritas direkt, så att sidbyten inte laddar om.
  try {
    const sparat = JSON.parse(sessionStorage.getItem(VADER_SS));
    if (sparat && Date.now() - sparat.t < VADER_FARSK && giltig(sparat.d)) {
      rita(sparat.d);
      return;
    }
  } catch (e) { /* strunt i det, vi hämtar nytt */ }

  fetch(VADER_URL)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((data) => {
      const platser = Array.isArray(data) ? data : [data];
      if (!giltig(platser)) throw new Error('oväntat svar');
      try { sessionStorage.setItem(VADER_SS, JSON.stringify({ t: Date.now(), d: platser })); } catch (e) { /* ok */ }
      rita(platser);
    })
    .catch(() => {
      box.innerHTML = '<p class="vader-laddar">Vädertjänsten svarar inte just nu. ' +
        'Kika ut genom fönstret i stället. 🪟</p>';
    });
}

/* ─────────────── Larven från helvetet 🐛🔥 ───────────────
   »Larven fra helvede« (ekprocessionsspinnaren) härjar enligt rapporterna
   i Odense. Då och då kryper en in på sidan. Klicka på den: eldkastare. */

const LARV_KEY = 'kusinlarver2026';

// Demonstranterna ropar sitt plakat med riktig dansk röst (förgenererade
// klipp i larv/, samma ElevenLabs-röst som Jojjes danskskola). Saknas
// klippet får webbläsarens danska talsyntes ta över.
let larvRop = null;

function ropaPlakat(klipp, text) {
  if (larvRop) { try { larvRop.pause(); } catch (e) { /* ok */ } larvRop = null; }
  const talFallback = () => {
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'da-DK';
      const dansk = speechSynthesis.getVoices().find((v) => /^da([-_]|$)/i.test(v.lang));
      if (dansk) u.voice = dansk;
      u.rate = 1.05;
      speechSynthesis.speak(u);
    } catch (e) { /* tyst demonstration då */ }
  };
  try {
    const ljud = new Audio(klipp);
    ljud.volume = 0.9;
    larvRop = ljud;
    ljud.addEventListener('ended', () => { if (larvRop === ljud) larvRop = null; });
    ljud.addEventListener('error', talFallback);
    const p = ljud.play();
    if (p) p.catch(talFallback);
  } catch (e) {
    talFallback();
  }
}

// Eldkastarens dån: syntetiserad explosion (djup boom + brusblast) i WebAudio.
// Skapas i klickstunden, så webbläsarens ljudpolicy släpper fram den.
let eldCtx = null;

function spelaEldljud() {
  try {
    eldCtx = eldCtx || new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { return; /* utan WebAudio brinner larven tyst */ }
  const ctx = eldCtx;
  const spela = () => {
    if (ctx.state !== 'running') return;
    const t0 = ctx.currentTime;
    const master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);

    // Djup boom: en sinus som sveper nedåt med en punchig svälld.
    const boom = ctx.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(150, t0);
    boom.frequency.exponentialRampToValueAtTime(38, t0 + 0.5);
    const boomG = ctx.createGain();
    boomG.gain.setValueAtTime(0.0001, t0);
    boomG.gain.exponentialRampToValueAtTime(1, t0 + 0.02);
    boomG.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.62);
    boom.connect(boomG);
    boomG.connect(master);
    boom.start(t0);
    boom.stop(t0 + 0.65);

    // Explosionsbrus genom ett lågpass som öppnar och stänger igen.
    const dur = 0.9;
    const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2200, t0);
    lp.frequency.exponentialRampToValueAtTime(160, t0 + dur);
    const noiseG = ctx.createGain();
    noiseG.gain.setValueAtTime(0.0001, t0);
    noiseG.gain.exponentialRampToValueAtTime(0.75, t0 + 0.012);
    noiseG.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    noise.connect(lp);
    lp.connect(noiseG);
    noiseG.connect(master);
    noise.start(t0);
    noise.stop(t0 + dur);
  };
  if (ctx.state === 'running') spela();
  else ctx.resume().then(spela).catch(() => { /* blockerat tills ett klick släpper fram ljud */ });
}

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
    spelaEldljud();
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

    // Demonstrationsplakaten hålls upp växelvis, ett nytt för varje klick.
    // klipp = demonstranternas rop, inläst med dansk röst (ElevenLabs);
    // tal = samma budskap i korrekt stavning, som reserv för talsyntesen.
    const PLAKAT = [
      ['JA TIL MENNESKER', 'NEJ TIL LARVER',
        'larv/01.mp3', 'Ja til mennesker! Nej til larver!'],
      ['VAEK MED LARVEN!', 'SEND DEN TILLBAGE TILL HELVEDE!',
        'larv/02.mp3', 'Væk med larven! Send den tilbage til helvede!'],
    ];
    const [overst, underst, klipp, tal] = PLAKAT[(n - 1) % PLAKAT.length];
    // Ropet kommer strax efter smällen, samtidigt som plakatet åker upp.
    setTimeout(() => ropaPlakat(klipp, tal), 420);
    const toast = document.createElement('div');
    toast.className = 'larv-toast';
    toast.innerHTML = `<span class="plakat-overst">${overst}</span><span class="plakat-underst">${underst}</span>`;
    document.body.appendChild(toast);
    const w = toast.offsetWidth;
    toast.style.left = `${Math.min(Math.max(cx - w / 2, 8), Math.max(8, window.innerWidth - w - 8))}px`;
    toast.style.top = `${Math.min(Math.max(cy - 150, 12), Math.max(12, window.innerHeight - toast.offsetHeight - 70))}px`;
    toast.animate(
      [
        { opacity: 0, transform: 'translateY(16px) rotate(-5deg)' },
        { opacity: 1, transform: 'translateY(0) rotate(2deg)', offset: 0.15 },
        { opacity: 1, transform: 'translateY(-2px) rotate(-2deg)', offset: 0.45 },
        { opacity: 1, transform: 'translateY(0) rotate(2deg)', offset: 0.75 },
        { opacity: 0, transform: 'translateY(-10px) rotate(-3deg)' },
      ],
      { duration: 3200 }
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
  const SKIP = '#lott-protokoll, #lott-tally, #lott-scen, #lott-kontroll, #matlag-lista, #matlag-banner, ' +
    '#matlag-prestationer, #cup-seedning, #cup-sena, #cup-grupper, #cup-trad, ' +
    '#narvaro-chart, #vader, #dagens-ord, .section-nav, .countdown, ' +
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

/* ─────────────── SvampBob i djupet 🧽 ───────────────
   Den som skrollar ända ner till botten belönas: SvampBob kikar upp
   över nederkanten, gapskrattar sitt na-ha-ha-ha-ha-ha-ha (två bildrutor
   i växeldrift plus släktens egen skratt.mp3) och dyker ner igen. */

let skrattLjud = null;

function spelaSkratt() {
  try {
    skrattLjud = skrattLjud || new Audio('skratt.mp3');
    skrattLjud.currentTime = 0;
    skrattLjud.volume = 0.9;
    const p = skrattLjud.play();
    if (p) p.catch(() => { /* ljud kräver att besökaren klickat nån gång */ });
  } catch (e) { /* utan ljudstöd skrattar han tyst */ }
}

function stoppaSkratt() {
  if (skrattLjud) { try { skrattLjud.pause(); skrattLjud.currentTime = 0; } catch (e) { /* ok */ } }
}

function setupSvampBob() {
  if (reducedMotion) return;
  const FRAMES = ['img/ansikten/svamp1.webp', 'img/ansikten/svamp2.webp'];
  FRAMES.forEach((src) => { const i = new Image(); i.src = src; });

  const el = document.createElement('div');
  el.className = 'svampbob';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <span class="svampbob-bubbla">Na-ha-ha-ha-ha-ha-ha!</span>
    <img class="svampbob-bild" src="${FRAMES[0]}" alt="">`;
  document.body.appendChild(el);
  const bild = el.querySelector('.svampbob-bild');

  let uppe = false;   // han är på väg upp, skrattar eller glider ner
  let iZonen = false; // besökaren står redan vid botten
  let senast = -Infinity;
  let bladdra = 0;    // bildruteväxlaren
  let nerTimer = 0;   // timern som skickar ner honom av sig själv
  let pratTimer = 0;  // timern som visar pratbubblan

  // Skickar ner honom igen: stoppar skratt, timrar och animation.
  const nerIgen = () => {
    clearInterval(bladdra); bladdra = 0;
    clearTimeout(nerTimer); nerTimer = 0;
    clearTimeout(pratTimer); pratTimer = 0;
    stoppaSkratt();
    bild.src = FRAMES[0];
    el.classList.remove('uppe', 'pratar');
    setTimeout(() => { uppe = false; }, 600); // låt honom glida ner klart
  };

  const kika = () => {
    uppe = true;
    senast = performance.now();

    // Dyk upp på ett nytt ställe varje gång; spegelvänd om han hamnar till vänster.
    // Nedre högra hörnet lämnas fritt åt ✏️-pennan.
    const w = el.offsetWidth || 140;
    const vanster = 12;
    const hoger = 84;
    const maxX = Math.max(vanster, window.innerWidth - w - hoger);
    const x = vanster + Math.random() * (maxX - vanster);
    el.style.right = 'auto';
    el.style.left = `${x}px`;
    el.classList.toggle('vand', x + w / 2 < window.innerWidth / 2);

    el.classList.add('uppe');
    spelaSkratt();
    let ruta = 0;
    bladdra = setInterval(() => {
      ruta = 1 - ruta;
      bild.src = FRAMES[ruta];
    }, 160);
    pratTimer = setTimeout(() => el.classList.add('pratar'), 300);
    // skrattklippet är runt sex sekunder; han är uppe större delen av det
    nerTimer = setTimeout(nerIgen, 4800);
  };

  // Klick på SvampBob avbryter skrattet och skickar ner honom direkt.
  el.addEventListener('click', () => { if (uppe) nerIgen(); });

  const vidBotten = () => {
    const doc = document.scrollingElement || document.documentElement;
    return window.innerHeight + doc.scrollTop >= doc.scrollHeight - 48;
  };

  let vantar = false;
  window.addEventListener('scroll', () => {
    if (vantar) return;
    vantar = true;
    requestAnimationFrame(() => {
      vantar = false;
      const nere = vidBotten();
      // kikar när man når botten – inte igen förrän man lämnat den och kommit tillbaka
      if (nere && !iZonen && !uppe && performance.now() - senast > 6000) kika();
      iZonen = nere;
    });
  }, { passive: true });
}

/* ─────────────── Alice födelsedagsspel 🎂 ───────────────
   Den 26 juli fyller Alice år – då (och bara då) dyker tårtjakten upp.
   Håkan och Jonas har bakat en vegansk tårta, men Håkan glömde sockret.
   Man väljer vem i släkten man spelar som och måste fånga den riktiga
   vegantårtan med socker, som smakar helt fantastiskt. Spelet startas
   från festbandet under menyn – det tränger sig aldrig på självmant. */

/* ── Partyhattarna 🥳 ──
   Den som klarar tårtjakten vinner en partyhatt åt sin surfare, resten av
   dagen. Vinnarna delas med alla besökare via hattar.json i repot – samma
   publiceringsmekanism som ✏️-pennan, där familjelösenordet låser upp den
   krypterade GitHub-nyckeln. Utan lösenord syns hatten bara i den egna
   webbläsaren. */

const HATT_FILE = 'hattar.json';
const HATT_LS = 'kusinHattar';
const hattVinnare = new Set();

// Svensk genitiv: namn som slutar på s, x eller z får inget extra s
// (»Jonas partyhatt«, inte »Jonass«). Klassikern bland genitivmissar.
const genitiv = (namn) => namn + (/[sxz]$/i.test(namn) ? '' : 's');

const hattIdag = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Sätter hatt på en surfare som saknar en men ska ha (anropas vid spawn och
// retroaktivt när vinnarlistan laddats/utökats medan surfare redan är ute).
function sattHattPa(el) {
  if (!hattVinnare.has(el.dataset.slakting) || el.querySelector('.surfer-hatt')) return;
  const inre = el.querySelector('.surfer-inre');
  if (!inre) return;
  const hatt = document.createElement('img');
  hatt.className = 'surfer-hatt';
  hatt.src = 'img/spel/partyhatt.webp';
  hatt.alt = '';
  inre.appendChild(hatt);
}
const sattHattar = () => document.querySelectorAll('.surfer').forEach(sattHattPa);

// Hattarna gäller bara vinstdagen ("resten av dagen"), därav datumkravet.
function hattarFran(json) {
  if (json && json.datum === hattIdag() && Array.isArray(json.vinnare)) {
    for (const id of json.vinnare) hattVinnare.add(String(id));
  }
}

function laddaHattar() {
  try { hattarFran(JSON.parse(localStorage.getItem(HATT_LS))); } catch (e) { /* ok */ }
  fetch(`${HATT_FILE}?v=${Date.now()}`)
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => { hattarFran(json); sattHattar(); })
    .catch(() => { /* offline: lokala hattar duger */ });
}

// Vinsten syns direkt i den egna webbläsaren, oavsett publicering.
function vinnHattLokalt(id) {
  hattVinnare.add(id);
  try {
    let sparat = null;
    try { sparat = JSON.parse(localStorage.getItem(HATT_LS)); } catch (e) { sparat = null; }
    const vinnare = (sparat && sparat.datum === hattIdag() && Array.isArray(sparat.vinnare))
      ? sparat.vinnare.map(String) : [];
    if (!vinnare.includes(id)) vinnare.push(id);
    localStorage.setItem(HATT_LS, JSON.stringify({ datum: hattIdag(), vinnare }));
  } catch (e) { /* privat läge: hatten lever ändå sidladdningen ut */ }
  sattHattar();
}

// Publiceringen sker helt automatiskt vid vinst: nyckelfrasen ligger inte i
// klartext i koden (grep hittar den inte), men en målmedveten kodläsare kan
// förstås plocka fram den. Medveten avvägning – det här är en familjesajt,
// och GitHub-nyckeln kan alltid återkallas om något skulle spåra ur.
const HATT_SESAM = 'OzkyJyUnKiM=';
const hattSesam = () => {
  const pad = 'kusinsemestern';
  return atob(HATT_SESAM).split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ pad.charCodeAt(i % pad.length))).join('');
};

// Publicerar vinnaren till hattar.json så att hatten syns för alla.
// Nyckelfrasen dekrypterar GitHub-nyckeln (nyckel.json) i webbläsaren,
// precis som i ✏️-pennan; är sessionen redan upplåst behövs ingen fras.
// Returnerar true om något faktiskt skrevs, false om hatten redan fanns.
async function publiceraHatt(id, losen) {
  let token = '';
  try { token = sessionStorage.getItem(PUB_SS) || ''; } catch (e) { /* ok */ }
  if (!token) {
    if (!losen) throw new Error('skriv familjens lösenord först');
    const nyckelRes = await fetch(`${NYCKEL_FILE}?v=${Date.now()}`);
    if (!nyckelRes.ok) throw new Error('lösenordsläget är inte aktiverat ännu');
    const blob = await nyckelRes.json();
    const b64d = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
    const base = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(losen), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64d(blob.salt), iterations: blob.iter || PBKDF_ITER, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    try {
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: b64d(blob.iv) }, key, b64d(blob.data));
      token = new TextDecoder().decode(plain);
    } catch (err) {
      throw new Error('fel lösenord (VERSALER gäller)');
    }
    try { sessionStorage.setItem(PUB_SS, token); } catch (e) { /* ok */ }
  }

  const api = `https://api.github.com/repos/${EDIT_REPO}/contents/${HATT_FILE}`;
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
  const getRes = await fetch(`${api}?ref=${encodeURIComponent(EDIT_BRANCH)}`, { headers });
  let sha;
  let nuvarande = null;
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
    try { nuvarande = JSON.parse(decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))))); } catch (e) { nuvarande = null; }
  } else if (getRes.status !== 404) {
    throw new Error(`GitHub svarade ${getRes.status} vid läsning`);
  }
  const vinnare = (nuvarande && nuvarande.datum === hattIdag() && Array.isArray(nuvarande.vinnare))
    ? nuvarande.vinnare.map(String) : [];
  if (vinnare.includes(id)) return false; // redan publicerad: spara en commit
  vinnare.push(id);
  const body = {
    message: `Tårtjakten: partyhatt åt ${id} 🥳`,
    content: btoa(unescape(encodeURIComponent(JSON.stringify({ datum: hattIdag(), vinnare }, null, 2) + '\n'))),
    branch: EDIT_BRANCH,
  };
  if (sha) body.sha = sha;
  const putRes = await fetch(api, { method: 'PUT', headers, body: JSON.stringify(body) });
  if (!putRes.ok) throw new Error(`GitHub svarade ${putRes.status} vid skrivning`);
  return true;
}

function setupAliceFodelsedag() {
  const nu = new Date();
  // Hemlig förhandstitt: ?tartjakt i adressen visar spelet oavsett datum,
  // utan att röra auto-öppningsflaggan (så födelsedagen förblir orörd).
  const testlage = /tartjakt/i.test(location.search + location.hash);
  // Bara på riktiga födelsedagen publiceras vinsthattar för alla –
  // förhandstittsvinster andra dagar stannar i den egna webbläsaren.
  const riktigDag = nu.getMonth() === 6 && nu.getDate() === 26;
  if (!testlage && !riktigDag) return;

  const band = document.createElement('button');
  band.type = 'button';
  band.className = 'fodelsedag-band';
  band.innerHTML = '🎂🎈 Idag fyller Alice år! <span>Spela födelsedagsspelet →</span>';
  const nav = document.querySelector('.topnav');
  if (nav) nav.insertAdjacentElement('afterend', band);

  let overlay = null;
  let stadning = null; // spelloopens städfunktion

  const stang = () => {
    if (stadning) { stadning(); stadning = null; }
    if (overlay) { overlay.remove(); overlay = null; }
  };

  const kort = (inner) => `
    <div class="alice-kort">
      <button type="button" class="alice-stang" aria-label="Stäng">✕</button>
      ${inner}
    </div>`;

  const koppla = (fn) => {
    overlay.querySelector('.alice-stang').addEventListener('click', stang);
    const vidare = overlay.querySelector('.alice-vidare');
    if (vidare && fn) vidare.addEventListener('click', fn);
  };

  const scenIntro = () => {
    if (stadning) { stadning(); stadning = null; }
    overlay.innerHTML = kort(`
      <div class="alice-ansikten">
        <img src="img/ansikten/hakan.webp" alt="Håkan">
        <span class="alice-mitt">🎂</span>
        <img src="img/ansikten/jonas.webp" alt="Jonas">
      </div>
      <h2>Grattis Alice! 🎉</h2>
      <p>Håkan och Jonas har i hemlighet bakat en <strong>vegansk
        födelsedagstårta</strong>. De ser mycket nöjda ut. Håkan säger att
        han »följde receptet nästan exakt«.</p>
      <button type="button" class="btn alice-vidare">Smaka på tårtan 😋</button>`);
    koppla(scenBla);
  };

  const scenBla = () => {
    overlay.innerHTML = kort(`
      <div class="alice-ansikten">
        <img src="img/spel/tarta-utan.webp" alt="En grå och sorgsen tårta" class="alice-tartbild">
      </div>
      <h2>BLÄÄÄ! 🤢</h2>
      <p><strong>Håkan glömde sockret!</strong> Tårtan smakar våt kartong med en
        ton av grus. Men ryktet säger att den <em>riktiga</em> vegantårtan – med
        socker – finns där ute. Någon i släkten måste ut och fånga den!</p>
      <p class="alice-instruktion">Styr din jägare med fingret eller musen
        (eller piltangenterna). Fånga <strong>de riktiga tårtorna</strong> –
        hur många som krävs står högst upp i spelet, och alla jägare har inte
        samma tempo. Men varning: benen har en toppfart, tårtorna vinglar i
        Nordsjövinden, de faller snabbare för varje poäng och Håkans
        sockerfria kostar dyrt. Bara en äkta födelsedagshjälte klarar det!</p>
      <button type="button" class="btn alice-vidare">Ut på tårtjakt! 🏃‍♀️</button>`);
    koppla(scenVal);
  };

  // Vem spelar? Vinnarens surfare får partyhatten, så valet är viktigt.
  let valdId = 'alice';
  let valdNamn = 'Alice';

  // Extremläget är avsiktligt brutalt, men några av jägarna föredrar ett
  // mänskligare tempo: färre tårtor att fånga, beskedligare fall, mindre
  // vind, snabbare ben, större korg och ett lindrigare straff för Håkans
  // sockerfria. Lika hedrande vinst, samma partyhatt.
  const LUGNT_TEMPO = ['ann', 'ak', 'lena', 'la'];
  const tempoFor = (id) => (LUGNT_TEMPO.includes(id)
    ? { mal: 6, fart: 620, straff: 1, bra: 0.55, spawn: 620, fangst: 64,
        fall: 165, okning: 16, fallSlump: 105, vind: 12, vindSlump: 24 }
    : { mal: 10, fart: 480, straff: 2, bra: 0.30, spawn: 520, fangst: 52,
        fall: 240, okning: 30, fallSlump: 150, vind: 26, vindSlump: 46 });
  const raknord = (n) => ({ 6: 'sex', 10: 'tio' })[n] || String(n);

  const scenVal = () => {
    overlay.innerHTML = kort(`
      <h2>Vem ger sig ut på jakten? 🏃</h2>
      <p>Välj vem du spelar som. Den som fångar alla riktiga tårtor vinner en
        <strong>partyhatt</strong> åt sin surfare – resten av dagen!</p>
      <div class="alice-val">
        ${SURF_FACES.map(([id, namn]) => `
          <button type="button" class="alice-val-knapp${id === valdId ? ' vald' : ''}"
            data-id="${id}" data-namn="${esc(namn)}">
            <img src="img/ansikten/${id}.webp" alt=""><span>${esc(namn)}</span>
          </button>`).join('')}
      </div>`);
    overlay.querySelector('.alice-stang').addEventListener('click', stang);
    for (const knapp of overlay.querySelectorAll('.alice-val-knapp')) {
      knapp.addEventListener('click', () => {
        valdId = knapp.dataset.id;
        valdNamn = knapp.dataset.namn;
        scenSpel();
      });
    }
  };

  const scenSpel = () => {
    // EXTREMLÄGE: jägaren har toppfart (ingen teleport), tårtorna vinglar i
    // vinden, faller allt snabbare och de sockerfria kostar poäng.
    // Ansträngning obligatorisk – men tempot följer vem man spelar som.
    const T = tempoFor(valdId);
    const MAL = T.mal;
    const MAXFART = T.fart; // px/s för jägaren – ligg rätt i förväg

    overlay.innerHTML = kort(`
      <p class="alice-status">🎂 Riktiga tårtor: <strong class="alice-poang">0</strong>/${MAL}</p>
      <div class="alice-plan">
        <div class="alice-spelare"><img src="img/ansikten/${valdId}.webp" alt="${esc(valdNamn)}"><span>🧺</span></div>
      </div>`);
    overlay.querySelector('.alice-stang').addEventListener('click', stang);

    const plan = overlay.querySelector('.alice-plan');
    const spelare = overlay.querySelector('.alice-spelare');
    const poangEl = overlay.querySelector('.alice-poang');
    let poang = 0;
    let spelareX = plan.clientWidth / 2;
    let malX = spelareX;
    let vanster = false;
    let hoger = false;
    const tartor = [];
    let raf = 0;
    let spawnTimer = 0;
    let senasteT = performance.now();
    let klart = false;

    const rita = () => { spelare.style.transform = `translateX(${spelareX - 42}px)`; };
    const klampa = (x) => Math.max(40, Math.min(plan.clientWidth - 40, x));
    // Teleport används av init och testkroken; spelaren styr bara målet.
    const flytta = (x) => { spelareX = klampa(x); malX = spelareX; rita(); };
    flytta(spelareX);

    const pekare = (e) => {
      const r = plan.getBoundingClientRect();
      malX = klampa(e.clientX - r.left);
      e.preventDefault();
    };
    plan.addEventListener('pointermove', pekare);
    plan.addEventListener('pointerdown', pekare);
    const tangentNer = (e) => {
      if (e.key === 'ArrowLeft') { vanster = true; e.preventDefault(); }
      if (e.key === 'ArrowRight') { hoger = true; e.preventDefault(); }
    };
    const tangentUpp = (e) => {
      if (e.key === 'ArrowLeft') vanster = false;
      if (e.key === 'ArrowRight') hoger = false;
    };
    document.addEventListener('keydown', tangentNer);
    document.addEventListener('keyup', tangentUpp);

    const meddela = (text, x, y) => {
      const m = document.createElement('span');
      m.className = 'alice-rop';
      m.textContent = text;
      m.style.left = `${x}px`;
      m.style.top = `${y}px`;
      plan.appendChild(m);
      setTimeout(() => m.remove(), 900);
    };

    const spawn = (braForce, xForce) => {
      const bra = braForce !== undefined ? braForce : Math.random() < T.bra;
      const el = document.createElement('img');
      el.className = 'alice-tarta' + (bra ? ' bra' : ' daliga');
      el.src = bra ? 'img/spel/tarta-med.webp' : 'img/spel/tarta-utan.webp';
      el.alt = '';
      plan.appendChild(el);
      tartor.push({
        el, bra,
        x0: xForce !== undefined ? xForce : 60 + Math.random() * (plan.clientWidth - 120),
        x: xForce !== undefined ? xForce : 0,
        y: -70,
        fart: T.fall + poang * T.okning + Math.random() * T.fallSlump,
        // vind: testkrokens tårtor faller rakt så proven blir deterministiska
        vind: xForce !== undefined ? 0 : T.vind + Math.random() * T.vindSlump,
        fas: Math.random() * Math.PI * 2,
        frekvens: 0.8 + Math.random() * 1.4,
      });
    };

    const vinst = () => {
      klart = true;
      stadning();
      stadning = null;
      scenVinst();
    };

    const tick = (t) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (t - senasteT) / 1000);
      senasteT = t;
      // Alice jagar målet med begränsad toppfart
      if (vanster) malX = klampa(malX - MAXFART * dt * 1.15);
      if (hoger) malX = klampa(malX + MAXFART * dt * 1.15);
      const diff = malX - spelareX;
      const steg = MAXFART * dt;
      spelareX = Math.abs(diff) <= steg ? malX : spelareX + Math.sign(diff) * steg;
      rita();

      const fangstY = plan.clientHeight - 96;
      for (let i = tartor.length - 1; i >= 0; i--) {
        const k = tartor[i];
        k.y += k.fart * dt;
        // vinglande fall i Nordsjövinden
        k.x = Math.max(30, Math.min(plan.clientWidth - 30,
          k.x0 + Math.sin((k.y / 90) * k.frekvens + k.fas) * k.vind));
        k.el.style.transform = `translate(${k.x - 32}px, ${k.y}px)`;
        if (k.y > fangstY && k.y < fangstY + 70 && Math.abs(k.x - spelareX) < T.fangst) {
          if (k.bra) {
            poang += 1;
            poangEl.textContent = String(poang);
            meddela('Mums! 😋', k.x, fangstY);
          } else {
            poang = Math.max(0, poang - T.straff);
            poangEl.textContent = String(poang);
            meddela(`BLÄÄ! −${T.straff} 🤢`, k.x, fangstY);
            plan.classList.add('skakar');
            setTimeout(() => plan.classList.remove('skakar'), 350);
          }
          k.el.remove();
          tartor.splice(i, 1);
          if (poang >= MAL && !klart) { vinst(); return; }
        } else if (k.y > plan.clientHeight + 40) {
          k.el.remove();
          tartor.splice(i, 1);
        }
      }
    };

    spawnTimer = setInterval(() => { if (!document.hidden) spawn(); }, T.spawn);
    raf = requestAnimationFrame(tick);

    stadning = () => {
      cancelAnimationFrame(raf);
      clearInterval(spawnTimer);
      document.removeEventListener('keydown', tangentNer);
      document.removeEventListener('keyup', tangentUpp);
    };

    // Odokumenterad krok så testerna kan styra spelet.
    window.__aliceSpel = { spawn, flytta, stoppaAuto: () => clearInterval(spawnTimer) };
  };

  const scenVinst = () => {
    vinnHattLokalt(valdId);
    const hjalte = valdId === 'alice'
      ? 'Alice har fångat den riktiga vegantårtan'
      : `${esc(valdNamn)} överlämnar högtidligt den riktiga vegantårtan till Alice`;
    overlay.innerHTML = kort(`
      <div class="alice-ansikten">
        <img src="img/spel/tarta-med.webp" alt="Den riktiga vegantårtan" class="alice-tartbild">
        <span class="alice-vinnare-huvud">
          <img src="img/ansikten/${valdId}.webp" alt="${esc(valdNamn)}">
          <img class="alice-vinnare-hatt" src="img/spel/partyhatt.webp" alt="">
        </span>
      </div>
      <h2>HELT FANTASTISKT! 🤩</h2>
      <p>Du klarade det nästan omöjliga: ${raknord(tempoFor(valdId).mal)} riktiga
        tårtor i full Nordsjövind! ${hjalte} – <strong>med socker</strong> – och den smakar
        precis så himmelskt som en födelsedagstårta ska. Håkan ber om ursäkt
        och bjuder på softice i Hurup. 😅</p>
      <p class="alice-grattis">🎂 GRATTIS PÅ FÖDELSEDAGEN, ALICE! 🎈</p>
      <p class="alice-hatt-info">Som belöning surfar <strong>${esc(valdNamn)}</strong> i
        partyhatt resten av dagen – spana in vågorna där uppe! 🏄</p>
      <p class="alice-hatt-status" aria-live="polite"></p>
      <button type="button" class="btn alice-vidare">Spela igen 🔁</button>`);
    koppla(scenVal);

    // Hatten publiceras automatiskt för hela släkten – men bara på riktiga
    // födelsedagen, så att förhandstittar inte skräpar ner för alla.
    const hattStatus = overlay.querySelector('.alice-hatt-status');
    if (riktigDag) {
      hattStatus.textContent = 'Hatten sätts på för hela släkten … 🛰️';
      publiceraHatt(valdId, hattSesam())
        .then((nytt) => {
          hattStatus.textContent = nytt
            ? `Klart! 🥳 Alla besökare ser ${genitiv(valdNamn)} partyhatt inom någon minut.`
            : `${genitiv(valdNamn)} partyhatt är redan publicerad – alla ser den. 🥳`;
        })
        .catch(() => {
          hattStatus.textContent =
            'Hatten syns i din webbläsare, men publiceringen för alla gick inte just nu. Pyt – fira ändå!';
        });
    } else {
      hattStatus.textContent =
        'Förhandstitt utanför födelsedagen: hatten syns bara i din webbläsare.';
    }
    // Emojikonfetti över hela overlayn
    if (!reducedMotion) {
      const emojis = ['🎉', '🎂', '🎈', '✨', '🥳', '🍓'];
      for (let i = 0; i < 36; i++) {
        const p = document.createElement('span');
        p.className = 'alice-konfetti';
        p.textContent = emojis[i % emojis.length];
        p.style.left = `${Math.random() * 100}%`;
        p.style.fontSize = `${18 + Math.random() * 22}px`;
        overlay.appendChild(p);
        p.animate(
          [
            { transform: 'translateY(-60px) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight + 80}px) rotate(${Math.random() * 540 - 270}deg)`, opacity: 0.9 },
          ],
          { duration: 2600 + Math.random() * 2600, delay: Math.random() * 1200, easing: 'ease-in' }
        ).onfinish = () => p.remove();
      }
    }
  };

  const oppna = () => {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'alice-overlay';
    document.body.appendChild(overlay);
    scenIntro();
  };

  // Spelet öppnas bara på begäran: festbandet under menyn visar att det
  // finns, men ingen får en modal i ansiktet när sidan laddas.
  band.addEventListener('click', oppna);
  window.__aliceOppna = oppna;
}

/* ─────────────── Släktkontrollen 🛂 ───────────────
   Första besöket i en ny webbläsare möts av gränskontrollen: tre slumpade
   frågor ur släktens gemensamma minne. Alla rätt bevisar släktskap en gång
   för alla — beviset sparas i localStorage och gäller enheten för evigt. */

const SLAKT_LS = 'kusinSlaktBevisad';

// Första alternativet är alltid det rätta; ordningen blandas vid visning.
const SLAKT_FRAGOR = [
  { q: 'Vad av följande ska du absolut inte ha i maten på kusinsemestern?',
    alt: ['Jordnötter', 'Koriander', 'Gluten', 'Rapsolja'] },
  { q: 'Angående [ … ]. Jag satte mig på ditt [ … ].', lucka: true,
    alt: ['Flygplan', 'Tåg', 'Paraply', 'Visitkort'] },
  { q: 'Vilket tv-program är bäst?',
    alt: ['SvampBob', 'Mustiga Mauri', 'Paradise Hotel', 'Antikrundan'] },
  { q: 'Ett [ … ] är väl inget [ … ].', lucka: true,
    alt: ['Ägg', 'Päron', 'Löfte', 'Problem'] },
  { q: 'Who is the wife of [ … ]?',
    alt: ['Hakan', 'Larsake', 'Carl', 'Manne'] },
  { q: 'Med på semestern är familjen …',
    alt: ['Tofu', 'Broccoli', 'Bacon', 'Sandpapper'] },
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
        <p class="slakt-ingress">Det här är kusinsemesterns webbplats, endast för släkten.
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
      else nyOmgang('Hmm. Det där lät inte som släkten. Vakten blandar nya frågor. Försök igen!');
    });
    if (felmedd) form.querySelector('h2').focus();
  };

  const godkann = () => {
    try { localStorage.setItem(SLAKT_LS, '1'); } catch (e) { /* privat läge */ }
    overlay.innerHTML = `
      <div class="slakt-kort slakt-valkommen">
        <div class="slakt-emblem" aria-hidden="true">🏖️</div>
        <h2>Godkänd! Välkommen hem, släkting!</h2>
        <p>Släktskapet är härmed styrkt och intygat för all framtid på den här enheten.
          Softicen står i Hurup.</p>
      </div>`;
    overlay.classList.add('godkand'); // larmet lägger sig när släktskapet är styrkt
    document.body.classList.remove('slakt-sperr');
    setTimeout(() => overlay.classList.add('borta'), reducedMotion ? 1200 : 2200);
    setTimeout(() => overlay.remove(), reducedMotion ? 1300 : 2900);
  };

  nyOmgang();
}

/* ─────────────── Otto vid klockan 🎬🕰️ ───────────────
   Klick på nedräkningen öppnar en film där Otto sjunger en tidsenlig låt.
   Han är filmad mot svart bakgrund; den svarta bakgrunden nycklas bort i
   realtid med en liten WebGL-shader (max-kanal som alfa), så att bara Otto
   syns – och det fungerar i alla webbläsare, även iPhone, till skillnad
   från äkta alfa-video. */

const OTTO_VS = `
  attribute vec2 p;
  varying vec2 uv;
  void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
// Svart -> genomskinligt. Otto är filmad över svart, alltså är bildvärdet redan
// förmultiplicerat (färg * täckning), så vec4(färg, alfa) ger kantfria kanter.
// res = texelstorlek * suddradie, fade = global uttoning (0..1).
const OTTO_FS = `
  precision mediump float;
  varying vec2 uv;
  uniform sampler2D tex;
  uniform vec2 res;
  uniform float fade;
  vec4 s(vec2 p) {
    vec3 c = texture2D(tex, p).rgb;
    float l = max(c.r, max(c.g, c.b));
    return vec4(c, smoothstep(0.04, 0.17, l));
  }
  void main() {
    // Mjuka kanter: förmultiplicerad box-blur över en liten omgivning
    // (vikterna summerar till 1.0).
    vec4 acc = s(uv) * 0.28
      + (s(uv + vec2(res.x, 0.0)) + s(uv - vec2(res.x, 0.0))
       + s(uv + vec2(0.0, res.y)) + s(uv - vec2(0.0, res.y))) * 0.12
      + (s(uv + res) + s(uv - res)
       + s(uv + vec2(res.x, -res.y)) + s(uv + vec2(-res.x, res.y))) * 0.06;
    // Mjuk, fejdad bildram: tona ut alfan mot bildrutans kanter så att den
    // rektangulära rutan inte syns, och den som når kanten tonar ut mjukt
    // i stället för att kapas skarpt. Bredare band nedtill där han oftast
    // klipps av vid midjan.
    float ram = smoothstep(0.0, 0.06, uv.x) * smoothstep(0.0, 0.06, 1.0 - uv.x)
              * smoothstep(0.0, 0.05, 1.0 - uv.y) * smoothstep(0.0, 0.11, uv.y);
    float m = fade * ram;
    gl_FragColor = vec4(acc.rgb * m, acc.a * m);
  }`;

function setupOttoKlockan() {
  const klocka = $('#countdown');
  if (!klocka) return;
  klocka.classList.add('klickbar-klocka');
  klocka.setAttribute('title', 'Tryck för en tidsenlig hälsning från Otto 🎬');

  let overlay = null;
  let raf = 0;

  const stang = () => {
    if (!overlay) return;
    cancelAnimationFrame(raf); raf = 0;
    const v = overlay.querySelector('video');
    if (v) { try { v.pause(); } catch (e) { /* ok */ } v.removeAttribute('src'); v.load && v.load(); }
    overlay.classList.remove('pa');
    const doda = overlay;
    overlay = null;
    setTimeout(() => doda.remove(), 350);
    document.removeEventListener('keydown', vidTangent);
  };
  const vidTangent = (e) => { if (e.key === 'Escape') stang(); };

  const oppna = () => {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'otto-overlay';
    overlay.innerHTML = `
      <div class="otto-scen">
        <canvas class="otto-canvas"></canvas>
        <video class="otto-video" playsinline webkit-playsinline preload="auto"></video>
      </div>
      <button class="otto-stang" aria-label="Stäng">✕</button>
      <p class="otto-hint">🎬 Otto har något att säga om tiden …</p>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('pa'));

    overlay.querySelector('.otto-stang').addEventListener('click', stang);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) stang(); });
    document.addEventListener('keydown', vidTangent);

    const video = overlay.querySelector('video');
    const canvas = overlay.querySelector('canvas');
    video.src = 'otto.mp4';
    video.addEventListener('ended', stang);

    const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: true })
      || canvas.getContext('experimental-webgl', { premultipliedAlpha: true, alpha: true });

    // Ljudet spelas av videon själv; kräver besökarens klick, vilket vi har.
    const start = video.play();
    if (start) start.catch(() => { /* om uppspelning nekas visas ändå bilden */ });

    if (!gl) {
      // Utan WebGL: fall tillbaka på att visa videon direkt (screen tar bort svart).
      video.classList.add('otto-fallback');
      video.addEventListener('timeupdate', () => {
        const kvar = (video.duration || 24) - video.currentTime;
        if (kvar < 1.3) video.style.opacity = String(Math.max(0, kvar / 1.3));
      });
      return;
    }

    const bygg = (typ, kall) => { const s = gl.createShader(typ); gl.shaderSource(s, kall); gl.compileShader(s); return s; };
    const prog = gl.createProgram();
    gl.attachShader(prog, bygg(gl.VERTEX_SHADER, OTTO_VS));
    gl.attachShader(prog, bygg(gl.FRAGMENT_SHADER, OTTO_FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const resLoc = gl.getUniformLocation(prog, 'res');
    const fadeLoc = gl.getUniformLocation(prog, 'fade');
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    const BLUR = 2.2;    // kantsuddning i texlar
    const TONA_IN = 0.4; // sekunder
    const TONA_UT = 1.3; // sekunder – de sista tonar bort mjukt
    const rita = () => {
      raf = requestAnimationFrame(rita);
      if (video.readyState < 2) return;
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        gl.uniform2f(resLoc, BLUR / canvas.width, BLUR / canvas.height);
      }
      const d = video.duration || 24;
      const t = video.currentTime;
      const fade = Math.max(0, Math.min(1, t / TONA_IN, (d - t) / TONA_UT));
      gl.uniform1f(fadeLoc, fade);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, video); } catch (e) { return; }
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    rita();
  };

  klocka.addEventListener('click', oppna);
}

/* ─────────────── Appen på hemskärmen 📲 ───────────────
   Sajten är en PWA: service workern (sw.js) sparar sidskalet så att den
   går att starta som app och läsa utan täckning – nyttigt i Thy. Här
   registreras den, och en diskret knapp erbjuder installation. Android
   och datorn får webbläsarens egen dialog; iPhone saknar API för det, så
   där visas den korta vägen via Dela-menyn i stället. */

const APP_DOLD_LS = 'kusinAppKnappDold';

function setupApp() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* t.ex. file:// */ });
    });
  }

  const redanApp = window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (redanApp) return; // körs redan som app – då behövs ingen knapp
  try { if (localStorage.getItem(APP_DOLD_LS) === '1') return; } catch (e) { /* ok */ }

  const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  let installPrompt = null;

  const pill = document.createElement('div');
  pill.className = 'app-pill';
  pill.hidden = true;
  pill.innerHTML =
    '<button type="button" class="app-pill-knapp">📲 Lägg till på hemskärmen</button>' +
    '<button type="button" class="app-pill-stang" aria-label="Nej tack">✕</button>' +
    '<p class="app-pill-hjalp" hidden>Tryck på <strong>Dela</strong> ' +
    '<span aria-hidden="true">⬆️</span> längst ner i Safari och välj ' +
    '<strong>»Lägg till på hemskärmen«</strong>. 🏖️</p>';
  document.body.appendChild(pill);

  const dolj = (forEvigt) => {
    pill.remove();
    if (forEvigt) { try { localStorage.setItem(APP_DOLD_LS, '1'); } catch (e) { /* ok */ } }
  };

  pill.querySelector('.app-pill-stang').addEventListener('click', () => dolj(true));
  pill.querySelector('.app-pill-knapp').addEventListener('click', async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      installPrompt = null;
      if (outcome === 'accepted') dolj(true);
      else dolj(false);
      return;
    }
    // iPhone: ingen dialog finns, visa vägen via Dela-menyn.
    pill.querySelector('.app-pill-hjalp').hidden = false;
    pill.classList.add('visar-hjalp');
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    pill.hidden = false;
  });
  window.addEventListener('appinstalled', () => dolj(true));

  // iPhone får knappen direkt (inget beforeinstallprompt finns där).
  if (iOS) setTimeout(() => { pill.hidden = false; }, 2500);
}

/* ─────────────── Stora Matlagslottningen 2026 · direktsänd 🏅📡 ───────────────
   Reglerna, fastslagna i gruppchatten den 8 augusti:
   · tretton middagar, 9–21 augusti – ankomst- och avresedagen är fria
   · sex fasta par lagar varsin dag; kommissionens trippel (Jonas, Otto,
     Hannes) en dag; Jojje & Ellen en dag (11/12); Alice & Theo en dag (20/21)
   · fem slumpdagar: en trippel ur åttan + tre dubblar – ingen hamnar med
     någon hen redan lagat med, och ingen står två dagar i rad
   · Ivan och Jessica kör en gång (sina par), Tyra är hedersbefriad
   Dragningen förrättas i DIREKTSÄNDNING: förrättaren släpper en dag i taget,
   dagens kockar surfar in från var sitt håll och beseglar laget med en high
   five, och alla som har sidan öppen ser samma sak samtidigt. Synken går via
   live.json på branchen lott-live (utan Pages-bygge): förrättaren skriver
   via GitHub-API:t, och alla läser samma API med villkorad hämtning – ETag
   och If-None-Match gör oförändrade svar (304) kostnadsfria, så det går att
   polla tätt. Sekundsnabbt åt båda hållen. */

const LOTT_DAGAR = range(9, 21);
const LOTT_PAR = [
  ['lena', 'la'], ['hakan', 'ak'], ['jonas', 'jessica'],
  ['nora', 'manne'], ['hannes', 'ivan'], ['ann', 'jakob'],
];
const LOTT_TRIPPEL = ['jonas', 'otto', 'hannes'];
const LOTT_KORTA = [
  { lag: ['jojje', 'ellen'], fonster: [11, 12] },
  { lag: ['alice', 'theo'], fonster: [20, 21] },
];
const LOTT_ATTA = ['lena', 'la', 'hakan', 'ak', 'nora', 'manne', 'ann', 'jakob'];
const LOTT_UTKAST_LS = 'kusinLottUtkast2026';
const LOTT_LIVE_BRANCH = 'lott-live';
const LOTT_LIVE_FIL = 'live.json';
const LOTT_LIVE_API = `https://api.github.com/repos/${EDIT_REPO}/contents/${LOTT_LIVE_FIL}`;
const LOTT_FIL = 'lottning.json'; // det fastställda protokollet, på sajtens vanliga branch

// Själva dragningen. Returnerar [{ d, lag: [id, …] }] för alla tretton dagar.
// Ren avvisningssamplning: matematiken är rymlig (384 giltiga lagutfall och
// gott om dagsordningar), så några hundra försök räcker alltid med marginal.
function nyLottning() {
  const parK = (a, b) => [a, b].sort().join('+');
  const tagna = new Set();
  for (const [a, b] of LOTT_PAR) tagna.add(parK(a, b));
  for (let i = 0; i < LOTT_TRIPPEL.length; i++) {
    for (let j = i + 1; j < LOTT_TRIPPEL.length; j++) {
      tagna.add(parK(LOTT_TRIPPEL[i], LOTT_TRIPPEL[j]));
    }
  }
  const blandaOm = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  for (let forsok = 0; forsok < 5000; forsok++) {
    // Slumptrippeln: tre ur åttan som inte återförenar något gammalt par.
    const ordning = blandaOm(LOTT_ATTA.slice());
    const trippel = [];
    for (const p of ordning) {
      if (trippel.length < 3 && trippel.every((q) => !tagna.has(parK(p, q)))) trippel.push(p);
    }
    if (trippel.length < 3) continue;

    // Kvarvarande fem + Otto: tre dubblar utan gamla par. (Otto har bara
    // lagat med Jonas och Hannes, som båda är klara – han går alltid att para.)
    const kvar = blandaOm(ordning.filter((p) => !trippel.includes(p)).concat('otto'));
    const dubblar = [[kvar[0], kvar[1]], [kvar[2], kvar[3]], [kvar[4], kvar[5]]];
    if (dubblar.some(([a, b]) => tagna.has(parK(a, b)))) continue;

    // Lagen på dagarna: korttidslagen inom sina fönster, resten slumpas fritt.
    const dagLag = {};
    for (const kort of LOTT_KORTA) {
      dagLag[kort.fonster[Math.floor(Math.random() * kort.fonster.length)]] = kort.lag.slice();
    }
    const lagen = blandaOm([
      ...LOTT_PAR.map((lag) => lag.slice()),
      LOTT_TRIPPEL.slice(),
      trippel,
      ...dubblar,
    ]);
    const fria = LOTT_DAGAR.filter((d) => !dagLag[d]);
    fria.forEach((d, i) => { dagLag[d] = lagen[i]; });

    // Ingen ska stå två dagar i rad.
    let krock = false;
    for (let i = 0; i < LOTT_DAGAR.length - 1 && !krock; i++) {
      const idag = dagLag[LOTT_DAGAR[i]];
      const imorgon = dagLag[LOTT_DAGAR[i + 1]];
      krock = idag.some((p) => imorgon.includes(p));
    }
    if (krock) continue;

    return LOTT_DAGAR.map((d) => ({ d, lag: dagLag[d] }));
  }
  return null; // ska inte kunna hända – kontrolleras av testerna
}

// Förstasidans banner: dagens matlag stort, morgondagens mindre under.
// Utanför lottningens dagar (eller utan fastställd lottning) förblir den dold.
function renderDagensMatlag() {
  const banner = $('#matlag-banner');
  const namnFor = Object.fromEntries(SURF_FACES.map((f) => [f[0], f[1]]));
  const nu = new Date();
  if (nu.getFullYear() !== YEAR || nu.getMonth() !== MONTH) return;
  const idag = nu.getDate();

  const kockar = (post, klass) => post.lag.map((id) =>
    `<span class="lott-kock"><img class="${klass}" src="img/ansikten/${id}.webp" alt="">` +
    `${esc(namnFor[id] || id)}</span>`).join('<span class="amp">&amp;</span>');

  fetch(`${LOTT_FIL}?v=${Date.now()}`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('ingen lottning'))))
    .then((protokoll) => {
      if (!protokoll || !Array.isArray(protokoll.dagar)) return;
      const hitta = (d) => protokoll.dagar.find((p) => p.d === d) || null;
      const idagsLag = hitta(idag);
      const morgonLag = hitta(idag + 1);
      if (!idagsLag && !morgonLag) return;
      if (idagsLag) {
        banner.innerHTML =
          '<p class="mb-rubrik">🍳 Dagens matlag</p>' +
          `<p class="mb-lag">${kockar(idagsLag, 'mb-ansikte')}</p>` +
          (morgonLag
            ? `<p class="mb-imorgon">Imorgon: ${kockar(morgonLag, 'lott-mini')}</p>`
            : '<p class="mb-imorgon">Semesterns sista lottade middag – njut! 🥂</p>');
      } else {
        // Ankomstdagen: ingen lottad middag i dag, men i morgon smäller det.
        banner.innerHTML =
          '<p class="mb-rubrik">🍳 Morgondagens matlag</p>' +
          `<p class="mb-lag">${kockar(morgonLag, 'mb-ansikte')}</p>` +
          '<p class="mb-imorgon">Ikväll: ankomstmiddag under eget ansvar 🌭</p>';
      }
      banner.hidden = false;
      // Knappen till dagboken med tidigare matlags prestationer hör ihop
      // med bannern och visas först när den har något att peka på.
      const prestationer = $('#matlag-prestationer');
      if (prestationer) prestationer.hidden = false;
    })
    .catch(() => { /* ingen fastställd lottning: bannern förblir dold */ });
}

/* ── Dagens omslagsbild: en bild som fångar dagen, ovanför dagens rad ──
   Originalen ligger i DAGAR/ (»Dag N« = semesterdag N = den (8+N):e augusti),
   webbversionerna i img/mat/. Bildtexterna kommer från gruppchatten. */
const DAG_OMSLAG = {
  9: { fil: 'omslag9', text: 'Härligt häng i stora semesterhuset.' },
  10: { fil: 'omslag10', text: 'Håkan njuter av utsikten från fyren.' },
  11: { fil: 'omslag11', text: 'My leker i en jättes skugga.' },
  12: { fil: 'omslag12', text: 'Solförmörkelsedagen!' },
  13: { fil: 'omslag13', text: 'Brygghäng med hela gänget.', pos: '50% 22%' },
  14: { fil: 'omslag14', text: 'CC-finalen avgjordes på sista ringen.' },
  15: { fil: 'omslag15', text: 'Morgonens oväntade gäst.', pos: '50% 62%' },
};

/* ── Bonusfilmer: klipp som läggs mellan dagarna i dagboken ──
   Nyckeln är dagen (datumet i augusti) som klippet läggs EFTER.
   Neutrala klassnamn med flit, precis som filmrutan på förstasidan:
   ord i stil med »reklam« göms av annonsblockerarnas filterlistor. */
const BONUS_KLIPP = {
  12: {
    kicker: '🏓 Bonusfilm',
    rubrik: 'Pingismatchen: Jonas mot Jojje',
    text: 'Höjdpunkterna från stormatchen mellan Seipel och von Essen 13 augusti.',
    youtube: 'ypOQ5Iedn8w',
  },
  14: {
    kicker: '🏆 Bonusfilm',
    rubrik: 'CC-finalen 2026: Seipel mot von Essen',
    text: 'Historiskt sportögonblick #87 – returmötet avgörs på sista ringen, 14 augusti.',
    youtube: '532okCAXB9M',
  },
};

/* ── Ur köket: matlagens egna bilder, dag för dag ──
   Originalen ligger i MAT/ (uppladdade via GitHub), webbversionerna i
   img/mat/. Titlarna är satta av kommissionens gastronomiska utskott. */
const MATLAG_BILDER = {
  9: [
    { fil: 'dag9-1', kurs: 'Lunch',
      titel: '»Baguette dorée« – ugnsgyllene giv på klassisk fransk stång, vilande på draperad folie av högsta karat' },
    { fil: 'dag9-2', kurs: 'Lunch',
      titel: '»Velouté verte de la Limfjord« – sammetslen grönärtscrème, uppslagen vid bordet ur blankpolerad kittel' },
    { fil: 'dag9-3', kurs: 'Förrätt',
      titel: '»Craquelin nordique« – örtcrème på råg, krönt av soltorkad tomat och handplockad basilika' },
    { fil: 'dag9-4', kurs: 'Middag',
      titel: '»Le grand chaudron« – silkig gryta på kidneybönor, babyspenat och solmogen tomat, rörd med fast hand' },
    { fil: 'dag9-5', kurs: 'Middag',
      titel: '»Assiette de la maison« – husets komposition, tornerad tableside med generös och säker sked' },
    { fil: 'dag9-6', kurs: 'Efterrätt',
      titel: '»Crumble de fruits d’été« – gyllene smuldeg över karamelliserad stenfrukt, serverad i familjärt anslag' },
  ],
  10: [
    { fil: 'dag10-1', kurs: 'Lunch',
      titel: '»Déjeuner sur la plage« – handpillat frigående ägg i sällskap av rullad tunnbrödscigarr, mot fond av azurblå bägare' },
    { fil: 'dag10-2', kurs: 'Middag',
      titel: '»Spaghetti au pesto de la maison« – al dente-trådar glaserade i basilikans gröna guld, flankerade av krisp sallad och solmogen melon' },
    { fil: 'dag10-3', kurs: 'Efterrätt',
      titel: '»Fondant noir de minuit« – djupt mörk kladdkaka under ett stilla fall av florsockersnö, med lättvispat moln därtill' },
  ],
  11: [
    { fil: 'dag11-1', kurs: 'Frukost',
      titel: '»Crêpes du matin« – solgula plättar i prydlig kolonn, i stilla väntan på sitt äppelguld' },
    { fil: 'dag11-2', kurs: 'Frukost',
      titel: '»Pommes caramélisées« – smörstekta äppelklyftor i kanelglans, frukostens krönande drag' },
    { fil: 'dag11-3', kurs: 'Lunch',
      titel: '»Hot dog de la plage« – grillmästarens klassiker, räckt med silvertång och säker hand' },
    { fil: 'dag11-4', kurs: 'Middag',
      titel: '»Chicken parmigiana« – gyllengratinerad klassiker på bädd av tomatglänsande skruvar' },
  ],
  12: [
    { fil: 'dag12-1', kurs: 'Frukost',
      titel: '»Œufs brouillés à la ciboulette« – krämig äggröra direkt ur pannan, krönt av späd gräslök' },
    { fil: 'dag12-2', kurs: 'Frukost',
      titel: '»Aurore de fraise« – morgonens uppvaknande i glas, med jordgubbe och mynta på bräddens estrad' },
    { fil: 'dag12-3', kurs: 'Frukost',
      titel: '»Œufs de caille au plat« – vakteläggens miniatyrsoluppgångar, ur husets omsorgsfullt skyltade kartong' },
    { fil: 'dag12-4', kurs: 'Elvakaffe',
      titel: '»Soltårta« – elvakaffets strålande mästerverk, med gräddens moln mitt framför solen' },
    { fil: 'dag12-5', kurs: 'Lunch',
      titel: '»Linguine alla Norma di Limfjorden« – aubergine, solmogen tomat och rostade pinjenötter i elegant förening' },
    { fil: 'dag12-6', kurs: 'Förrätt',
      titel: '»Solsnurror« – frasiga smördegsspiraler kring basilikans gröna kärna, formade som dagens huvudperson' },
    { fil: 'dag12-7', kurs: 'Förrätt',
      titel: '»Sunset tequila« – solnedgången serverad i glas, med jordgubbe på horisontens rand' },
    { fil: 'dag12-8', kurs: 'Middag',
      titel: '»Bao buns från Solens Rike« – ångade guldkuddar, avnjutna med båda händerna och total koncentration' },
    { fil: 'dag12-9', kurs: 'Efterrätt',
      titel: '»Dannebrogen i en skål« – rött och vitt i nationalfärgernas tecken, så efterlängtad att kameran aldrig hann ställa skärpan' },
  ],
  13: [
    { fil: 'dag13-1', kurs: 'Elvakaffe',
      titel: '»Croissants partagés« – ugnsvarma guldhalvmånar med chokladhjärta, broderligt delade med hela sällskapet' },
    { fil: 'dag13-2', kurs: 'Lunch',
      titel: '»Okonomiyaki à la Nissum« – gyllene platta i solsken, under lackglänsande drag av rostad sesam och salladslök' },
    { fil: 'dag13-3', kurs: 'Middag',
      titel: '»Bol de bœuf de la maison« – fjordens svar på bibimbap: ris, färs och picklade morötter under en kaskad av grönt' },
    { fil: 'dag13-4', kurs: 'Efterrätt',
      titel: '»Fondant aux baies rouges« – mörk choklad möter rubinröda bär, serverad i levande ljus' },
  ],
  14: [
    { fil: 'dag14-1', kurs: 'Elvakaffe',
      titel: '»Assiette de petits biscuits« – handplockade rariteter ur samlarkassetten, serverade i originalets eleganta form' },
    { fil: 'dag14-2', kurs: 'Lunch',
      titel: '»Le paquet du chef« – omsorgsfullt draperad i klarfilm, ackompanjerad av mörk brygd utan socker, årgång 2026' },
    { fil: 'dag14-3', kurs: 'Middag',
      titel: '»Taco libre de Limfjorden« – fredagens festbuffé där varje gäst komponerar sitt eget mästerverk' },
    { fil: 'dag14-4', kurs: 'Efterrätt',
      titel: '»Glace noyée« – vaniljens vita öar i ett djupt och generöst hav av mörk choklad' },
  ],
  15: [
    { fil: 'dag15-1', kurs: 'Lunch',
      titel: '»Tartine à l\'œuf« – rågens fundament under röd pesto, ägg i halvmånar och avokadons gröna böljor' },
    { fil: 'dag15-2', kurs: 'Förrätt',
      titel: '»Délices du soir« – mörka delikatesser i glaskupa, serverade i levande ljus' },
    { fil: 'dag15-3', kurs: 'Middag',
      titel: '»Saumon de la maison« – laxens rosa böljor med färskpotatis, haricots verts och sås ur trippelns kittel' },
    { fil: 'dag15-4', kurs: 'Efterrätt',
      titel: '»Drømmekage de Thy« – långpannans danska dröm under ett generöst mörkt täcke' },
  ],
};

// Lyftvisningen: klick på en bild öppnar den stor, med titel och bläddring.
function oppnaMatlyft(bilder, start) {
  let i = start;
  const lyft = document.createElement('div');
  lyft.className = 'mat-lyft';
  lyft.innerHTML =
    '<button type="button" class="mat-lyft-stang" aria-label="Stäng">✕</button>' +
    '<button type="button" class="mat-lyft-pil mat-lyft-bak" aria-label="Föregående">‹</button>' +
    '<figure><img alt=""><figcaption></figcaption></figure>' +
    '<button type="button" class="mat-lyft-pil mat-lyft-fram" aria-label="Nästa">›</button>';
  document.body.appendChild(lyft);
  const bild = lyft.querySelector('img');
  const text = lyft.querySelector('figcaption');
  const visa = () => {
    const b = bilder[i];
    bild.src = `img/mat/${b.fil}.webp`;
    text.innerHTML = `<span class="mat-kurs">${esc(b.kurs)}</span> ${esc(b.titel)}`;
  };
  const stang = () => {
    lyft.remove();
    document.removeEventListener('keydown', tangent);
  };
  const stega = (riktning) => {
    i = (i + riktning + bilder.length) % bilder.length;
    visa();
  };
  const tangent = (e) => {
    if (e.key === 'Escape') stang();
    if (e.key === 'ArrowLeft') stega(-1);
    if (e.key === 'ArrowRight') stega(1);
  };
  lyft.querySelector('.mat-lyft-stang').addEventListener('click', stang);
  lyft.querySelector('.mat-lyft-bak').addEventListener('click', () => stega(-1));
  lyft.querySelector('.mat-lyft-fram').addEventListener('click', () => stega(1));
  lyft.addEventListener('click', (e) => { if (e.target === lyft) stang(); });
  document.addEventListener('keydown', tangent);
  visa();
}

// Matlagssidan visar det fastställda protokollet högst upp, med dagens
// matlag utpekat. Finns ingen fastställd lottning ligger sektionen dold.
function renderMatlagslista() {
  const sektion = $('#matlag-schema');
  const lista = $('#matlag-lista');
  const namnFor = Object.fromEntries(SURF_FACES.map((f) => [f[0], f[1]]));
  const nu = new Date();
  const idag = (nu.getFullYear() === YEAR && nu.getMonth() === MONTH) ? nu.getDate() : null;

  fetch(`${LOTT_FIL}?v=${Date.now()}`)
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error('ingen lottning'))))
    .then((protokoll) => {
      if (!protokoll || !Array.isArray(protokoll.dagar) || !protokoll.dagar.length) return;
      lista.innerHTML = '';
      for (const post of protokoll.dagar) {
        // Allt som hör till en dag samlas i ett kort: omslag, datum och
        // kockar i huvudet, och matlagets bilder därunder.
        const kort = document.createElement('article');
        kort.className = 'dag-kort' + (post.d === idag ? ' dag-kort-idag' : '');

        const omslag = DAG_OMSLAG[post.d];
        if (omslag) {
          const knapp = document.createElement('button');
          knapp.type = 'button';
          knapp.className = 'dag-omslag';
          knapp.setAttribute('aria-label', `Förstora: ${omslag.text}`);
          // pos flyttar utsnittet (object-position) när ansikten hamnar
          // utanför den breda omslagsrutans standardbeskärning.
          knapp.innerHTML =
            `<img src="img/mat/${omslag.fil}.webp" loading="lazy" alt="${esc(omslag.text)}"` +
            `${omslag.pos ? ` style="object-position: ${omslag.pos}"` : ''}>` +
            `<span class="dag-omslag-text">${esc(omslag.text)}</span>`;
          knapp.addEventListener('click', () =>
            oppnaMatlyft([{ fil: omslag.fil, kurs: fmtDay(post.d), titel: omslag.text }], 0));
          kort.appendChild(knapp);
        }

        const huvud = document.createElement('header');
        huvud.className = 'dag-kort-huvud';
        huvud.innerHTML =
          `<div class="dag-datum"><span class="dag-nr">${post.d}</span>` +
          `<span class="dag-veckodag">${dow(post.d)} · aug</span></div>` +
          '<div class="dag-kockar">' + post.lag.map((id) =>
            `<span class="lott-kock"><img class="lott-mini" src="img/ansikten/${id}.webp" alt="">` +
            `${esc(namnFor[id] || id)}</span>`).join('<span class="amp">&amp;</span>') + '</div>' +
          (post.d === idag ? '<span class="dag-idag">Idag</span>' : '');
        kort.appendChild(huvud);

        const bilder = MATLAG_BILDER[post.d];
        if (bilder && bilder.length) {
          const galleri = document.createElement('div');
          galleri.className = 'mat-galleri';
          const kockar = post.lag.map((id) => namnFor[id] || id).join(' & ');
          galleri.innerHTML =
            `<p class="mat-galleri-rubrik">📸 Ur köket: ${esc(kockar)}s taffel</p>` +
            '<div class="mat-galleri-rutor">' + bilder.map((b, bi) =>
              `<button type="button" class="mat-ruta" data-bild="${bi}" ` +
              `aria-label="Förstora: ${esc(b.titel)}">` +
              `<img src="img/mat/${b.fil}-tumme.webp" loading="lazy" alt="${esc(b.titel)}">` +
              `<span class="mat-ruta-kurs">${esc(b.kurs)}</span></button>`).join('') + '</div>';
          galleri.querySelectorAll('.mat-ruta').forEach((knapp) => {
            knapp.addEventListener('click', () => oppnaMatlyft(bilder, Number(knapp.dataset.bild)));
          });
          kort.appendChild(galleri);
        }

        lista.appendChild(kort);

        // Ett bonusklipp som hör hemma just här i dagboken? In med det,
        // som ett litet mellanspel mellan dagskorten.
        const bonus = BONUS_KLIPP[post.d];
        if (bonus) {
          const klipp = document.createElement('article');
          klipp.className = 'bonus-klipp';
          klipp.innerHTML =
            `<p class="bonus-kicker">${esc(bonus.kicker)}</p>` +
            `<h3 class="bonus-rubrik">${esc(bonus.rubrik)}</h3>` +
            `<p class="bonus-text">${esc(bonus.text)}</p>` +
            '<div class="bonus-video">' +
            `<iframe src="https://www.youtube-nocookie.com/embed/${bonus.youtube}" ` +
            `title="${esc(bonus.rubrik)}" loading="lazy" ` +
            'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
            'allowfullscreen></iframe></div>';
          lista.appendChild(klipp);
        }
      }
      sektion.hidden = false;
      // Ankarlänken från förstasidan pekar hit, men sektionen är dold tills
      // protokollet laddats – så hoppet får göras om när den väl syns.
      if (location.hash === '#matlag-schema') sektion.scrollIntoView();
    })
    .catch(() => { /* inte lottat än: sektionen förblir dold */ });
}

function setupLottsandning() {
  const scen = $('#lott-scen');
  const vatten = $('#lott-vatten');
  const protokoll = $('#lott-protokoll');
  const statusEl = $('#lott-status');
  const liveBand = $('#lott-liveband');
  const kopieraBtn = $('#lott-kopiera');
  const namnFor = Object.fromEntries(SURF_FACES.map((f) => [f[0], f[1]]));
  const kroppFor = Object.fromEntries(SURF_FACES.map((f) => [f[0], f[2]]));

  // I testläge (och för den som bett om lugna rörelser) kortas allt till blink.
  const snabb = () => !!window.__lottSnabb || reducedMotion;
  const vila = (ms) => new Promise((r) => setTimeout(r, snabb() ? Math.min(ms, 40) : ms));
  const iso = () => new Date().toISOString();

  /* ── Protokollet ── */

  const lagHtml = (lag) => lag.map((id) =>
    `<span class="lott-kock"><img class="lott-mini" src="img/ansikten/${id}.webp" alt="">` +
    `${esc(namnFor[id] || id)}</span>`).join('<span class="amp">&amp;</span>');

  const laggRad = (post) => {
    $('#lott-utfall').hidden = false;
    const rad = document.createElement('div');
    rad.className = 'result-row revealed';
    rad.innerHTML =
      `<div class="result-date">${fmtDay(post.d)}<span class="result-dow">${dow(post.d)}</span></div>` +
      `<div class="result-team">${lagHtml(post.lag)}</div>`;
    protokoll.appendChild(rad);
  };

  const visaTally = (dagar) => {
    const antal = {};
    for (const post of dagar) {
      for (const id of post.lag) {
        const namn = namnFor[id] || id;
        antal[namn] = (antal[namn] || 0) + 1;
      }
    }
    const chips = Object.entries(antal)
      .sort((a, b) => a[0].localeCompare(b[0], 'sv'))
      .map(([namn, n]) => `<span class="tally-chip">${esc(namn)} × ${n}</span>`)
      .join('');
    $('#lott-tally').innerHTML = chips ? `<strong>Passfördelning:</strong><br>${chips}` : '';
  };

  const protokollText = (dagar, forrattad) => {
    const rader = [
      '📜 PROTOKOLL: 2026 ÅRS STORA MATLAGSLOTTNING',
      'Kusinsemestern · Helligsø Strand · förrättad i direktsändning',
      '',
    ];
    for (const post of dagar) {
      rader.push(`${dow(post.d)} ${fmtDay(post.d)}: ${post.lag.map((id) => namnFor[id] || id).join(' & ')}`);
    }
    rader.push('');
    rader.push(forrattad
      ? `🖋️ Fastställt den ${fmtDateTime(forrattad)}. Lotten har talat. ⚖️`
      : '⚠️ Ännu ej fastställt (§ 4).');
    return rader.join('\n');
  };

  /* ── Scenen: dagens kockar surfar in och gör high five ── */

  async function spelaDag(post) {
    scen.hidden = false;
    vatten.innerHTML = '';
    $('#lott-scen-dag').textContent = `${dow(post.d)} ${post.d} augusti`;
    statusEl.textContent = `🔴 ${dow(post.d)} ${post.d} augusti avtäcks …`;
    if (!snabb()) scen.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const pos = post.lag.length === 3 ? [8, 62, 35] : [16, 54];
    const sida = post.lag.length === 3 ? ['v', 'h', 'v'] : ['v', 'h'];
    for (let i = 0; i < post.lag.length; i++) {
      const id = post.lag[i];
      const el = document.createElement('div');
      el.className = 'lott-surfare' + (sida[i] === 'h' ? ' vand' : '');
      el.innerHTML =
        `<img class="lott-kropp" src="img/surf/surf-${kroppFor[id] || 'man'}.webp" alt="">` +
        `<img class="lott-ansikte" src="img/ansikten/${id}.webp" alt="">` +
        `<span class="lott-namn">${esc(namnFor[id] || id)}</span>`;
      el.style.left = sida[i] === 'v' ? '-34%' : '112%';
      vatten.appendChild(el);
      void el.offsetWidth; // reflow, så att transitionen startar från kanten
      el.style.left = `${pos[i]}%`;
      await vila(1100);
    }
    await vila(200);
    for (const surf of vatten.querySelectorAll('.lott-surfare')) surf.classList.add('hifajv');
    const smack = document.createElement('span');
    smack.className = 'lott-smack';
    smack.textContent = '✋';
    vatten.appendChild(smack);
    await vila(950);
    laggRad(post);
    await vila(500);
  }

  /* ── Sändningsläget: tillämpas i kö så att animationer inte trampas ── */

  let lage = null;
  let ritade = 0;
  let forstaRitningen = true;
  let ko = Promise.resolve();

  async function tillampa(nytt) {
    if (!nytt || typeof nytt !== 'object') return;
    const forra = lage;
    lage = nytt;
    const dagar = Array.isArray(nytt.visade) ? nytt.visade : [];
    liveBand.hidden = nytt.status !== 'live';

    if (dagar.length < ritade) {
      // Sändningen har backat (eller börjat om): rita om från noll.
      protokoll.innerHTML = '';
      $('#lott-tally').innerHTML = '';
      ritade = 0;
      vatten.innerHTML = '';
      scen.hidden = true;
    }
    while (ritade < dagar.length) {
      const post = dagar[ritade];
      if (forstaRitningen || snabb()) laggRad(post);
      else await spelaDag(post); // eslint-disable-line no-await-in-loop
      ritade++;
    }
    forstaRitningen = false;

    if (nytt.status === 'live') {
      statusEl.textContent = ritade === 0
        ? '🔴 Sändningen har börjat! Kommissionen samlar sig …'
        : `🔴 Dag ${ritade} av ${LOTT_DAGAR.length} avtäckt. Sändningen pågår.`;
      kopieraBtn.hidden = true;
      $('#lott-faststall-text').textContent = FASTSTALL_VANTAR;
    } else if (nytt.status === 'klar') {
      scen.hidden = true;
      statusEl.textContent = 'Sändningen är avslutad och protokollet fastställt. Lotten har talat. ⚖️';
      visaTally(dagar);
      kopieraBtn.hidden = false;
      $('#lott-faststall-text').textContent =
        `Härmed fastställt i vederbörlig ordning den ${fmtDateTime(nytt.forrattad || iso())}. ` +
        'Protokollet äger laga kraft. Må äran fördelas jämnt och disken likaså. 🖋️⚖️';
      if (forra && forra.status === 'live' && !reducedMotion && $('#confetti')) fireConfetti();
    } else {
      statusEl.textContent = 'Sändningen har inte börjat än. Håll utkik i gruppchatten – ' +
        'när det väl smäller ser du dragningen här, live. 📺';
    }
    uppdateraKnappar();
  }

  const FASTSTALL_VANTAR = 'Utfallet vinner laga kraft först då förrättaren fastställt ' +
    'protokollet vid sändningens slut. Omlottning därefter medges endast vid synnerliga ' +
    'skäl (t.ex. force majeure, myteri eller brända köttbullar).';

  const koaLage = (nytt) => { ko = ko.then(() => tillampa(nytt)).catch(() => { /* aldrig stopp */ }); };

  /* ── Läsning: alla klienter följer live.json via contents-API:t ──
     (raw.githubusercontent.com cachar i fem minuter och struntar i
     query-strängen, så den duger inte till livesynk.) Villkorad hämtning
     med ETag gör oförändrade svar till kostnadsfria 304:or, och läsningen
     sker med samma tyst upplåsta nyckel som publiceringen, så hela
     släkten delar en rejäl API-kvot. */

  let lasEtag = null;
  let lasToken = '';
  let pollTimer = 0;
  const poll = async () => {
    clearTimeout(pollTimer);
    try {
      const headers = { Accept: 'application/vnd.github.raw+json' };
      if (lasToken) headers.Authorization = `Bearer ${lasToken}`;
      if (lasEtag) headers['If-None-Match'] = lasEtag;
      const r = await fetch(`${LOTT_LIVE_API}?ref=${encodeURIComponent(LOTT_LIVE_BRANCH)}`,
        { headers, cache: 'no-store' });
      if (r.ok) {
        lasEtag = r.headers.get('etag');
        koaLage(await r.json());
      } // 304 = oförändrat läge, kostar ingenting
    } catch (e) { /* offline: nästa försök får ta det */ }
    const livePagar = lage && lage.status === 'live';
    pollTimer = setTimeout(poll, livePagar ? 4000 : 30000);
  };
  document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
  window.__lottPoll = poll; // odokumenterad krok så att testerna slipper vänta på pollintervallet

  (async () => {
    // Det fastställda protokollet (om det finns) ritas först, sedan tar liven över.
    try {
      const r = await fetch(`${LOTT_FIL}?v=${Date.now()}`);
      if (r.ok) {
        const fast = await r.json();
        if (fast && Array.isArray(fast.dagar)) {
          koaLage({ v: 1, status: 'klar', visade: fast.dagar, forrattad: fast.forrattad });
        }
      }
    } catch (e) { /* ingen fastställd lottning än */ }
    try {
      lasToken = await lasUppToken(hattSesam());
    } catch (e) { /* utan nyckel: anonym läsning med ETag duger också */ }
    poll();
  })();

  /* ── Förrättarens kontrollrum ── */

  const kontroll = $('#lott-kontroll');
  const felEl = $('#lott-kontroll-fel');
  const startaBtn = $('#lott-starta');
  const nastaBtn = $('#lott-nasta');
  const backaBtn = $('#lott-backa');
  const omstartBtn = $('#lott-omstart');
  const faststallBtn = $('#lott-faststall');

  let utkast = null;
  try { utkast = JSON.parse(localStorage.getItem(LOTT_UTKAST_LS)); } catch (e) { utkast = null; }
  let token = '';
  let liveSha;
  let skriver = false;

  const utkastStammer = () => {
    if (!utkast || !Array.isArray(utkast.schema) || utkast.schema.length !== LOTT_DAGAR.length) return false;
    const visade = (lage && lage.visade) || [];
    return visade.every((post, i) => JSON.stringify(post) === JSON.stringify(utkast.schema[i]));
  };

  function uppdateraKnappar() {
    if (kontroll.hidden) return;
    const status = lage ? lage.status : 'ingen';
    const visade = (lage && lage.visade) || [];
    const live = status === 'live';
    const styr = live && utkastStammer();
    startaBtn.hidden = live;
    startaBtn.disabled = skriver;
    startaBtn.textContent = status === 'klar' ? '📡 Ny sändning (river upp protokollet)' : '📡 Starta sändningen';
    nastaBtn.hidden = !styr;
    nastaBtn.disabled = skriver || visade.length >= LOTT_DAGAR.length;
    backaBtn.hidden = !styr;
    backaBtn.disabled = skriver || visade.length === 0;
    omstartBtn.hidden = !live;
    omstartBtn.disabled = skriver;
    faststallBtn.hidden = !styr || visade.length < LOTT_DAGAR.length;
    faststallBtn.disabled = skriver;
    $('#lott-kontroll-status').textContent = !live
      ? 'Ingen sändning pågår. Dragningen görs och sparas på den här enheten när du startar.'
      : (styr
        ? `LIVE · dag ${visade.length} av ${LOTT_DAGAR.length} visad. Nästa knapptryck syns hos alla inom några sekunder.`
        : 'En sändning pågår, men den styrs från en annan enhet. Här kan du bara börja om från noll.');
  }

  // Skrivning till GitHub: hämta sha vid behov, skriv, försök EN gång till vid
  // sha-krock (händer om filen ändrats bakom ryggen på oss).
  async function putFil(branch, fil, api, innehall, medd, kandSha, omtag) {
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };
    let sha = kandSha;
    if (sha === undefined) {
      const g = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, { headers });
      if (g.ok) sha = (await g.json()).sha;
      else if (g.status !== 404) throw new Error(`GitHub svarade ${g.status} vid läsning`);
    }
    const body = {
      message: medd,
      content: btoa(unescape(encodeURIComponent(JSON.stringify(innehall, null, 2) + '\n'))),
      branch,
    };
    if (sha) body.sha = sha;
    const r = await fetch(api, { method: 'PUT', headers, body: JSON.stringify(body) });
    if (!r.ok) {
      if (!omtag && (r.status === 409 || r.status === 422)) {
        return putFil(branch, fil, api, innehall, medd, undefined, true);
      }
      throw new Error(`GitHub svarade ${r.status} vid skrivning`);
    }
    return (await r.json()).content.sha;
  }

  async function skrivLive(nytt, medd) {
    skriver = true;
    felEl.textContent = '';
    uppdateraKnappar();
    try {
      nytt.uppdaterad = iso();
      liveSha = await putFil(LOTT_LIVE_BRANCH, LOTT_LIVE_FIL, LOTT_LIVE_API, nytt, `Lottningen: ${medd}`, liveSha);
      koaLage(nytt); // egna skärmen behöver inte vänta på pollen
    } catch (err) {
      felEl.textContent = `Det gick inte: ${err.message}. Försök igen.`;
    }
    skriver = false;
    uppdateraKnappar();
  }

  const nyttUtkast = () => {
    const schema = nyLottning();
    if (!schema) throw new Error('dragningen gick inte ihop (borde inte kunna hända)');
    utkast = { schema, skapad: iso() };
    try { localStorage.setItem(LOTT_UTKAST_LS, JSON.stringify(utkast)); } catch (e) { /* ok */ }
  };

  startaBtn.addEventListener('click', async () => {
    if (lage && lage.status === 'klar' &&
      !window.confirm('Protokollet är redan fastställt. Riva upp det och starta en ny sändning med ny dragning?')) return;
    nyttUtkast();
    await skrivLive({ v: 1, status: 'live', startad: iso(), visade: [] }, 'sändningen börjar 📡');
  });

  nastaBtn.addEventListener('click', () => {
    const visade = (lage && lage.visade) || [];
    if (visade.length >= LOTT_DAGAR.length) return;
    const nasta = utkast.schema[visade.length];
    skrivLive({ ...lage, visade: utkast.schema.slice(0, visade.length + 1) },
      `${dow(nasta.d)} ${fmtDay(nasta.d)} avtäcks 🏄`);
  });

  backaBtn.addEventListener('click', () => {
    const visade = (lage && lage.visade) || [];
    if (!visade.length) return;
    skrivLive({ ...lage, visade: visade.slice(0, -1) }, 'en dag backas ⏪');
  });

  omstartBtn.addEventListener('click', async () => {
    if (!window.confirm('Börja om från noll med en helt ny dragning?')) return;
    nyttUtkast();
    await skrivLive({ v: 1, status: 'live', startad: iso(), visade: [] }, 'omstart med ny dragning 🔄');
  });

  faststallBtn.addEventListener('click', async () => {
    if (!window.confirm('Fastställa protokollet? Därefter äger det laga kraft (§ 4).')) return;
    skriver = true;
    felEl.textContent = '';
    uppdateraKnappar();
    try {
      const nu = iso();
      const api = `https://api.github.com/repos/${EDIT_REPO}/contents/${LOTT_FIL}`;
      await putFil(EDIT_BRANCH, LOTT_FIL, api,
        { v: 1, forrattad: nu, dagar: utkast.schema }, 'Lottningen: protokollet fastställt 🖋️');
      skriver = false;
      await skrivLive({ v: 1, status: 'klar', startad: lage && lage.startad, forrattad: nu, visade: utkast.schema },
        'protokollet fastställt 🖋️');
    } catch (err) {
      skriver = false;
      felEl.textContent = `Det gick inte: ${err.message}. Försök igen.`;
      uppdateraKnappar();
    }
  });

  kopieraBtn.addEventListener('click', async () => {
    const dagar = (lage && lage.visade) || [];
    const text = protokollText(dagar, lage && lage.forrattad);
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
    kopieraBtn.textContent = ok ? '✅ Kopierat!' : '📋 Kopiera till gruppchatten';
    setTimeout(() => { kopieraBtn.textContent = '📋 Kopiera till gruppchatten'; }, 2500);
  });

  /* ── Sigillet: lösenordet låser upp kontrollrummet ── */

  const LOSEN_HASH = '049d9cbeae34cbc4d6f5243eb7306d4ce3315f3779ac86c346aa85349390cbbf';
  const sha256hex = async (text) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  };

  async function lasUppToken(losen) {
    try {
      const t = sessionStorage.getItem(PUB_SS);
      if (t) return t;
    } catch (e) { /* ok */ }
    const res = await fetch(`${NYCKEL_FILE}?v=${Date.now()}`);
    if (!res.ok) throw new Error('hittar inte nyckel.json');
    const blob = await res.json();
    const b64d = (x) => Uint8Array.from(atob(x), (c) => c.charCodeAt(0));
    const bas = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(losen), 'PBKDF2', false, ['deriveKey']);
    const nyckel = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: b64d(blob.salt), iterations: blob.iter || PBKDF_ITER, hash: 'SHA-256' },
      bas, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const klartext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: b64d(blob.iv) }, nyckel, b64d(blob.data));
    const t = new TextDecoder().decode(klartext);
    try { sessionStorage.setItem(PUB_SS, t); } catch (e) { /* ok */ }
    return t;
  }

  const oppnaBtn = $('#lott-oppna-kontroll');
  let losenBox = null;
  oppnaBtn.addEventListener('click', () => {
    if (!kontroll.hidden) return;
    if (losenBox) { losenBox.querySelector('input').focus(); return; }
    losenBox = document.createElement('form');
    losenBox.className = 'losen-box';
    losenBox.innerHTML = `
      <p class="losen-text">🔐 Sändningen styrs endast av behörig förrättare.
        Ange kommissionens lösenord för att bryta sigillet:</p>
      <div class="losen-row">
        <input type="password" class="losen-input" placeholder="LÖSENORD"
          autocomplete="off" aria-label="Kommissionens lösenord">
        <button type="submit" class="btn btn-small">Bryt sigillet</button>
      </div>
      <p class="losen-fel" aria-live="polite"></p>`;
    oppnaBtn.parentNode.insertAdjacentElement('afterend', losenBox);
    const input = losenBox.querySelector('input');
    const fel = losenBox.querySelector('.losen-fel');
    losenBox.addEventListener('submit', async (e) => {
      e.preventDefault();
      const svar = input.value.trim();
      if (!svar) { input.focus(); return; }
      let hash = '';
      try { hash = await sha256hex(svar); } catch (err) { /* utan WebCrypto blir det nej */ }
      if (hash !== LOSEN_HASH) {
        fel.textContent = 'Fel lösenord. Kommissionen påminner: VERSALER gäller.';
        input.select();
        return;
      }
      fel.textContent = 'Sigillet bryts …';
      try {
        token = await lasUppToken(svar);
      } catch (err) {
        fel.textContent = `Nyckeln gick inte att låsa upp: ${err.message}.`;
        return;
      }
      losenBox.remove();
      losenBox = null;
      oppnaBtn.hidden = true;
      kontroll.hidden = false;
      uppdateraKnappar();
    });
    input.focus();
  });
}

/* ─────────────── Helvedeslarven Cup 🐛🔥🏓 ───────────────
   Pingisturneringen: 13 spelare på plats i tre grupper (4+4+5), plus
   Alice och Theo som ansluter på tisdagen och därför är direktinsatta
   i slutspelsträdet – på olika halvor, en som etta och en som tvåa.
   Seedningen är kommissionens tekniska utskotts bästa gissning och
   används bara för att göra grupperna jämna (ormfördelning). */

const CUP_SEEDNING = [
  ['otto', 'Ung, snabb och helt orädd vid bordet.'],
  ['jonas', 'Rutinerad matchspelare – huvudperson i två sportfilmer bara denna vecka.'],
  ['hannes', 'Explosiv forehand, van vid finaler.'],
  ['manne', 'Lugn och svårläst – vinner de långa duellerna.'],
  ['jakob', 'Teknisk finlirare med oväntad skruv.'],
  ['ivan', 'Turneringens joker – underskatta honom på egen risk.'],
  ['nora', 'Snabba reflexer och smarta vinklar.'],
  ['jessica', 'Stabil grundspelare som aldrig skänker bort en poäng.'],
  ['hakan', 'Golfsvingen översätts förvånansvärt väl till backhand.'],
  ['la', 'Listig veteran med semesterns lömskaste serve.'],
  ['ak', 'Underskattad – har loppisfyndat ett alldeles eget racket.'],
  ['ann', 'Armen i beaktande, men taktiken i toppklass.'],
  ['lena', 'Benet säger stopp, viljan säger kör.'],
];

// Ormfördelning ur seedningen: 1-2-3 / 6-5-4 / 7-8-9 / 12-11-10 / 13.
const CUP_GRUPPER = [
  { namn: 'Grupp 1', spelare: ['otto', 'ivan', 'nora', 'ann'] },
  { namn: 'Grupp 2', spelare: ['jonas', 'jakob', 'jessica', 'ak'] },
  { namn: 'Grupp 3', spelare: ['hannes', 'manne', 'hakan', 'la', 'lena'] },
];

// Spelschema per grupp: alla möter alla, jämnt fördelat över omgångar.
// I femmansgruppen står en spelare över varje omgång (vila).
const CUP_SCHEMA = {
  'Grupp 1': [
    { matcher: [['otto', 'ivan'], ['nora', 'ann']] },
    { matcher: [['otto', 'nora'], ['ivan', 'ann']] },
    { matcher: [['otto', 'ann'], ['ivan', 'nora']] },
  ],
  'Grupp 2': [
    { matcher: [['jonas', 'jakob'], ['jessica', 'ak']] },
    { matcher: [['jonas', 'jessica'], ['jakob', 'ak']] },
    { matcher: [['jonas', 'ak'], ['jakob', 'jessica']] },
  ],
  'Grupp 3': [
    { matcher: [['hannes', 'la'], ['manne', 'hakan']], vila: 'lena' },
    { matcher: [['lena', 'hakan'], ['hannes', 'manne']], vila: 'la' },
    { matcher: [['la', 'manne'], ['lena', 'hannes']], vila: 'hakan' },
    { matcher: [['hakan', 'hannes'], ['la', 'lena']], vila: 'manne' },
    { matcher: [['manne', 'lena'], ['hakan', 'la']], vila: 'hannes' },
  ],
};

// Mot Ann (armen) och Lena (benet) spelar motståndaren med fel hand.
const CUP_FELHAND = new Set(['ann', 'lena']);

// Spelade matcher: nyckeln är paret i schemats ordning, värdet är
// setsiffrorna i samma ordning. [2, 0] för 'jonas|jakob' = 2-0 till Jonas.
const CUP_RESULTAT = {
  'jonas|jakob': [2, 0],
};

// Kvartsfinalerna: etta mot tvåa, alltid från olika grupper. Alice och
// Theo (sent inträde tisdag) är direktinsatta på varsin halva av trädet.
const CUP_KVART = [
  { nr: 'KF1', hem: { etikett: 'Ettan i grupp 1' }, borta: { etikett: 'Tvåan i grupp 3' } },
  { nr: 'KF2', hem: { spelare: 'alice', not: 'direktinsatt gruppetta' }, borta: { etikett: 'Tvåan i grupp 2' } },
  { nr: 'KF3', hem: { etikett: 'Ettan i grupp 2' }, borta: { spelare: 'theo', not: 'direktinsatt grupptvåa' } },
  { nr: 'KF4', hem: { etikett: 'Ettan i grupp 3' }, borta: { etikett: 'Tvåan i grupp 1' } },
];

function renderCupen() {
  const namnFor = Object.fromEntries(SURF_FACES.map((f) => [f[0], f[1]]));
  const seedNr = Object.fromEntries(CUP_SEEDNING.map(([id], i) => [id, i + 1]));
  const ansikte = (id, klass) =>
    `<img class="${klass}" src="img/ansikten/${id}.webp" alt="" loading="lazy">`;

  // ── Seedningslistan ──
  $('#cup-seedning').innerHTML = CUP_SEEDNING.map(([id, motiv], i) =>
    '<li class="cup-seed">' +
    `<span class="cup-seed-nr">${i + 1}</span>` +
    ansikte(id, 'cup-seed-ansikte') +
    `<span class="cup-seed-namn">${esc(namnFor[id] || id)}</span>` +
    `<span class="cup-seed-motiv">${esc(motiv)}</span></li>`).join('');

  $('#cup-sena').innerHTML =
    '<p class="cup-sena-rubrik">🚌 Utanför seedningen</p>' +
    '<p class="cup-sena-text">' +
    ['alice', 'theo'].map((id) =>
      `<span class="lott-kock">${ansikte(id, 'lott-mini')}${esc(namnFor[id])}</span>`)
      .join(' <span class="amp">&amp;</span> ') +
    ' ansluter på tisdagen och kliver in direkt i slutspelet – utan gruppspel, ' +
    'men också utan uppvärmning. ★</p>';

  // ── Grupperna med spelschema ──
  const felhand = (a, b) => (CUP_FELHAND.has(a) || CUP_FELHAND.has(b))
    ? '<span class="cup-felhand" title="Fel hand gäller!">🖐️ fel hand!</span>' : '';
  $('#cup-grupper').innerHTML = CUP_GRUPPER.map((grupp) => {
    const medlemmar = grupp.spelare.map((id) =>
      `<span class="cup-medlem">${ansikte(id, 'cup-medlem-ansikte')}` +
      `<span>${esc(namnFor[id] || id)}</span>` +
      `<span class="cup-medlem-seed">seed ${seedNr[id]}</span></span>`).join('');
    const omgangar = CUP_SCHEMA[grupp.namn].map((omg, i) =>
      `<div class="cup-omgang"><p class="cup-omgang-rubrik">Omgång ${i + 1}` +
      (omg.vila ? ` <span class="cup-vila">(${esc(namnFor[omg.vila])} vilar)</span>` : '') +
      '</p>' +
      omg.matcher.map(([a, b]) => {
        const res = CUP_RESULTAT[`${a}|${b}`];
        const segrare = res ? (res[0] > res[1] ? a : b) : null;
        const namn = (id) => (id === segrare
          ? `<strong>${esc(namnFor[id] || id)}</strong>` : esc(namnFor[id] || id));
        return '<p class="cup-match-rad">' +
          `<span class="cup-match-par">${namn(a)}–${namn(b)}</span>` +
          felhand(a, b) +
          (res
            ? `<span class="cup-resultat cup-resultat-klar">${res[0]}–${res[1]}</span>`
            : '<span class="cup-resultat" aria-hidden="true"></span>') + '</p>';
      }).join('') +
      '</div>').join('');
    return `<article class="cup-grupp"><h3>${esc(grupp.namn)}</h3>` +
      `<div class="cup-medlemmar">${medlemmar}</div>${omgangar}</article>`;
  }).join('');

  // ── Slutspelsträdet ──
  const slot = (s) => {
    if (s.spelare) {
      return `<div class="cup-slot cup-slot-klar">${ansikte(s.spelare, 'cup-slot-ansikte')}` +
        `<span class="cup-slot-namn">${esc(namnFor[s.spelare])} ★</span>` +
        `<span class="cup-slot-not">${esc(s.not)}</span></div>`;
    }
    return `<div class="cup-slot"><span class="cup-slot-namn">${esc(s.etikett)}</span></div>`;
  };
  const match = (nr, hem, borta) =>
    `<div class="cup-match"><p class="cup-match-nr">${nr}</p>${hem}${borta}</div>`;
  const vinnare = (nr) => `<div class="cup-slot"><span class="cup-slot-namn">Vinnaren av ${nr}</span></div>`;

  $('#cup-trad').innerHTML =
    '<div class="cup-kolumner">' +
    '<div class="cup-kolumn">' +
    '<p class="cup-kolumn-rubrik">Kvartsfinaler</p>' +
    '<div class="cup-par">' + match('KF1', slot(CUP_KVART[0].hem), slot(CUP_KVART[0].borta)) +
    match('KF2', slot(CUP_KVART[1].hem), slot(CUP_KVART[1].borta)) + '</div>' +
    '<div class="cup-par">' + match('KF3', slot(CUP_KVART[2].hem), slot(CUP_KVART[2].borta)) +
    match('KF4', slot(CUP_KVART[3].hem), slot(CUP_KVART[3].borta)) + '</div>' +
    '</div>' +
    '<div class="cup-kolumn">' +
    '<p class="cup-kolumn-rubrik">Semifinaler</p>' +
    '<div class="cup-par">' + match('SF1', vinnare('KF1'), vinnare('KF2')) +
    match('SF2', vinnare('KF3'), vinnare('KF4')) + '</div>' +
    '</div>' +
    '<div class="cup-kolumn">' +
    '<p class="cup-kolumn-rubrik">Final</p>' +
    '<div class="cup-par">' + match('🏆 Finalen', vinnare('SF1'), vinnare('SF2')) + '</div>' +
    '<p class="cup-pokal" aria-hidden="true">🏆<br><span>Helvedeslarven<br>Cup</span></p>' +
    '</div>' +
    '</div>';
}

/* ─────────────── Start ─────────────── */

document.addEventListener('DOMContentLoaded', () => {
  setupSlakttest();
  setupAliceFodelsedag();
  setupLarv();
  setupApp();
  setupSvampBob();
  laddaHattar(); // före surfarna, så vinnarhattarna oftast hinner laddas
  setupSurfers();
  setupOttoKlockan();
  setupEditor();
  setupDanskskolan();

  // Varje sida har bara sina egna byggstenar. Kör det som faktiskt finns.
  if ($('#countdown')) {
    renderCountdown();
    setInterval(renderCountdown, 1000);
  }
  if ($('#vader')) renderVader();
  if ($('#dagens-ord')) renderDagensOrd();
  if ($('#narvaro-chart')) renderChart();
  if ($('#action-map')) initActionMap();

  const korsika = $('#korsika-dagar');
  if (korsika) {
    const dagar = Math.ceil((new Date(2027, 7, 1) - new Date()) / 86400000);
    if (dagar > 0) korsika.textContent = `Drömmen ligger ungefär ${dagar} dagar bort (preliminärt)`;
  }

  if ($('#lott-scen')) setupLottsandning();
  if ($('#matlag-lista')) renderMatlagslista();
  if ($('#matlag-banner')) renderDagensMatlag();
  if ($('#cup-sidan')) renderCupen();
});
