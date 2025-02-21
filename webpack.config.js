const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	entry: {
		background: './src/background/index.ts',
		popup: './src/popup/index.ts'
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name]/index.js'
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: ['.ts', '.js'],
		alias: {
			'@': path.resolve(__dirname, 'src')
		}
	},
	plugins: [
		new CopyPlugin({
			patterns: [
				{ 
					from: 'src/popup/popup.html',
					to: 'popup/popup.html'
				},
				{ 
					from: 'src/popup/styles',
					to: 'popup/styles'
				},
				{ 
					from: 'manifest.json',
					to: 'manifest.json'
				},
				{
					from: 'icons',
					to: 'icons'
				}
			]
		})
	],
	optimization: {
		splitChunks: {
			chunks: 'all'
		}
	},
	devtool: 'source-map'
};