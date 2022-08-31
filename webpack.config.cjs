const path = require('path');

const common = {
  entry: './src/main.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, './build/src'),
  },
  plugins: [
    {
      apply: compiler => {
        compiler.hooks.afterCompile.tap("transfer", compilation => {
          require('child_process').fork('./sync/transfer.js');
        })
      }
    }
  ]
};

module.exports = [
  {
    ...common,
    devtool: "inline-source-map",
    name: 'dev',
  },
  {
    ...common,
    name: 'prod'
  }
];
