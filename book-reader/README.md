# Audiobook Reader

Open `index.html` in a browser, drop in any file (PDF, EPUB, DOCX, ODT, RTF, TXT, Markdown, HTML, code, CSV/JSON, images via OCR) and press Play.

## Voices (all free)
| Engine | Quality | Download | Notes |
|---|---|---|---|
| Kokoro-82M (Apache-2.0) | Most natural | ~92 MB once (326 MB with GPU) | 28 English voices (US/UK). Needs a reasonably fast device. |
| Piper (MIT) | Good | 20–110 MB per voice, once | 100+ voices, 30+ languages, fast even on phones. |
| ElevenLabs (your account) | Studio | None (uses your credits) | Paste your API key in ⤓ Audio. Defaults to **George, Warm Captivating Storyteller**. Free plan ≈ 10,000 credits/month. |
| Device voices | Varies | None | Built into your OS/browser. Cannot be exported. |

Neural voices run entirely in your browser (no account, no API key, text never leaves your device).

## Our own voices + Storyteller style
- **Raconteur** (default narrator), **Hearth, Storyteller, Wit** are original voices created by blending Kokoro's built-in voice styles (free, offline, not a copy of any real person). Samples: `samples/`.
- **Storyteller style** (default) shapes narration with timing measured from professional audiobook narration: ~0.12 s breaths, ~0.3 s between sentences, ~0.65–0.7 s at paragraphs and dialogue turns, tight staccato runs ("The rain fell. The kettle sulked."), 0.4 s after questions, 0.5 s after trailing-off lines, and an extra held beat before a short closing line (comic/dramatic timing). Short punchy lines are read slightly slower, long descriptive runs slightly faster. Switch to **Plain** anytime.

## Sounding natural, not robotic
- **Phrase-group generation:** whole phrases (up to a paragraph) are generated together so intonation flows across sentences instead of resetting every sentence; the audio is then split at the voice's own pauses for highlighting and timing.
- **Human timing:** pauses vary naturally (±15%) instead of being identical.
- **Recording-booth realism:** short fades (no clicks), faint room tone instead of dead digital silence.
- **Narration mastering:** warmth, softened metallic edge, gentle compression, audiobook loudness (ACX: −18 to −23 dB RMS, peaks below −3 dB).
- **Spoken symbols:** "Chapter IV" → "Chapter 4", "&" → "and", "50%" → "50 percent", "e.g." → "for example", links → "link".
- **ElevenLabs:** gets the surrounding text for continuity and slightly more expressive settings.
- Compare `samples/storyteller-before.mp3` (old per-sentence) with `samples/storyteller.mp3`.

## ElevenLabs notes
- The key is stored only in this browser (localStorage) and sent only to api.elevenlabs.io. Use a restricted key with a credit limit.
- Every generated sentence is saved on the device, so replays and exports of already-heard text cost no credits.
- Only 2 sentences are generated ahead, so skipping around wastes little.
- When credits run out, playback pauses and switches to device voices; a partial export is saved.
- "Test" plays ElevenLabs' free preview clip (no credits).

## Export
**⤓ Audio → Export** renders a chapter, the rest of the book, or the whole book to MP3 or WAV using Kokoro or Piper.

## Best performance
Serve the folder over http(s) (e.g. GitHub Pages, or `python3 -m http.server` in this folder) and keep `coi-sw.js` next to `index.html`. This:
- lets the voices use all CPU cores (multithreading),
- saves downloaded voices so they work offline,
- avoids re-downloading every visit (opening the file directly from disk works, but cannot cache voices).

## Tests
26 automated tests (UI, formats, playback, export, stress, chaos) using Playwright + Chromium:
```
cd book-reader && python3 -m http.server 8766 &   # serve the app
cd tests && python3 gen.py && node suite.cjs      # generate fixtures, run suite
```
Playback/export tests use a silent built-in `test` engine and a mocked ElevenLabs API, so no models are downloaded and no credits are spent.
