# Audiobook Reader

Open `index.html` in a browser, drop in any file (PDF, EPUB, DOCX, ODT, RTF, TXT, Markdown, HTML, code, CSV/JSON, images via OCR) and press Play.

## Voices (all free)
| Engine | Quality | Download | Notes |
|---|---|---|---|
| Kokoro-82M (Apache-2.0) | Most natural | ~92 MB once (326 MB with GPU) | 28 English voices (US/UK). Needs a reasonably fast device. |
| Piper (MIT) | Good | 20–110 MB per voice, once | 100+ voices, 30+ languages, fast even on phones. |
| Device voices | Varies | None | Built into your OS/browser. Cannot be exported. |

Neural voices run entirely in your browser (no account, no API key, text never leaves your device).

## Export
**⤓ Audio → Export** renders a chapter, the rest of the book, or the whole book to MP3 or WAV using Kokoro or Piper.

## Best performance
Serve the folder over http(s) (e.g. GitHub Pages, or `python3 -m http.server` in this folder) and keep `coi-sw.js` next to `index.html`. This:
- lets the voices use all CPU cores (multithreading),
- saves downloaded voices so they work offline,
- avoids re-downloading every visit (opening the file directly from disk works, but cannot cache voices).
