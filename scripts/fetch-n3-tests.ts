/**
 * Fetches the W3C N3 test suite (https://github.com/w3c/N3) at a pinned commit
 * into a local, git-ignored cache directory so the reasoning spec tests
 * (__tests__/spec/spec-test.ts) can run against it without the suite being
 * committed to this repo.
 *
 * In CI the cache directory is persisted with actions/cache keyed on this
 * pinned commit (see .github/workflows/nodejs.yml), so the download only
 * happens on a cache miss. Locally, re-running is a no-op once the suite is
 * present. Set N3_TESTS_DIR to override the cache location (must match the
 * runner and the CI cache path).
 */
import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Pinned upstream commit of w3c/N3. Bump this (and let the CI cache key, which
// hashes this file, refresh) to pull in new/updated tests.
export const N3_TESTS_COMMIT = '97653d42da0cd272289ce86f79208d4f0febdde9';

export const cacheDir = process.env.N3_TESTS_DIR
  ?? path.join(__dirname, '..', '__tests__', 'spec', '.w3c-n3-tests');

// The subtree of the upstream repo the reasoning suite reads from.
const SUBTREE = 'tests/N3Tests';

async function main() {
  const manifest = path.join(cacheDir, 'manifest-reasoner.ttl');
  if (fs.existsSync(manifest)) {
    // Already fetched (local re-run or CI cache hit).
    process.stdout.write(`N3 test suite already present at ${cacheDir}\n`);
    return;
  }

  process.stdout.write(`Fetching w3c/N3@${N3_TESTS_COMMIT} into ${cacheDir}\n`);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'n3-tests-'));
  const tarball = path.join(tmp, 'n3.tar.gz');

  try {
    const url = `https://codeload.github.com/w3c/N3/tar.gz/${N3_TESTS_COMMIT}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
    }
    fs.writeFileSync(tarball, new Uint8Array(await res.arrayBuffer()));

    // Extract only the reasoning-tests subtree, stripping the
    // `N3-<commit>/tests/N3Tests/` prefix so files land directly in cacheDir.
    fs.mkdirSync(cacheDir, { recursive: true });
    execFileSync('tar', [
      '-xzf', tarball,
      '-C', cacheDir,
      '--strip-components', '3',
      `N3-${N3_TESTS_COMMIT}/${SUBTREE}`,
    ], { stdio: 'inherit' });

    if (!fs.existsSync(manifest)) {
      throw new Error(`Extraction did not produce ${manifest}`);
    }
    process.stdout.write('N3 test suite ready\n');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// Only fetch when run directly (`ts-node scripts/fetch-n3-tests`), not when
// the spec-test runner imports this module for `cacheDir` / `N3_TESTS_COMMIT`.
if (require.main === module) {
  main().catch((err) => {
    process.stderr.write(`${err instanceof Error ? err.stack : String(err)}\n`);
    process.exitCode = 1;
  });
}
