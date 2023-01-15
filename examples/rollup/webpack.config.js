const path = require('path');

module.exports = {
  mode: 'production',
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'server'),
  },
  resolve: {
    fallback: {
      path: false,
      fs: false,
    }
  }
};
