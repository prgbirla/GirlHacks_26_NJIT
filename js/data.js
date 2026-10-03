/* Sample data for the Mathematics grove.
   Trees are big concepts (x, y = position on the full grove map, used for ordering).
   s = shrubs: smaller ideas inside the tree. EDGES go from "learn first" to "learn next" and are
   either required or good to have. */
const TREES = [
  { id: 'arith', l: 'Arithmetic', x: 80, y: 380, b: 'Working with numbers. The soil everything else grows in.', s: ['Order of operations', 'Fractions', 'Exponents', 'Negative numbers'] },
  { id: 'algebra', l: 'Algebra', x: 230, y: 250, b: 'Using letters to stand in for unknown numbers.', s: ['Variables', 'Solving equations', 'Factoring', 'Inequalities'] },
  { id: 'geometry', l: 'Geometry', x: 230, y: 520, b: 'Shapes, angles and space.', s: ['Angles', 'Pythagorean theorem', 'Area & volume', 'Coordinate plane'] },
  { id: 'functions', l: 'Functions', x: 390, y: 160, b: 'Rules that turn one number into another.', s: ['Domain & range', 'Graphing', 'Composition', 'Inverse functions'] },
  { id: 'trig', l: 'Trigonometry', x: 390, y: 430, b: 'How angles and side lengths relate.', s: ['Sine & cosine', 'Unit circle', 'Radians'] },
  { id: 'probability', l: 'Probability', x: 390, y: 620, b: 'Measuring how likely things are.', s: ['Sample spaces', 'Independent events', 'Conditional probability'] },
  { id: 'limits', l: 'Limits', x: 550, y: 100, b: 'What a function approaches as inputs get close to a point.', s: ['One-sided limits', 'Continuity', 'Limits at infinity'] },
  { id: 'linsys', l: 'Systems of Equations', x: 550, y: 290, b: 'Solving several equations at once.', s: ['Substitution', 'Elimination', 'Graphing solutions'] },
  { id: 'vectors', l: 'Vectors', x: 550, y: 470, b: 'Arrows with a size and a direction.', s: ['Vector addition', 'Scalar multiplication', 'Magnitude', 'Dot product'] },
  { id: 'stats', l: 'Statistics', x: 550, y: 640, b: 'Summarizing data with numbers.', s: ['Mean & median', 'Variance', 'Outliers'] },
  { id: 'derivatives', l: 'Derivatives', x: 710, y: 150, b: 'How fast something changes at an instant.', s: ['Power rule', 'Chain rule', 'Product rule', 'Tangent lines'] },
  { id: 'matrices', l: 'Matrices', x: 710, y: 370, b: 'Grids of numbers that bundle many equations together.', s: ['Matrix multiplication', 'Determinants', 'Inverse matrices'] },
  { id: 'distributions', l: 'Distributions', x: 710, y: 610, b: 'Patterns of how likely each outcome is.', s: ['Normal distribution', 'Binomial distribution', 'Expected value'] },
  { id: 'integrals', l: 'Integrals', x: 870, y: 70, b: 'Adding up infinitely many tiny pieces.', s: ['Area under a curve', 'Antiderivatives', 'Fundamental theorem'] },
  { id: 'partials', l: 'Partial Derivatives', x: 870, y: 250, b: 'Change in one direction when a function has many inputs.', s: ['Multivariable functions', 'Partial notation'] },
  { id: 'lintrans', l: 'Linear Transformations', x: 870, y: 450, b: 'Matrices as ways to stretch, rotate and flip space.', s: ['Rotation', 'Scaling', 'Shear', 'Composition'] },
  { id: 'gradient', l: 'Gradient', x: 1030, y: 250, b: 'The direction of steepest climb on a surface.', s: ['Gradient vector', 'Directional derivative', 'Gradient descent'] },
  { id: 'eigen', l: 'Eigenvectors', x: 1030, y: 450, b: 'Directions a transformation only stretches, never turns.', s: ['Eigenvalues', 'Characteristic equation', 'Diagonalization'] },
];
// [from, to, type]: "req" = required before you can learn it, "opt" = good to have, helps but not essential
const EDGES = [
  ['arith', 'algebra', 'req'], ['arith', 'geometry', 'req'], ['arith', 'probability', 'req'],
  ['algebra', 'functions', 'req'], ['algebra', 'linsys', 'req'], ['algebra', 'trig', 'req'], ['algebra', 'vectors', 'req'],
  ['geometry', 'trig', 'req'], ['geometry', 'vectors', 'req'], ['trig', 'vectors', 'opt'],
  ['functions', 'limits', 'req'], ['functions', 'derivatives', 'req'], ['limits', 'derivatives', 'req'], ['trig', 'derivatives', 'opt'],
  ['linsys', 'matrices', 'opt'], ['vectors', 'matrices', 'req'], ['vectors', 'partials', 'opt'], ['vectors', 'lintrans', 'req'],
  ['probability', 'stats', 'req'], ['probability', 'distributions', 'req'], ['stats', 'distributions', 'opt'],
  ['derivatives', 'integrals', 'req'], ['derivatives', 'partials', 'req'], ['matrices', 'lintrans', 'req'],
  ['partials', 'gradient', 'req'], ['lintrans', 'eigen', 'req'],
];

/* ---------- helpers shared by both pages ---------- */
const byId = Object.fromEntries(TREES.map(t => [t.id, t]));
const parents = {}, kids = {};
TREES.forEach(t => { parents[t.id] = []; kids[t.id] = []; });
const EDGE_TYPE = {};
EDGES.forEach(([a, b, type]) => { kids[a].push(b); parents[b].push(a); EDGE_TYPE[a + '>' + b] = type === 'opt' ? 'opt' : 'req'; });
const edgeType = (a, b) => EDGE_TYPE[a + '>' + b];

// Column of each tree on the full map: longest chain of prerequisites before it
const DEPTH = {};
function depthOf(id) {
  if (!(id in DEPTH)) DEPTH[id] = parents[id].length ? 1 + Math.max(...parents[id].map(depthOf)) : 0;
  return DEPTH[id];
}
TREES.forEach(t => depthOf(t.id));

function reach(id, map) {
  const seen = new Set(), stack = [...map[id]];
  while (stack.length) { const n = stack.pop(); if (seen.has(n)) continue; seen.add(n); stack.push(...map[n]); }
  return seen;
}

// Prerequisites you can't skip: everything reachable backward through required links only
function reachRequired(id) {
  const seen = new Set(), stack = parents[id].filter(p => edgeType(p, id) === 'req');
  while (stack.length) {
    const n = stack.pop(); if (seen.has(n)) continue; seen.add(n);
    parents[n].forEach(p => { if (edgeType(p, n) === 'req') stack.push(p); });
  }
  return seen;
}

const SEARCH_INDEX = [];
TREES.forEach(t => {
  SEARCH_INDEX.push({ label: t.l, tree: t.id });
  t.s.forEach(s => SEARCH_INDEX.push({ label: s, tree: t.id, shrub: s }));
});

// Find a tree (or the tree a shrub grows on) from whatever the user typed
function findConcept(text) {
  const v = (text || '').trim().toLowerCase();
  if (!v) return null;
  if (byId[v]) return { tree: v };
  return SEARCH_INDEX.find(o => o.label.toLowerCase() === v)
    || SEARCH_INDEX.find(o => o.label.toLowerCase().startsWith(v))
    || SEARCH_INDEX.find(o => o.label.toLowerCase().includes(v))
    || null;
}

function fillDatalist(id) {
  const dl = document.getElementById(id);
  SEARCH_INDEX.forEach(o => { const op = document.createElement('option'); op.value = o.label; dl.appendChild(op); });
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs, parent) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
