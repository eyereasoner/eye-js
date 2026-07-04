/*! eyereasoner CDN redirect shim (ESM) — `dynamic-import.js`.
 *
 * Byte-identical at every `dynamic-import.js` path on the `pages` site (any
 * depth). It derives the requested version from its OWN url and re-exports the
 * matching CDN build as the `eyereasoner` named export, preserving the original
 * `const { eyereasoner } = await import('.../dynamic-import.js')` contract.
 *
 * Canonical source: https://github.com/eyereasoner/eye-js (redirects/dynamic-import.js)
 */
const CDN = 'https://esm.sh/eyereasoner';
const seg = (new URL(import.meta.url).pathname.match(/\/eye-js\/(.*)\/dynamic-import\.js$/) || [, ''])[1];
const v = seg.replace(/(^|\/)latest$/, '').replace(/\//g, '.');
// eslint-disable-next-line import/no-unresolved
export const eyereasoner = await import(CDN + (v ? `@${v}` : ''));
