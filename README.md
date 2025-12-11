# Messengerify

Unofficial desktop wrapper for Messenger.com built with Electron and TypeScript.

## Features

- **Native Desktop Experience**: Run Messenger as a standalone desktop application
- **Custom Window Controls**: Frameless window with custom draggable title bar
- **Persistent Sessions**: Your login session is saved between app restarts
- **Clean Interface**: Automatically hides the feed section for a focused messaging experience
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

- **Framework**: Electron
- **Language**: TypeScript
- **Target**: ES2020
- **Module System**: CommonJS
- **Window Style**: Frameless with hidden title bar
- **Session Storage**: Persistent partition (`persist:messenger`)
- **Security**: Context isolation enabled, Node integration disabled

## Keyboard Shortcuts

- **F12**: Toggle Developer Tools
- **Cmd+Option+I** (Mac) / **Ctrl+Shift+I** (Windows/Linux): Toggle Developer Tools

## License

MIT
