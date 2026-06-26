# Electrode Calendar — Claude Instructions

## Skill Auto-Invocation Rules

The following skills are installed and **must be invoked automatically** when a user request matches. This is a blocking requirement — invoke the skill via the Skill tool BEFORE generating any other response.

### skill-creator
**Invoke when the user:**
- Asks to "create a skill", "write a skill", "build a new skill", "make a slash command", "scaffold a SKILL.md", "help me write a skill", or "what's the skill format"
- Wants to improve or fix an existing skill's frontmatter or description
- Asks how skills work in Claude Code

### mcp-builder
**Invoke when the user:**
- Asks to "create an MCP server", "build MCP tools", "add MCP integration", "expose X as an MCP tool", "wire up Y to Claude", "make a Model Context Protocol server", or "generate MCP"
- Wants to connect Claude to an external API, database, or service via tools
- Asks to scaffold a stdio or HTTP MCP server in TypeScript or Python

### webapp-testing
**Invoke when the user:**
- Asks to "test the UI", "run smoke tests", "check the app flows", "run Playwright tests", "verify the UI", "screenshot the app", "test staging", or "automate browser tests"
- Wants to verify a feature works end-to-end in a real browser
- Asks to set up nightly UI tests or a CI smoke-test script

### frontend-design
**Invoke when the user:**
- Asks to "design a UI", "make this look better", "improve the layout", "apply design principles", "style this component", "make this accessible", "fix the spacing", or "clean up the CSS"
- The current code has inconsistent spacing, hardcoded hex values, mismatched font sizes, or accessibility issues
- A new UI component needs to be built with professional polish

### brand-guidelines
**Invoke when the user:**
- Asks to "apply brand guidelines", "make this on-brand", "follow the style guide", "use our brand colors", "write in our voice", or "match our brand"
- Any artifact (UI, doc, email, slide) needs to reflect the project's identity
- The user references a brand, style guide, or design system

### theme-factory
**Invoke when the user:**
- Asks to "generate a theme", "create a design system", "add dark mode", "build a color system", "make a Tailwind theme", "create component variants", or "generate semantic tokens"
- Needs to produce structured design tokens (JSON, CSS variables, Tailwind config)
- Wants a cohesive light/dark palette from a seed color

### internal-comms
**Invoke when the user:**
- Asks to "write a Slack message", "draft an announcement", "write an incident update", "compose a status update", "write an exec summary", "help me communicate X to the team", or "write a shoutout"
- Needs any internal workplace communication drafted
- Asks for an incident template (investigating, identified, resolved)

### slack-gif-creator
**Invoke when the user:**
- Asks to "make a Slack GIF", "create a reaction GIF", "animate this for Slack", "make a celebration GIF", "generate a team GIF", or "make an animated sticker"
- Wants a short looping animation for a Slack reaction, emoji slot, or team celebration

### algorithmic-art
**Invoke when the user:**
- Asks to "generate art", "create generative graphics", "make a pattern", "create SVG art", "make algorithmic art", "generate a visual background", or "make a noise field"
- Wants parameterized, seed-reproducible visual art in SVG or HTML Canvas format

### canvas-design
**Invoke when the user:**
- Asks to "make a banner", "create an OG image", "design a social card", "build a marketing asset", "create a cover image", "make a product screenshot frame", or "create a YouTube thumbnail"
- Needs any static or semi-static marketing visual exported as PNG

### doc-coauthoring
**Invoke when the user:**
- Asks to "edit this doc", "improve this writing", "rewrite this", "make this clearer", "co-author with me", "give me diff suggestions", "tighten this up", or "review my writing"
- Pastes a document, email, blog post, RFC, or any prose and wants editing help
- Asks for tracked-change style suggestions they can accept or reject

### web-artifacts-builder
**Invoke when the user:**
- Asks to "build a mini-app", "create a demo", "make a dashboard", "build a tool", "create a single-file web app", "make an interactive widget", or "build a standalone HTML page"
- Wants a self-contained HTML artifact (calculator, visualizer, form, data table, game)
- Needs a quick interactive prototype without a build step

---

## General Guidelines

- **Always check for `.claude/brand.json`** before generating any UI, copy, or visual artifact. If it exists, load it and apply brand settings.
- **Skills compose** — chain them when needed: e.g., `theme-factory` → `frontend-design` → `brand-guidelines` for a complete design pass.
- **Skill output is ephemeral by default** — do not commit generated files (GIFs, art, assets, test scripts) unless the user explicitly asks.
- **Never duplicate skill work** — if a skill is invoked, follow its workflow rather than solving the problem inline.
