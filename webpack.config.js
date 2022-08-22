
const path = require('path');
const webpack = require("webpack");

module.exports = (env) => {
    /** @type {import('webpack').Configuration} */
    const config = {
        mode: 'development',
        target: 'node',
        entry: './src/index.js',
        output: {
            path: path.resolve(__dirname, "dist"),
        },
        plugins: [
            new webpack.CleanPlugin(),
        ],
        devtool: 'source-map',
        optimization: {
            splitChunks: {
                minSize: 0
            }
        }
    };
    if (env.wmf) {
        config.plugins.push(new webpack.container.ModuleFederationPlugin({
            name: "mainApp",
            shared: {
                'is-odd': { eager: true, singleton: true, version: '3.0.1', requiredVersion: '*' },
                'is-number': { eager: true, singleton: true, version: '3.0.1', requiredVersion: '*' }
            },
            remoteType: "node-commonjs"
        }));
    }
    return config;
};