---
name: brand-guidelines
description: "Applies a project's brand identity — colors, typography, logo rules, voice and tone, approved imagery — to any artifact Claude generates, including UI, docs, slides, emails, and code comments. Use when asked to 'apply brand guidelines', 'make this on-brand', 'follow our style guide', 'use our brand colors', or 'write in our voice'. Requires a brand definition file or will prompt to create one."
---

# Brand Guidelines — Your Style Guide as a Skill

You ensure every artifact Claude produces — UI components, documentation, marketing copy, emails, slide decks — adheres to the project's brand identity. If a brand definition file exists, you load it. If not, you guide the user through creating one.

## Context

Brand consistency is enforced through a single source of truth: `.claude/brand.json`. This file is the brand definition. Every artifact generated in this session references it. Without it, brand enforcement is impossible — create it first.

## Inputs

Check for `.claude/brand.json`. If it exists, load it and proceed. If not, collect:

1. **Visual Identity**
   - Primary color (hex) and its name
   - Secondary/accent colors (up to 3)
   - Background palette (light and dark mode if applicable)
   - Text colors (primary, secondary, muted)
   - Error, warning, success colors
   - Typography: heading font name + fallback, body font name + fallback
   - Logo: file path(s) in repo, minimum clear space, dark/light variants

2. **Voice & Tone**
   - Brand personality (3–5 adjectives: "direct", "warm", "technical", "playful")
   - Audience: who reads this content?
   - Formality: formal / semi-formal / casual
   - What to say (approved phrases, taglines, product names)
   - What NOT to say (competitor names, forbidden terms, jargon to avoid)
   - Sentence length preference: short punchy / medium / long flowing

3. **Typography Rules**
   - Heading case: Title Case / Sentence case / ALL CAPS
   - Callout/emphasis style: bold / italic / colored / boxed
   - Max line length for body text

4. **Imagery & Illustration Style** (optional)
   - Photography style (lifestyle / product / abstract)
   - Illustration style (flat / 3D / isometric / hand-drawn)
   - Approved image sources or libraries

5. **Layout Conventions**
   - Preferred border-radius: sharp (0px) / soft (4–8px) / round (16px+)
   - Shadow style: none / subtle / pronounced
   - Border usage: hairline / medium / none

## Workflow

### 1. Load or create brand definition

```bash
cat .claude/brand.json 2>/dev/null || echo "No brand file found"
```

If no brand file: collect answers to the Inputs above (ask one category at a time, don't dump all questions at once), then write `.claude/brand.json`.

Brand definition schema:

```json
{
  "name": "Acme Corp",
  "colors": {
    "primary": { "hex": "#4f46e5", "name": "Indigo" },
    "secondary": { "hex": "#0ea5e9", "name": "Sky" },
    "accent": { "hex": "#f59e0b", "name": "Amber" },
    "bg": {
      "primary": "#ffffff",
      "secondary": "#f9fafb",
      "dark": "#111827"
    },
    "text": {
      "primary": "#111827",
      "secondary": "#6b7280",
      "inverse": "#ffffff"
    },
    "feedback": {
      "success": "#16a34a",
      "warning": "#d97706",
      "error": "#dc2626"
    }
  },
  "typography": {
    "heading": { "family": "Inter", "fallback": "sans-serif", "weight": 700 },
    "body": { "family": "Inter", "fallback": "sans-serif", "weight": 400 },
    "mono": { "family": "JetBrains Mono", "fallback": "monospace" },
    "headingCase": "sentence",
    "maxLineLength": "65ch"
  },
  "logo": {
    "light": "assets/logo-dark.svg",
    "dark": "assets/logo-light.svg",
    "minClearSpace": "16px",
    "doNot": ["stretch", "rotate", "recolor", "add-shadow"]
  },
  "voice": {
    "personality": ["direct", "knowledgeable", "warm"],
    "formality": "semi-formal",
    "audience": "developers and product teams",
    "approvedTerms": ["platform", "workspace", "compose"],
    "forbiddenTerms": ["simply", "just", "easy", "revolutionary"],
    "sentenceLength": "medium",
    "punctuation": "oxford-comma-yes"
  },
  "layout": {
    "borderRadius": "8px",
    "shadows": "subtle",
    "borders": "hairline"
  }
}
```

### 2. Generate CSS/Tailwind tokens from brand

If the project uses CSS or Tailwind, write the brand as tokens:

```bash
cat > .claude/brand-tokens.css << 'EOF'
/* Auto-generated from .claude/brand.json — do not edit by hand */
:root {
  --brand-primary: /* primary.hex */;
  --brand-secondary: /* secondary.hex */;
  /* ... */
}
EOF
```

### 3. Apply brand to the requested artifact

**For UI components:** Use brand color tokens, heading/body fonts, border-radius, and shadow settings from the brand file. Verify all text meets WCAG AA contrast against brand backgrounds.

**For written content:** Adopt the voice settings — match formality, sentence length, and approved vocabulary. Replace any forbidden terms. Apply heading case rule.

**For documentation:** Use the heading font for titles, body font for prose. Follow Oxford comma setting. Use brand color for callout/highlight boxes.

**For emails/Slack:** Subject line uses heading case rule. Opening tone matches personality. Sign-off aligns with formality level.

**For slides/decks:** Logo placement in approved corner with clear space respected. Brand color palette for backgrounds and accent. Typography as defined.

### 4. Brand compliance check

Before delivering any artifact, run through:
- [ ] All colors reference brand tokens (no raw hex values)
- [ ] No forbidden terms in copy
- [ ] Heading case applied correctly
- [ ] Logo used correctly (if present)
- [ ] Font families match brand spec
- [ ] Tone matches personality adjectives
- [ ] Contrast ratios valid against brand backgrounds

### 5. Update brand definition (if new decisions were made)

If the user approved a new color, phrase, or layout rule during this session, update `.claude/brand.json` and commit:

```bash
git add .claude/brand.json
git commit -m "brand: update guidelines with [what changed]"
```

## Output Format

At the start of any artifact generation, confirm:
```
Applying brand: <name>
Primary: <color> (<name>)  Typography: <heading-font> / <body-font>
Voice: <personality list>  Formality: <level>
```

Then produce the artifact. At the end:
```
Brand compliance: ✅ All checks passed | ⚠️ Issues: <list>
```

## Wrap Up

Remind the user that `.claude/brand.json` should be committed to the repo so that all future sessions use the same brand definition. Suggest running the `frontend-design` skill after brand application for spacing and layout polish.
