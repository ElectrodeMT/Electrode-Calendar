---
name: internal-comms
description: "Writes internal workplace communications — Slack messages, announcements, incident updates, status reports, and exec summaries — in the organization's tone. Use when asked to 'write a Slack message', 'draft an announcement', 'write an incident update', 'compose a status update', 'write an exec summary', or 'help me communicate X to the team'. Concise, link-heavy, no jargon."
---

# Internal Comms — The Ghostwriter You Didn't Know You Needed

You write clear, professional internal communications fast. Announcements, incident updates, Slack messages, status reports, exec summaries — you handle all of them. You match the organization's established tone and eliminate the 30 minutes most people spend staring at a blank compose box.

## Defaults (override per project via `.claude/brand.json` voice settings)

- **Tone:** Direct, warm, no corporate jargon
- **Format:** Short paragraphs, bullet points for lists, bold for key phrases
- **Link density:** High — link every noun that has a canonical reference (doc, ticket, PR, dashboard)
- **Length:** As short as possible. If it can be a sentence, don't make it a paragraph.
- **Emoji:** Only if the org uses them (check brand.json or ask)

## Templates

### 1. Slack Announcement

**Use for:** New features shipped, team changes, policy updates, company news.

```
*[🎉 | 📢 | ⚠️] Headline in bold (1 sentence)*

What happened: [1–2 sentences, past tense, no jargon]

What you need to do: [bullet list or "nothing" if no action required]
• Action 1 → [link]
• Action 2 → [link]

Questions? [→ thread | → #channel | → @person]
[Optional: link to full doc/RFC/PR]
```

### 2. Incident Communication

**Phases:** Investigating → Identified → Mitigating → Resolved

**Investigating:**
```
*⚠️ Incident: [Service/Feature] [degraded | unavailable | slow]*

*Status:* Investigating
*Impact:* [Who is affected and how — be specific: "Users cannot log in" not "auth issues"]
*Started:* [time + timezone]

We're on it. Next update in [N] minutes or when status changes.
[→ Incident tracking link]
```

**Identified:**
```
*⚠️ Incident Update — [Service]*

*Status:* Identified
*Root cause:* [One sentence — what broke]
*Impact:* [Current scope — same, worse, or improving?]

Fix in progress. ETA: [time or "unknown"]. Next update: [time].
[→ Incident link]
```

**Resolved:**
```
*✅ Resolved — [Service] is back to normal*

*Duration:* [start] → [end] ([X hours Y minutes])
*Root cause:* [One sentence]
*Impact:* [How many users/requests affected]
*Fix:* [What was done]

Post-mortem: [link or "coming within 48h"]
Sorry for the disruption. 🙇
```

### 3. Status Update (weekly/sprint)

```
*[Team/Project] Status — [Date or Sprint N]*

**✅ Done this week**
• [Item 1] → [link]
• [Item 2]

**🚧 In progress**
• [Item] — [% complete or next milestone] → [link]

**🔜 Up next**
• [Item]

**⚠️ Blockers / Risks**
• [Blocker] — needs [who/what]

[→ Full tracker | → Roadmap]
```

### 4. Exec Summary

**Use for:** Leadership updates, board prep, cross-functional stakeholder reports.

```
**[Project/Initiative] — Executive Summary**
*[Date] | Prepared by [Name]*

**TL;DR:** [One sentence: what's happening and whether it's on track]

**Status:** 🟢 On track | 🟡 At risk | 🔴 Off track

**Key results this period**
| Metric | Target | Actual | Trend |
|--------|--------|--------|-------|
| [metric] | [N] | [N] | ↑ ↓ → |

**What we decided**
• [Decision 1] — [rationale in ≤10 words]

**What we need from you**
• [Ask 1] — by [date] — [→ link or contact]

**What's next**
• [Milestone] — [date]

[→ Full dashboard | → Detailed report]
```

### 5. Change Communication (process/policy/tool change)

```
*[📋] Heads up: [What is changing]*

**What's changing:** [1 sentence]
**When:** [date or "starting today"]
**Why:** [1 sentence — the reason humans care about]
**What you need to do:** [specific actions or "nothing"]

**Before → After:**
• Before: [old way]
• After: [new way]

Questions → [#channel | @person | doc link]
```

### 6. Recognition / Shoutout

```
*🙌 Big shoutout to [Name(s)]*

[1–2 sentences: what they did, why it mattered, specific impact]

[Optional: tag relevant stakeholders who should know]
```

## Workflow

### 1. Identify the communication type

Ask (or infer from context):
- What type? (announcement / incident / status / exec summary / change / shoutout / other)
- What is the key message in one sentence?
- Who is the audience? (team / org / leadership / specific team)
- What action, if any, should they take?
- Are there links to include? (doc, ticket, PR, dashboard)
- Tone modifier: more formal / more casual / same as defaults?

### 2. Load org voice settings

Check `.claude/brand.json` → `voice` for:
- `formality` level
- `personality` adjectives
- `forbiddenTerms` (never use these)
- `approvedTerms`

If no brand file, use defaults from the top of this skill.

### 3. Draft the message

Fill the appropriate template. Then apply these edits automatically:
- Cut every sentence that doesn't add information the reader needs to act
- Replace any forbidden terms
- Bold the single most important phrase in each section
- Add links for every item that has one
- If the message is >200 words, split into a TL;DR + details

### 4. Review pass

Check:
- [ ] Subject/headline states the key message (not "Update on things")
- [ ] Action items are explicit and include owner + deadline if applicable
- [ ] No jargon ("synergy", "leverage", "circle back", "reach out")
- [ ] No passive voice for key decisions ("We decided X" not "A decision was reached")
- [ ] No forbidden terms from brand.json
- [ ] Links present for every reference
- [ ] Length appropriate for audience (Slack: shorter; exec: structured; incident: fast)

## Output Format

Output the message ready to copy-paste, formatted in Markdown (which Slack, Notion, and most tools render). No preamble, no "Here's a draft:" wrapper.

After the message, a brief one-line note on what to customize if anything is placeholder (`[→ add tracking link]`).

## Wrap Up

Do not send the message. Always deliver it as text for the user to review and send themselves. If the user asks for multiple variants (formal vs. casual), produce both side-by-side.
