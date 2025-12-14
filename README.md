# Messengerify

Unofficial desktop wrapper for Messenger.com built with Electron and TypeScript.

## Features

- **Native Desktop Experience**: Run Messenger as a standalone desktop application
- **Single Instance Lock**: Prevents multiple instances from running simultaneously
- **Custom Window Controls**: Frameless window with custom draggable title bar
- **Persistent Sessions**: Your login session is saved between app restarts
- **Clean Interface**: Automatically hides the feed section for a focused messaging experience
- **Context Menu**: Right-click support for copy, paste, image operations, and Google search
- **External Link Handling**: Non-Messenger links open in your default browser
- **Developer Tools**: Quick access with F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows/Linux)
- **Smart Window Sizing**: Automatically sizes to 80% of your screen with reasonable constraints
- **Hot Reload**: Development mode includes automatic reloading on code changes

## Installation

### Prerequisites

- Node.js (v16 or higher)
- npm, yarn, pnpm, or bun

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd messengerify
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

## Development

### Run in Development Mode

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

This will compile the TypeScript source and launch the Electron app with hot reload enabled.

### Compile TypeScript

```bash
npm run compile
# or
yarn compile
# or
pnpm compile
# or
bun compile
```

## Building

### Build for macOS

```bash
npm run build:mac
# or
yarn build:mac
# or
pnpm build:mac
# or
bun build:mac
```

This will create a `.dmg` installer and `.zip` archive in the `dist` directory.

### Build for All Platforms

```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun build
```

## Publishing Releases

### Version & Release Workflow

```bash
# 1. Bump version (choose one)
npm run version:patch   # Bug fixes (0.0.1 → 0.0.2)
npm run version:minor   # New features (0.0.1 → 0.1.0)
npm run version:major   # Breaking changes (0.0.1 → 1.0.0)

# 2. Build the app
npm run build:mac
```

This will create distributable files in the `release/` directory:
- `.dmg` installer
- `.zip` portable version

Users download new versions manually from [GitHub Releases](https://github.com/auduongtuan/messengerify/releases).

### Enabling Auto-Updates (Optional)

Auto-updates are implemented but disabled by default (requires code signing).

**To enable**:
1. Get an Apple Developer account ($99/year) and set up code signing
2. Set `ENABLE_AUTO_UPDATES = true` in `src/main.ts`
3. Build with `npm run build:mac`

Once enabled, the app will automatically download and install updates on quit.

## Project Structure

```
messengerify/
├── src/
│   └── main.ts          # Main Electron process (TypeScript)
├── assets/
│   └── icon.icns        # macOS app icon
├── dist/                # Compiled JavaScript output
├── package.json         # Project configuration
└── tsconfig.json        # TypeScript configuration
```

## Technical Details

- **Framework**: Electron v39
- **Language**: TypeScript 5.9
- **Target**: ES2020
- **Module System**: CommonJS
- **Window Style**: Frameless with hidden title bar
- **Session Storage**: Persistent partition (`persist:messenger`, separate for dev/prod)
- **Security**: Context isolation enabled, Node integration disabled
- **Single Instance**: Prevents multiple app instances from conflicting

## Keyboard Shortcuts

- **F12**: Toggle Developer Tools
- **Cmd+Option+I** (Mac) / **Ctrl+Shift+I** (Windows/Linux): Toggle Developer Tools

## License

MIT
