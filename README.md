# CanvasPal

A Chrome extension that helps students prioritize Canvas assignments based on due dates, grade weights, and grade impact.

## Features

- Prioritized assignment list based on intelligent algorithm
- Integration with Canvas via iCalendar feed
- Grade impact analysis
- Customizable priority weights
- Assignment completion tracking
- Real-time updates

## GUI

The extension provides an intuitive interface through a popup window when clicking the CanvasPal icon in Chrome:

- **Dashboard**: Shows your upcoming assignments sorted by priority
- **Priority Scores**: Visual indicators of assignment importance
- **Due Dates**: Color-coded timeline of submission deadlines
- **Grade Impact**: Visual representation of how each assignment affects your final grade
- **Quick Actions**: Mark assignments as complete, set reminders, or hide items

![CanvasPal Interface](docs/images/canvaspal-interface.png)

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Google Chrome browser

## Installation for Development

1. Clone the repository:
```bash
git clone https://github.com/yourusername/CanvasPal.git
cd CanvasPal
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right
   - Click "Load unpacked"
   - Select the `dist` directory from the project folder

## Installation for Users

1. Download the extension from the Chrome Web Store (link coming soon)
2. Click "Add to Chrome"
3. Accept the permissions

## Development

- Start development server:
```bash
npm run dev
```

- Run tests:
```bash
npm test
```

- Lint code:
```bash
npm run lint
```

## Building for Production

1. Update version in `manifest.json`
2. Build the production version:
```bash
npm run build:prod
```
3. The production-ready extension will be in the `dist` directory

## Configuration

1. Click the CanvasPal icon in Chrome
2. Open settings
3. Enter your Canvas iCalendar feed URL
4. Adjust priority weights (optional)
5. Save settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

[MIT License](LICENSE)

## Support

For bug reports and feature requests, please [open an issue](https://github.com/yourusername/CanvasPal/issues).
