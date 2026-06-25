# Graph Report - .  (2026-06-25)

## Corpus Check
- Corpus is ~46,157 words - fits in a single context window. You may not need a graph.

## Summary
- 40 nodes · 55 edges · 7 communities
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Personal Assistant AI|Personal Assistant AI]]
- [[_COMMUNITY_App Identity & UI|App Identity & UI]]
- [[_COMMUNITY_Data Persistence Layer|Data Persistence Layer]]
- [[_COMMUNITY_CMMS Advisor Panel|CMMS Advisor Panel]]
- [[_COMMUNITY_Initialization & Storage|Initialization & Storage]]
- [[_COMMUNITY_Calendar & Reporting|Calendar & Reporting]]
- [[_COMMUNITY_Auth & Permissions|Auth & Permissions]]

## God Nodes (most connected - your core abstractions)
1. `Electrode Maintenance Team Calendar App` - 15 edges
2. `init Function (App Initialization)` - 8 edges
3. `Claude AI Command Panel (CMMS Advisor)` - 7 edges
4. `Task Management (create/assign/complete/delete)` - 7 edges
5. `Authentication and Invite System` - 5 edges
6. `Firebase Realtime Database Sync` - 4 edges
7. `Personal Assistant Tab (PA)` - 4 edges
8. `sendToClaudeAI Function` - 3 edges
9. `CMMS Upgrade Proposals Tab` - 3 edges
10. `saveToStorage Function` - 3 edges

## Surprising Connections (you probably didn't know these)
- `Graphify Knowledge Graph Instructions` --references--> `Electrode Maintenance Team Calendar App`  [EXTRACTED]
  CLAUDE.md → index.html

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Dual Persistence Layer: localStorage Cache + Firebase Source of Truth** — index_local_storage_persistence, index_firebase_realtime_sync, index_save_to_storage, index_load_from_storage, index_fb_save_calendar_data [EXTRACTED 0.95]
- **Claude AI Advisor Subsystem (Chat + PA + CMMS + Daily)** — index_claude_ai_panel, index_send_to_claude_ai, index_process_claude, index_send_to_pa, index_generate_daily_briefing, index_anthropic_api_integration [EXTRACTED 0.95]
- **Role-Based Access Control System** — index_auth_system, index_admin_credentials, index_roles_permissions, index_login_gate_screens, index_invite_system [EXTRACTED 0.95]

## Communities (7 total, 0 thin omitted)

### Community 0 - "Personal Assistant AI"
Cohesion: 0.33
Nodes (7): Anthropic Claude API Integration, generateDailyBriefing Function, Personal Assistant Memory (loadPAMemory), Personal Assistant Tab (PA), processClaude Function, sendToClaudeAI Function, sendToPA Function (Personal Assistant)

### Community 1 - "App Identity & UI"
Cohesion: 0.33
Nodes (6): Graphify Knowledge Graph Instructions, DM Font Family (DM Serif Display, DM Mono, DM Sans), downloadCalendar Function, Electrode Maintenance Team Calendar App, F1 Racing Background Visual System, Share Calendar Modal

### Community 2 - "Data Persistence Layer"
Cohesion: 0.40
Nodes (6): Announcements System (Post/Pin/Feed), fbSaveCalendarData Function, Firebase Realtime Database Sync, loadFromStorage Function, localStorage Persistence (Offline Cache), saveToStorage Function

### Community 3 - "CMMS Advisor Panel"
Cohesion: 0.47
Nodes (6): Claude AI Command Panel (CMMS Advisor), CMMS (Computerized Maintenance Management System) Evolution, CMMS Upgrade Proposals Tab, CMMS Evolution Roadmap Tab, Daily Micro-Improvements Tab, Admin Live Edit Bar (Admin-Only Command Bar)

### Community 4 - "Initialization & Storage"
Cohesion: 0.33
Nodes (6): Team Files Modal (Shared File Storage), init Function (App Initialization), loadCMSSFromStorage Function, loadDailyImprovements Function, loadHistory Function (Event/Audit History), Login Gate Screens (A/B/C/D)

### Community 5 - "Calendar & Reporting"
Cohesion: 0.40
Nodes (5): Calendar Views (Month/Week/Day), Email Log (Outgoing Notification Log), Smart Insights / Recommendations System, Task Completion Report Modal, Task Management (create/assign/complete/delete)

### Community 6 - "Auth & Permissions"
Cohesion: 0.50
Nodes (4): Admin Credentials (SHA-256 Hashed, Never Hardcoded), Authentication and Invite System, Invite System (Invite Codes and Links), Roles and Permissions (CATEGORIES)

## Knowledge Gaps
- **13 isolated node(s):** `Graphify Knowledge Graph Instructions`, `Admin Credentials (SHA-256 Hashed, Never Hardcoded)`, `processClaude Function`, `Admin Live Edit Bar (Admin-Only Command Bar)`, `F1 Racing Background Visual System` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Electrode Maintenance Team Calendar App` connect `App Identity & UI` to `Data Persistence Layer`, `CMMS Advisor Panel`, `Initialization & Storage`, `Calendar & Reporting`, `Auth & Permissions`?**
  _High betweenness centrality (0.646) - this node is a cross-community bridge._
- **Why does `Claude AI Command Panel (CMMS Advisor)` connect `CMMS Advisor Panel` to `Personal Assistant AI`, `App Identity & UI`?**
  _High betweenness centrality (0.425) - this node is a cross-community bridge._
- **Why does `init Function (App Initialization)` connect `Initialization & Storage` to `Personal Assistant AI`, `Data Persistence Layer`, `Auth & Permissions`?**
  _High betweenness centrality (0.262) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `Task Management (create/assign/complete/delete)` (e.g. with `Smart Insights / Recommendations System` and `Email Log (Outgoing Notification Log)`) actually correct?**
  _`Task Management (create/assign/complete/delete)` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Graphify Knowledge Graph Instructions`, `Admin Credentials (SHA-256 Hashed, Never Hardcoded)`, `processClaude Function` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._