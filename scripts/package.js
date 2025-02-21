const fs = require('fs');
const path = require('path');

function checkRequiredFiles() {
	const requiredFiles = [
		'dist/background/index.js',
		'dist/popup/popup.html',
		'dist/popup/styles/popup.css',
		'dist/contentScript/index.js',
		'manifest.json'
	];

	const requiredIcons = [
		'icons/icon16.png',
		'icons/icon48.png',
		'icons/icon128.png'
	];

	console.log('Checking required files...');
	
	// Check dist files
	requiredFiles.forEach(file => {
		if (!fs.existsSync(path.join(__dirname, '..', file))) {
			console.error(`Missing required file: ${file}`);
			process.exit(1);
		}
	});

	// Check icons
	let missingIcons = false;
	requiredIcons.forEach(icon => {
		if (!fs.existsSync(path.join(__dirname, '..', icon))) {
			console.warn(`Warning: Missing icon file: ${icon}`);
			console.warn('Please create icon files before publishing the extension.');
			missingIcons = true;
		}
	});

	if (missingIcons) {
		console.log('\nIcon Requirements:');
		console.log('- icon16.png (16x16)');
		console.log('- icon48.png (48x48)');
		console.log('- icon128.png (128x128)');
		console.log('\nPlease add these files to the icons directory.');
	}

	console.log('File check complete.');
}

// Run checks
checkRequiredFiles();