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
    res.setHeader('content-type', 'text/javascript');
    fs.createReadStream(path.join(__dirname, '..', 'bundle', 'index.js')).pipe(res);
  });

  return app;
}
