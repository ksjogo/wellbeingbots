var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    'webpack-dev-server/client?http://localhost:3000',
    'webpack/hot/only-dev-server',
    './src/index'
  ],
  plugins: [
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.SourceMapDevToolPlugin({
      filename: '[name].map'
    })
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx']
  },
  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: true,
              plugins: ['react-hot-loader/babel'],
            },
          },
          {
            loader: "awesome-typescript-loader"
          },
        ],
        include: path.join(__dirname, 'src')
      }, {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
    ]
  }
};
