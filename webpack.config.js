const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        'background/index': './src/background/index.ts',
        'popup/popup': './src/popup/popup.ts',
        'content/gradeScraper': './src/content/gradeScraper.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',  // This will maintain directory structure
        chunkFilename: 'vendors/[name].js'  // Added to control vendor chunk output
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            configFile: path.resolve(__dirname, './tsconfig.json'),
                            onlyCompileBundledFiles: true,
                            transpileOnly: false,
                            logLevel: 'info',
                            compilerOptions: {
                                module: 'esnext',
                                moduleResolution: 'node'
                            }
                        }
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['node_modules', path.resolve(__dirname, 'src')],
        alias: {
            '@': path.resolve(__dirname, 'src')
        }
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                { 
                    from: 'src/popup/popup.html',
                    to: 'popup/popup.html'  // Updated to match manifest structure
                },
                { 
                    from: 'src/popup/popup.css',
                    to: 'popup/popup.css'  // Updated to match manifest structure
                },
                { 
                    from: 'src/settings/settings.html',
                    to: 'settings/settings.html'  // Updated to match manifest structure
                },
                { 
                    from: 'src/settings/settings.css',
                    to: 'settings/settings.css'  // Updated to match manifest structure
                },
                { 
                    from: 'src/manifest.json',
                    to: 'manifest.json'
                },
                {
                    from: 'icons/*.png',
                    to: 'icons/[name][ext]'
                }
            ]
        })
    ],
    optimization: {
        splitChunks: {
            chunks: 'all',
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors/vendor',
                    chunks: 'all'
                }
            }
        }
    },
    devtool: 'source-map',
    stats: {
        errorDetails: true,
        children: true,
        logging: 'verbose'
    }
};