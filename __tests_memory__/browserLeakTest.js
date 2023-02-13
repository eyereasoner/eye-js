const { run } = require('@memlab/api');
const { createTestApp } = require('../__test_utils__/serve')

async function main() {
  const app = createTestApp();
  const server = app.listen(3000);

  const leaks = await run({scenario: {
    url: () => 'http://localhost:3000/',
    action: async page => {
      for (let i = 0; i < 200; i += 1) {
        await page.click('button[id=execute]')
      }
    },
    back: page => page.click('button[id=clear]'),
    repeat: () => 5,
  }});

  server.close();

  if (leaks.leaks.length > 0) {
    throw new Error('Memory Leaks Found')
  };
}

main();
