const express = require('express');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

module.exports.createTestApp = function createTestApp() {
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
    res.setHeader('content-type', 'text/javascript; charset=utf-8');
    fs.createReadStream(path.join(__dirname, '..', 'bundle', 'index.js')).pipe(res);
  });

  return app;
}

// Serves the release artifact shape (bundle/latest/) the same way the GitHub
// Pages branch does: as a plain static directory. Any chunk or asset that the
// published bundle requests at runtime must therefore actually exist in the
// released file set, or the test pages fail to load.
module.exports.createDistTestApp = function createDistTestApp() {
  const app = express();

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1_000,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);

  // Serve the real prebuilt example (examples/prebuilt/index.html) rather than
  // a test-only copy of it, so the example itself is under test and there is a
  // single source of truth for script-tag consumption. The only change made --
  // at serve time, never to the committed example -- is pointing its script tag
  // at the locally built release artifact instead of the published GitHub Pages
  // bundle.
  app.get('/', (_, res) => {
    const example = fs.readFileSync(path.join(__dirname, '..', 'examples', 'prebuilt', 'index.html'), 'utf-8');
    const rewritten = example.replace(
      /src="https:\/\/eyereasoner\.github\.io\/eye-js\/[^"]+\/index\.js"/,
      'src="/latest/index.js"',
    );
    if (rewritten === example) {
      // Fail loudly: without the rewrite the page would silently load the
      // *published* bundle over the network and the test would not be testing
      // the freshly built dist at all
      throw new Error('Could not find the GitHub Pages script src in examples/prebuilt/index.html to point at the local dist');
    }
    res.setHeader('content-type', 'text/html');
    res.send(rewritten);
  });

  app.get('/dynamic-import', (_, res) => {
    res.setHeader('content-type', 'text/html');
    fs.createReadStream(path.join(__dirname, 'dist-dynamic-import.html')).pipe(res);
  });

  // express.static sets `Content-Type: text/javascript; charset=utf-8`, which
  // is required for WASM streaming instantiation (see "Serving Files" in the README)
  app.use('/latest', express.static(path.join(__dirname, '..', 'bundle', 'latest')));

  return app;
}
