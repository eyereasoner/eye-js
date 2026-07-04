import { execSync } from 'child_process';
import * as fs from 'fs';
import type { Server } from 'http';
import * as path from 'path';
import { firefox, chromium, type BrowserType } from 'playwright';
import { createDistTestApp } from '../__test_utils__/serve';

// Generous timeout for the reasoner to produce a result on slow CI runners,
// kept within the overall 120s jest timeout of each test below
const RESULT_TIMEOUT = 90_000;

const root = path.join(__dirname, '..');
const bundleDir = path.join(root, 'bundle');

describe('Testing the built browser dist', () => {
  let server: Server;

  // Recreate the released artifact shape that consumers load from GitHub Pages
  // (bundle/latest/index.js and bundle/latest/dynamic-import.js). The webpack
  // bundle already exists at bundle/index.js because `npm run test:unit` runs
  // `bundle:webpack` first; the `bundle:latest` release script (the same one the
  // release workflow runs) then derives dynamic-import.js and the latest/ copies.
  beforeAll(() => {
    const webpackBundle = path.join(bundleDir, 'index.js');
    if (!fs.existsSync(webpackBundle)) {
      throw new Error('bundle/index.js is missing; run `npm run bundle:webpack` first (`npm run test:unit` does this automatically)');
    }

    const versionDir = path.join(bundleDir, 'dist-test');
    fs.mkdirSync(versionDir, { recursive: true });
    fs.copyFileSync(webpackBundle, path.join(versionDir, 'index.js'));

    execSync('npm run bundle:latest -- --name=vdist-test', { cwd: root, stdio: 'inherit' });

    server = createDistTestApp().listen(3002);
  }, 120_000);

  afterAll(async () => {
    await new Promise((res, rej) => {
      server.on('close', res);
      server.on('error', rej);
      server.close(res);
    });
  });

  ([[firefox, 'firefox'], [chromium, 'chromium']] as [BrowserType<{}>, string][]).forEach(
    ([browserType, browserName]) => {
      ([
        ['a script tag (latest/index.js)', '/'],
        ['a dynamic import (latest/dynamic-import.js)', '/dynamic-import'],
      ] as [string, string][]).forEach(([mechanism, pagePath]) => {
        it(`should complete a reasoning round-trip via ${mechanism} in ${browserName}`, async () => {
          const browser = await browserType.launch();

          // Ensure the browser is always closed, even when an expectation fails;
          // a leaked browser stops the jest worker from exiting and hangs CI
          try {
            const page = await browser.newPage();

            await page.goto(`http://localhost:3002${pagePath}`);

            // Wait for the page to finish the reasoning round-trip (or to report
            // an error) rather than sleeping for a fixed amount of time
            await page.waitForFunction(
              () => (document.querySelector('div[id=result]')?.textContent ?? '').trim() !== ''
                || (document.querySelector('div[id=error]')?.textContent ?? '').trim() !== '',
              undefined,
              { timeout: RESULT_TIMEOUT },
            );

            await expect(page.textContent('div[id=error]').then((r) => r?.trim())).resolves.toEqual('');
            // The derived triple is not part of the input data, so its presence
            // proves the bundle parsed the input and reasoned over it
            await expect(page.textContent('div[id=result]')).resolves.toContain(':Socrates a :Mortal');
          } finally {
            await browser.close();
          }
        }, 120_000);
      });
    },
  );
});
