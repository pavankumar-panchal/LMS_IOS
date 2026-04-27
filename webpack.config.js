const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = path.resolve(__dirname);

// Files that need Babel (our src + RN packages that ship non-standard JS)
// @react-navigation packages are already valid ESM — webpack handles them natively, no babel needed
const babelInclude = [
  path.resolve(appDirectory, 'App.tsx'),
  path.resolve(appDirectory, 'src'),
  path.resolve(appDirectory, 'web'),
  path.resolve(appDirectory, 'node_modules/react-native/'),
  path.resolve(appDirectory, 'node_modules/react-native-web/'),
  path.resolve(appDirectory, 'node_modules/react-native-screens/'),
  path.resolve(appDirectory, 'node_modules/react-native-safe-area-context/'),
  path.resolve(appDirectory, 'node_modules/react-native-gesture-handler/'),
  path.resolve(appDirectory, 'node_modules/react-native-reanimated/'),
  path.resolve(appDirectory, 'node_modules/react-native-paper/'),
  path.resolve(appDirectory, 'node_modules/react-native-vector-icons/'),
  path.resolve(appDirectory, 'node_modules/@react-native/assets-registry/'),
];

const babelLoaderConfiguration = {
  test: /\.[jt]sx?$/,
  include: babelInclude,
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: false,
      sourceType: 'unambiguous',
      presets: [
        ['@babel/preset-env', { targets: { browsers: 'last 2 versions' }, modules: false }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      plugins: [
        ['@babel/plugin-transform-class-properties', { loose: true }],
        ['@babel/plugin-transform-private-methods', { loose: true }],
        ['@babel/plugin-transform-private-property-in-object', { loose: true }],
        ['module-resolver', { alias: { 'react-native$': 'react-native-web' } }],
        'react-native-reanimated/plugin',
      ],
    },
  },
};

// @react-navigation packages: already ESM, just needs TypeScript stripped
const navBabelConfiguration = {
  test: /\.[jt]sx?$/,
  include: [
    path.resolve(appDirectory, 'node_modules/@react-navigation/'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: false,
      sourceType: 'module',
      presets: [
        // modules:false = keep ESM, webpack bundles it
        ['@babel/preset-env', { targets: { browsers: 'last 2 versions' }, modules: false }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
    },
  },
};

const imageLoaderConfiguration = {
  test: /\.(gif|jpe?g|png|svg)$/,
  use: { loader: 'url-loader', options: { name: '[name].[ext]' } },
};

module.exports = {
  entry: path.join(appDirectory, 'web/index.js'),
  output: {
    filename: 'bundle.web.js',
    path: path.join(appDirectory, 'web/dist'),
    publicPath: '/',
  },
  resolve: {
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
    alias: {
      'react-native$': 'react-native-web',
      '@react-native-async-storage/async-storage': path.join(appDirectory, 'web/AsyncStorageWeb.js'),
    },
  },
  module: {
    rules: [babelLoaderConfiguration, navBabelConfiguration, imageLoaderConfiguration],
  },
  plugins: [
    new webpack.ProvidePlugin({ process: 'process/browser' }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(true),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    new HtmlWebpackPlugin({
      template: path.join(appDirectory, 'web/index.html'),
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
  },
};
