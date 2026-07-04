/*! eyereasoner CDN redirect shim — classic `<script src>` global.
 *
 * Byte-identical at every `index.js` path on the `pages` site (any depth).
 * It derives the requested version from its OWN url, dynamically imports the
 * matching build from the CDN, and re-exposes it as `window.eyereasoner` so
 * existing `<script src=".../index.js">` + `eyereasoner.n3reasoner(...)` usage
 * keeps working. The global is populated asynchronously; a Proxy makes every
 * method callable immediately (it returns a promise), matching the documented
 * `await eyereasoner.n3reasoner(...)` usage.
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
