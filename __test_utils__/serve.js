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

  app.get('/', (_, res) => {
    res.setHeader('content-type', 'text/html');
    fs.createReadStream(path.join(__dirname, 'dist-script-tag.html')).pipe(res);
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
