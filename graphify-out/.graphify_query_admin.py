import json
import networkx as nx
from networkx.readwrite import json_graph
from pathlib import Path

data = json.loads(Path("graphify-out/graph.json").read_text(encoding="utf-8"))
G = json_graph.node_link_graph(data, edges="links")

# Find createSupabaseAdmin node
admin_id = None
for nid, d in G.nodes(data=True):
    if d.get("label") == "createSupabaseAdmin()":
        admin_id = nid
        break

if not admin_id:
    print("createSupabaseAdmin() node not found")
    raise SystemExit(1)

# BFS depth 2 from admin - callers and callees
nodes = {admin_id}
edges_out = []
for depth in range(2):
    frontier = list(nodes)
    for n in frontier:
        for neighbor in G.neighbors(n):
            if neighbor not in nodes:
                nodes.add(neighbor)
            _raw = G[n][neighbor]
            e = next(iter(_raw.values()), {}) if isinstance(G, nx.MultiGraph) else _raw
            edges_out.append((n, neighbor, e))

print(f"createSupabaseAdmin() hub: {len(nodes)} nodes in 2-hop neighborhood\n")

callers = []
for u, v, e in edges_out:
    if admin_id in (u, v) and e.get("relation") in ("calls", "imports", "references"):
        other = u if v == admin_id else v
        callers.append((G.nodes[other].get("label", other), G.nodes[other].get("source_file", ""), e.get("relation")))

seen = set()
print("Direct callers (sample):")
for label, src, rel in sorted(set(callers), key=lambda x: x[1])[:35]:
    print(f"  {label} [{rel}] <- {src}")
print(f"\n... total unique callers in subgraph: {len(set(callers))}")
