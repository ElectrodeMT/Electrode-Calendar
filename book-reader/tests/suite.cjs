const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const URL_ = 'http://localhost:8766/'; const F = f => path.join(__dirname, f);
const results = []; let browser;
async function page(opts = {}) {
  const ctx = await browser.newContext(opts.iphone ? { acceptDownloads: true, ...require('playwright').devices['iPhone 13'] } : { acceptDownloads: true, viewport: opts.viewport || { width: 1280, height: 800 }, colorScheme: opts.colorScheme || 'light' });
  const p = await ctx.newPage(); p.errs = []; p.dialogs = [];
  p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/SecurityError|Failed to load resource/.test(m.text())) p.errs.push(m.text().slice(0, 200)); });
  p.on('dialog', d => { p.dialogs.push(d.type() + ':' + d.message().slice(0, 60)); d.accept(); });
  await p.goto(URL_); await p.waitForFunction(() => window.__abr && crossOriginIsolated, null, { timeout: 15000 }).catch(() => {});
  return p;
}
async function open(p, f) { await p.evaluate(() => document.getElementById('status').textContent = ''); await p.setInputFiles('#file', F(f));
  await p.waitForFunction(() => /Loaded|Resumed|Error/.test(document.getElementById('status').textContent), null, { timeout: 60000 }); return p.textContent('#status'); }
async function testEngine(p, voice = 'test') { await p.evaluate(v => { const e = document.getElementById('engine'); if (![...e.options].some(o => o.value === 'test')) e.add(new Option('test', 'test')); e.value = 'test';
  const s = document.getElementById('voice'); s.innerHTML = ''; ['test', 'fail', 'slow', 'long'].forEach(x => s.add(new Option(x, x))); s.disabled = false; s.value = v; }, voice); }
const st = p => p.evaluate(() => __abr.state);
const chs = p => p.$$eval('#toc li', l => l.map(x => x.textContent));
const sents = p => p.$$eval('#text .s', l => l.map(x => x.textContent.trim()));
function lum(hex) { let h6 = hex.replace('#', ''); if (h6.length === 3) h6 = [...h6].map(x => x + x).join(''); const c = h6.match(/../g).map(h => { const v = parseInt(h, 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
async function T(cat, name, fn) {
  const t0 = Date.now(); let p;
  try { p = await page(fn.opts); const detail = await fn(p); if (p.errs.length) throw new Error('JS errors: ' + p.errs.join(' | '));
    results.push({ cat, name, ok: true, ms: Date.now() - t0, detail: detail || '' }); }
  catch (e) { results.push({ cat, name, ok: false, ms: Date.now() - t0, detail: e.message.slice(0, 400) }); }
  finally { if (p) await p.context().close(); }
  const r = results[results.length - 1]; console.log(`${r.ok ? 'PASS' : 'FAIL'} [${cat}] ${name} (${r.ms}ms) ${r.detail}`);
}
const assert = (c, m) => { if (!c) throw new Error(m); };
const tests = [];
const add = (cat, name, fn, opts) => { fn.opts = opts; tests.push([cat, name, fn]); };

// ---------- UI ----------
add('UI', '1. Phone width (375px): no horizontal scroll, header fits', async p => {
  await open(p, 'book.txt');
  const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: innerWidth, hdr: [...document.querySelectorAll('header > *')].filter(e => e.offsetParent).map(e => e.getBoundingClientRect().right) }));
  assert(r.sw <= r.cw, `page ${r.sw}px wider than viewport ${r.cw}px`); assert(Math.max(...r.hdr) <= r.cw, 'header overflows: ' + Math.max(...r.hdr));
  return `scrollWidth ${r.sw}/${r.cw}`;
}, { viewport: { width: 375, height: 740 } });
add('UI', '2. Player never hides the last line of text (phone + desktop)', async p => {
  await open(p, 'book.txt'); const out = [];
  for (const [w, h] of [[375, 740], [1280, 800], [320, 568]]) {
    await p.setViewportSize({ width: w, height: h }); await p.waitForTimeout(150);
    await p.evaluate(() => scrollTo(0, 1e9)); await p.waitForTimeout(100);
    const r = await p.evaluate(() => { const last = [...document.querySelectorAll('#text .s')].pop().getBoundingClientRect(); const pl = document.querySelector('.player').getBoundingClientRect(); return { lastBottom: last.bottom, playerTop: pl.top, ph: pl.height }; });
    out.push(`${w}px: player ${Math.round(r.ph)}px`); assert(r.lastBottom <= r.playerTop, `at ${w}px last line (bottom ${Math.round(r.lastBottom)}) hidden under player (top ${Math.round(r.playerTop)})`);
  }
  return out.join(', ');
});
add('UI', '3. Color contrast meets WCAG in light & dark themes', async p => {
  const out = [];
  for (const theme of ['light', 'dark']) {
    const c = await p.evaluate(t => { document.documentElement.dataset.theme = t; const s = getComputedStyle(document.documentElement); return ['--bg', '--panel', '--ink', '--muted', '--read', '--accent', '--accent-ink', '--hl', '--warn', '--warn-ink'].reduce((o, k) => (o[k] = s.getPropertyValue(k).trim(), o), {}); }, theme);
    const checks = [['ink/bg', c['--ink'], c['--bg'], 4.5], ['muted/panel', c['--muted'], c['--panel'], 4.5], ['ink/highlight', c['--ink'], c['--hl'], 4.5], ['read/bg', c['--read'], c['--bg'], 3], ['button text/accent', c['--accent-ink'], c['--accent'], 4.5], ['warn', c['--warn-ink'], c['--warn'], 4.5]];
    for (const [n, a, b, min] of checks) { const r = contrast(a, b); out.push(`${theme} ${n} ${r.toFixed(1)}`); assert(r >= min, `${theme} ${n} contrast ${r.toFixed(2)} < ${min}`); }
  }
  return out.filter((_, i) => i % 3 === 0).join(', ');
});
add('UI', '4. Theme toggle + text size persist across reload', async p => {
  await p.click('#themeBtn'); const t1 = await p.evaluate(() => document.documentElement.dataset.theme);
  await p.$eval('#fs', e => { e.value = 28; e.dispatchEvent(new Event('input')); });
  await p.reload(); await p.waitForTimeout(500);
  const r = await p.evaluate(() => ({ t: document.documentElement.dataset.theme, fs: getComputedStyle(document.documentElement).getPropertyValue('--fs').trim() }));
  assert(r.t === t1, 'theme not persisted'); assert(r.fs === '28px', 'font size not persisted: ' + r.fs); return `theme=${r.t}, fs=${r.fs}`;
});
add('UI', '5. Keyboard: Space toggles once even when Play button has focus; arrows step', async p => {
  await open(p, 'book.txt'); await testEngine(p);
  await p.focus('#play'); await p.keyboard.press('Space'); await p.waitForTimeout(150);
  const a = (await st(p)).playing; await p.keyboard.press('Space'); await p.waitForTimeout(150); const b = (await st(p)).playing;
  assert(a === true && b === false, `Space with focused button: after 1st=${a}, after 2nd=${b} (expected true,false)`);
  await p.focus('body'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('ArrowRight'); const s = await st(p);
  assert(s.si === 2 || (s.ch === 0 && s.si >= 2), 'arrows did not step: ' + JSON.stringify(s)); return JSON.stringify(s);
});
add('UI', '6. Audio dialog: opens, Escape closes, shortcuts blocked while open, controls labelled', async p => {
  await open(p, 'book.txt'); await p.click('#audioBtn'); assert(await p.$eval('#audioDlg', d => d.open), 'dialog did not open');
  const before = await st(p); await p.keyboard.press('ArrowRight'); const after = await st(p); assert(before.si === after.si, 'shortcut leaked through dialog');
  await p.keyboard.press('Escape'); assert(!(await p.$eval('#audioDlg', d => d.open)), 'Escape did not close');
  const unlabeled = await p.$$eval('button, input, select', els => els.filter(e => e.offsetParent && !(e.getAttribute('aria-label') || e.title || e.textContent.trim() || e.closest('label'))).map(e => e.id || e.outerHTML.slice(0, 40)));
  assert(!unlabeled.length, 'controls without accessible names: ' + unlabeled.join(', ')); return 'ok';
});

// ---------- Functionality ----------
add('Function', '7. Text formats parse correctly (TXT, MD, HTML, RTF, CSV, JSON, SRT, CJK/Arabic)', async p => {
  const exp = { 'book.txt': [3, 'Alpha one.'], 'doc.md': [2, 'Some bold text with a link.'], 'doc.html': [2, 'Para one.'], 'doc.rtf': [1, 'Hello from RTF.'], 'doc.csv': [1, 'name, age.'], 'doc.json': [1, null], 'doc.srt': [1, 'Hello subtitle.'], 'cjk.txt': [1, '这是第一句。'] };
  const out = [];
  for (const [f, [n, first]] of Object.entries(exp)) {
    const s = await open(p, f); assert(!/Error/.test(s), f + ': ' + s); const c = await chs(p), ss = await sents(p);
    assert(c.length === n, `${f}: ${c.length} chapters, expected ${n} (${c.join('|')})`); if (first) assert(ss[0] === first, `${f}: first sentence "${ss[0]}" expected "${first}"`);
    if (f === 'doc.rtf') assert(ss.join(' ').includes('Café'), 'RTF accent lost: ' + ss.join(' '));
    if (f === 'doc.srt') assert(!ss.join(' ').includes('-->'), 'SRT timecodes read aloud');
    out.push(`${f}:${c.length}ch`);
  }
  assert(!(await p.evaluate(() => window.__bad)), 'HTML file script executed'); return out.join(' ');
});
add('Function', '8. Zip formats: EPUB (spaces in path), DOCX (headings), ODT', async p => {
  let s = await open(p, 'book.epub'); assert(!/Error/.test(s), s); let c = await chs(p);
  assert(c.join('|') === 'The Beginning|The End', 'epub chapters: ' + c.join('|')); assert(await p.textContent('#title') === 'Test Epub Book', 'epub title');
  s = await open(p, 'doc.docx'); assert(!/Error/.test(s), s); c = await chs(p); assert(c.join('|') === 'Part 1|Part 2', 'docx chapters: ' + c.join('|'));
  s = await open(p, 'doc.odt'); assert(!/Error/.test(s), s); c = await chs(p); assert(c.join('|') === 'Alpha|Beta', 'odt chapters: ' + c.join('|'));
  return 'epub/docx/odt ok';
});
add('Function', '9. Corrupt & hostile files: friendly errors, no crash, no XSS', async p => {
  const out = [];
  for (const f of ['bad.epub', 'bad.pdf', 'bad.docx', 'empty.txt', 'bin.dat']) {
    const s = await open(p, f); assert(/Error/.test(s), f + ' did not report an error: ' + s);
    assert(!/undefined|null|Cannot read|is not a function|\[object/i.test(s), `${f}: unfriendly message "${s}"`); out.push(f + ' → ' + s.slice(7, 60));
  }
  await open(p, 'xss <img src=x onerror=alert(1)>.txt'); await p.waitForTimeout(300);
  assert(!p.dialogs.some(d => d.startsWith('alert')), 'XSS executed: ' + p.dialogs.join(',')); assert(!(await p.$('#reader img, #lib img, #toc img')), 'HTML injected into DOM');
  return out.join(' | ');
});
add('Function', '10. Resume position, library progress & delete', async p => {
  await open(p, 'book.txt'); await p.click('#nextCh'); await p.click('#fwd'); await p.waitForTimeout(700);
  await p.reload(); await p.waitForTimeout(800); await open(p, 'book.txt');
  const s = await st(p); assert(s.ch === 1 && s.si === 1, 'did not resume: ' + JSON.stringify(s)); assert(/Resumed/.test(await p.textContent('#status')), 'no resume message');
  await open(p, 'doc.md'); await p.waitForTimeout(300); const lib = await p.$$eval('#lib li', l => l.map(x => x.textContent)); assert(lib.length === 2, 'library: ' + lib.join('|'));
  await p.click('#lib li:nth-child(2)'); await p.waitForTimeout(300); const s2 = await st(p); assert(s2.ch === 1 && s2.si === 1, 'library reopen lost position ' + JSON.stringify(s2));
  await p.click('#lib li:nth-child(1) .x'); await p.waitForTimeout(500); return 'resume ok, lib ' + lib.length;
});
add('Function', '11. Neural pipeline plays through chapters to the end', async p => {
  await open(p, 'book.txt'); await testEngine(p); await p.click('#play');
  await p.waitForFunction(() => /Finished/.test(document.getElementById('status').textContent), null, { timeout: 30000 });
  const s = await st(p); assert(!s.playing && s.ch === 2, 'end state ' + JSON.stringify(s));
  await p.click('#play'); await p.waitForTimeout(400); const s2 = await st(p);
  assert(s2.playing && s2.ch === 0, 'pressing Play after finishing should restart from the beginning, got ' + JSON.stringify(s2));
  return 'finished + restart ok';
});
add('Function', '12. Pause/resume continues mid-sentence (no restart)', async p => {
  await open(p, 'book.txt'); await testEngine(p, 'long'); await p.click('#play'); await p.waitForTimeout(900);
  await p.click('#play'); const t1 = await p.$eval('#audio', a => a.currentTime); await p.waitForTimeout(300);
  await p.click('#play'); await p.waitForTimeout(150); const t2 = await p.$eval('#audio', a => a.currentTime); const s = await st(p);
  assert(t1 > 0.3 && t2 >= t1, `resume restarted sentence (paused at ${t1.toFixed(2)}s, now ${t2.toFixed(2)}s)`); assert(s.playing, 'not playing after resume');
  return `paused ${t1.toFixed(2)}s → resumed ${t2.toFixed(2)}s`;
});
add('Function', '13. Sleep timer "end of chapter" stops at chapter boundary', async p => {
  await open(p, 'book.txt'); await testEngine(p); await p.selectOption('#sleep', 'ch'); await p.click('#play');
  await p.waitForFunction(() => !__abr.state.playing, null, { timeout: 20000 }); const s = await st(p);
  assert(s.ch === 0, 'continued into next chapter: ' + JSON.stringify(s)); assert(/Sleep/.test(await p.textContent('#status')), 'no sleep message');
  const pos = await p.textContent('#pos'); assert(!/4\/3|\b(\d+)\/\1\b.*NaN/.test(pos) && !/ 4\/3/.test(pos), 'position display out of range: ' + pos);
  return pos;
});
add('Function', '14. Neural engine failures fall back to device voices', async p => {
  await open(p, 'book.txt'); await testEngine(p, 'fail'); await p.click('#play');
  await p.waitForFunction(() => document.getElementById('engine').value === 'browser', null, { timeout: 20000 });
  return await p.textContent('#status');
});
add('Function', '15. Export: chapter WAV has exact expected length', async p => {
  await open(p, 'book.txt'); await p.selectOption('#style', 'plain'); await testEngine(p); await p.click('#audioBtn'); await p.selectOption('#exScope', 'ch'); await p.selectOption('#exFmt', 'wav');
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('#exStart')]);
  const buf = fs.readFileSync(await d.path()); const samples = buf.readUInt32LE(40) / 2;
  const gaps = [0.9, 0.15, 0.6, 0.6].map(g => Math.round(24000 * g)); const expect = 4 * 3600 + gaps.reduce((a, b) => a + b);
  assert(buf.toString('ascii', 0, 4) === 'RIFF', 'not a WAV'); assert(samples === expect, `samples ${samples} expected ${expect}`);
  return d.suggestedFilename() + ' ' + samples + ' samples';
});
add('Function', '16. Export survives user playing/seeking during export (no dropped sentences)', async p => {
  await open(p, 'book.txt'); await p.selectOption('#style', 'plain'); await testEngine(p, 'slow'); await p.click('#audioBtn'); await p.selectOption('#exScope', 'book'); await p.selectOption('#exFmt', 'wav');
  const dlP = p.waitForEvent('download', { timeout: 60000 }); await p.click('#exStart'); await p.waitForTimeout(800);
  await p.keyboard.press('Escape'); for (let i = 0; i < 4; i++) { await p.click('#fwd'); await p.waitForTimeout(150); } await p.click('#play'); await p.waitForTimeout(400); await p.click('#play');
  const d = await dlP; const samples = fs.readFileSync(await d.path()).readUInt32LE(40) / 2;
  const items = 3 + 6; const gapSec = [0.9, 0.15, 0.6, 0.6, 0.9, 0.15, 0.6, 0.9, 0.6]; const expect = items * 3600 + gapSec.reduce((a, g) => a + Math.round(24000 * g), 0);
  assert(samples === expect, `export lost audio when user interacted: ${samples} samples vs ${expect} expected`); return samples + ' samples';
});
add('Function', '17. Export one-file-per-chapter + MP3 encoding', async p => {
  await open(p, 'book.txt'); await testEngine(p); await p.click('#audioBtn'); await p.selectOption('#exScope', 'chapters'); await p.selectOption('#exFmt', 'mp3');
  const files = []; p.on('download', async d => files.push({ n: d.suggestedFilename(), sz: fs.statSync(await d.path()).size }));
  await p.click('#exStart'); await p.waitForFunction(() => /Done/.test(document.getElementById('exStatus').textContent), null, { timeout: 60000 }); await p.waitForTimeout(800);
  assert(files.length === 3, 'files: ' + JSON.stringify(files)); assert(files.every(f => f.n.endsWith('.mp3') && f.sz > 500), 'bad mp3s ' + JSON.stringify(files));
  return files.map(f => f.n).join(', ');
});

// ---------- Stress / performance ----------
add('Stress', '18. 2.6 MB book (60 chapters, 36k sentences): load + 300 rapid steps', async p => {
  const t0 = Date.now(); await open(p, 'big.txt'); const load = Date.now() - t0;
  const n = await p.evaluate(() => document.querySelectorAll('#toc li').length);
  const stepMs = await p.evaluate(async () => { const t = performance.now(); for (let i = 0; i < 300; i++) document.getElementById('fwd').click(); return performance.now() - t; });
  const chapMs = await p.evaluate(async () => { const t = performance.now(); for (let i = 0; i < 30; i++) document.getElementById('nextCh').click(); return performance.now() - t; });
  assert(n === 60, 'chapters ' + n); assert(load < 8000, 'load too slow ' + load); assert(stepMs < 1500, `300 sentence steps took ${stepMs.toFixed(0)}ms`); assert(chapMs < 3000, `30 chapter jumps took ${chapMs.toFixed(0)}ms`);
  return `load ${load}ms, 300 steps ${stepMs.toFixed(0)}ms, 30 chapter jumps ${chapMs.toFixed(0)}ms`;
});
add('Stress', '19. 2.4 MB single-chapter HTML (15k blocks) parses fast; save is cheap', async p => {
  const t0 = Date.now(); const s = await open(p, 'bightml.html'); const load = Date.now() - t0; assert(!/Error/.test(s), s);
  const n = await p.evaluate(() => document.querySelectorAll('#text .s').length);
  const stepMs = await p.evaluate(async () => { const t = performance.now(); for (let i = 0; i < 100; i++) document.getElementById('fwd').click(); return performance.now() - t; });
  assert(load < 8000, `parse took ${load}ms`); assert(n > 25000, 'sentences ' + n); assert(stepMs < 1500, `100 steps in a 30k-sentence chapter took ${stepMs.toFixed(0)}ms`);
  return `parse ${load}ms, ${n} sentences, 100 steps ${stepMs.toFixed(0)}ms`;
});
add('Stress', '20. Chaos: 400 random clicks/seeks/keys while neural audio plays', async p => {
  await open(p, 'big.txt'); await testEngine(p); const acts = ['#fwd', '#back', '#nextCh', '#prevCh', '#play', 'seek', 'sent', 'key', 'rate', 'toc']; let rnd = 7;
  const R = n => (rnd = (rnd * 1103515245 + 12345) % 2147483648) % n;
  for (let i = 0; i < 400; i++) {
    const a = acts[R(acts.length)];
    if (a === 'seek') await p.$eval('#seek', (e, v) => { e.value = Math.floor(v * (+e.max + 1)); e.dispatchEvent(new Event('input')); }, R(1000) / 1000);
    else if (a === 'sent') await p.evaluate(v => { const s = document.querySelectorAll('#text .s'); s[Math.floor(v * s.length)]?.click(); }, R(1000) / 1000);
    else if (a === 'key') await p.keyboard.press(['Space', 'ArrowLeft', 'ArrowRight', 'Shift+ArrowRight', 'Shift+ArrowLeft'][R(5)]);
    else if (a === 'rate') await p.$eval('#rate', (e, v) => { e.value = v; e.dispatchEvent(new Event('input')); e.dispatchEvent(new Event('change')); }, 0.5 + R(25) / 10);
    else if (a === 'toc') await p.evaluate(v => document.querySelectorAll('#toc li')[v]?.click(), R(60));
    else await p.evaluate(sel => document.querySelector(sel).click(), a);
    if (i % 50 === 0) await p.waitForTimeout(100);
  }
  await p.waitForTimeout(500);
  const s = await p.evaluate(() => ({ ...__abr.state, len: document.querySelectorAll('#text .s').length, hl: document.querySelectorAll('#text .s.cur').length, toc: [...document.querySelectorAll('#toc li')].findIndex(l => l.classList.contains('active')) }));
  assert(s.si >= 0 && s.si < s.len && s.hl === 1 && s.toc === s.ch, 'inconsistent state ' + JSON.stringify(s));
  if (s.playing) { const si0 = s.si, ch0 = s.ch; await p.waitForTimeout(1500); const s2 = await st(p); assert(s2.si !== si0 || s2.ch !== ch0 || !s2.playing, 'playback stuck after chaos ' + JSON.stringify(s2)); }
  return JSON.stringify(s);
});

add('Style', '25. Storyteller timing rules (pauses, staccato, questions, beats) + export uses them', async p => {
  fs.writeFileSync(F('story.txt'), 'Chapter One\n\nIt was, by all accounts, a perfectly ordinary Tuesday. The rain fell. The kettle sulked. And Arthur, aged sixty-three, decided that today he would finally become an adventurer.\n\n"Where are you going?" asked his wife.\n\n"Out," said Arthur.\n\nHe considered this. Adventurers, he was fairly certain, did not carry umbrellas. Arthur owned none of these things... but he did have a very nice umbrella and a hat.\n\nSo he took it.\n');
  await open(p, 'story.txt'); assert(await p.$eval('#style', s => s.value) === 'story', 'Storyteller is not the default');
  const g = await p.evaluate(() => { const out = {}; const sents = [...document.querySelectorAll('#text .s')].map(x => x.textContent.trim()); sents.forEach((t, i) => out[t.slice(0, 24)] = +__abr.styleGap(__abr.state.ch, i, true).toFixed(2)); return { out, rate: [__abr.styleRate('So he took it.'), __abr.styleRate('It was, by all accounts, a perfectly ordinary Tuesday.')] }; });
  const o = g.out, want = { 'It was, by all accounts,': 0.3, 'The rain fell.': 0.18, 'The kettle sulked.': 0.3, 'And Arthur, aged sixty-t': 0.6, '"Where are you going?" a': 0.6, '"Out," said Arthur.': 0.55, 'He considered this.': 0.3, 'Arthur owned none of the': 0.75, 'So he took it.': 1.1 };
  for (const [k, v] of Object.entries(want)) assert(o[k] === v, `gap after "${k}" = ${o[k]}, expected ${v}. All: ${JSON.stringify(o)}`);
  assert(g.rate[0] < 1 && g.rate[1] === 1, 'rate shaping ' + g.rate);
  await testEngine(p); await p.click('#audioBtn'); await p.selectOption('#exScope', 'ch'); await p.selectOption('#exFmt', 'wav'); await p.uncheck('#exTitles');
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('#exStart')]);
  const buf = fs.readFileSync(await d.path()), samples = buf.readUInt32LE(40) / 2, n = Object.keys(o).length;
  let runs = 0, inRun = false, quiet = 0; // count sentences actually present: bursts of sound separated by >= 0.1 s of quiet
  for (let i = 0; i + 1 < samples; i += 120) { const v = Math.abs(buf.readInt16LE(44 + i * 2)) / 32768; let loud = v > 0.02; if (!loud) { for (let k = 1; k < 120 && !loud && i + k < samples; k += 6) loud = Math.abs(buf.readInt16LE(44 + (i + k) * 2)) / 32768 > 0.02; }
    if (loud) { if (!inRun) runs++; inRun = true; quiet = 0; } else if (inRun && ++quiet >= 20) inRun = false; }
  const base = n * 3600 + Object.values(o).reduce((a, x) => a + Math.round(24000 * x), 0);
  assert(runs === n, `expected ${n} spoken sentences in export, found ${runs}`); assert(Math.abs(samples - base) < base * 0.12, `length ${samples} vs ~${base}`);
  return `gaps ok, ${runs}/${n} sentences present, ${(samples / 24000).toFixed(1)}s`;
});

add('Style', '26. Natural output: phrase groups, varied pauses, audiobook loudness, room tone, spoken symbols', async p => {
  await open(p, 'book.txt'); await testEngine(p);
  const r = await p.evaluate(() => ({ g: [__abr.styleGap(0, 0), __abr.styleGap(0, 0, true)], chunk: __abr.chunkEnd(0, 0), t: __abr.speechText('Chapter IV & 50% e.g. this, see https://x.y now.') }));
  assert(r.chunk === 1, 'phrase group should cover both sentences of paragraph 1, got end ' + r.chunk);
  assert(r.t === 'Chapter 4 and 50 percent for example, this, see link now.', 'speech text: ' + r.t);
  await p.click('#audioBtn'); await p.selectOption('#exScope', 'ch'); await p.selectOption('#exFmt', 'wav');
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('#exStart')]);
  const b = fs.readFileSync(await d.path()), n = b.readUInt32LE(40) / 2, x = i => b.readInt16LE(44 + i * 2) / 32768;
  let sq = 0, cnt = 0, peak = 0, run = 0, longest = 0;
  for (let i = 0; i < n; i++) { const v = Math.abs(x(i)); peak = Math.max(peak, v); if (v > 0.03) { sq += v * v; cnt++; } run = v === 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  const rmsDb = 20 * Math.log10(Math.sqrt(sq / cnt)), peakDb = 20 * Math.log10(peak);
  assert(rmsDb > -23 && rmsDb < -16, 'speech loudness ' + rmsDb.toFixed(1) + ' dB'); assert(peakDb <= -0.9, 'peaks too hot ' + peakDb.toFixed(1));
  assert(longest < 240, `dead digital silence: ${(longest / 24).toFixed(0)} ms of exact zeros`);
  return `speech ${rmsDb.toFixed(1)} dB RMS, peak ${peakDb.toFixed(1)} dB, longest digital silence ${(longest / 24).toFixed(1)} ms, jittered gap ${r.g[0]} vs base ${r.g[1]}`;
});

add('iPhone', '27. iPhone: export kept in "Your audio files", Save works on tap, survives reload, can be removed', async p => {
  await open(p, 'book.txt'); await testEngine(p); await p.click('#audioBtn'); await p.selectOption('#exScope', 'ch'); await p.selectOption('#exFmt', 'mp3');
  let autoDl = 0; p.on('download', () => autoDl++);
  await p.click('#exStart'); await p.waitForFunction(() => /Done/.test(document.getElementById('exStatus').textContent), null, { timeout: 30000 }); await p.waitForTimeout(500);
  assert(autoDl === 0, 'iPhone should not auto-download (Safari blocks it)');
  const rows = await p.$$eval('#exFiles li', l => l.map(x => x.textContent)); assert(rows.length === 1 && /Chapter 1\.mp3/.test(rows[0]), 'list: ' + rows.join('|'));
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 10000 }), p.click('#exFiles li button:has-text("Save")')]);
  const size = fs.statSync(await d.path()).size; assert(size > 500 && d.suggestedFilename().endsWith('.mp3'), 'saved file ' + size);
  await p.reload(); await p.waitForTimeout(800); await p.click('#audioBtn'); await p.waitForTimeout(300);
  assert((await p.$$('#exFiles li')).length === 1, 'file not kept after reload');
  await p.click('#exFiles li button:has-text("Delete")'); await p.waitForTimeout(300); assert((await p.$$('#exFiles li')).length === 0, 'remove failed');
  return `${d.suggestedFilename()} ${size} bytes; hint: ${(await p.textContent('#exHint')).slice(0, 40)}`;
}, { iphone: true });

add('Narrator', '28. One narrator reads everything: dialogue uses the narrator voice, no character controls', async p => {
  await open(p, 'dialogue.txt'); await testEngine(p);
  const r = await p.evaluate(() => ({ ctl: !!document.getElementById('chars') || !!document.getElementById('castList'),
    parts: [...document.querySelectorAll('#text .s')].map((_, i) => __abr.parts(0, i).length) }));
  assert(!r.ctl, 'character voice controls still present'); assert(r.parts.every(n => n === 1), 'a sentence is still split between voices');
  await p.click('#play'); await p.waitForFunction(() => __abr.state.si >= 2, null, { timeout: 15000 }); await p.click('#play');
  return `${r.parts.length} sentences, all narrator`;
});
add('Narrator', '34. Emotion: sad, excited, sarcastic, awe and serious passages are each acted; neutral lines stay neutral', async p => {
  await open(p, 'emotion.txt');
  const m = await p.evaluate(() => [...document.querySelectorAll('#text .s')].map((x, i) => [x.textContent.trim().slice(0, 18), __abr.emo(0, i).mood]));
  const want = { 'She wept for a lon': 'sad', '"We actually won!': 'excited', '"Oh, wonderful," s': 'sarcastic', 'Above her the star': 'awe', 'If the debt was no': 'serious', 'The house was quie': '', 'That night she cli': '' };
  for (const [k, v] of m) if (k in want) assert(want[k] === v, `"${k}" read as "${v}", expected "${want[k] || 'neutral'}"`);
  const g = await p.evaluate(() => [__abr.styleGap(0, 4, true), __abr.styleGap(0, 2, true)]);
  assert(g[0] > g[1], 'sad lines should get longer pauses');
  return m.map(x => x[1] || '-').join(' ');
});
add('Narration', '35. PDF like a real book: no running headers/page numbers/footnote markers, sentences flow across pages, real chapters', async p => {
  await open(p, 'book-layout.pdf');
  const toc = await chs(p); assert(toc.length === 3 && /Chapter One/.test(toc[0]), 'chapters: ' + toc.join(' | '));
  const r = await p.evaluate(() => { const ps = [...document.querySelectorAll('#text p')].map(x => x.textContent.trim()); return { n: ps.length, txt: ps.join(' '), broken: ps.filter(x => !/[.!?"”:]$/.test(x) || /^[a-z]/.test(x)).length }; });
  assert(!/Wealth Buried/.test(r.txt), 'running header read aloud'); assert(!/sentences\s?\d/.test(r.txt), 'footnote marker read aloud');
  assert(r.n === 14 && r.broken === 0, `paragraphs ${r.n}, broken ${r.broken}`);
  return `3 chapters, 14 clean paragraphs in chapter 1`;
});
add('Narration', '36. Numbers, money, units and symbols are said the way a narrator says them; pronunciation dictionary works', async p => {
  const cases = { 'They raised $2.5 million.': 'They raised 2.5 million dollars.', 'Revenue hit $500K.': 'Revenue hit 500 thousand dollars.', 'It was 72°F outside.': 'It was 72 degrees Fahrenheit outside.', 'Room No. 5 is open.': 'Room number 5 is open.', 'She lives in St. Louis.': 'She lives in Saint Louis.', 'Climb Mt. Everest.': 'Climb Mount Everest.', 'About 2/3 agree.': 'About two thirds agree.', 'Read pages 12-15.': 'Read pages 12 to 15.', 'Call 555-1234 now.': 'Call 555-1234 now.', 'He ran 5km today.': 'He ran 5 kilometers today.', 'It works [12].': 'It works.' };
  const got = await p.evaluate(c => Object.fromEntries(Object.keys(c).map(k => [k, __abr.speechText(k)])), cases);
  for (const [k, v] of Object.entries(cases)) assert(got[k] === v, `"${k}" -> "${got[k]}", expected "${v}"`);
  await p.click('#audioBtn'); await p.fill('#pronBox', 'Gizaw = Gee-zow\nIbid ='); await p.keyboard.press('Escape');
  const s = await p.evaluate(() => __abr.speechText('Ibid. Gizaw wrote it.')); assert(s === 'Gee-zow wrote it.', s);
  return `${Object.keys(cases).length} cases + dictionary`;
});
add('Player', '37. Auto-scroll follows the narrator, yields when you scroll, and "Back to where he is reading" returns', async p => {
  await open(p, 'big.txt'); await testEngine(p, 'slow'); await p.click('#play'); await p.waitForFunction(() => __abr.state.si >= 2, null, { timeout: 15000 });
  await p.mouse.move(400, 300); await p.mouse.wheel(0, 3000); await p.waitForTimeout(300);
  assert(await p.isVisible('#backPill'), 'pill not shown after manual scroll'); const y1 = await p.evaluate(() => scrollY);
  await p.waitForFunction(() => __abr.state.si >= 5, null, { timeout: 15000 }); const y2 = await p.evaluate(() => scrollY);
  assert(Math.abs(y2 - y1) < 5, `page was yanked back while reading (${y1} -> ${y2})`);
  await p.click('#backPill'); await p.waitForTimeout(800); assert(!(await p.isVisible('#backPill')), 'pill still visible');
  const inView = await p.evaluate(() => { const r = document.querySelector('#text .s.cur').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
  assert(inView, 'current sentence not on screen after Back'); await p.click('#play');
  return 'yields + returns';
});
add('Player', '38. Bookmarks: save the current sentence, listed in the menu, tap jumps there, remove works, kept after reload', async p => {
  await open(p, 'big.txt'); await p.evaluate(() => [...document.querySelectorAll('#text .s')][7].click()); await p.waitForTimeout(200);
  if (await p.evaluate(() => __abr.state.playing)) await p.click('#play');
  await p.click('#bmBtn'); assert(await p.isVisible('#bms li'), 'bookmark not listed');
  await p.reload(); await p.waitForFunction(() => window.__abr && document.querySelectorAll('#lib li .t').length, null, { timeout: 15000 }); await p.click('#lib li');
  await p.waitForFunction(() => document.querySelectorAll('#bms li').length === 1, null, { timeout: 15000 });
  await p.evaluate(() => [...document.querySelectorAll('#text .s')][0].click()); await p.waitForTimeout(200); if (await p.evaluate(() => __abr.state.playing)) await p.click('#play');
  await p.click('#bms li .t'); await p.waitForTimeout(200); const s = await st(p); assert(s.si === 7, 'jumped to ' + s.si);
  if (s.playing) await p.click('#play'); await p.click('#bms li .x'); assert(!(await p.isVisible('#bms li')), 'not removed');
  return 'save, list, persist, jump, remove';
});
add('Narration', '39. EPUB/HTML footnote markers and footnote text are skipped; normal links kept', async p => {
  await open(p, 'footnotes.html'); const t = await p.evaluate(() => document.getElementById('text').innerText);
  assert(!/tool\s?1|mind\s?2|must not be read|Smith, 2019/.test(t), 'footnote read: ' + t); assert(/normal link kept/.test(t), 'lost normal text');
  return 'clean';
});
add('Player', '40. Word-by-word highlight follows playback and only the current sentence is split into words', async p => {
  await open(p, 'book.txt'); await testEngine(p, 'long'); await p.click('#play');
  await p.waitForFunction(() => document.querySelector('#text .s.cur .w.wcur'), null, { timeout: 15000 });
  const r = await p.evaluate(() => ({ split: [...document.querySelectorAll('#text .s')].filter(s => s.querySelector('.w')).length, text: document.querySelector('#text .s.cur').textContent }));
  await p.click('#play'); assert(r.split === 1, 'sentences split: ' + r.split);
  return 'word marker on: ' + r.text.slice(0, 30);
});
add('Narration', '41. PDF tables of figures, their header rows and dotted contents lines are not read aloud', async p => {
  await open(p, 'table.pdf'); const t = await p.evaluate(() => document.getElementById('text').innerText);
  assert(!/\$40,000|Year Income|\.{5}/.test(t), 'table/contents read: ' + t); assert(/numbers looked/.test(t) && /pattern is clear/.test(t), 'lost prose');
  return 'prose only';
});
add('Offline', '30. Make available offline, then with the network blocked: app loads, opens Word/text, plays, exports MP3', async p => {
  await p.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 15000 });
  await p.click('#audioBtn'); await p.uncheck('#offKokoro'); await p.click('#offGo');
  await p.waitForFunction(() => /Ready offline|Stopped/.test(document.getElementById('offStatus').textContent), null, { timeout: 60000 });
  const st0 = await p.textContent('#offStatus'); assert(/Ready offline/.test(st0), st0);
  const ctx = p.context(); await ctx.setOffline(true); await p.reload(); await p.waitForFunction(() => window.__abr, null, { timeout: 15000 });
  assert(!(await p.evaluate(() => navigator.onLine)), 'still online?');
  await open(p, 'doc.docx'); assert((await chs(p)).join('|') === 'Part 1|Part 2', 'Word doc offline');
  await open(p, 'book.txt'); await testEngine(p); await p.click('#play'); await p.waitForFunction(() => /Finished/.test(document.getElementById('status').textContent), null, { timeout: 30000 });
  await p.click('#audioBtn'); await p.selectOption('#exScope', 'ch'); await p.selectOption('#exFmt', 'mp3');
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('#exStart')]);
  const size = fs.statSync(await d.path()).size; assert(size > 500, 'mp3 offline'); await ctx.setOffline(false);
  return `offline: app + Word + playback + MP3 (${size} bytes)`;
});

add('Share', '31. Get & share: link, copy, QR code, ZIP download, install info; link-preview tags present', async p => {
  await p.context().grantPermissions(['clipboard-read', 'clipboard-write'], { origin: URL_ });
  await p.click('#shareBtn'); await p.waitForFunction(() => document.getElementById('qr').src.startsWith('data:image'), null, { timeout: 15000 });
  const url = await p.inputValue('#shareUrl'); assert(url === URL_, 'share url ' + url);
  await p.click('#copyLink'); assert(await p.evaluate(() => navigator.clipboard.readText()) === URL_, 'clipboard'); assert(/copied/.test(await p.textContent('#shareMsg')), 'copy message');
  assert(await p.getAttribute('#zipLink', 'href') === 'audiobook-reader.zip', 'zip link');
  assert(/install/i.test(await p.textContent('#instInfo')), 'install info');
  const og = await p.evaluate(() => ['og:title', 'og:image', 'og:description'].map(k => document.querySelector(`meta[property="${k}"]`)?.content));
  assert(og.every(Boolean) && /og\.png$/.test(og[1]), 'og tags ' + og);
  const man = await (await p.request.get(URL_ + 'manifest.webmanifest')).json(); assert(man.icons.length === 2 && man.display === 'standalone', 'manifest');
  await p.keyboard.press('Escape'); return `link ${url}; QR ok; copy ok; manifest ok`;
});
add('Share', '32. iPhone: Get & share shows Add-to-Home-Screen steps', async p => {
  await p.click('#shareBtn'); await p.waitForTimeout(500);
  assert(!(await p.$eval('#iosSteps', e => e.classList.contains('hide'))), 'iOS steps hidden');
  const t = await p.textContent('#iosSteps'); assert(/Add to Home Screen/.test(t), t);
  const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, w: innerWidth })); assert(r.sw <= r.w, 'overflow on phone');
  return t.replace(/\s+/g, ' ').slice(0, 70);
}, { iphone: true });

add('My voice', '33. Personal voice: import, listed first, backup, never sent over the network, bad file rejected, remove', async p => {
  const sent = []; p.on('request', r => { if (/u_me_/.test(r.url()) || (r.postData() || '').length > 400000) sent.push(r.url()); });
  const data = Buffer.alloc(522240); for (let i = 0; i < data.length; i += 4) data.writeFloatLE(Math.sin(i) * 0.1, i);
  await p.click('#audioBtn');
  await p.setInputFiles('#myVoiceFile', { name: 'notes.bin', mimeType: 'application/octet-stream', buffer: Buffer.from('nope') }); await p.waitForTimeout(300);
  assert(/not a voice file/.test(await p.textContent('#myVoiceInfo')), 'bad file not rejected');
  await p.setInputFiles('#myVoiceFile', { name: 'myvoice_a.bin', mimeType: 'application/octet-stream', buffer: data }); await p.waitForTimeout(800);
  assert(/Added/.test(await p.textContent('#myVoiceInfo')), await p.textContent('#myVoiceInfo'));
  const first = await p.$eval('#voice', s => ({ v: s.value, t: s.options[0].text })); assert(/^au_me_/.test(first.v) && /My voice/.test(first.t), 'not selected/first: ' + JSON.stringify(first));
  assert((await p.$$('#myVoices li')).length === 1, 'not listed');
  const [d] = await Promise.all([p.waitForEvent('download'), p.click('#myVoices li button:has-text("Save a backup copy")')]);
  assert(fs.statSync(await d.path()).size === 522240, 'backup size');
  await p.reload(); await p.waitForTimeout(800); await p.selectOption('#engine', 'kokoro'); await p.waitForTimeout(300);
  assert(/^au_me_/.test(await p.$eval('#voice', s => s.value)), 'not kept after reload');
  await p.click('#audioBtn'); await p.click('#myVoices li button:has-text("Remove")'); await p.waitForTimeout(500);
  assert((await p.$$('#myVoices li')).length === 0, 'not removed');
  assert(!sent.length, 'personal voice sent over network: ' + sent.join(','));
  return 'import/backup/persist/remove ok; nothing sent over the network';
});

// ---------- ElevenLabs (mocked API: no real credits used) ----------
function wavBuf(n, sr = 44100) { const b = Buffer.alloc(44 + n * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40); return b; }
async function castSet(p, name, idx, value) { // pick a cast row by its exact name label, then set its n-th menu
  const ok = await p.evaluate(([name, idx, value]) => { const li = [...document.querySelectorAll('#castList li')].find(l => l.querySelector('.t').textContent.split(' · ')[0] === name); if (!li) return false;
    const sel = li.querySelectorAll('select')[idx]; sel.value = value; sel.dispatchEvent(new Event('change')); return true; }, [name, idx, value]);
  if (!ok) throw new Error('cast row not found: ' + name);
}
async function mockEleven(p, mode = {}) {
  p.el = { tts: 0, calls: [] }; const H = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };
  await p.route('https://api.elevenlabs.io/**', async route => {
    const u = new URL(route.request().url()); p.el.calls.push(u.pathname);
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 200, headers: { ...H, 'access-control-allow-methods': '*' } });
    if (route.request().headers()['xi-api-key'] !== 'good-key') return route.fulfill({ status: 401, headers: H, contentType: 'application/json', body: JSON.stringify({ detail: { status: 'invalid_api_key', message: 'Invalid API key' } }) });
    if (u.pathname === '/v1/user/subscription') return route.fulfill({ headers: H, contentType: 'application/json', body: JSON.stringify({ tier: 'free', character_count: 1200, character_limit: 10000 }) });
    if (u.pathname === '/v1/voices') return route.fulfill({ headers: H, contentType: 'application/json', body: JSON.stringify({ voices: [{ voice_id: 'aaa', name: 'Aria', category: 'premade', labels: { gender: 'female' } }, { voice_id: 'bbb', name: 'Brian', category: 'premade', labels: { gender: 'male' } }, { voice_id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', category: 'premade', preview_url: 'https://api.elevenlabs.io/preview.wav' }] }) });
    if (u.pathname === '/preview.wav') return route.fulfill({ headers: H, contentType: 'audio/wav', body: wavBuf(4410) });
    if (u.pathname === '/v1/models') return route.fulfill({ headers: H, contentType: 'application/json', body: JSON.stringify([{ model_id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2', can_do_text_to_speech: true }, { model_id: 'eleven_flash_v2_5', name: 'Eleven Flash v2.5', can_do_text_to_speech: true }]) });
    if (u.pathname.startsWith('/v1/text-to-speech/')) {
      p.el.tts++;
      if (mode.quota && p.el.tts > mode.quota) return route.fulfill({ status: 401, headers: H, contentType: 'application/json', body: JSON.stringify({ detail: { status: 'quota_exceeded', message: 'This request exceeds your quota.' } }) });
      if (mode.busy && p.el.tts <= mode.busy) return route.fulfill({ status: 429, headers: H, contentType: 'application/json', body: JSON.stringify({ detail: { status: 'too_many_concurrent_requests', message: 'busy' } }) });
      return route.fulfill({ headers: H, contentType: 'audio/mpeg', body: wavBuf(8820) });
    }
    return route.fulfill({ status: 404, headers: H, body: '{}' });
  });
}
async function setKey(p, key) { if (!(await p.$eval('#audioDlg', d => d.open))) await p.click('#audioBtn'); await p.fill('#elKey', key); await p.click('#elSave'); await p.waitForFunction(() => !/Checking/.test(document.getElementById('elInfo').textContent), null, { timeout: 15000 }); }
add('ElevenLabs', '21. Key check, George default, credits shown, plays book, replay costs no credits', async p => {
  await mockEleven(p); await open(p, 'book.txt'); await setKey(p, 'good-key');
  const info = await p.textContent('#elInfo'); assert(/8,800 of 10,000/.test(info), 'credits not shown: ' + info);
  await p.waitForFunction(() => document.getElementById('engine').value === 'eleven' && document.getElementById('voice').value, null, { timeout: 10000 });
  assert(await p.$eval('#voice', s => s.value) === 'JBFqnCBsd6RMkjVDRZzb', 'George not default'); await p.keyboard.press('Escape');
  await p.click('#play'); await p.waitForFunction(() => /Finished/.test(document.getElementById('status').textContent), null, { timeout: 30000 });
  const first = p.el.tts; await p.click('#play'); await p.waitForTimeout(300); await p.waitForFunction(() => /Finished/.test(document.getElementById('status').textContent), null, { timeout: 30000 });
  assert(first === 4, `expected 4 TTS requests (6 sentences in 4 phrase groups), got ${first}`); assert(p.el.tts === first, `replay re-spent credits: ${p.el.tts - first} extra requests`);
  return `${first} requests first play, 0 on replay; ${info.slice(0, 60)}`;
});
add('ElevenLabs', '22. Credits run out mid-book: clear message, falls back to device voices', async p => {
  await mockEleven(p, { quota: 2 }); await open(p, 'book.txt'); await setKey(p, 'good-key'); await p.keyboard.press('Escape');
  await p.click('#play'); await p.waitForFunction(() => document.getElementById('engine').value === 'browser', null, { timeout: 20000 });
  const st_ = await p.textContent('#status'); assert(/credits .* used up/.test(st_) && !(await st(p)).playing, 'message: ' + st_); return st_;
});
add('ElevenLabs', '23. Rate limiting (429) is retried automatically; bad key rejected clearly', async p => {
  await mockEleven(p, { busy: 2 }); await open(p, 'book.txt');
  await setKey(p, 'wrong-key'); const bad = await p.textContent('#elInfo'); assert(/rejected the API key/.test(bad), 'bad key msg: ' + bad);
  await setKey(p, 'good-key'); await p.waitForFunction(() => document.getElementById('engine').value === 'eleven', null, { timeout: 10000 }); await p.keyboard.press('Escape');
  await p.click('#play'); await p.waitForFunction(() => __abr.state.si >= 2, null, { timeout: 30000 });
  assert((await st(p)).engine === 'eleven', 'fell back instead of retrying'); return `${p.el.tts} TTS calls incl. 2 retried; bad key: "${bad.slice(0, 50)}"`;
});
add('ElevenLabs', '24. No key → asks for key (no silent switch); export length exact; free preview', async p => {
  await mockEleven(p); await open(p, 'book.txt'); await p.selectOption('#style', 'plain'); await p.selectOption('#engine', 'eleven'); await p.waitForTimeout(200);
  await p.click('#play'); await p.waitForTimeout(300);
  assert(await p.$eval('#audioDlg', d => d.open), 'key dialog not opened'); assert((await st(p)).engine === 'eleven' && !(await st(p)).playing, 'engine switched or playing without key');
  await p.fill('#elKey', 'good-key'); await p.click('#elSave'); await p.waitForFunction(() => document.getElementById('voice').value === 'JBFqnCBsd6RMkjVDRZzb', null, { timeout: 10000 });
  await p.keyboard.press('Escape'); const before = p.el.tts; await p.click('#sample'); await p.waitForTimeout(500); assert(p.el.tts === before, 'preview spent credits');
  await p.click('#audioBtn'); await p.selectOption('#exScope', 'ch'); await p.selectOption('#exFmt', 'wav');
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('#exStart')]);
  const samples = fs.readFileSync(await d.path()).readUInt32LE(40) / 2; const g = [0.9, 0.15, 0.6, 0.6].reduce((a, x) => a + Math.round(44100 * x), 0);
  const exp = 3 * 8820 + [0.9, 0.6, 0.6].reduce((a, x) => a + Math.round(44100 * x), 0); // title + 2 phrase groups
  assert(samples === exp, `export samples ${samples}, expected ${exp}`); return `export ${samples} samples; preview free`;
});

(async () => {
  browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  for (const [i, [c, n, f]] of tests.entries()) if (!only || only.includes(i + 1)) await T(c, n, f);
  await browser.close();
  const pass = results.filter(r => r.ok).length; console.log(`\n${pass}/${results.length} passed`);
  fs.writeFileSync(__dirname + '/results-' + (process.env.RUN || 'x') + '.json', JSON.stringify(results, null, 1));
})();
