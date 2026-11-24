const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const URL_ = 'http://localhost:8766/'; const F = f => path.join(__dirname, f);
const results = []; let browser;
async function page(opts = {}) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: opts.viewport || { width: 1280, height: 800 }, colorScheme: opts.colorScheme || 'light' });
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
  await open(p, 'book.txt'); await testEngine(p); await p.click('#audioBtn'); await p.selectOption('#exScope', 'ch'); await p.selectOption('#exFmt', 'wav');
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }), p.click('#exStart')]);
  const buf = fs.readFileSync(await d.path()); const samples = buf.readUInt32LE(40) / 2;
  const gaps = [0.9, 0.15, 0.6, 0.6].map(g => Math.round(24000 * g)); const expect = 4 * 3600 + gaps.reduce((a, b) => a + b);
  assert(buf.toString('ascii', 0, 4) === 'RIFF', 'not a WAV'); assert(samples === expect, `samples ${samples} expected ${expect}`);
  return d.suggestedFilename() + ' ' + samples + ' samples';
});
add('Function', '16. Export survives user playing/seeking during export (no dropped sentences)', async p => {
  await open(p, 'book.txt'); await testEngine(p, 'slow'); await p.click('#audioBtn'); await p.selectOption('#exScope', 'book'); await p.selectOption('#exFmt', 'wav');
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

(async () => {
  browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const only = process.argv[2] ? process.argv[2].split(',').map(Number) : null;
  for (const [i, [c, n, f]] of tests.entries()) if (!only || only.includes(i + 1)) await T(c, n, f);
  await browser.close();
  const pass = results.filter(r => r.ok).length; console.log(`\n${pass}/${results.length} passed`);
  fs.writeFileSync(__dirname + '/results-' + (process.env.RUN || 'x') + '.json', JSON.stringify(results, null, 1));
})();
