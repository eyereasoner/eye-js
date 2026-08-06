/*! eyereasoner CDN redirect shim — classic `<script src>` global.
 *
 * ONE-TIME HISTORICAL BACKFILL: this stub only exists to keep the Pages URLs
 * of versions that were already published answering `200 + JS`. New releases
 * do not add Pages files — consumers should import from the CDN directly
 * (see README "Browser Builds").
 *
 * Byte-identical at every `index.js` path on the `pages` site (any depth).
 * It derives the requested version from its OWN url, dynamically imports the
 * matching build from the CDN, and re-exposes it as `window.eyereasoner` so
 * existing `<script src=".../index.js">` + `eyereasoner.n3reasoner(...)` usage
 * keeps working. The global is populated asynchronously; a Proxy makes every
 * method callable immediately (it returns a promise), matching the documented
 * `await eyereasoner.n3reasoner(...)` usage.
 *
 * It deliberately imports the SELF-CONTAINED (WebAssembly-inlined) CDN build:
 * legacy pages cannot be assumed to carry the import map that the split
 * `.wasm`-asset delivery documented in the README requires.
 *
 * Canonical source: https://github.com/eyereasoner/eye-js (redirects/index.js)
 */
(function () {
  var CDN = 'https://esm.sh/eyereasoner';
  var src = (document.currentScript && document.currentScript.src) || '';
  var m = src.match(/\/eye-js\/(.*)\/index\.js(?:[?#]|$)/);
  var v = (m ? m[1] : '').replace(/(^|\/)latest$/, '').replace(/\//g, '.');
  var loading = import(CDN + (v ? '@' + v : ''));
  loading.then(function (mod) { globalThis.eyereasoner = mod; });
  globalThis.eyereasoner = new Proxy({}, {
    get: function (_target, key) {
      return function () {
        var args = arguments;
        return loading.then(function (mod) { return mod[key].apply(mod, args); });
      };
    },
  });
})();
