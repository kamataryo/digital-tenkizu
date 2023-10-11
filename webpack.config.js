const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin")


module.exports = {
  mode: 'development',
  entry: './src/main.ts',
  module: {
    rules: [
      { test: /\.ts$/, use: 'ts-loader' },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: 'body',
      template: './public/index.html',
      minify: true,
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "public/tiles", to: "tiles" },
      ],
    }),
  ],
  resolve: {
    extensions: ['.ts', '.js'],
  },
};
