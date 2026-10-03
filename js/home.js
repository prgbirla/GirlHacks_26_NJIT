function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- ask for a concept ---------- */
const form = document.getElementById('ask');
const input = document.getElementById('concept');
const note = document.getElementById('note');
fillDatalist('concepts');

function goTo(text) {
  const hit = findConcept(text);
  if (!text.trim()) { note.textContent = 'Type a concept first, or pick one below.'; input.focus(); return; }
  if (!hit) { note.textContent = `We don't have a tree for “${text.trim()}” yet. Try one of these:`; return; }
  const mode = form.querySelector('input[name="mode"]:checked').value;
  const q = new URLSearchParams({ concept: hit.tree, mode });
  if (hit.shrub) q.set('shrub', hit.shrub);
  location.href = 'map.html?' + q.toString();
}
form.addEventListener('submit', e => { e.preventDefault(); goTo(input.value); });
document.querySelectorAll('[data-try]').forEach(b => b.addEventListener('click', () => { input.value = b.dataset.try; goTo(b.dataset.try); }));

/* ---------- realm map ---------- */
(function realm() {
  const svg = document.getElementById('realmSvg');
  const box = document.getElementById('realmBox');
  const R = rng(11);
  const M = { x: 300, y: 205, r: 145 }, C = { x: 665, y: 205, r: 135 };
  const d = (x, y, o) => Math.hypot(x - o.x, y - o.y);

  // trails between forests: ideas that cross from one field to another
  el('path', { class: 'trail-dots', d: 'M440 170 C 480 140, 500 140, 535 165' }, svg);
  el('path', { class: 'trail-dots', d: 'M440 245 C 480 275, 500 275, 535 250' }, svg);
  el('path', { class: 'trail-dots', d: 'M790 270 C 820 320, 840 345, 852 350' }, svg);
  el('path', { class: 'trail-dots', d: 'M165 260 C 130 300, 115 318, 106 326' }, svg);
  el('circle', { class: 'future', cx: 885, cy: 352, r: 34 }, svg);
  el('circle', { class: 'future', cx: 80, cy: 330, r: 30 }, svg);

  const pts = [];
  for (let i = 0; i < 6000 && pts.length < 320; i++) {
    const x = 150 + R() * 660, y = 55 + R() * 300;
    const inM = d(x, y, M) < M.r - 6, inC = d(x, y, C) < C.r - 6;
    if (!inM && !inC) continue;
    const r = 7 + R() * 6;
    if (pts.some(p => Math.hypot(p.x - x, p.y - y) < p.r + r + 1)) continue;
    pts.push({ x, y, r, f: inM ? 'math' : 'cs' });
  }
  pts.sort((a, b) => a.y - b.y);
  const groups = {};
  ['math', 'cs'].forEach(f => groups[f] = el('g', { class: 'forest f-' + f }, svg));
  pts.forEach(p => {
    el('circle', { class: 'crown', cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: p.r.toFixed(1) }, groups[p.f]);
    el('circle', { class: 'crown-hi', cx: (p.x - p.r * .3).toFixed(1), cy: (p.y - p.r * .3).toFixed(1), r: (p.r * .45).toFixed(1) }, groups[p.f]);
  });

  for (let i = 0; i < 14; i++) {
    const f = el('circle', { class: 'firefly', cx: (40 + R() * 880).toFixed(0), cy: (30 + R() * 360).toFixed(0), r: (1.6 + R() * 1.6).toFixed(1) }, svg);
    f.style.animationDelay = (-R() * 3.2).toFixed(2) + 's';
  }

  function sign(x, y, title, sub) {
    const g = el('g', { class: 'sign' }, svg);
    const w = Math.max(title.length * 9.6, sub.length * 7.4) + 28;
    el('rect', { x: x - w / 2, y: y - 22, width: w, height: 46, rx: 12 }, g);
    el('text', { class: 't', x, y: y - 1, 'text-anchor': 'middle' }, g).textContent = title;
    el('text', { class: 's', x, y: y + 16, 'text-anchor': 'middle' }, g).textContent = sub;
  }
  sign(300, 386, 'Mathematics', `Open · ${TREES.length} trees`);
  sign(665, 386, 'Computer Science', 'Sprouting soon');
  el('text', { x: 885, y: 404, 'text-anchor': 'middle', class: 'future-label' }, svg).textContent = 'Future grove';

  function hit(f, shape, attrs, open) {
    const h = el(shape, Object.assign({ class: 'hit' + (open ? '' : ' locked') }, attrs), svg);
    h.addEventListener('mouseenter', () => { box.classList.add('hovering'); groups[f].classList.add('hot'); });
    h.addEventListener('mouseleave', () => { box.classList.remove('hovering'); groups[f].classList.remove('hot'); });
    if (open) {
      h.setAttribute('tabindex', '0'); h.setAttribute('role', 'link'); h.setAttribute('aria-label', 'Pick a math concept');
      const go = () => { window.scrollTo({ top: 0, behavior: 'smooth' }); input.focus({ preventScroll: true }); };
      h.addEventListener('click', go);
      h.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    }
  }
  hit('math', 'circle', { cx: M.x, cy: M.y, r: M.r }, true);
  hit('cs', 'circle', { cx: C.x, cy: C.y, r: C.r }, false);
})();
