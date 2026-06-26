---
name: canvas-design
description: "Creates polished HTML5 Canvas compositions for marketing assets — banners, social cards, OG images, email headers, and product screenshots — as self-contained HTML files with PNG export. Use when asked to 'make a banner', 'create an OG image', 'design a social card', 'build a marketing asset', 'create a cover image', or 'make a product screenshot frame'."
---

# Canvas Design — HTML5 Canvas Compositions for Marketing Assets

You create polished, export-ready marketing assets using HTML5 Canvas: social cards, OG images, banners, email headers, and product screenshot frames. Output is a self-contained HTML file with a one-click PNG export button. No design software required.

## Standard Asset Sizes

| Asset | Width | Height | Use |
|-------|-------|--------|-----|
| OG Image | 1200 | 630 | Social sharing, link previews |
| Twitter Card | 1200 | 628 | Twitter/X link cards |
| LinkedIn Post | 1200 | 627 | LinkedIn shares |
| Instagram Square | 1080 | 1080 | Instagram posts |
| Instagram Story | 1080 | 1920 | Instagram/Snapchat stories |
| Email Header | 600 | 200 | Email newsletters |
| YouTube Thumbnail | 1280 | 720 | YouTube video covers |
| GitHub Social | 1280 | 640 | GitHub repo social card |

## Inputs

1. **Asset type** — which size (or custom WxH)
2. **Content** — headline, subline, body text, CTA text
3. **Brand colors** — from `.claude/brand.json` or user-provided
4. **Background style** — solid / gradient / mesh-gradient / image (URL)
5. **Logo?** — path or URL
6. **Layout** — centered / left-aligned / split (text left, graphic right)
7. **Visual accent** — none / geometric shape / icon / illustration

## Design Principles Applied

- **Visual hierarchy:** Headline 2.5× body size; max 2 font weights
- **Padding:** Minimum 10% of canvas width on each side
- **Contrast:** All text WCAG AA against background
- **Focus:** One primary message per asset — no more than 3 text elements
- **Breathing room:** ≥16px gap between every element

## Template: OG Image (1200×630)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>OG Image Builder</title>
  <style>
    body { margin: 0; background: #1a1a1a; display: flex; flex-direction: column; align-items: center; padding: 24px; gap: 16px; }
    canvas { box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
    button { padding: 10px 24px; background: #4f46e5; color: #fff; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; }
  </style>
</head>
<body>
<canvas id="c" width="1200" height="630"></canvas>
<button onclick="exportPNG()">Download PNG</button>
<script>
// ── PARAMETERS ──────────────────────────────────────────────────────────────
const HEADLINE     = 'Your Headline Here';
const SUBLINE      = 'Supporting message in one sentence';
const CTA          = 'Get Started →';
const BG_START     = '#0f0c29';   // gradient start
const BG_END       = '#302b63';   // gradient end
const ACCENT       = '#4f46e5';   // brand color
const TEXT_PRIMARY = '#ffffff';
const TEXT_SECOND  = 'rgba(255,255,255,0.75)';
const FONT         = 'system-ui, -apple-system, sans-serif';
// ────────────────────────────────────────────────────────────────────────────

const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const PAD = W * 0.08; // 8% padding

function draw() {
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, BG_START);
  grad.addColorStop(1, BG_END);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Accent geometric shape (top-right circle)
  ctx.beginPath();
  ctx.arc(W - 100, 0, 300, 0, Math.PI * 2);
  ctx.fillStyle = `${ACCENT}22`;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(W - 50, 50, 180, 0, Math.PI * 2);
  ctx.fillStyle = `${ACCENT}33`;
  ctx.fill();

  // Accent bar (left edge)
  ctx.fillStyle = ACCENT;
  ctx.fillRect(PAD * 0.6, H * 0.2, 6, H * 0.6);

  const textX = PAD;
  let y = H * 0.3;

  // Headline
  ctx.fillStyle = TEXT_PRIMARY;
  ctx.font = `bold 72px ${FONT}`;
  ctx.textBaseline = 'top';

  // Word-wrap headline
  const words = HEADLINE.split(' ');
  let line = '';
  const maxW = W - PAD * 2 - 60;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, textX, y);
      y += 84;
      line = word;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, textX, y);
  y += 84 + 24;

  // Subline
  ctx.font = `400 32px ${FONT}`;
  ctx.fillStyle = TEXT_SECOND;
  ctx.fillText(SUBLINE, textX, y);
  y += 48 + 40;

  // CTA pill
  const ctaMetrics = ctx.measureText(CTA);
  const ctaW = ctaMetrics.width + 48;
  const ctaH = 56;
  ctx.fillStyle = ACCENT;
  roundRect(ctx, textX, y, ctaW, ctaH, 28);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 24px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillText(CTA, textX + 24, y + ctaH / 2);

  // Bottom metadata bar
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fillRect(0, H - 80, W, 80);
  ctx.fillStyle = TEXT_SECOND;
  ctx.font = `400 20px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('yourcompany.com', PAD, H - 40);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function exportPNG() {
  const link = document.createElement('a');
  link.download = 'og-image.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}

draw();
</script>
</body>
</html>
```

## Workflow

### 1. Gather content and brand

Load `.claude/brand.json` for colors/fonts if it exists. Collect headline, subline, CTA, asset type.

### 2. Select layout

- **Centered:** Great for symmetric, bold statements
- **Left-aligned:** More readable for longer text; accent on right
- **Split:** Product screenshot or icon on right half; text on left

### 3. Build the canvas composition

Fill the template with the actual content. Adjust:
- Font sizes relative to canvas size
- Text wrapping based on measured text width
- Color tokens from brand guidelines
- Geometric accents matching brand personality

### 4. Handle fonts (if custom)

```javascript
// Load Google Font or local font before drawing
const font = new FontFace('Inter', 'url(https://fonts.gstatic.com/s/inter/...)');
await font.load();
document.fonts.add(font);
draw(); // now safe to use
```

### 5. Write file and provide export

```bash
mkdir -p .claude/assets
# Write HTML file
```

## Output Format

```
Asset created: <type> (<WxH>)
Headline: "<text>"
Colors: <bg> → <accent>
Layout: <layout>

Preview: open .claude/assets/<name>.html
Export: click "Download PNG" button in the browser

File: .claude/assets/<name>.html
```

## Wrap Up

Deliver the HTML file. Note that custom fonts require an internet connection in the browser to load from CDN. Offer to apply brand guidelines from `.claude/brand.json` if not already done. These files belong in `.claude/assets/` which should typically be gitignored unless the user wants to version them.
