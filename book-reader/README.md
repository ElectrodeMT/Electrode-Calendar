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
24 automated tests (UI, formats, playback, export, stress, chaos) using Playwright + Chromium:
```
cd book-reader && python3 -m http.server 8766 &   # serve the app
cd tests && python3 gen.py && node suite.cjs      # generate fixtures, run suite
```
Playback/export tests use a silent built-in `test` engine and a mocked ElevenLabs API, so no models are downloaded and no credits are spent.
