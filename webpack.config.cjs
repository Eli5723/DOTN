const webpack = require('webpack');
const path = require('path');

module.exports = {
    // Building Client
    entry: './src/Client.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'client.bundle.js',
    },

    // Development Settings
    mode:"development",

    devtool: 'source-map',

    devServer: {
        static: {
          directory: path.join(__dirname, 'dist'),
        },
        compress: false,
        port: 8080,
        hot: false,
      },

    plugins:[
        new webpack.DefinePlugin({
            GAME_ADDRESS: JSON.stringify("127.0.0.1"),
            GAME_PORT: JSON.stringify("8000")
        })
    ]
};