/* eslint-disable no-console */
/**
 * Generate the `pages` redirect tree that replaces the old webpack bundles.
 *
 * Instead of building a ~4MB webpack bundle per release and publishing it to
 * the `pages` branch (which grew the branch to ~7.5GB), we publish two tiny,
 * self-deriving redirect stubs (`redirects/index.js` and
 * `redirects/dynamic-import.js`). Each stub reads its own URL, works out the
 * requested version, and loads the matching build from the CDN. Because the
 * bytes are identical at every path, git deduplicates them to two blobs, so
 * per-release growth is effectively zero.
 *
 * Usage:
 *   ts-node scripts/generate-redirects --name=v2.3.14 [--out=bundle]
 *
 * Writes, under <out>/:
 *   <M>/<m>/<p>/{index.js,dynamic-import.js}   (the exact patch)
 *   latest/, <M>/latest/, <M>/<m>/latest/      (the documented shortcuts)
 *   .nojekyll                                  (skip GitHub's Jekyll build)
 */
import path from 'path';
import fs from 'fs';

const ROOT = path.join(__dirname, '..');
const outArg = process.argv.find((a) => a.startsWith('--out='))?.slice(6);
const nameArg = process.argv.find((a) => a.startsWith('--name='))?.slice(8);
const OUT = outArg || 'bundle';

const classicStub = fs.readFileSync(path.join(ROOT, 'redirects', 'index.js'), 'utf8');
const esmStub = fs.readFileSync(path.join(ROOT, 'redirects', 'dynamic-import.js'), 'utf8');

function writeStubs(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.js'), classicStub);
  fs.writeFileSync(path.join(dir, 'dynamic-import.js'), esmStub);
}

const outRoot = path.join(ROOT, OUT);
fs.mkdirSync(outRoot, { recursive: true });
// `.nojekyll` stops GitHub trying to Jekyll-build the (large) pages tree.
fs.writeFileSync(path.join(outRoot, '.nojekyll'), '');

if (nameArg) {
  const version = nameArg.replace(/^v/, '').split('.');
  // Exact patch dir: /<M>/<m>/<p>/
  writeStubs(path.join(outRoot, ...version));
  // Documented `latest` shortcuts: /latest/, /<M>/latest/, /<M>/<m>/latest/
  for (let i = 0; i < version.length; i += 1) {
    writeStubs(path.join(outRoot, ...version.slice(0, i), 'latest'));
  }
  console.log(`Wrote redirect stubs for ${version.join('.')} into ${OUT}/ (index.js + dynamic-import.js)`);
} else {
  console.log(`No --name= supplied; wrote only ${OUT}/.nojekyll`);
}
