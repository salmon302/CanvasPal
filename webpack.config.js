const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
	entry: {
		background: './src/background/index.ts',
		popup: './src/popup/index.ts',
		contentScript: './src/contentScript/index.ts'
	},
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name]/index.js'
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
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
					from: 'src/popup/styles/popup.css',
					to: 'popup/styles/popup.css'
				},
				{ 
					from: 'manifest.json',
					to: 'manifest.json'
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