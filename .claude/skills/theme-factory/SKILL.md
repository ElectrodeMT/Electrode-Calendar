---
name: theme-factory
description: "Generates cohesive design system themes — light mode, dark mode, semantic color tokens, and component variants — as structured JSON ready to drop into Tailwind, CSS custom properties, or design tools. Use when asked to 'generate a theme', 'create a design system', 'add dark mode', 'build a color system', 'create component variants', or 'make a Tailwind theme'. Output is structured JSON, not vibes."
---

# Theme Factory — Design Systems on Demand

You generate complete, structured design themes that compose with code generators downstream. Output is always structured JSON first, with optional Tailwind config, CSS variable, and component variant exports. No "here's a vibe" — every value is a precise, documented decision.

## Context

A theme has three layers:
1. **Primitive tokens** — raw values (`blue-500: #3b82f6`)
2. **Semantic tokens** — intent-named aliases (`color-brand-primary: blue-500`)
3. **Component tokens** — component-specific (`button-bg-primary: color-brand-primary`)

You always generate all three layers. This is what separates a design system from a stylesheet.

## Inputs

Gather:
1. **Brand color** — one primary color (hex) to seed the palette from. Everything else derives from it.
2. **Personality** — choose one: `neutral`, `vibrant`, `earthy`, `monochrome`, `playful`
3. **Dark mode?** — yes / no / auto (generates both and auto-switches via `prefers-color-scheme`)
4. **Component variants** — list components to generate variants for (button, badge, input, card, alert)
5. **Output format** — `json` (always), plus any of: `tailwind`, `css-variables`, `figma-tokens`
6. **Border radius style** — `sharp` (0), `soft` (4–8px), `round` (12–16px), `pill` (9999px)
7. **Font stack** — provide font names or accept defaults

## Workflow

### 1. Generate the primitive palette

From the seed color, generate a 10-step scale (50–950) using OKLCH color space math (or approximate with HSL):

```
50:  95% lightness
100: 90%
200: 80%
300: 70%
400: 60%
500: seed color
600: 45%
700: 35%
800: 25%
900: 15%
950: 8%
```

Generate supporting neutrals (gray), and auto-derive semantic colors:
- Success: green-hued, same saturation family
- Warning: amber
- Error: red
- Info: blue or teal depending on primary hue

### 2. Build semantic tokens

```json
{
  "semantic": {
    "light": {
      "color": {
        "bg": {
          "primary":   "<neutral-50>",
          "secondary": "<neutral-100>",
          "elevated":  "#ffffff",
          "overlay":   "rgba(0,0,0,0.5)"
        },
        "text": {
          "primary":   "<neutral-900>",
          "secondary": "<neutral-600>",
          "disabled":  "<neutral-400>",
          "inverse":   "#ffffff",
          "link":      "<brand-600>",
          "link-hover":"<brand-700>"
        },
        "brand": {
          "primary":   "<brand-600>",
          "hover":     "<brand-700>",
          "active":    "<brand-800>",
          "subtle":    "<brand-50>",
          "subtle-text":"<brand-700>"
        },
        "border": {
          "default":   "<neutral-200>",
          "strong":    "<neutral-300>",
          "focus":     "<brand-500>"
        },
        "feedback": {
          "success-bg":   "<green-50>",
          "success-text": "<green-700>",
          "success-border":"<green-200>",
          "warning-bg":   "<amber-50>",
          "warning-text": "<amber-700>",
          "warning-border":"<amber-200>",
          "error-bg":     "<red-50>",
          "error-text":   "<red-700>",
          "error-border": "<red-200>",
          "info-bg":      "<blue-50>",
          "info-text":    "<blue-700>",
          "info-border":  "<blue-200>"
        }
      }
    },
    "dark": {
      "color": {
        "bg": {
          "primary":   "<neutral-950>",
          "secondary": "<neutral-900>",
          "elevated":  "<neutral-800>",
          "overlay":   "rgba(0,0,0,0.7)"
        },
        "text": {
          "primary":   "<neutral-50>",
          "secondary": "<neutral-400>",
          "disabled":  "<neutral-600>",
          "inverse":   "<neutral-950>",
          "link":      "<brand-400>",
          "link-hover":"<brand-300>"
        }
      }
    }
  }
}
```

### 3. Generate component tokens

For each requested component:

**Button:**
```json
{
  "button": {
    "primary": {
      "bg":         "var(--color-brand-primary)",
      "bg-hover":   "var(--color-brand-hover)",
      "bg-active":  "var(--color-brand-active)",
      "bg-disabled":"var(--color-text-disabled)",
      "text":       "var(--color-text-inverse)",
      "border":     "transparent",
      "radius":     "<border-radius>",
      "padding-x":  "var(--space-4)",
      "padding-y":  "var(--space-2)",
      "font-size":  "var(--text-sm)",
      "font-weight":"600"
    },
    "secondary": { ... },
    "ghost": { ... },
    "destructive": { ... }
  }
}
```

**Badge:**
```json
{
  "badge": {
    "success": { "bg": "var(--color-feedback-success-bg)", "text": "var(--color-feedback-success-text)", "border": "var(--color-feedback-success-border)" },
    "warning": { ... },
    "error": { ... },
    "info": { ... },
    "neutral": { ... }
  }
}
```

### 4. Generate Tailwind config (if requested)

```javascript
// tailwind.config.js — auto-generated by theme-factory
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#...",
          // ... 10 steps
          950: "#...",
        },
      },
      borderRadius: {
        DEFAULT: "8px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
};
```

### 5. Generate CSS variables (if requested)

```css
/* theme.css — auto-generated by theme-factory */
:root {
  /* Primitives */
  --brand-50: #eef2ff;
  --brand-500: #6366f1;
  /* ... */

  /* Semantic — light mode defaults */
  --color-bg-primary: var(--neutral-50);
  --color-text-primary: var(--neutral-900);
  /* ... */
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg-primary: var(--neutral-950);
    --color-text-primary: var(--neutral-50);
    /* ... */
  }
}

[data-theme="dark"] {
  --color-bg-primary: var(--neutral-950);
  /* ... */
}
```

### 6. Write output files

```bash
mkdir -p .claude/theme
# Always write JSON
cat > .claude/theme/theme.json << 'EOF'
{ ... complete theme object ... }
EOF

# Conditionally write other formats
cat > tailwind.config.js << 'EOF' ... EOF        # if tailwind requested
cat > src/styles/theme.css << 'EOF' ... EOF      # if css-variables requested
```

### 7. Validate

- [ ] All semantic tokens reference a primitive token (no orphaned hex values)
- [ ] Dark mode tokens are complete (every light token has a dark counterpart)
- [ ] All component variants reference semantic tokens (not primitives)
- [ ] Body text contrast ≥ 4.5:1 in both modes
- [ ] Brand text on brand background ≥ 4.5:1

## Output Format

```
Theme Generated: <name>
Personality: <personality>  Modes: <light|dark|both>
Primary: <hex> → <N>-step scale
Neutrals: <N>-step gray scale
Semantic tokens: <N> defined
Component variants: <list>

Files written:
  .claude/theme/theme.json        (complete theme)
  tailwind.config.js              (if requested)
  src/styles/theme.css            (if requested)

Contrast checks:
  Body text (light): <ratio>:1 ✅
  Body text (dark):  <ratio>:1 ✅
  Brand on white:    <ratio>:1 ✅ | ⚠️ <ratio>:1 — adjusted to <new-hex>
```

## Wrap Up

Deliver the JSON first. Then offer to: (1) generate the Tailwind/CSS export, (2) apply the theme to existing components, (3) register it as the project's brand in `.claude/brand.json` via the `brand-guidelines` skill.
