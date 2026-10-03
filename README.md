# Enchanted Groves

**GirlHacks 2026 · Theme: Whimsical Wonders (Enchanted Groves)**

A map for high school students that shows where any concept fits in what you're learning.
Type in a concept and it appears in the center of a forest. The trees on one side are what you need to learn before it. The trees on the other side are what it leads to next.

## The problem

1. **"I want to learn X, but what should I learn first?"** Students often don't know which concepts they need before starting something new.
2. **"I just learned X. What can I learn next?"** After learning something, it's hard to see where it leads.

## How it works

| In the forest | What it means |
| --- | --- |
| **Forest** | A field of study (Mathematics, Computer Science…). Each forest has its own tree color. |
| **Tree** | A big concept, like *Vectors* or *Derivatives*. |
| **Shrub** | A smaller idea that belongs to a tree, like *Vector addition* or *Dot product*. |
| **Path** | A link from one tree to another. Follow it backward for prerequisites and forward for what's next. A tree can have many links in each direction. |

Prerequisite links come in two kinds:

- **Required:** solid line. You need this first.
- **Good to have:** dotted line. It helps, but you can skip it.

### Pages

- **`index.html`**: asks for a concept and shows the realm map of forests.
- **`map.html?concept=vectors`**: the forest map, centered on the chosen concept.
  - **Learn first** highlights the prerequisites (left) and lists them in learning order.
  - **Learn next** highlights the topics it leads to (right).
  - Hover a tree to see its direct links, click it to move it to the center, drag to pan, and scroll to zoom.

## Run it

It's plain HTML, CSS and JavaScript, so there's no build step.

- **Quickest:** open `index.html` in a browser.
- **Local server** (needed later, when the page loads the JSON files):
  ```bash
  python -m http.server 8000
  # then open http://localhost:8000
  ```
- **GitHub Pages:** go to Settings → Pages, deploy from the `main` branch with `/ (root)` as the folder.

## Project structure

```
├── index.html          Home page: concept search + realm map
├── map.html            Forest map centered on one concept
├── css/
│   └── style.css       Shared styles (light + dark theme)
├── js/
│   ├── data.js         Sample math data + graph helpers (shared)
│   ├── home.js         Home page: search, realm map
│   └── map.js          Map page: layout, highlighting, pan/zoom, side panel
├── data/
│   ├── math_nodes.json Trees and shrubs (to be generated)
│   └── math_edges.json Links between trees (to be generated)
└── scripts/
    ├── build_math.py   Builds the math data files
    └── Forest.py
```

## Data format

The site currently uses the sample data in `js/data.js`. The JSON files in `data/` are planned to follow this shape:

```jsonc
// math_nodes.json
{ "id": "vectors",         "label": "Vectors",         "forest": "math", "kind": "tree" }
{ "id": "vector-addition", "label": "Vector addition", "forest": "math", "kind": "shrub", "parent": "vectors" }

// math_edges.json   (from = learn first, to = learn next)
{ "from": "algebra", "to": "vectors", "type": "required" }
{ "from": "trig",    "to": "vectors", "type": "good_to_have" }
```

## Roadmap

- [ ] Load the forest from `data/*.json` instead of the sample data
- [ ] Add the Computer Science forest
- [ ] Trails between forests for links that cross fields
