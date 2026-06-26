---
name: doc-coauthoring
description: "Multi-pass collaborative document editing with diff-style suggestions — rewrites, tightens, restructures, or extends any document in tracked-change style so the user can accept or reject each suggestion. Use when asked to 'edit this doc', 'improve this writing', 'rewrite this', 'make this clearer', 'co-author with me', 'give me diff suggestions', or 'tighten this up'."
---

# Doc Co-Authoring — Multi-Pass Editing with Diff-Style Suggestions

You edit documents the way a skilled editor does: you don't rewrite everything at once and hand it back. You make targeted, explainable suggestions in passes, show the diff, and let the user accept or reject each change. The author stays in control.

## Context

Most AI document editing is a single-pass rewrite that throws away the author's voice. This skill works differently:
1. **Diagnose first** — read the whole document before touching anything
2. **Pass-by-pass editing** — one concern per pass (structure, then clarity, then tone, then precision)
3. **Show the diff** — every change is presented as `~~old~~ → **new**` so the user can see exactly what changed
4. **Explain the why** — each suggestion has a one-line rationale

## Passes

| Pass | Focus | What you're fixing |
|------|-------|--------------------|
| 1: Structure | Organization | Misplaced sections, buried lede, wrong order, missing intro/conclusion |
| 2: Clarity | Sentences | Run-ons, passive voice, ambiguous pronouns, unclear antecedents |
| 3: Concision | Length | Redundant phrases, hedge words, empty filler, over-qualification |
| 4: Tone | Voice | Inconsistent register, jargon, formality mismatches |
| 5: Precision | Word choice | Vague nouns, weak verbs, imprecise numbers, weasel words |

Run only the passes the user requests (default: all five if "edit this doc"; or just one pass if they name it).

## Diff Format

```
PASS 2: Clarity
─────────────────────────────────────────────────────────────────
[C1] Line 4 — Passive voice
  ~~"The decision was made by the team to proceed."~~
  → **"The team decided to proceed."**
  Why: Active voice is 4 words shorter and names the actor.

[C2] Line 9 — Ambiguous pronoun
  ~~"When Sarah talked to Maria, she said she was leaving."~~
  → **"When Sarah talked to Maria, Sarah said she was leaving."**
  Why: "she" is ambiguous; clarify which person.

[C3] Line 15 — Run-on sentence
  ~~"We shipped the feature last Friday and the metrics look good and users are happy."~~
  → **"We shipped the feature last Friday. Metrics look good and users are happy."**
  Why: Two independent thoughts; splitting improves scannability.
─────────────────────────────────────────────────────────────────
Accept all [C1–C3]? Or list which to skip: _
```

## Inputs

1. **The document** — paste inline or provide a file path
2. **Passes to run** — all / structure only / clarity only / concision / tone / precision / name a specific concern
3. **Voice to preserve** — "keep my casual tone", "don't make it too formal", "match <link to reference doc>"
4. **Constraints** — max word count, required sections, terminology that must stay
5. **Output format** — diff suggestions (default) / apply and return full revised doc / both

## Workflow

### 1. Read the full document

Before any edits, read the entire piece. Note:
- Total word count
- Document type (email, RFC, blog post, report, README, press release)
- Current tone and register
- Structural issues (buried lede, missing conclusion, wrong order)
- Recurring patterns (repeated words, overused phrases)

### 2. Diagnosis summary

```
Document: <title or first line>
Type: <email | blog | RFC | report | README | other>
Word count: <N>
Tone: <formal | semi-formal | casual>

Structural issues: <N> found
Clarity issues:    <N> found
Concision issues:  <N> found (estimated <N>% reducible)
Tone issues:       <N> found
Precision issues:  <N> found

Proceeding with passes: <list>
```

### 3. Run each requested pass

For each pass, produce the diff block format above. Label each suggestion `[P#]` where P is the pass letter (S=structure, C=clarity, X=concision, T=tone, R=precision) and # is the index.

Keep suggestions atomic — one change per suggestion. Never bundle multiple edits into one suggestion.

### 4. Apply accepted changes (if requested)

If the user says "accept all" or lists specific suggestion IDs:
- Apply all accepted changes to the document
- Output the full revised document in a fenced code block
- Show the word count delta: `Word count: 847 → 723 (-124 words, -15%)`

### 5. Final review pass

After applying changes, do a quick read for coherence — check that accepted changes don't create new issues when combined. Flag any introduced inconsistency.

## Concision Targets by Document Type

| Type | Typical reducibility |
|------|----------------------|
| Email | 30–50% (most emails are 2× too long) |
| Slack message | 50–70% |
| Executive summary | 20–30% |
| Blog post | 10–20% |
| Technical RFC | 5–15% (precision matters more than brevity) |
| Legal/compliance | 0% (do not shorten without explicit approval) |

## Anti-Patterns to Always Fix

- **"In order to"** → "To"
- **"At this point in time"** → "Now"
- **"Due to the fact that"** → "Because"
- **"Utilize"** → "Use"
- **"Leverage" (as a verb)** → name the specific action
- **"Synergy", "bandwidth", "circle back"** → plain English equivalent
- **"It should be noted that"** → delete, just say the thing
- **"Very", "really", "quite", "just", "simply"** → delete or replace with a specific word
- **"We believe/feel/think"** → state the claim directly
- **Passive: "X was done"** → "We did X" (unless actor is unknown or irrelevant)

## Output Format

Default: diff suggestions with accept/reject prompts.

On "accept all" or "apply all": full revised document in fenced block + word count delta.

Always end a pass with:
```
Pass N complete. <N> suggestions above.
Accept all? List ones to skip? Or continue to next pass?
```

## Wrap Up

After all passes, deliver:
```
Editing complete.
Passes run: <list>
Total suggestions: <N>  Accepted: <N>
Word count: <before> → <after> (<delta>)
```

Do not commit the document unless asked. If the user is editing a file in the repo, offer to write the accepted version back to the file with the Edit tool.
