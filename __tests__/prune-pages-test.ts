import fs from 'fs';
import os from 'os';
import path from 'path';
import { prunePagesTree } from '../scripts/prune-pages';

// Mirrors the layout of the `pages` branch: per-patch bundle dirs, `latest`
// copies at every level, the deployed example and the benchmark data
// (dev/bench) written by a separate workflow.
const fixtureFiles = [
  '.nojekyll',
  'latest/index.js',
  'latest/dynamic-import.js',
  '4/latest/index.js',
  '4/10/latest/index.js',
  '4/10/1/index.js',
  '4/10/1/dynamic-import.js',
  '4/10/2/index.js',
  '4/10/3/index.js',
  '4/10/3/dynamic-import.js',
  '4/9/9/index.js',
  '4/9/latest/index.js',
  '3/22/0/index.js',
  '3/22/latest/index.js',
  '3/latest/index.js',
  'example/index.html',
  'dev/bench/data.js',
  'dev/bench/index.html',
];

function makeFixture(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'eye-js-pages-'));
  for (const file of fixtureFiles) {
    fs.mkdirSync(path.join(root, path.dirname(file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), `content of ${file}`);
  }
  return root;
}

function listFiles(root: string, prefix = ''): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(path.join(root, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(root, relative));
    } else {
      files.push(relative);
    }
  }
  return files.sort();
}

describe('prunePagesTree', () => {
  let root: string;

  beforeEach(() => {
    root = makeFixture();
  });

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('removes only the superseded patch dirs of the released minor', () => {
    const { removed, kept } = prunePagesTree(root, '4.10.3');

    expect(removed).toEqual([path.join('4', '10', '1'), path.join('4', '10', '2')]);
    expect(kept).toEqual([path.join('4', '10', '3'), path.join('4', '10', 'latest')]);
    expect(listFiles(root)).toEqual(fixtureFiles
      .filter((file) => !file.startsWith('4/10/1/') && !file.startsWith('4/10/2/'))
      .map((file) => path.join(...file.split('/')))
      .sort());
  });

  it('does not delete anything on a dry run but still reports the plan', () => {
    const before = listFiles(root);
    const { removed } = prunePagesTree(root, '4.10.3', true);

    expect(removed).toEqual([path.join('4', '10', '1'), path.join('4', '10', '2')]);
    expect(listFiles(root)).toEqual(before);
  });

  it('is a no-op for a minor version with no directory yet', () => {
    const before = listFiles(root);
    const { removed, kept } = prunePagesTree(root, '5.0.0');

    expect(removed).toEqual([]);
    expect(kept).toEqual([]);
    expect(listFiles(root)).toEqual(before);
  });

  it('is a no-op when the released patch is the only one', () => {
    const before = listFiles(root);
    const { removed, kept } = prunePagesTree(root, '3.22.0');

    expect(removed).toEqual([]);
    expect(kept).toEqual([path.join('3', '22', '0'), path.join('3', '22', 'latest')]);
    expect(listFiles(root)).toEqual(before);
  });

  it('rejects malformed versions', () => {
    expect(() => prunePagesTree(root, '4.10')).toThrow(/major\.minor\.patch/);
    expect(() => prunePagesTree(root, 'v4.10.3')).toThrow(/major\.minor\.patch/);
    expect(() => prunePagesTree(root, '4.10.x')).toThrow(/major\.minor\.patch/);
    expect(() => prunePagesTree(root, '../dev.0.0')).toThrow(/major\.minor\.patch/);
  });

  it('rejects a missing pages root', () => {
    expect(() => prunePagesTree(path.join(root, 'nope'), '4.10.3')).toThrow(/does not exist/);
  });
});
