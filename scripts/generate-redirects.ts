/* eslint-disable no-console */
/**
 * ONE-TIME historical backfill of the `pages` redirect tree.
 *
 * Releases used to publish a ~4MB webpack bundle per version to the `pages`
 * branch (served at https://eyereasoner.github.io/eye-js/<M>/<m>/<p>/...),
 * which grew that branch to ~7.5GB. That per-release publishing has stopped
 * entirely: the README now points browser consumers directly at a CDN, so new
 * releases need no Pages files at all. Accordingly this script is NOT wired
 * into CI — it exists to be run ONCE (plus ad-hoc spot fixes) to cover the
 * URLs of versions that were already published.
 *
 * For every version ever published to npm (`--all`), or a single version
 * (`--name=vX.Y.Z`), it writes a pair of tiny self-deriving redirect stubs
 * (redirects/index.js and redirects/dynamic-import.js). Each stub reads its
 * own URL, works out the requested version, and loads the matching build from
 * the CDN. The bytes are identical at every path, so git deduplicates the
 * whole tree to two blobs. Publishing the result to `pages` — ideally as a
 * fresh orphan commit replacing the old bundles — keeps every historical URL
 * answering `200 + JS` while shrinking the branch to a few MB.
 *
 * Usage:
 *   ts-node scripts/generate-redirects --all            # backfill every published version
 *   ts-node scripts/generate-redirects --name=v2.3.14   # a single version (spot fix)
 *   ... [--out=bundle]                                  # output directory (default: bundle)
 *
 * Writes, under <out>/:
 *   <M>/<m>/<p>/{index.js,dynamic-import.js}   (each exact patch version)
 *   latest/, <M>/latest/, <M>/<m>/latest/      (the documented shortcuts)
 *   index.js                                   (the root classic-script URL)
 *   .nojekyll                                  (skip GitHub's Jekyll build)
 */
import path from 'path';
import fs from 'fs';

const ROOT = path.join(__dirname, '..');
const outArg = process.argv.find((a) => a.startsWith('--out='))?.slice(6);
const nameArg = process.argv.find((a) => a.startsWith('--name='))?.slice(8);
const all = process.argv.includes('--all');
const OUT = outArg || 'bundle';

const classicStub = fs.readFileSync(path.join(ROOT, 'redirects', 'index.js'), 'utf8');
const esmStub = fs.readFileSync(path.join(ROOT, 'redirects', 'dynamic-import.js'), 'utf8');

type Version = [major: number, minor: number, patch: number];

function parseVersion(str: string): Version | undefined {
  const match = str.match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : undefined;
}

/** Every stable version of eyereasoner ever published to npm. */
async function publishedVersions(): Promise<Version[]> {
  const res = await fetch('https://registry.npmjs.org/eyereasoner');
  if (!res.ok) {
    throw new Error(`npm registry request failed: ${res.status} ${res.statusText}`);
  }
  const { versions } = await res.json() as { versions: Record<string, unknown> };
  return Object.keys(versions)
    .map(parseVersion)
    .filter((v): v is Version => v !== undefined);
}

function writeStubs(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.js'), classicStub);
  fs.writeFileSync(path.join(dir, 'dynamic-import.js'), esmStub);
}

async function main(): Promise<void> {
  let versions: Version[];
  if (all) {
    versions = await publishedVersions();
  } else if (nameArg) {
    const version = parseVersion(nameArg);
    if (!version) {
      throw new Error(`--name must look like vX.Y.Z (got "${nameArg}")`);
    }
    versions = [version];
  } else {
    console.log('Usage: ts-node scripts/generate-redirects (--all | --name=vX.Y.Z) [--out=bundle]');
    process.exitCode = 1;
    return;
  }

  const outRoot = path.join(ROOT, OUT);
  fs.mkdirSync(outRoot, { recursive: true });
  // `.nojekyll` stops GitHub trying to Jekyll-build the pages tree.
  fs.writeFileSync(path.join(outRoot, '.nojekyll'), '');

  // The stubs derive the version from their own URL, so the `latest` shortcut
  // dirs get the same bytes as everything else — they just need to exist.
  writeStubs(path.join(outRoot, 'latest'));
  // The root https://eyereasoner.github.io/eye-js/index.js (classic only).
  fs.writeFileSync(path.join(outRoot, 'index.js'), classicStub);

  for (const [major, minor, patch] of versions) {
    writeStubs(path.join(outRoot, `${major}`, `${minor}`, `${patch}`));
    writeStubs(path.join(outRoot, `${major}`, 'latest'));
    writeStubs(path.join(outRoot, `${major}`, `${minor}`, 'latest'));
  }

  console.log(`Wrote redirect stubs for ${versions.length} version(s) into ${OUT}/ (index.js + dynamic-import.js)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
