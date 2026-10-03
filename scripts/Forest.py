"""Check and explore the forest dataset.

  python forest.py check              -> look for cycles, broken ids, orphans
  python forest.py prereqs <node_id>  -> what to learn first (problem 1)
  python forest.py next <node_id>     -> what you can learn after (problem 2)

Rules:
  * Edges are stored once, as "from must come before to".
  * A shrub inherits its parent tree's prerequisites.
  * Pass --hard to follow only "requires" edges.
"""
import json, sys, glob
from collections import defaultdict

nodes = {n["id"]: n for f in glob.glob("*_nodes.json") for n in json.load(open(f))}
edges = [e for f in glob.glob("*_edges.json") for e in json.load(open(f))]
hard_only = "--hard" in sys.argv

def graph():
    fwd, back = defaultdict(set), defaultdict(set)
    for e in edges:
        if hard_only and e["type"] != "requires":
            continue
        fwd[e["from"]].add(e["to"]); back[e["to"]].add(e["from"])
    for n in nodes.values():  # a tree comes before its own shrubs
        if n["parent"]:
            fwd[n["parent"]].add(n["id"]); back[n["id"]].add(n["parent"])
    return fwd, back

def check():
    problems = []
    ids = set(nodes)
    for e in edges:
        for end in ("from", "to"):
            if e[end] not in ids:
                problems.append(f"edge points to unknown id: {e[end]}")
        if e["from"] == e["to"]:
            problems.append(f"self-loop: {e['from']}")
    for n in nodes.values():
        p = n["parent"]
        if p and (p not in nodes or nodes[p]["kind"] != "tree"):
            problems.append(f"shrub {n['id']} has bad parent {p}")
    seen = defaultdict(int)
    for e in edges:
        seen[(e["from"], e["to"])] += 1
    problems += [f"duplicate edge {a} -> {b}" for (a, b), c in seen.items() if c > 1]
    linked = {e["from"] for e in edges} | {e["to"] for e in edges}
    for n in nodes.values():
        if n["kind"] == "tree" and n["id"] not in linked:
            problems.append(f"orphan tree (no edges): {n['id']}")
    # cycle detection
    fwd, _ = graph()
    color = {}
    def dfs(u, path):
        color[u] = 1
        for v in fwd[u]:
            if color.get(v) == 1:
                problems.append("cycle: " + " -> ".join(path[path.index(v):] + [v]))
            elif v not in color:
                dfs(v, path + [v])
        color[u] = 2
    for u in nodes:
        if u not in color:
            dfs(u, [u])
    print("\n".join(problems) if problems else
          f"OK: {len(nodes)} nodes, {len(edges)} edges, no problems found")
    return not problems

def walk(start, adj):
    out, stack = {}, [(start, 0)]
    while stack:
        u, d = stack.pop()
        for v in adj[u]:
            if v not in out or d + 1 < out[v]:
                out[v] = d + 1; stack.append((v, d + 1))
    return out

def show(title, found):
    print(title)
    for nid, dist in sorted(found.items(), key=lambda x: (x[1], nodes[x[0]]["level"])):
        n = nodes[nid]
        print(f"  {'  ' * (dist - 1)}{n['name']}  [{n['kind']}, level {n['level']}]")

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args or args[0] == "check":
        sys.exit(0 if check() else 1)
    cmd, nid = args[0], args[1]
    if nid not in nodes:
        sys.exit(f"unknown node: {nid}")
    fwd, back = graph()
    if cmd == "prereqs":
        show(f"Before {nodes[nid]['name']}, learn:", walk(nid, back))
    elif cmd == "next":
        show(f"After {nodes[nid]['name']}, you can explore:", walk(nid, fwd))