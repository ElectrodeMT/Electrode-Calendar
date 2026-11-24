// Audiobook Reader service worker
// 1) Offline: keeps the app, its libraries and voice files on the device (cache-first).
// 2) Speed: adds cross-origin isolation headers so neural voices can use all CPU cores.
const VERSION = 'v3';
const SHELL = 'abr-shell-' + VERSION;
const CDN = 'abr-cdn-v1'; // libraries & small voice files; survives app updates
const SHELL_FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const CDN_HOSTS = /(^|\.)(jsdelivr\.net|cdnjs\.cloudflare\.com|huggingface\.co|hf\.co|xethub\.hf\.co|projectnaptha\.com)$/;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => Promise.all(SHELL_FILES.map(f => c.add(f).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('abr-shell-') && k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function isolate(res) {
  if (!res || res.status === 0 || res.type === 'opaqueredirect') return res;
  const h = new Headers(res.headers);
  h.set('Cross-Origin-Embedder-Policy', 'credentialless');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
}
function timeout(ms) { return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms)); }

self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const url = new URL(r.url), same = url.origin === self.location.origin;

  if (r.mode === 'navigate' && same) { // the app page: fresh when online, cached when offline
    e.respondWith((async () => {
      const cache = await caches.open(SHELL);
      try {
        const res = await Promise.race([fetch(r), timeout(5000)]);
        if (res.ok) cache.put('./index.html', res.clone());
        return isolate(res);
      } catch {
        return isolate(await cache.match('./index.html') || await cache.match(r) || new Response('<h1>Offline</h1><p>Open the app once while online, then tap ⤓ Audio → Make available offline.</p>', { headers: { 'Content-Type': 'text/html' } }));
      }
    })());
    return;
  }

  if (same) { // icons, manifest, this file
    e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => { if (res.ok) caches.open(SHELL).then(c => c.put(r, res.clone())); return res; })));
    return;
  }

  // Libraries and voice files from CDNs: cache-first. Large .onnx models are already stored by the voice engines
  // themselves (Kokoro: Cache Storage, Piper: device storage), so they are not duplicated here.
  if (CDN_HOSTS.test(url.hostname) && !/\.onnx(\?|$)/.test(url.pathname) && !r.headers.has('range')) {
    e.respondWith((async () => {
      const cache = await caches.open(CDN), hit = await cache.match(r, { ignoreVary: true });
      if (hit) return hit;
      const res = await fetch(r);
      if (res.ok && (res.type === 'cors' || res.type === 'basic')) cache.put(r, res.clone()).catch(() => {});
      return res;
    })());
  }
});
