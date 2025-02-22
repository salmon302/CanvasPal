# CanvasPal

A Chrome extension that helps students prioritize Canvas assignments based on due dates, grade weights, and grade impact.

## Features

- 🎯 Smart Assignment Prioritization
  - Considers due dates, grade weights, and potential grade impact
  - Customizable priority weights
  - Visual priority indicators
- 📅 Seamless Canvas Integration
  - Works with Canvas iCalendar feed
  - Real-time grade data integration
  - Automatic assignment detection
- 🎨 User-Friendly Interface
  - Color-coded priority levels
  - Detailed assignment information
  - Easy configuration options

## Prerequisites

- Google Chrome browser
- Canvas LMS access
- Canvas iCalendar feed URL

## Installation

### For Users
1. Download the latest release from the Chrome Web Store (Coming Soon)
2. Click "Add to Chrome"
3. Follow the configuration steps below

### For Development
1. Clone the repository:
```bash
git clone https://github.com/yourusername/CanvasPal.git
```
2. Install dependencies:
```bash
npm install
```
3. Build the development version:
```bash
npm run build:dev
```
4. Load the extension in Chrome:
   - Open chrome://extensions
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` directory

## Development

- `npm run build:dev` - Build development version with watch mode
- `npm run build:prod` - Build production version
- `npm test` - Run tests
- `npm run lint` - Run linting

## Building for Production

1. Update version in `manifest.json`
2. Run: `npm run build:prod`
3. The production-ready extension will be in the `dist` directory

## Configuration

1. Click the CanvasPal icon in Chrome
2. Open settings
3. Enter your Canvas iCalendar feed URL:
   - Go to Canvas Calendar
   - Click "Calendar Feed"
   - Copy the URL
4. Adjust priority weights (optional):
   - Due Date Weight
   - Grade Weight
   - Grade Impact Weight
5. Save settings

## Priority Algorithm

CanvasPal uses a sophisticated algorithm to prioritize assignments:
```
Priority = (Due Date Factor * Due Date Weight) +
          (Grade Weight Factor * Grade Weight) +
          (Impact Factor * Impact Weight)
```
Where:
- Due Date Factor = 1 - (Time Remaining / Total Time)
- Grade Weight Factor = Assignment Weight / 100
- Impact Factor = Potential Grade Impact / 100

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE)

## Support

For bug reports and feature requests, please [open an issue](https://github.com/yourusername/CanvasPal/issues).
