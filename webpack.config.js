const webpack = require("webpack");
const WorkerPlugin = require('worker-plugin');

module.exports = {
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.worker\.ts$/,
                loader: 'worker-loader',
                options: {
                    inline: 'no-fallback'
                }
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader'
                }
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'ts-loader'
                }
            },
            {
                test: /\.(wgsl)$/,
                use: {
                    loader: 'ts-shader-loader'
                }
            },
            {
                test: /\.(glsl)$/,
                use: {
                    loader: 'ts-shader-loader'
                }
            },
            // {
            //     test: /\.worker\.ts$/,
            //     type: 'asset/source',
            // },
            {
                test: /\.wasm$/,
                type: 'asset/source',
            },
            // {
            //     test: /\.wasm$/,
            //     type: "asset/inline",
            //     use: {
            //         loader: 'file-loader',
            //         options: {
            //             name: '[name].[ext]',
            //         },
            //     },
            // },
        ]
    },
    // plugins: [
    //     new WorkerPlugin()
    // ],
    output: {
        filename: "ventea.js",
        libraryTarget: "module"
    },
    experiments: {
        outputModule: true
    },
    devtool: false,
    resolve: {
        extensions: ['.ts', '.js']
    }
};