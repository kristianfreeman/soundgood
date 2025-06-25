# SoundGood 🎙️

Professional audio enhancement for developer videos. Automatically improve your video's audio quality with customizable compression, filtering, and loudness normalization.

![SoundGood Screenshot](assets/screenshot.png)

## Features

- 🎬 **Drag & Drop Interface** - Simply drop your video file to get started
- 🎚️ **Professional Audio Processing**
  - High-pass filter to remove low-frequency rumble
  - Dynamic compression for consistent volume
  - EBU R128 loudness normalization
- 🎯 **Presets** - Light, Standard, Aggressive, and Ultra processing options
- 🔄 **A/B Comparison** - Toggle between original and enhanced audio
- 💾 **Auto-save** - Processed videos saved with `_soundgood` suffix
- 🎨 **Clean UI** - Minimalist interface with collapsible sections

## Installation

### Download Pre-built Releases

Download the latest release for your platform from the [Releases](https://github.com/kristianfreeman/soundgood/releases) page:

- **macOS**: Download the `.dmg` file (Universal - works on Intel and Apple Silicon)
- **Windows**: Download the `.exe` installer
- **Linux**: Download the `.AppImage` file

### Build from Source

Requirements:
- Node.js 18 or higher
- npm or yarn

```bash
# Clone the repository
git clone https://github.com/kristianfreeman/soundgood.git
cd soundgood

# Install dependencies
npm install

# Run in development
npm start

# Build for your platform
npm run dist
```

## Usage

1. **Load a Video**
   - Drag and drop a video file onto the dropzone
   - Or click to browse and select a file

2. **Adjust Settings** (optional)
   - Choose a preset or customize individual parameters
   - **High-Pass Filter**: Remove low-frequency noise (20-200 Hz)
   - **Compression**: Control dynamic range
     - Threshold: When compression starts (-60 to 0 dB)
     - Ratio: How much to compress (1:1 to 20:1)
     - Attack/Release: How fast compression responds
     - Makeup Gain: Boost overall level after compression
   - **Loudness Normalization**: Target volume level (-30 to -6 LUFS)

3. **Process & Compare**
   - Processing starts automatically when you drop a file
   - Click the toggle button to A/B compare original vs enhanced
   - Your enhanced video is automatically saved

## Audio Processing Details

SoundGood uses FFmpeg with the following audio chain:

1. **High-Pass Filter** - Removes rumble and low-frequency noise
2. **Dynamic Compression** - Evens out volume levels
3. **Loudness Normalization** - Ensures consistent playback volume across platforms

### Presets

- **Light**: Gentle enhancement for already good audio
- **Standard**: Balanced processing for most videos
- **Aggressive**: Strong processing for poor audio conditions
- **Ultra**: Maximum processing for challenging audio

## Development

```bash
# Install dependencies
npm install

# Run in development with TypeScript watch mode
npm run dev

# Compile TypeScript
npm run compile

# Build distributables
npm run build

# Run tests (when implemented)
npm test
```

### Project Structure

```
soundgood/
├── src/
│   ├── main.ts         # Electron main process
│   └── renderer.ts     # UI and interaction logic
├── dist/               # Compiled JavaScript (git ignored)
├── assets/             # Icons and images
├── build-config/       # Build configuration files
└── index.html          # Main UI
```

### Technologies

- **Electron** - Cross-platform desktop app framework
- **TypeScript** - Type-safe JavaScript
- **FFmpeg** - Audio/video processing
- **Font Awesome** - Icon library

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Building Releases

Releases are automatically built when you push a version tag:

```bash
git tag v1.0.1
git push origin v1.0.1
```

GitHub Actions will build for all platforms and create a release.

## License

[MIT License](LICENSE) - feel free to use this in your own projects!

## Troubleshooting

### "App can't be opened" on macOS
The app isn't code-signed yet. Right-click the app and select "Open" to bypass Gatekeeper.

### Video won't process
- Ensure your video has an audio track
- Try a different video format (MP4 recommended)
- Check the console for error messages

### Audio sounds distorted
- Try a lighter preset
- Reduce the compression ratio
- Lower the makeup gain

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Audio processing powered by [FFmpeg](https://ffmpeg.org/)
- Icons from [Font Awesome](https://fontawesome.com/)

---

Made with ❤️ for developers who want their screencasts to sound professional