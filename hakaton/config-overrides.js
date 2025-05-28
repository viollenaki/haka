const { override } = require('customize-cra');
const webpack = require('webpack');

module.exports = function override(config) {
  // Добавляем полифиллы
  config.resolve = {
    ...config.resolve,
    fallback: {
      ...config.resolve?.fallback,
      "process": require.resolve("process/browser.js"), // Важно указать .js
      "buffer": require.resolve("buffer/"),
      "assert": require.resolve("assert/"),
      "stream": require.resolve("stream-browserify"),
      "path": require.resolve("path-browserify"),
      "crypto": require.resolve("crypto-browserify"),
      "fs": false,
      "os": false
    },
    alias: {
      ...config.resolve?.alias,
      'process/browser': require.resolve('process/browser.js'),
    }
  };

  // Добавляем плагины
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: ['process/browser.js'], // Важно указать .js
      Buffer: ['buffer', 'Buffer']
    })
  ];

  // Добавляем обработку ESM-модулей
  config.module.rules.push({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false // Отключаем требование полного указания путей для ESM
    }
  });

  return config;
};