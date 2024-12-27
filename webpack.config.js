const webpack = require('webpack');
const path = require('path');


module.exports = {
  resolve: {
    fallback: {
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      zlib: require.resolve('browserify-zlib'),
      util: require.resolve('util/'),
      timers: require.resolve('timers-browserify'),
      url: require.resolve('url/'),
      net: false,
      tls: false,
      buffer: require.resolve('buffer/'),
      process: require.resolve('process/browser'),
    },
    extensions: ['.js', '.jsx', '.json'], // Extensiones para simplificar las importaciones
  },
  module: {
    rules: [
      {
        test: /\.m?js$/, // Archivos que pueden ser ESM o CommonJS
        resolve: {
          fullySpecified: false, // Permite que las importaciones no tengan que ser completamente especificadas
        },
          test: /\.js$/,
          enforce: 'pre',
          use: ['source-map-loader'],
      },
    ],
  },
  plugins: [
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ],
};
