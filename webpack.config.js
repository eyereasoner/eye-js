const path = require('path');

const version = process.argv.find(name => name.startsWith('--name='))?.slice(8);

module.exports = {
  mode: 'production',
  entry: './dist/index.js',
  output: {
    library: "eyereasoner",
    filename: 'index.js',
    path: path.resolve(__dirname, 'bundle', ...(version ? version.split('.') : [])),
  },
  resolve: {
    fallback: {
      path: false,
      fs: false,
      crypto: false,
    }
  },
};
