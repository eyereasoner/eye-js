const express = require('express');
const fs = require('fs');
const path = require('path');
const {run} = require('@memlab/api');
const rateLimit = require('express-rate-limit');

const app = express();

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 1_000,
	standardHeaders: true,
	legacyHeaders: false,
});

app.use(limiter);

app.get('/', (_, res) => {
  res.setHeader('content-type', 'text/html');
  fs.createReadStream(path.join(__dirname, 'browser.html')).pipe(res);
});

app.get('/index.js', (_, res) => {
  res.setHeader('content-type', 'text/javascript');
  fs.createReadStream(path.join(__dirname, '..', 'bundle', 'index.js')).pipe(res);
});

async function main() {
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
