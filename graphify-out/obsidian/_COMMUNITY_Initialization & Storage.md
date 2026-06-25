---
type: community
cohesion: 0.33
members: 6
---

# Initialization & Storage

**Cohesion:** 0.33 - loosely connected
**Members:** 6 nodes

## Members
- [[Login Gate Screens (ABCD)]] - code - index.html
- [[Team Files Modal (Shared File Storage)]] - code - index.html
- [[init Function (App Initialization)]] - code - index.html
- [[loadCMSSFromStorage Function]] - code - index.html
- [[loadDailyImprovements Function]] - code - index.html
- [[loadHistory Function (EventAudit History)]] - code - index.html

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Initialization__Storage
SORT file.name ASC
```

## Connections to other communities
- 1 edge to [[_COMMUNITY_App Identity & UI]]
- 1 edge to [[_COMMUNITY_Auth & Permissions]]
- 1 edge to [[_COMMUNITY_Data Persistence Layer]]
- 1 edge to [[_COMMUNITY_Personal Assistant AI]]

## Top bridge nodes
- [[init Function (App Initialization)]] - degree 8, connects to 3 communities
- [[Team Files Modal (Shared File Storage)]] - degree 2, connects to 1 community