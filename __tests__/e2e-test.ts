import type { Server } from 'http';
import { firefox, chromium, type BrowserType } from 'playwright';
import { createTestApp } from '../__test_utils__/serve';
import { data } from '../data/socrates';

const TIMEOUT = { timeout: 10_000 } as const;

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
        const page = await browser.newPage();

        await page.goto('http://localhost:3001/');
        await expect(page.textContent('textarea[id=data]', TIMEOUT).then((r) => r?.trim())).resolves.toEqual(data.trim());
        await expect(page.textContent('div[id=result]', TIMEOUT).then((r) => r?.trim())).resolves.toEqual('');

        await page.click('button[id=execute]', TIMEOUT);
        // Time for new result to be inserted in the DOM
        await new Promise((res) => { setTimeout(res, 500); });

        await expect(page.textContent('textarea[id=data]', TIMEOUT).then((r) => r?.trim())).resolves.toEqual(data.trim());
        await expect(page.textContent('div[id=result]', TIMEOUT).then((r) => r?.trim())).resolves.toEqual('@prefix : .:Socrates a :Mortal.');

        await page.click('button[id=clear]', TIMEOUT);
        // Time for new result to be inserted in the DOM
        await new Promise((res) => { setTimeout(res, 100); });

        await expect(page.textContent('textarea[id=data]', TIMEOUT).then((r) => r?.trim())).resolves.toEqual(data.trim());
        await expect(page.textContent('div[id=result]', TIMEOUT).then((r) => r?.trim())).resolves.toEqual('');

        await page.close();
        await browser.close();
      }, 120_000);
    },
  );
});
