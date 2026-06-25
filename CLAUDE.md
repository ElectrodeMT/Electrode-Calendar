## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## Context Navigation

Before doing any global file search (Grep, Glob, or shell find/grep), check graphify-out/graph.json first:

1. If `graphify-out/graph.json` exists, run `graphify query "<question>"` to retrieve scoped subgraph context — do NOT grep the whole codebase.
2. Use `graphify path "<NodeA>" "<NodeB>"` to trace relationships between two concepts without file scanning.
3. Use `graphify explain "<concept>"` for focused node-level context.
4. Only fall back to Grep/Glob/Read when the graph returns no relevant results for the query.

This ensures persistent memory across sessions: the graph encodes architecture, relationships, and concepts extracted from the full codebase and survives context resets.
