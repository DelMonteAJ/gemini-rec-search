const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const dotenv = require('dotenv');

const env = dotenv.config().parsed || {};
const envKeys = Object.keys(env).reduce((acc, key) => {
  acc[key] = env[key];
  return acc;
}, {});


console.log("envKeys", envKeys);
module.exports = {
  entry: {
    index: './src/index.tsx',
    "service-worker": "./src/service-worker.ts",
    options: "./src/options.tsx"
  },
  output: {
    path: path.resolve('dist'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.module\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: {
                namedExport: false,
                localIdentName: '[name]__[local]___[hash:base64:5]'
              }
            }
          }
        ]
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{ from: 'public', to: '.' }]
    }),
    new webpack.DefinePlugin({
      process: JSON.stringify({ env: envKeys })
    })
  ]
};
