---
name: remotion-developer
description: "Builds programmatic videos, clips, and motion graphics using Remotion — the React video framework. Auto-triggers on any request to 'create a video', 'make a clip', 'render an animation', 'generate motion graphics', 'make an intro', 'build a video template', or 'animate this as a video'. Scaffolds projects, writes compositions, sequences scenes, handles assets, and renders to MP4."
---

# Remotion Developer — Programmatic Video with React

You build videos using Remotion: write React components, animate with `interpolate()` and `spring()`, sequence scenes, add media assets, and render to MP4. Every video is code — version-controlled, parameterized, reproducible.

## Core Mental Model

Remotion renders video by mounting a React component once per frame. Frame 0 is the first frame; frame `durationInFrames - 1` is the last. `useCurrentFrame()` returns the current frame number. Everything animates by reading that number and computing a value from it.

```
Frame 0 ──────────────────────────── Frame N
   ↓                                    ↓
React renders at frame 0        React renders at frame N
useCurrentFrame() === 0         useCurrentFrame() === N
```

This means: no imperative animation libraries, no timelines, no keyframe editors. Just pure functions of time.

## Inputs

Gather before starting:
1. **What the video shows** — describe each scene
2. **Duration** — seconds (convert: frames = seconds × fps)
3. **FPS** — 30 (default) / 60 (smooth) / 24 (cinematic)
4. **Dimensions** — 1920×1080 (16:9) / 1080×1080 (square) / 1080×1920 (vertical/Reels)
5. **Assets** — images, audio files, video clips to include
6. **Text/copy** — any titles, subtitles, captions
7. **Output** — local MP4 / Lambda render / embed in React app

---

## Workflow

### 1. Scaffold the project (new projects only)

```bash
npx create-video@latest
cd my-video
npm install
```

For an existing React project, add Remotion:
```bash
npm install remotion @remotion/cli
```

Project structure:
```
my-video/
├── src/
│   ├── Root.tsx          ← registers all Compositions
│   ├── MyComposition.tsx ← main scene component
│   └── index.ts          ← entry point
├── public/               ← static assets (images, audio, video)
├── remotion.config.ts
└── package.json
```

### 2. Register compositions in Root.tsx

```tsx
import { Composition } from "remotion";
import { MyComposition } from "./MyComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MyVideo"
        component={MyComposition}
        durationInFrames={150}   // 5 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          titleText: "Hello World",
        }}
      />
    </>
  );
};
```

### 3. Write the composition

**Minimal composition:**
```tsx
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

export const MyComposition: React.FC<{ titleText: string }> = ({ titleText }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames, width, height } = useVideoConfig();

  return (
    <AbsoluteFill style={{ backgroundColor: "#0f0f0f" }}>
      <div style={{ color: "white", fontSize: 80 }}>
        Frame {frame} of {durationInFrames}
      </div>
    </AbsoluteFill>
  );
};
```

### 4. Animate with interpolate()

`interpolate(value, inputRange, outputRange, options)` — maps one range to another, exactly like CSS animation keyframes but in pure JS.

```tsx
import { interpolate, useCurrentFrame } from "remotion";

const frame = useCurrentFrame();

// Fade in over first 30 frames (1 second at 30fps)
const opacity = interpolate(frame, [0, 30], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

// Slide up: starts at y=100, ends at y=0 over 45 frames
const translateY = interpolate(frame, [0, 45], [100, 0], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});

// Scale pulse: 1.0 → 1.05 → 1.0 over frames 60-90
const scale = interpolate(frame, [60, 75, 90], [1, 1.05, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
});
```

### 5. Animate with spring() — for natural motion

`spring()` simulates physics. Feels more natural than linear interpolation for UI elements.

```tsx
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

const frame = useCurrentFrame();
const { fps } = useVideoConfig();

// Bouncy entrance — starts at frame 10
const scale = spring({
  frame: frame - 10,   // offset when animation starts
  fps,
  config: {
    damping: 8,        // lower = more bouncy
    stiffness: 80,     // higher = faster
    mass: 1,
  },
  from: 0,
  to: 1,
});

// Common presets:
// Snappy UI:   { damping: 200, stiffness: 100 }
// Bouncy:      { damping: 8,   stiffness: 80  }
// Slow settle: { damping: 12,  stiffness: 40  }
```

### 6. Sequence multiple scenes

`<Sequence>` renders its children only during a specified time window.

```tsx
import { AbsoluteFill, Sequence } from "remotion";
import { TitleScene } from "./TitleScene";
import { ContentScene } from "./ContentScene";
import { OutroScene } from "./OutroScene";

export const MyVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Title: frames 0-89 (3 seconds) */}
      <Sequence from={0} durationInFrames={90}>
        <TitleScene />
      </Sequence>

      {/* Content: frames 60-209 — overlaps title for crossfade */}
      <Sequence from={60} durationInFrames={150}>
        <ContentScene />
      </Sequence>

      {/* Outro: last 60 frames */}
      <Sequence from={210} durationInFrames={60}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
```

Inside a `<Sequence>`, `useCurrentFrame()` resets to 0 at `from`. Each scene component sees its own local time — design scenes as if they always start at frame 0.

### 7. Add media assets

**Images:**
```tsx
import { Img, staticFile } from "remotion";

// Static file from public/ directory
<Img src={staticFile("logo.png")} style={{ width: 200 }} />

// Remote URL (must be CORS-accessible)
<Img src="https://example.com/image.png" />
```

**Audio:**
```tsx
import { Audio, staticFile } from "remotion";

<Audio src={staticFile("background.mp3")} volume={0.5} />

// Trim audio: start at 10s, play for 30s
<Audio
  src={staticFile("track.mp3")}
  startFrom={10 * 30}    // frame number (10s × 30fps)
  endAt={40 * 30}        // frame number
  volume={(f) => interpolate(f, [0, 30], [0, 1])} // fade in
/>
```

**Video clips:**
```tsx
import { OffthreadVideo, staticFile } from "remotion";

// OffthreadVideo is preferred over <Video> for composition
<OffthreadVideo
  src={staticFile("clip.mp4")}
  startFrom={0}
  style={{ width: "100%", height: "100%" }}
/>
```

### 8. Typography and text animation

```tsx
// Character-by-character reveal
const text = "Hello World";
const charsToShow = Math.floor(interpolate(frame, [0, 60], [0, text.length], {
  extrapolateRight: "clamp",
}));

<div style={{ fontFamily: "Inter, sans-serif", fontSize: 72, color: "white" }}>
  {text.slice(0, charsToShow)}
  <span style={{ opacity: frame % 20 < 10 ? 1 : 0 }}>|</span>
</div>

// Load custom fonts
import { loadFont } from "@remotion/google-fonts/Inter";
const { fontFamily } = loadFont();
```

### 9. Preview in Remotion Studio

```bash
npx remotion studio
# Opens http://localhost:3000
# Scrub through frames, live-edit code, hot reload
```

### 10. Render to MP4

```bash
# Render the default composition
npx remotion render src/index.ts MyVideo output.mp4

# With options
npx remotion render src/index.ts MyVideo output.mp4 \
  --codec=h264 \
  --crf=18 \
  --fps=30 \
  --frames=0-150

# Pass props
npx remotion render src/index.ts MyVideo output.mp4 \
  --props='{"titleText":"Custom Title"}'
```

### 11. Lambda rendering (for production / long videos)

```bash
npm install @remotion/lambda

# Deploy site to S3
npx remotion lambda sites create src/index.ts --site-name=my-video

# Deploy Lambda function
npx remotion lambda functions deploy --memory=2048 --timeout=120 --region=us-east-1

# Render
npx remotion lambda render my-video MyVideo \
  --region=us-east-1 \
  --out=output.mp4
```

---

## Common Patterns

### Crossfade between scenes
```tsx
// Scene A fades out, Scene B fades in over frames 60-90
const fadeOut = interpolate(frame, [60, 90], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const fadeIn  = interpolate(frame, [60, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
```

### Progress bar
```tsx
const progress = frame / durationInFrames; // 0 to 1
<div style={{ width: `${progress * 100}%`, height: 4, background: "#4f46e5" }} />
```

### Countdown timer
```tsx
const secondsLeft = Math.ceil((durationInFrames - frame) / fps);
<div>{secondsLeft}</div>
```

### Staggered list items
```tsx
const items = ["First", "Second", "Third"];
{items.map((item, i) => {
  const delay = i * 10; // 10 frame stagger between items
  const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div key={i} style={{ opacity }}>{item}</div>;
})}
```

---

## Output Format

After building a composition:
```
Video built: <title>
Duration: <N>s (<frames> frames at <fps>fps)
Dimensions: <W>x<H>
Scenes: <list with timing>
Assets: <list>

Preview:  npx remotion studio
Render:   npx remotion render src/index.ts <CompositionId> output.mp4
Lambda:   npx remotion lambda render <site> <CompositionId> --region=us-east-1

Files written:
  src/<CompositionName>.tsx
  src/Root.tsx (updated)
```

## Wrap Up

Always confirm the composition renders in Studio before rendering to MP4 — frame-accurate preview is the core Remotion workflow. Don't render to Lambda until the Studio preview is correct. Offer to add `@remotion/player` if the user wants to embed the video in a React app without rendering to a file.
