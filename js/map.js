/* ---------- read the concept from the URL ---------- */
const params = new URLSearchParams(location.search);
const asked = params.get('concept') || '';
const found = findConcept(asked);
const state = {
  sel: found ? found.tree : 'vectors',
  shrub: params.get('shrub') || (found && found.shrub) || null,
  mode: params.get('mode') === 'branches' ? 'branches' : 'roots',
};
const note = document.getElementById('note');
if (asked && !found) note.textContent = `We couldn't find “${asked}”, so here's Vectors instead.`;
fillDatalist('concepts');

/* ---------- layout constants ---------- */
const FIRST = 250;   // distance from the center tree to the first column
const GAP = 190;     // distance between later columns
const ROW = 124;     // vertical space between related trees in a column
const UROW = 118;    // vertical space between unrelated trees
const CENTER_BAND = 175; // room kept clear above and below the center tree
const R_SMALL = 28, R_CENTER = 48;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- build the SVG once ---------- */
const svg = document.getElementById('groveSvg');
const defs = el('defs', {}, svg);
// arrowheads: filled for required links, hollow for good-to-have links, one per color
['n', 'roots', 'branches'].forEach(tone => ['req', 'opt'].forEach(type => {
  const m = el('marker', { id: `m-${tone}-${type}`, viewBox: '0 0 12 12', refX: 10, refY: 6, markerWidth: 13, markerHeight: 13, markerUnits: 'userSpaceOnUse', orient: 'auto' }, defs);
  el('path', { d: 'M1.5 1.5 L10.5 6 L1.5 10.5 Z', class: `mk mk-${tone} ${type}` }, m);
}));
const edgeLayer = el('g', {}, svg), treeLayer = el('g', {}, svg);

const edgeEls = EDGES.map(([a, b]) => ({ a, b, type: edgeType(a, b), p: el('path', { class: 'edge' }, edgeLayer) }));

function canopy(g, r) {
  const k = r / 24;
  el('circle', { class: 'c1', r: 24 * k }, g);
  el('circle', { class: 'c2', cx: -6 * k, cy: -5 * k, r: 15 * k }, g);
  el('circle', { class: 'c3', cx: 8 * k, cy: -2 * k, r: 13 * k }, g);
  el('circle', { class: 'c2', cx: 1 * k, cy: 8 * k, r: 12 * k }, g);
  el('circle', { class: 'shine', cx: -9 * k, cy: -10 * k, r: 4 * k }, g);
}

const treeEls = {}, bigShrubs = {}, relTags = {};
TREES.forEach(t => {
  const g = el('g', { class: 'tree', role: 'button', 'aria-label': `Center the map on ${t.l}` }, treeLayer);

  // small version: shrubs as dots on an arc above, name below
  const sm = el('g', { class: 'sm' }, g);
  el('circle', { class: 'halo', r: 44 }, sm);
  const n = t.s.length;
  t.s.forEach((s, i) => {
    const a = (-155 + (n === 1 ? 65 : i * 130 / (n - 1))) * Math.PI / 180;
    const sx = Math.cos(a) * 42, sy = Math.sin(a) * 40;
    el('line', { class: 'stem', x1: 0, y1: 0, x2: sx.toFixed(1), y2: sy.toFixed(1) }, sm);
    el('title', {}, el('circle', { class: 'shrub', cx: sx.toFixed(1), cy: sy.toFixed(1), r: 6 }, sm)).textContent = s;
  });
  el('circle', { class: 'ring', r: 35 }, sm);
  canopy(sm, 24);
  el('text', { class: 'name', y: 48 }, sm).textContent = t.l;
  relTags[t.id] = el('text', { class: 'rel-tag', y: 63 }, sm);

  // center version: bigger canopy with labelled shrubs above and below
  const bg = el('g', { class: 'bg' }, g);
  const top = Math.ceil(n / 2), bottom = n - top;
  const angles = [];
  for (let i = 0; i < top; i++) angles.push(top === 1 ? -90 : -150 + i * 120 / (top - 1));
  for (let i = 0; i < bottom; i++) angles.push(bottom === 1 ? 90 : 150 - i * 120 / (bottom - 1));
  bigShrubs[t.id] = {};
  t.s.forEach((s, i) => {
    const a = angles[i] * Math.PI / 180, up = angles[i] < 0;
    const sx = Math.cos(a) * 70, sy = Math.sin(a) * 66;
    el('line', { class: 'stem', x1: 0, y1: 0, x2: sx.toFixed(1), y2: sy.toFixed(1) }, bg);
    const c = el('circle', { class: 'shrub big', cx: sx.toFixed(1), cy: sy.toFixed(1), r: 8 }, bg);
    // side labels grow outward so neighbours on the same arc don't collide
    const side = sx < -10 ? 'end' : sx > 10 ? 'start' : 'middle';
    const lx = side === 'end' ? sx + 6 : side === 'start' ? sx - 6 : sx;
    el('text', { class: 'shrub-name', x: lx.toFixed(1), y: (sy + (up ? -14 : 24)).toFixed(1), 'text-anchor': side }, bg).textContent = s;
    bigShrubs[t.id][s] = c;
  });
  el('circle', { class: 'ring', r: R_CENTER + 4 }, bg);
  canopy(bg, R_CENTER - 10);
  el('text', { class: 'center-name', y: 128 }, bg).textContent = t.l;

  g.addEventListener('click', () => { if (!dragged) select(t.id); });
  g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(t.id); } });
  g.addEventListener('pointerenter', () => { if (!drag) setHover(t.id); });
  g.addEventListener('pointerleave', () => setHover(null));
  g.addEventListener('focus', () => setHover(t.id));
  g.addEventListener('blur', () => setHover(null));
  treeEls[t.id] = g;
});

/* ---------- layout: chosen concept at the center, every tree stays on the map ---------- */
// Columns come from each tree's depth in the whole grove, shifted so the chosen tree is column 0.
// Prerequisites always land to the left and next topics to the right.
// In each column, related trees sit in the middle band; unrelated trees move above and below it.
function layout(s) {
  const anc = reach(s, parents), desc = reach(s, kids);
  const related = new Set([s, ...anc, ...desc]);
  const cols = new Map();
  TREES.forEach(t => {
    const c = DEPTH[t.id] - DEPTH[s];
    if (!cols.has(c)) cols.set(c, []);
    cols.get(c).push(t.id);
  });
  const colX = c => Math.sign(c) * (FIRST + (Math.abs(c) - 1) * GAP);
  const pos = {};
  const bary = id => {
    const ys = [...parents[id], ...kids[id]].filter(n => pos[n]).map(n => pos[n].y);
    return ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : null;
  };

  // place columns from the center outward so neighbours are placed first
  const order = [...cols.keys()].sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
  order.forEach(c => {
    const ids = cols.get(c), x = colX(c);
    const rel = ids.filter(id => related.has(id)), un = ids.filter(id => !related.has(id));
    let top = 0, bottom = 0;
    if (c === 0) {
      pos[s] = { x: 0, y: 0 };
      top = -CENTER_BAND; bottom = CENTER_BAND;
    } else if (rel.length) {
      rel.sort((a, b) => (bary(a) ?? 0) - (bary(b) ?? 0) || byId[a].y - byId[b].y);
      rel.forEach((id, i) => pos[id] = { x, y: (i - (rel.length - 1) / 2) * ROW });
      top = pos[rel[0]].y - 30; bottom = pos[rel[rel.length - 1]].y + 30;
    } else {
      top = -40; bottom = 40;
    }
    const pref = id => bary(id) ?? (byId[id].y - 360);
    const above = un.filter(id => pref(id) < 0).sort((a, b) => pref(b) - pref(a));
    const below = un.filter(id => pref(id) >= 0).sort((a, b) => pref(a) - pref(b));
    above.forEach((id, i) => pos[id] = { x, y: top - UROW * (i + 1) });
    below.forEach((id, i) => pos[id] = { x, y: bottom + UROW * (i + 1) });
  });


  // fit the related trees; unrelated ones may sit off screen and are reachable by dragging
  let halfW = 360, halfH = 190;
  related.forEach(id => { halfW = Math.max(halfW, Math.abs(pos[id].x) + 150); halfH = Math.max(halfH, Math.abs(pos[id].y) + 90); });
  return { anc, desc, related, A: new Set([s, ...anc]), D: new Set([s, ...desc]), pos, view: { w: halfW * 2, h: halfH * 2 } };
}

/* ---------- animation between layouts ---------- */
const cur = {};
TREES.forEach(t => cur[t.id] = { x: 0, y: 0 });
let curView = { w: 720, h: 380 }, bloom = 0;
let raf = 0, finish = () => {};
// pan + zoom: the layout is fitted to the stage, but never shrunk below a readable size
const MIN_FIT = 0.62, MAX_FIT = 1.15;
let pan = { x: 0, y: 0 }, zoom = 1, scale = 1;
const stage = document.getElementById('stage');

const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => 1 - Math.pow(1 - k, 3);
const radius = id => id === state.sel ? R_CENTER : R_SMALL;
function curve(a, b, ra, rb) {
  const sx = a.x + ra, ex = b.x - rb - 6, dx = Math.max(40, (ex - sx) / 2);
  return `M${sx.toFixed(1)} ${a.y.toFixed(1)} C${(sx + dx).toFixed(1)} ${a.y.toFixed(1)}, ${(ex - dx).toFixed(1)} ${b.y.toFixed(1)}, ${ex.toFixed(1)} ${b.y.toFixed(1)}`;
}

function draw() {
  TREES.forEach(t => treeEls[t.id].setAttribute('transform', `translate(${cur[t.id].x.toFixed(1)} ${cur[t.id].y.toFixed(1)})`));
  edgeEls.forEach(({ a, b, p }) => p.setAttribute('d', curve(cur[a], cur[b], radius(a), radius(b))));
  [edgeLayer, treeLayer].forEach(l => l.style.opacity = bloom.toFixed(3));

  const sw = stage.clientWidth || 800, sh = stage.clientHeight || 560;
  const fit = Math.min(sw / curView.w, sh / curView.h);
  scale = Math.min(MAX_FIT, Math.max(MIN_FIT, fit)) * zoom;
  const vw = sw / scale, vh = sh / scale;
  svg.setAttribute('viewBox', `${(pan.x - vw / 2).toFixed(1)} ${(pan.y - vh / 2).toFixed(1)} ${vw.toFixed(1)} ${vh.toFixed(1)}`);
}

function animateTo(next) {
  cancelAnimationFrame(raf);
  const from = {}, to = next.pos;
  TREES.forEach(t => from[t.id] = { ...cur[t.id] });
  const vFrom = { ...curView }, vTo = next.view;
  const pFrom = { ...pan }, zFrom = zoom, bFrom = bloom;
  const dur = reduceMotion ? 0 : 650, t0 = performance.now();

  function step(now) {
    const k = dur ? ease(Math.min(1, (now - t0) / dur)) : 1;
    TREES.forEach(t => cur[t.id] = { x: lerp(from[t.id].x, to[t.id].x, k), y: lerp(from[t.id].y, to[t.id].y, k) });
    curView = { w: lerp(vFrom.w, vTo.w, k), h: lerp(vFrom.h, vTo.h, k) };
    pan = { x: lerp(pFrom.x, 0, k), y: lerp(pFrom.y, 0, k) };
    zoom = lerp(zFrom, 1, k);
    bloom = lerp(bFrom, 1, k);
    draw();
    if (k < 1) raf = requestAnimationFrame(step);
  }
  finish = () => { cancelAnimationFrame(raf); step(Infinity); finish = () => {}; };
  raf = requestAnimationFrame(step);
}

/* ---------- hover: light up a tree's direct links ---------- */
function setHover(id) {
  svg.classList.toggle('hovering', !!id);
  TREES.forEach(t => {
    treeEls[t.id].classList.toggle('hov', t.id === id);
    treeEls[t.id].classList.toggle('hov-n', !!id && (parents[id].includes(t.id) || kids[id].includes(t.id)));
  });
  edgeEls.forEach(({ a, b, p }) => p.classList.toggle('hov-e', a === id || b === id));
}

/* ---------- state changes ---------- */
function select(id, shrub) {
  if (id === state.sel && !shrub) return;
  state.sel = id; state.shrub = shrub || null;
  update();
}
function setMode(m) {
  state.mode = m;
  update(false);
}

const TAG = { req: 'required', opt: 'good to have' };
function update(move = true) {
  const s = state.sel, t = byId[s];
  const next = layout(s);
  const { anc, desc, A, D } = next;
  // only one side is lit at a time: prerequisites in "Learn first", next topics in "Learn next"
  const roots = state.mode === 'roots';
  const active = roots ? anc : desc;

  TREES.forEach(o => {
    const g = treeEls[o.id], id = o.id;
    const dRoot = roots && parents[s].includes(id), dBranch = !roots && kids[s].includes(id);
    g.classList.toggle('center', id === s);
    g.classList.toggle('root', roots && anc.has(id));
    g.classList.toggle('branch', !roots && desc.has(id));
    g.classList.toggle('direct-root', dRoot);
    g.classList.toggle('direct-branch', dBranch);
    g.classList.toggle('unrel', id !== s && !active.has(id));
    g.setAttribute('tabindex', id === s ? '-1' : '0');
    // required / good to have only applies to prerequisites
    const type = dRoot ? edgeType(id, s) : null;
    relTags[id].textContent = type ? TAG[type] : '';
    relTags[id].setAttribute('class', 'rel-tag' + (type ? ' ' + type : ''));
  });

  edgeEls.forEach(({ a, b, type, p }) => {
    let tone = 'n';
    if (roots && A.has(a) && A.has(b)) tone = 'roots';
    else if (!roots && D.has(a) && D.has(b)) tone = 'branches';
    const style = tone === 'roots' ? type : 'req';   // dotted good-to-have style only on the learn-first side
    const direct = roots ? b === s : a === s;
    p.setAttribute('class', `edge ${style} tone-${tone}${tone !== 'n' && direct ? ' direct' : ''}`);
    p.setAttribute('marker-end', `url(#m-${tone}-${style})`);
  });
  document.getElementById('legendFirst').hidden = !roots;
  document.getElementById('legendNext').hidden = roots;
  setHover(null);
  Object.entries(bigShrubs[s]).forEach(([name, c]) => c.classList.toggle('hit', name === state.shrub));

  document.querySelectorAll('.seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === state.mode)));
  document.getElementById('sideL').hidden = !anc.size;
  document.getElementById('sideR').hidden = !desc.size;
  document.getElementById('sideL').classList.toggle('faded', state.mode !== 'roots');
  document.getElementById('sideR').classList.toggle('faded', state.mode === 'roots');
  document.title = `${t.l} · Enchanted Groves`;

  const q = new URLSearchParams({ concept: s, mode: state.mode });
  if (state.shrub) q.set('shrub', state.shrub);
  try { history.replaceState(null, '', '?' + q.toString()); } catch (e) { /* some browsers block this on file:// */ }

  renderPanel(next);
  if (move) animateTo(next);
}

/* ---------- side panel ---------- */
const tag = type => `<span class="tag ${type}">${TAG[type]}</span>`;
function renderPanel(next) {
  const t = byId[state.sel], s = t.id;
  const roots = state.mode === 'roots';
  const shrubChips = t.s.map(x => `<span class="chip${x === state.shrub ? ' hit-shrub' : ''}">${x}</span>`).join('');
  let html = `<div><p class="label">${state.shrub ? 'You searched “' + state.shrub + '”, which grows on' : 'You are here'}</p><h3>${t.l}</h3><p class="blurb">${t.b}</p></div>
    <div><h4>Shrubs on this tree <span class="count">${t.s.length}</span></h4><div class="chips">${shrubChips}</div></div>`;

  if (roots) {
    const order = [...next.anc].sort((a, b) => DEPTH[a] - DEPTH[b] || next.pos[a].y - next.pos[b].y);
    if (!order.length) {
      html += `<div><h4>Learn these first</h4><p class="empty">This is a starting tree. You can begin right here.</p></div>`;
    } else {
      const needed = reachRequired(s);
      html += `<div><h4>Learn these first <span class="count">${needed.size} required · ${order.length - needed.size} good to have</span></h4><ol class="trail">` +
        order.map(id => {
          const direct = parents[s].includes(id);
          const type = needed.has(id) ? 'req' : 'opt';
          return `<li class="${type}"><span class="dot"></span><button type="button" data-go="${id}"><strong>${byId[id].l}</strong>${tag(type)}${direct ? '<span class="tag dir">direct link</span>' : ''}<small>${byId[id].b}</small></button></li>`;
        }).join('') +
        `<li class="goal"><span class="dot"></span><div><strong>${t.l}</strong><span class="tag goal">goal</span><small>You'll be ready for this.</small></div></li></ol></div>`;
    }
  } else {
    const nx = kids[s];
    const further = [...next.desc].filter(id => !nx.includes(id)).sort((a, b) => DEPTH[a] - DEPTH[b]);
    if (!nx.length) {
      html += `<div><h4>Learn next</h4><p class="empty">This is the top of the grove for now. More trees are on the way.</p></div>`;
    }
    if (nx.length) {
      html += `<div><h4>Learn next <span class="count">${nx.length} branches</span></h4><div class="nexts">` +
        nx.map(id => `<button class="next" type="button" data-go="${id}"><strong>${byId[id].l}</strong><small>${byId[id].b}</small></button>`).join('') + `</div></div>`;
    }
    if (further.length) {
      html += `<div><h4>Further along <span class="count">${further.length}</span></h4><div class="chips">` +
        further.map(id => `<button class="chip" type="button" data-go="${id}">${byId[id].l}</button>`).join('') + `</div></div>`;
    }
  }
  html += `<p class="hint">Hover a tree to see its direct links. Click it to put it in the center.</p>`;
  document.getElementById('panel').innerHTML = html;
}

/* ---------- pan and zoom ---------- */
let drag = null, dragged = false;
svg.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  finish();
  drag = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, id: e.pointerId };
  dragged = false;
});
svg.addEventListener('pointermove', e => {
  if (!drag) return;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  if (!dragged && Math.hypot(dx, dy) < 5) return;
  if (!dragged) { dragged = true; svg.setPointerCapture(drag.id); stage.classList.add('dragging'); setHover(null); }
  pan = { x: drag.px - dx / scale, y: drag.py - dy / scale };
  draw();
});
function endDrag() { drag = null; stage.classList.remove('dragging'); setTimeout(() => { dragged = false; }, 0); }
svg.addEventListener('pointerup', endDrag);
svg.addEventListener('pointercancel', endDrag);
svg.addEventListener('wheel', e => {
  e.preventDefault();
  finish();
  zoomBy(Math.exp(-e.deltaY * 0.0015));
}, { passive: false });
function zoomBy(f) { zoom = Math.min(2.2, Math.max(0.4, zoom * f)); draw(); }
document.getElementById('zoomIn').addEventListener('click', () => { finish(); zoomBy(1.25); });
document.getElementById('zoomOut').addEventListener('click', () => { finish(); zoomBy(0.8); });
document.getElementById('recenter').addEventListener('click', () => { finish(); animateTo(layout(state.sel)); });
window.addEventListener('resize', draw);

/* ---------- controls ---------- */
document.getElementById('panel').addEventListener('click', e => {
  const b = e.target.closest('[data-go]');
  if (b) select(b.dataset.go);
});
document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

const qInput = document.getElementById('q');
function runSearch() {
  const v = qInput.value.trim();
  if (!v) { note.textContent = ''; return; }
  const hit = findConcept(v);
  if (!hit) { note.textContent = `No tree or shrub called “${v}” yet.`; return; }
  note.textContent = '';
  qInput.value = '';
  select(hit.tree, hit.shrub);
}
document.getElementById('find').addEventListener('submit', e => { e.preventDefault(); runSearch(); });
qInput.addEventListener('change', runSearch);

update();
