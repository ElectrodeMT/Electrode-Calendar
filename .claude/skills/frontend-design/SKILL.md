---
name: frontend-design
description: "Applies principled spacing, typography, layout, and color decisions to frontend code so the result looks intentional and professional, not AI-generated. Use when asked to 'design a UI', 'make this look better', 'apply design principles', 'style this component', 'improve the layout', or 'make this accessible'. Pairs with theme-factory and brand-guidelines."
---

# Frontend Design — Designs That Don't Look AI-Generated

You apply a concrete set of spacing, typography, layout, and color principles to produce UI that looks intentional, consistent, and accessible. You avoid vibe-coding and instead enforce measurable design decisions.

## Core Principles

### 1. Spacing — Use a Scale, Not Random Numbers

All spacing values must come from an 8-point base grid. Acceptable values: `4, 8, 12, 16, 24, 32, 48, 64, 96px` (or their rem equivalents).

Never write `margin: 13px` or `padding: 22px`. If a value doesn't land on the scale, round to the nearest step.

In Tailwind: `p-2 p-3 p-4 p-6 p-8 p-12 p-16 p-24` (2=8px, 3=12px, 4=16px, etc.)
In CSS variables:
```css
:root {
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-6: 24px;  --space-8: 32px;
  --space-12: 48px; --space-16: 64px; --space-24: 96px;
}
```

### 2. Typography — 3 Sizes Maximum per Screen

Pick a type scale and stick to it. A reliable scale for most UIs:

| Role       | Size     | Weight | Line Height |
|------------|----------|--------|-------------|
| Display    | 2.25rem  | 700    | 1.15        |
| Heading    | 1.5rem   | 600    | 1.25        |
| Subheading | 1.125rem | 600    | 1.3         |
| Body       | 1rem     | 400    | 1.6         |
| Small      | 0.875rem | 400    | 1.5         |
| Caption    | 0.75rem  | 500    | 1.4         |

Rules:
- Body text line height must be ≥1.5 for readability
- Never use more than 2 font families
- All text in the same semantic role must use the same size — no "this heading is slightly bigger because it felt right"
- Measure (line length) between 45–75 characters for body text → use `max-width: 65ch`

### 3. Color — Semantic Tokens, Not Hex Values in Components

Components must never reference a raw hex value. Every color must go through a semantic token:

```css
:root {
  /* Surface */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-bg-elevated: #ffffff;

  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-disabled: #9ca3af;
  --color-text-inverse: #ffffff;

  /* Brand */
  --color-brand-primary: #4f46e5;
  --color-brand-hover: #4338ca;
  --color-brand-subtle: #eef2ff;

  /* Feedback */
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #2563eb;

  /* Border */
  --color-border-default: #e5e7eb;
  --color-border-strong: #d1d5db;
}
```

### 4. Accessible Color Contrast

Before finalizing any color pairing, check WCAG 2.1 AA compliance:
- Normal text (< 18px): contrast ratio ≥ 4.5:1
- Large text (≥ 18px or ≥ 14px bold): contrast ratio ≥ 3:1
- UI components and icons: contrast ratio ≥ 3:1

Quick reference for common pairings:
- `#111827` on `#ffffff` → 16.1:1 ✅ AAA
- `#6b7280` on `#ffffff` → 5.9:1 ✅ AA
- `#9ca3af` on `#ffffff` → 3.0:1 ⚠️ Fails AA for body text
- `#ffffff` on `#4f46e5` → 7.1:1 ✅ AAA

Never use color as the only signal (error state, selection, etc.) — always pair with an icon or text label.

### 5. Layout — Structure Before Style

Use CSS Grid for two-dimensional layout, Flexbox for one-dimensional alignment.

```css
/* Page shell */
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  grid-template-rows: 64px 1fr;
  min-height: 100vh;
}

/* Component alignment */
.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
```

Rules:
- Every clickable target must be ≥ 44×44px (mobile) / ≥ 32×32px (desktop)
- No absolute positioning unless unavoidable (tooltips, dropdowns, modals)
- Responsive breakpoints: sm=640px, md=768px, lg=1024px, xl=1280px

### 6. Elevation & Depth — 3 Levels Maximum

```css
:root {
  --shadow-sm:  0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md:  0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg:  0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
```

Use `sm` for cards/inputs, `md` for dropdowns/popovers, `lg` for modals/dialogs. Never create custom shadows.

## Workflow

### 1. Audit existing styles

Before writing a single line of CSS, read the current styles:
- What values are currently used? List all unique spacing values, colors, font sizes.
- Which are off-scale or inconsistent? Flag them.

### 2. Define or adopt a token set

If no design system exists, generate one now using the templates in the Core Principles section. If Tailwind is present, map tokens to Tailwind's `theme.extend` in `tailwind.config.js`.

### 3. Apply the changes

Work through the component:
1. Replace off-scale spacing with scale values
2. Replace raw hex colors with semantic token references
3. Normalize typography to the type scale
4. Verify contrast ratios for all text/background pairings
5. Add missing `min-height`/`min-width` on interactive elements
6. Check mobile layout at 375px width

### 4. Verify

Check each principle has been applied:
- [ ] All spacing on 8-point grid
- [ ] ≤3 font sizes per screen
- [ ] No raw hex in component files
- [ ] All body text contrast ≥ 4.5:1
- [ ] All interactive targets ≥ 44px on mobile
- [ ] Layout uses Grid/Flex appropriately

## Output Format

After applying design changes, produce:

```
Design Audit & Changes
======================
Spacing: Fixed <N> off-scale values
Typography: Normalized to <N> sizes
Color: Replaced <N> raw values with tokens
Contrast: <N> pairs checked — all pass | <N> failures fixed
Layout: <description of grid/flex structure>

Accessibility: ✅ All text meets WCAG AA | ⚠️ Issues: <list>
```

## Wrap Up

Do not commit unless asked. Preview the design by running the dev server if available. Note which `brand-guidelines` settings would need to be applied on top (colors, fonts, logo usage).
