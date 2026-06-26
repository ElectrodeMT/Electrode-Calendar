---
name: skill-creator
description: "Meta-skill for writing Claude Code Skills. Use when the user wants to create, scaffold, or improve a Skill — including writing the frontmatter, description wording, workflow steps, and bundled file layout. Invoke when asked to 'create a skill', 'write a slash command', 'build a new skill', or 'help me write a SKILL.md'."
---

# Skill Creator — The Meta-Skill

You help users design, scaffold, and write Claude Code Skills. A Skill is a markdown file (`SKILL.md`) inside a named directory under `.claude/skills/` (project-scoped) or `~/.claude/skills/` (global). When invoked via the Skill tool, the file becomes active context that shapes Claude's behavior for that task.

## Frontmatter Contract

Every `SKILL.md` **must** open with YAML frontmatter. No exceptions.

```markdown
---
name: kebab-case-skill-name
description: "One or two sentences. Starts with the *use case*, not the tool name. Written so a language model can decide whether to invoke it."
---
```

### Writing a good `description` (the part most people get wrong)

The description is a **trigger sentence** — it must let the Skill tool decide whether to invoke this skill automatically. Rules:

1. **Lead with what problem it solves**, not what it is. Bad: "A skill for Playwright." Good: "Runs Playwright tests against a live URL, captures screenshots, and returns structured pass/fail output."
2. **Include concrete trigger phrases** — the exact words a user might type: `"create a skill"`, `"run smoke tests"`, `"generate a theme"`.
3. **Keep it under 50 words.** The model reads this at decision time; concise beats comprehensive.
4. **No jargon from inside the skill.** The description lives outside; it's the door, not the room.

---

## Directory Layout

### Minimal skill (single file)
```
.claude/skills/
└── my-skill/
    └── SKILL.md
```

### Bundled skill (with supporting assets)
```
.claude/skills/
└── my-skill/
    ├── SKILL.md         ← required; the entry point
    ├── examples/
    │   └── sample.json
    └── templates/
        └── scaffold.ts.hbs
```

The Skill tool loads `SKILL.md` automatically. Reference bundled files by relative path inside your skill instructions.

---

## Workflow

Make a checklist and work through each step.

### 1. Gather Requirements

Ask the user:
- What task should this skill perform?
- Who triggers it — the user explicitly, or Claude automatically?
- What are the inputs? (files, URLs, user-supplied values)
- What is the expected output? (files written, terminal output, summary message)
- Are there bundled assets (templates, schemas, examples) to include?
- Should it be project-scoped (`.claude/skills/`) or global (`~/.claude/skills/`)?

### 2. Draft the `name` and `description`

- `name`: kebab-case, ≤30 chars, memorable verb-noun form (`webapp-testing`, `theme-factory`)
- `description`: apply the four rules above; draft three options and pick the sharpest

### 3. Design the Skill Body

Structure the body as a **workflow**, not a reference doc. Claude executes skills top-to-bottom.

Recommended sections:
```markdown
## Context
What this skill does, what it does NOT do, important assumptions.

## Inputs
What the user must provide or what Claude should gather before starting.

## Workflow
Numbered steps. Each step is an action, not a heading.
1. Do X
2. Then do Y
3. Verify Z

## Output Format
Exact structure of the result — fenced code block, bullet list, summary table.

## Wrap Up
What to say when done. What NOT to do (e.g., don't open the browser, don't commit unless asked).
```

### 4. Scaffold the Files

```bash
SKILL_DIR=".claude/skills/<name>"
mkdir -p "$SKILL_DIR"
```

Write `SKILL.md` using the Edit or Write tool. If bundled assets are needed, create their directories and stub files now.

### 5. Validate

Check:
- [ ] Frontmatter present and valid YAML
- [ ] `name` is kebab-case
- [ ] `description` leads with use-case, includes trigger phrases, ≤50 words
- [ ] Body has a numbered Workflow section
- [ ] No placeholder text remains (`<name>`, `TODO`, etc.)
- [ ] If global, directory exists under `~/.claude/skills/`; if project, under `.claude/skills/`

### 6. Copy to Global (optional)

If the user wants the skill available in all sessions:
```bash
cp -r ".claude/skills/<name>" ~/.claude/skills/
```

### 7. Test

Invoke the new skill immediately to verify it loads:
```
/skill-name
```

Or via the Skill tool with a representative prompt.

---

## Output Format

After creating the skill, output:

```
Skill created: <name>
Location: .claude/skills/<name>/SKILL.md
Trigger phrases: <list of 3 phrases that would invoke it>

Description draft:
"<the description string>"

Files created:
- .claude/skills/<name>/SKILL.md
- [any additional files]
```

## Wrap Up

Tell the user the skill is ready and how to invoke it. Remind them:
- Project-scoped skills (`.claude/skills/`) travel with the repo and require pushing.
- Global skills (`~/.claude/skills/`) are local to the machine and must be re-created in new environments.
- Pair this skill with `mcp-builder` to create external tool access alongside the workflow.
