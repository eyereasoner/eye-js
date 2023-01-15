const path = require('path');

const version = process.argv.find(name => name.startsWith('--name='))?.slice(7);

module.exports = {
  mode: 'production',
  entry: './dist/index.js',
  output: {
    filename: version ? version + '.js' : 'bundle.js',
    path: path.resolve(__dirname, 'bundle'),
  },
  resolve: {
    fallback: {
      path: false,
      fs: false,
      crypto: false,
    }
  },
};
