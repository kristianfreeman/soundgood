# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm install` - Install dependencies
- `npm start` - Compile TypeScript and launch the Electron app
- `npm run compile` - Compile TypeScript files only
- `npm run dev` - Watch mode for TypeScript compilation
- `npm run build` - Build distributable for current platform
- `npm run dist` - Build distributable without publishing

### TypeScript Configuration
- Source files are in `src/` directory
- Compiled output goes to `dist/` directory
- Strict TypeScript settings are enabled

## Architecture

### Overview
SoundGood is an Electron desktop application for audio enhancement of developer videos. It uses ffmpeg for audio processing with customizable filters.

### Core Components

1. **Main Process** (`src/main.ts`)
   - Creates the Electron window (1400x900, min 1200x700)
   - Handles IPC communication with renderer
   - Implements ffmpeg audio processing pipeline
   - IPC handlers: `process-video`, `open-file-dialog`, `show-in-folder`

2. **Renderer Process** (`src/renderer.ts`)
   - UI event handling and state management
   - Video file selection via drag-drop or file dialog
   - Settings management with presets (Light, Standard, Aggressive, Ultra)
   - A/B audio comparison between original and processed
   - Auto-saves processed videos with `_soundgood` suffix

3. **Audio Processing Pipeline**
   - High-pass filter (configurable frequency)
   - Dynamic compression (acompressor with threshold, ratio, attack, release, makeup)
   - Loudness normalization (EBU R128 standard, configurable LUFS target)
   - All filters are optional and configurable

### Key Features
- Drag-and-drop video loading
- Real-time parameter adjustment with visual feedback
- Automatic processing on file drop
- Settings change detection with regenerate option
- Collapsible UI sections for better organization
- Custom Mostwasted font for branding

### UI Structure
- Main video container (16:9 aspect ratio)
- Sidebar (320px) with black background containing:
  - Preset selector with icons
  - Audio processing controls
  - Result display with file operations

### Important Notes
- Uses `nodeIntegration: true` and `contextIsolation: false` for Electron
- FFmpeg binaries are bundled via ffmpeg-static
- Font Awesome icons loaded locally from node_modules
- Threshold values converted from dB to linear for ffmpeg
- Attack/release times in milliseconds for acompressor