const webpack = require('webpack')

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', 'webpack'],
    plugins: [
      require('karma-jasmine'),
      require('karma-webpack'),
      require('karma-chrome-launcher'),
      require('karma-jsdom-launcher'),
      require('karma-coverage')
    ],
    files: [
      { pattern: 'test/setup.js', watched: false },
      { pattern: 'test/**/*.spec.jsx', watched: false },
      { pattern: 'test/**/*.spec.js', watched: false }
    ],
    preprocessors: {
      'test/setup.js': ['webpack'],
      'test/**/*.spec.js*': ['webpack']
    },
    webpack: {
      mode: 'development',
      devtool: false,
      plugins: [
        new webpack.DefinePlugin({
          'globalThis.VITE_API_URL': JSON.stringify('/api/v1')
        })
      ],
      resolve: { extensions: ['.js', '.jsx'] },
      module: {
        rules: [{
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }]],
              plugins: [['babel-plugin-istanbul', { exclude: ['test/**', '**/*.spec.*'] }]]
            }
          }
        }]
      }
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: 'coverage',
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'text-summary' },
        { type: 'text' },
        { type: 'json-summary', subdir: '.', file: 'resumen.json' }
      ]
    },
    // jsdom es el navegador por defecto: no se requiere Chrome instalado.
    browsers: ['jsdom'],
    singleRun: true,
    restartOnFileChange: false
  })
}
