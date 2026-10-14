/* eslint-disable no-console */
// Prunes superseded per-patch bundle directories from a checkout of the
// `pages` branch. When version x.y.z is published, every other numeric patch
// directory of the same minor version (x/y/<patch>) is removed, so per-minor
// storage stays bounded at one patch directory plus the `latest` copies.
//
// Only entries directly under <root>/<major>/<minor>/ whose names are plain
// numbers are ever touched; `latest` copies (latest/, <major>/latest/,
// <major>/<minor>/latest/), other minors/majors, `example/` and `dev/bench`
// (written by the benchmark workflow) are never modified.
// See https://github.com/eyereasoner/eye-js/issues/1845
import fs from 'fs';
import path from 'path';

export interface PruneResult {
  /** Paths (relative to root) that were removed (or would be, on a dry run) */
  removed: string[];
  /** Paths (relative to root) within the minor dir that were kept */
  kept: string[];
}

export function prunePagesTree(root: string, version: string, dryRun = false): PruneResult {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  if (!match) {
    throw new Error(`Expected a numeric version of the form major.minor.patch, got "${version}"`);
  }
  const [, major, minor, patch] = match;

  if (!fs.existsSync(root)) {
    throw new Error(`Pages root "${root}" does not exist`);
  }

  const removed: string[] = [];
  const kept: string[] = [];
  const minorDir = path.join(root, major, minor);

  if (fs.existsSync(minorDir)) {
    for (const entry of fs.readdirSync(minorDir, { withFileTypes: true })) {
      const relative = path.join(major, minor, entry.name);
      if (entry.isDirectory() && /^\d+$/.test(entry.name) && entry.name !== patch) {
        removed.push(relative);
        if (!dryRun) {
          fs.rmSync(path.join(minorDir, entry.name), { recursive: true, force: true });
        }
      } else {
        kept.push(relative);
      }
    }
  }

  return { removed: removed.sort(), kept: kept.sort() };
}

if (require.main === module) {
  const version = process.argv.find((arg) => arg.startsWith('--name='))?.slice(8);
  const root = process.argv.find((arg) => arg.startsWith('--root='))?.slice(7);
  const dryRun = process.argv.includes('--dry-run');

  if (!version || !root) {
    console.error('Usage: ts-node scripts/prune-pages --name=vX.Y.Z --root=<pages checkout> [--dry-run]');
    process.exit(1);
  }

  const { removed, kept } = prunePagesTree(root, version, dryRun);
  console.log(`${dryRun ? 'Would remove' : 'Removed'} ${removed.length} superseded patch dir(s) for v${version}:`);
  for (const dir of removed) {
    console.log(`  - ${dir}`);
  }
  console.log(`Kept within this minor: ${kept.join(', ') || '(none)'}`);
}
