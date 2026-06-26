---
name: algorithmic-art
description: "Generates parameterized generative art as SVG or HTML Canvas — fractals, noise fields, geometric patterns, and abstract compositions — with controllable seeds and parameters. Use when asked to 'generate art', 'create generative graphics', 'make a pattern', 'create SVG art', 'make algorithmic art', or 'generate a visual background'. Output is self-contained HTML or SVG."
---

# Algorithmic Art — Generative SVG/Canvas Art with Parameterized Seeds

You create parameterized generative art — fractals, Perlin noise fields, L-systems, geometric grids, reaction-diffusion simulations — as self-contained HTML files or SVG documents. Every piece is seeded and reproducible.

## Context

The golden rule: **every parameter is configurable at the top of the file**. The user should be able to change the seed number and get a completely different piece. Change the color palette variable and get a new color scheme. This is what separates generative art from one-off drawings.

## Styles Available

| Style | Description | Best for |
|-------|-------------|----------|
| `noise-field` | Perlin/simplex noise flow field | Organic backgrounds, hero images |
| `fractal-tree` | Recursive branching L-system | Profile illustrations, landing pages |
| `voronoi` | Voronoi diagram with colored cells | Mesh backgrounds, data art |
| `circle-pack` | Recursive circle packing | Infographic backdrops |
| `grid-variation` | Mondrian-style geometric grid | Brand art, card backgrounds |
| `reaction-diffusion` | Turing pattern simulation | Organic textures |
| `spiral` | Parametric spiral with variations | Icons, logos, decorations |
| `truchet` | Truchet tile tessellation | Pattern fills, wallpapers |

## Inputs

1. **Style** — which algorithm (or "surprise me" to auto-pick)
2. **Seed** — any integer; same seed = same output (default: random)
3. **Color palette** — hex list or named palette (`earth`, `neon`, `pastel`, `monochrome`, `brand`)
4. **Canvas size** — `800x800`, `1920x1080`, `400x400` (default: `800x600`)
5. **Output format** — `html` (interactive, animatable) or `svg` (static, scalable)
6. **Animate?** — yes (canvas) / no (both)
7. **Export?** — PNG download button included?

## Core Building Blocks

### Seeded PRNG

Every piece uses a seeded pseudo-random number generator so results are reproducible:

```javascript
// Mulberry32 — fast, good distribution, seed-reproducible
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const SEED = 42; // ← change this
const rng = mulberry32(SEED);
const rand = () => rng();
const randRange = (min, max) => min + rand() * (max - min);
const randInt = (min, max) => Math.floor(randRange(min, max));
const randChoice = (arr) => arr[randInt(0, arr.length)];
```

### Color Palettes

```javascript
const PALETTES = {
  earth:       ['#8B4513','#D2691E','#CD853F','#DEB887','#F5DEB3','#FFDEAD'],
  neon:        ['#ff00ff','#00ffff','#ffff00','#ff6600','#00ff66'],
  pastel:      ['#FFB3BA','#FFDFBA','#FFFFBA','#BAFFC9','#BAE1FF'],
  monochrome:  ['#0d0d0d','#1a1a1a','#333','#666','#999','#ccc','#f0f0f0'],
  brand:       [], // populate from brand.json
  sunset:      ['#ff6b6b','#feca57','#ff9f43','#ee5a24','#c0392b'],
  ocean:       ['#0077b6','#0096c7','#00b4d8','#48cae4','#90e0ef','#caf0f8'],
};

const PALETTE = PALETTES['earth']; // ← change this
```

### Noise Field Template

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Noise Field</title>
  <style>body{margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh;}</style>
</head>
<body>
<canvas id="c"></canvas>
<script>
// ── PARAMETERS ──────────────────────────────────────────────────────────────
const SEED     = 42;
const W        = 800;
const H        = 600;
const PALETTE  = ['#264653','#2a9d8f','#e9c46a','#f4a261','#e76f51'];
const STEP     = 6;        // grid resolution
const SCALE    = 0.003;    // noise frequency
const SPEED    = 0.005;    // animation speed (0 = static)
const ALPHA    = 0.03;     // trail opacity (lower = longer trails)
// ────────────────────────────────────────────────────────────────────────────

const canvas = document.getElementById('c');
canvas.width = W; canvas.height = H;
const ctx = canvas.getContext('2d');

function mulberry32(s) {
  return () => { s|=0; s=s+0x6D2B79F5|0; let t=Math.imul(s^s>>>15,1|s); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
}
const rng = mulberry32(SEED);
const rand = () => rng();

// Simple noise via hashing (replace with proper Perlin for smoother results)
function noise(x, y, z=0) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

const particles = Array.from({length: 2000}, () => ({
  x: rand() * W, y: rand() * H,
  color: PALETTE[Math.floor(rand() * PALETTE.length)]
}));

let t = 0;
function frame() {
  ctx.fillStyle = `rgba(0,0,0,${ALPHA})`;
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => {
    const angle = noise(p.x * SCALE, p.y * SCALE, t) * Math.PI * 4;
    p.x += Math.cos(angle) * 2;
    p.y += Math.sin(angle) * 2;
    if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) {
      p.x = rand() * W; p.y = rand() * H;
    }
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 2, 2);
  });

  t += SPEED;
  requestAnimationFrame(frame);
}
frame();
</script>
</body>
</html>
```

## Workflow

### 1. Clarify parameters

Confirm (or auto-pick): style, seed, palette, size, animate, export button.

### 2. Build the file

Create `.claude/art/<seed>-<style>.html`. Structure:
1. Canvas setup
2. `// ── PARAMETERS ──` block at the top — ALL configurable values here
3. PRNG setup
4. Core algorithm
5. Draw/animation loop
6. (Optional) PNG export button

### 3. Add export button (if requested)

```html
<button onclick="exportPNG()" style="position:fixed;bottom:20px;right:20px;padding:8px 16px;background:#fff;border:none;cursor:pointer;border-radius:4px;font-size:14px">Export PNG</button>
<script>
function exportPNG() {
  const link = document.createElement('a');
  link.download = 'art-seed-42.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
</script>
```

### 4. Preview

Provide the open command. For static SVG, output the SVG inline so it's visible in the chat.

## Output Format

Write the full HTML to `.claude/art/<seed>-<style>.html` and tell the user:

```
Art generated: <style>
Seed: <N>  Palette: <name>  Size: <WxH>  Animated: yes/no

Preview: open .claude/art/<N>-<style>.html
Change seed: edit SEED constant at the top of the file
Change palette: edit PALETTE constant

Files: .claude/art/<N>-<style>.html
```

## Wrap Up

These are ephemeral files by default — add `.claude/art/` to `.gitignore` unless the user wants to version them. If they want to use the art as a website background or UI element, offer to convert it to a reusable component.
