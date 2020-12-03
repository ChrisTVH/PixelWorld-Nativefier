const path = require('path');

module.exports = {
  target: 'node',
  entry: './src/main.ts',
  devtool: 'source-map', // https://webpack.js.org/configuration/devtool/
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader', // https://webpack.js.org/guides/typescript/
        exclude: /node_modules/,
      },
    ],
  },
  // No te burles de __dirname; https://webpack.js.org/configuration/node/#root
  node: {
    __dirname: false,
  },
  // Evite la agrupación de determinados paquetes importados y, en su lugar, recupere estos
  // departamentos externos en tiempo de ejecución. Esto es lo que queremos para el electrón, colocado en el
  // app por electron-packager. https://webpack.js.org/configuration/externals/
  externals: {
    electron: 'commonjs electron',
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'lib'),
  },
  mode: 'none'
};