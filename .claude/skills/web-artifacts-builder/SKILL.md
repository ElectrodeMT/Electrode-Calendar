---
name: web-artifacts-builder
description: "Builds self-contained single-file HTML artifacts — mini-apps, interactive dashboards, calculators, data visualizations, demos, and tools — that work without a build step, server, or dependencies. Use when asked to 'build a mini-app', 'create a demo', 'make a dashboard', 'build a tool', 'create a single-file web app', 'make an interactive widget', or 'build a standalone HTML page'."
---

# Web Artifacts Builder — Self-Contained HTML Mini-Apps

You build complete, interactive web applications as single self-contained HTML files. No npm, no build step, no server required — just open in a browser. Perfect for demos, prototypes, dashboards, calculators, and internal tools.

## What "Self-Contained" Means

- All HTML, CSS, and JavaScript in one file
- All assets inlined (SVG inline, images as base64 data URIs if needed, or loaded from CDN)
- No server-side code
- Works offline once loaded (except CDN dependencies)
- Shareable by sending the `.html` file

## Stack

Default stack (no config needed):
- **UI:** Vanilla HTML + CSS (or Tailwind via CDN)
- **Logic:** Vanilla JavaScript (ES2022 modules if needed)
- **Charts:** Chart.js via CDN (if data visualization)
- **Tables:** Custom or Tabulator via CDN (if data tables)
- **Icons:** Lucide or Heroicons via CDN SVG sprites

Only pull in a library when the task genuinely needs it. One file, no bloat.

## Artifact Types

| Type | Description | Key elements |
|------|-------------|--------------|
| Dashboard | Metrics, charts, KPIs | Grid layout, Chart.js, live data or mock data |
| Calculator | Input → computed output | Form inputs, real-time JS computation |
| Data Table | Browse/filter/sort data | Table, search input, column sort |
| Form | Data collection | Inputs, validation, localStorage persistence |
| Visualization | Chart/graph/diagram | Chart.js or D3, legend, tooltips |
| Game | Interactive toy | Canvas or DOM, event listeners, game loop |
| Timer/Clock | Time-based tool | `setInterval`, progress bars |
| Configurator | Adjust settings and preview | Side-by-side inputs + live preview |
| Diff Viewer | Compare two texts | Side-by-side, diff highlighting |

## Inputs

1. **What to build** — describe the artifact in plain English
2. **Data source** — mock data inline / CSV the user pastes / localStorage / URL fetch
3. **Interactivity** — what should the user be able to do?
4. **Style** — minimal / professional / branded (load `.claude/brand.json` if branded)
5. **Export?** — should there be a way to export data (CSV, PNG, print)?

## Structure Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Artifact Title</title>

  <!-- CDN dependencies (only what's needed) -->
  <!-- <script src="https://cdn.jsdelivr.net/npm/chart.js"></script> -->

  <style>
    /* ── Reset ─────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; font-size: 16px; line-height: 1.5; color: #111827; background: #f9fafb; }

    /* ── Design Tokens ──────────────────────────────── */
    :root {
      --color-primary: #4f46e5;
      --color-bg: #f9fafb;
      --color-surface: #ffffff;
      --color-border: #e5e7eb;
      --color-text: #111827;
      --color-text-muted: #6b7280;
      --radius: 8px;
      --shadow: 0 1px 3px rgba(0,0,0,0.1);
      --space-1: 4px; --space-2: 8px; --space-3: 12px;
      --space-4: 16px; --space-6: 24px; --space-8: 32px;
    }

    /* ── Layout ─────────────────────────────────────── */
    .app { max-width: 1200px; margin: 0 auto; padding: var(--space-6); }
    .card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius); box-shadow: var(--shadow); padding: var(--space-6); }
    .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-4); }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4); }

    /* ── Components ─────────────────────────────────── */
    .btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); background: var(--color-primary); color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; text-decoration: none; }
    .btn:hover { opacity: 0.9; }
    .btn-ghost { background: transparent; color: var(--color-text); border: 1px solid var(--color-border); }
    input, select, textarea { width: 100%; padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: 6px; font-size: 14px; font-family: inherit; }
    input:focus, select:focus { outline: 2px solid var(--color-primary); outline-offset: 1px; border-color: var(--color-primary); }
    label { font-size: 14px; font-weight: 500; color: var(--color-text); }
    .field { display: flex; flex-direction: column; gap: var(--space-1); }

    /* ── Typography ─────────────────────────────────── */
    h1 { font-size: 1.875rem; font-weight: 700; line-height: 1.2; }
    h2 { font-size: 1.25rem; font-weight: 600; line-height: 1.3; }
    h3 { font-size: 1rem; font-weight: 600; }
    .text-muted { color: var(--color-text-muted); font-size: 0.875rem; }

    /* ── App-specific styles ────────────────────────── */
    /* Add your component styles here */
  </style>
</head>
<body>
<div class="app">
  <header style="margin-bottom: var(--space-8);">
    <h1>Artifact Title</h1>
    <p class="text-muted">Short description of what this does</p>
  </header>

  <main>
    <!-- Content here -->
  </main>
</div>

<script>
// ── State ──────────────────────────────────────────────────────────────────
const state = {
  // application state here
};

// ── Data ───────────────────────────────────────────────────────────────────
const DATA = [
  // mock data here
];

// ── Logic ──────────────────────────────────────────────────────────────────
function compute(input) {
  // business logic here
  return result;
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  // update DOM based on state
}

// ── Events ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  render();
  // attach event listeners here
});
</script>
</body>
</html>
```

## Workflow

### 1. Scope the artifact

Clarify: what is the artifact, what data does it show/process, what can the user do with it.

### 2. Plan the data model

Define the `state` object and `DATA` structure before writing any DOM. Separate data from presentation from computation — even in a single file.

### 3. Build in this order

1. HTML structure (semantic, no styles)
2. CSS (tokens first, then layout, then components)
3. JavaScript (data → compute → render)
4. Interactivity (events → state update → re-render)
5. Polish (transitions, empty states, loading states)

### 4. Checklist before delivering

- [ ] Works with zero JS errors in console
- [ ] All interactive elements have `:hover` and `:focus` states
- [ ] Empty state handled (no data → show helpful message, not blank space)
- [ ] Mobile responsive (check at 375px width)
- [ ] No hardcoded pixel values for text (use rem)
- [ ] Keyboard navigable (can tab through all controls)
- [ ] Data is mock but realistic (real-looking names, dates, amounts)

### 5. Write and deliver

Write to `.claude/artifacts/<name>.html`. Provide the open command.

## Output Format

```
Artifact: <title>
Type: <type>
Features: <bullet list of what it does>

Preview: open .claude/artifacts/<name>.html

File: .claude/artifacts/<name>.html
```

Then output the key code section (not the full file) showing the interesting logic.

## Wrap Up

Offer to: (1) apply brand guidelines from `.claude/brand.json`, (2) add data export (CSV download, print-to-PDF), (3) convert to a proper React/Vue component if the user wants to integrate it into a bigger app. These artifacts live in `.claude/artifacts/` — gitignore that directory unless the user wants to version them.
