const { override, addWebpackAlias, addWebpackPlugin } = require('customize-cra');
const webpack = require('webpack');

module.exports = function override(config, env) {
  // Добавляем полифиллы
  config.resolve.fallback = {
    ...config.resolve.fallback,
    assert: require.resolve('assert/'),
    buffer: require.resolve('buffer/'),
    url: require.resolve('url/'),
    querystring: require.resolve('querystring-es3'),
    process: require.resolve('process/browser.js'),
    stream: require.resolve('stream-browserify'),
    zlib: require.resolve('browserify-zlib'),
    path: require.resolve('path-browserify'),
    fs: false,
    crypto: require.resolve('crypto-browserify')
  };
  
  // Добавляем плагины
  config.plugins = [
    ...config.plugins,
    new webpack.ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer']
    })
  ];

  return config;
};