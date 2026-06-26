---
name: slack-gif-creator
description: "Generates short, on-message animated GIFs for Slack reactions, celebrates, and team moments — as self-contained HTML Canvas animations exportable to GIF. Use when asked to 'make a slack gif', 'create a reaction gif', 'animate this for Slack', 'make a celebration gif', or 'generate a team gif'. Outputs a standalone HTML file that runs in browser and instructions to export."
---

# Slack GIF Creator — The Unserious Pick That Earns Its Spot

You generate short animated GIFs for Slack — celebrations, reactions, countdowns, announcements. The output is a self-contained HTML Canvas animation the user can preview in a browser, then export to GIF using a simple tool. Narrow scope, high morale ROI.

## Context

Browser-based canvas animations are the most reliable cross-platform approach. The output is:
1. A single `.html` file with embedded JavaScript animation
2. Instructions to export to `.gif` using `ScreenToGif`, `Gifski`, or browser recording
3. Optionally: an ffmpeg command if the user has it installed

**Constraint:** Keep animations under 3 seconds, under 480×480px, and under 8 frames/sec for Slack compatibility. Slack auto-plays GIFs on hover and loops them.

## Inputs

Ask:
1. **Message/theme** — what is the GIF about? ("deploy success", "welcome new hire Sarah", "Friday vibes", "bug squashed", "we shipped it")
2. **Style** — choose one: `emoji-party` / `text-burst` / `pixel-bounce` / `confetti` / `countdown` / `fire` / `typewriter`
3. **Text to display** — short phrase (≤20 chars), or none
4. **Color palette** — brand colors, team color, or auto-pick based on theme
5. **Size** — `240x240` (reaction) / `320x240` (banner) / `480x480` (large) — default: 320x240
6. **Duration** — 1s / 2s / 3s — default: 2s

## Style Templates

### `emoji-party`
Rain of emoji from top with bounce. Best for celebrations.

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Slack GIF — Emoji Party</title>
  <style>
    body { margin: 0; background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
    canvas { border: 1px solid #333; }
  </style>
</head>
<body>
<canvas id="c" width="320" height="240"></canvas>
<script>
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const EMOJIS = ['🎉','🎊','✨','🚀','🌟','💯','🎈'];
const DURATION = 2000; // ms
const FPS = 8;
const particles = Array.from({ length: 20 }, () => ({
  x: Math.random() * W,
  y: Math.random() * -H,
  vy: 2 + Math.random() * 3,
  emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
  size: 20 + Math.random() * 16,
}));

let start = null;
function draw(ts) {
  if (!start) start = ts;
  const elapsed = ts - start;
  if (elapsed > DURATION) { start = ts; }

  ctx.fillStyle = '#1a1d21'; // Slack dark bg
  ctx.fillRect(0, 0, W, H);

  ctx.font = `bold 28px sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('MESSAGE_HERE', W / 2, H * 0.72);

  particles.forEach(p => {
    p.y += p.vy;
    if (p.y > H + 30) p.y = -30;
    ctx.font = `${p.size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(p.emoji, p.x, p.y);
  });

  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
</script>
</body>
</html>
```

### `confetti`
Colored confetti squares falling with rotation. Best for ship/deploy moments.

```javascript
// Confetti particle system
const confetti = Array.from({ length: 60 }, () => ({
  x: Math.random() * W,
  y: Math.random() * -H,
  vx: (Math.random() - 0.5) * 2,
  vy: 2 + Math.random() * 3,
  rot: Math.random() * Math.PI * 2,
  vrot: (Math.random() - 0.5) * 0.15,
  w: 6 + Math.random() * 8,
  h: 4 + Math.random() * 6,
  color: ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#c77dff'][Math.floor(Math.random() * 5)],
}));
```

### `text-burst`
Text scales from 0→1 with a color pulse. Best for short announcements.

```javascript
// Text burst: scale from 0 to 1 with ease-out
const t = elapsed / DURATION; // 0→1
const scale = 1 - Math.pow(1 - t, 3); // ease-out-cubic
ctx.save();
ctx.translate(W / 2, H / 2);
ctx.scale(scale, scale);
ctx.fillStyle = `hsl(${t * 60}, 90%, 60%)`;
ctx.font = 'bold 36px sans-serif';
ctx.textAlign = 'center';
ctx.fillText('WE SHIPPED IT', 0, 0);
ctx.restore();
```

### `countdown`
3 → 2 → 1 → GO! with color transitions. Best for launches.

```javascript
const frames = ['3', '2', '1', '🚀'];
const frameIdx = Math.floor((elapsed / DURATION) * frames.length);
const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff'];
ctx.fillStyle = colors[frameIdx % colors.length];
ctx.font = 'bold 80px sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(frames[Math.min(frameIdx, frames.length - 1)], W / 2, H / 2);
```

### `typewriter`
Text appears character by character. Best for announcements or quotes.

```javascript
const fullText = 'MESSAGE_HERE';
const charsShown = Math.floor((elapsed / DURATION) * fullText.length);
const displayText = fullText.slice(0, charsShown) + (charsShown < fullText.length ? '|' : '');
ctx.font = 'bold 24px monospace';
ctx.fillStyle = '#00ff41'; // matrix green or brand color
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText(displayText, W / 2, H / 2);
```

## Workflow

### 1. Clarify the brief

Confirm style, text, colors, size, duration. If the theme is obvious (e.g., "bug squashed"), pick the style automatically (`emoji-party` with 🐛💥) and inform the user.

### 2. Build the HTML file

Create the full self-contained HTML file at `.claude/slack-gifs/<name>.html`:

```bash
mkdir -p .claude/slack-gifs
```

Choose the matching style template, fill in:
- `MESSAGE_HERE` → user's text
- Colors → brand or auto-picked
- Canvas size → per input
- Emoji set → matching the theme
- Duration constant

### 3. Preview instructions

```
Open in browser:
  open .claude/slack-gifs/<name>.html     # macOS
  xdg-open .claude/slack-gifs/<name>.html # Linux
  start .claude/slack-gifs/<name>.html    # Windows
```

### 4. Export to GIF

Provide the user with export options (in order of ease):

**Option A — ScreenToGif (Windows, free):**
> Open ScreenToGif → Recorder → point at the canvas → record 2–3 loops → edit → Save as GIF

**Option B — Browser built-in (Chrome DevTools):**
> DevTools → More tools → Rendering → FPS meter ON; then use browser's screen recording via `MediaRecorder` API, or Screencastify extension

**Option C — ffmpeg (if available):**
```bash
# First record the screen, then:
ffmpeg -i recording.mp4 -vf "fps=8,scale=320:-1:flags=lanczos,palettegen" palette.png
ffmpeg -i recording.mp4 -i palette.png -vf "fps=8,scale=320:-1:flags=lanczos,paletteuse" output.gif
```

**Option D — Inline GIF generator (advanced):**
Add gif.js to the HTML to encode frames directly in browser:
```html
<script src="https://unpkg.com/gif.js/dist/gif.js"></script>
```

### 5. Upload to Slack

In Slack: press `+` → Upload file → select `.gif` file → or drag directly into compose box.

For custom emoji: Slack Settings → Customize → Emoji → Add Custom Emoji → upload GIF (max 128KB, max 128×128px for emoji).

## Output Format

Deliver the HTML file contents inline (for the user to copy) AND write it to `.claude/slack-gifs/<name>.html`. Then:

```
GIF created: <name>
Style: <style>  Size: <WxH>  Duration: <N>s  FPS: 8

Preview: open .claude/slack-gifs/<name>.html in your browser.
Export: [ScreenToGif | ffmpeg command | browser recording]

Slack emoji size tip: for custom emoji, resize to 128x128 and keep under 128KB.
```

## Wrap Up

These files are intentionally ephemeral — `.claude/slack-gifs/` is typically gitignored. Ask if the user wants to add it to `.gitignore`. Do not commit GIF files unless explicitly asked.
