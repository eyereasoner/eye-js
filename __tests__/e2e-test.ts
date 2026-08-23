import type { Server } from 'http';
import { firefox, chromium, type BrowserType } from 'playwright';
import { createTestApp } from '../__test_utils__/serve';
import { data } from '../data/socrates';

// Generous timeout for the reasoner to produce a result on slow CI runners,
// kept within the overall 120s jest timeout of each test below
const RESULT_TIMEOUT = 90_000;

describe('Testing browsers', () => {
  let server: Server;

  // Create the server
  beforeAll(() => {
    const app = createTestApp();
    server = app.listen(3001);
  });

  afterAll(async () => {
    await new Promise((res, rej) => {
      server.on('close', res);
      server.on('error', rej);
      server.close(res);
    });
  });

  ([[firefox, 'firefox'], [chromium, 'chromium']] as [BrowserType<{}>, string][]).forEach(
    ([browserType, browserName]) => {
      it(`should be able to call the execute function in ${browserName}`, async () => {
        const browser = await browserType.launch();

        // Ensure the browser is always closed, even when an expectation fails;
        // a leaked browser stops the jest worker from exiting and hangs CI
        try {
          const page = await browser.newPage();

          await page.goto('http://localhost:3001/');
          await expect(page.textContent('textarea[id=data]').then((r) => r?.trim())).resolves.toEqual(data.trim());
          await expect(page.textContent('div[id=result]').then((r) => r?.trim())).resolves.toEqual('');

          await page.click('button[id=execute]');
          // Wait for the reasoner to insert the result into the DOM rather
          // than sleeping for a fixed amount of time
          await page.waitForFunction(
            () => (document.querySelector('div[id=result]')?.textContent ?? '').trim() !== '',
            undefined,
            { timeout: RESULT_TIMEOUT },
          );

          await expect(page.textContent('textarea[id=data]').then((r) => r?.trim())).resolves.toEqual(data.trim());
          await expect(page.textContent('div[id=result]').then((r) => r?.trim())).resolves.toEqual('@prefix : .:Socrates a :Mortal.');

          await page.click('button[id=clear]');
          // Wait for the result to be removed from the DOM
          await page.waitForFunction(
            () => (document.querySelector('div[id=result]')?.textContent ?? '').trim() === '',
            undefined,
            { timeout: RESULT_TIMEOUT },
          );

          await expect(page.textContent('textarea[id=data]').then((r) => r?.trim())).resolves.toEqual(data.trim());
          await expect(page.textContent('div[id=result]').then((r) => r?.trim())).resolves.toEqual('');
        } finally {
          await browser.close();
        }
      }, 120_000);
    },
  );
});
