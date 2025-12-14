# Auto-Updates Guide

## How It Works

Messengerify uses `electron-updater` for automatic updates with the following behavior:

- **Checks for updates**: On app startup only
- **Downloads silently**: Updates download in the background automatically
- **Installs on quit**: Updates are installed when you close the app
- **Development safe**: Auto-updates only run in production builds

## Publishing a New Version (Recommended Workflow)

### Option 1: Automated Versioning (Recommended)

```bash
# For bug fixes (1.0.0 → 1.0.1)
npm run version:patch

# For new features (1.0.0 → 1.1.0)
npm run version:minor

# For breaking changes (1.0.0 → 2.0.0)
npm run version:major
```

This automatically:
- Updates version in package.json
- Creates a git commit: "1.0.1"
- Creates a git tag: "v1.0.1"
- Pushes commit and tag to GitHub

Then publish the release:
```bash
source .env && npm run release
```

### Option 2: Manual Versioning

```bash
# 1. Update version manually in package.json
# 2. Commit your changes
git add .
git commit -m "chore: bump version to 1.0.1"
git tag v1.0.1
git push --follow-tags

# 3. Publish
source .env && npm run release
```

The release command will:
- Compile TypeScript
- Build the app
- Create a GitHub Release
- Upload installer files (.dmg, .zip)
- Generate update metadata (latest-mac.yml)

## Getting a GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scope: `repo` (for private repos) or `public_repo` (for public repos)
4. Copy the token and use it as `GH_TOKEN`

## Current Configuration

**Provider**: GitHub Releases
**Repository**: `auduongtuan/messengerify`
**Update Strategy**: Silent download, install on quit

## Migrating to Private Server

When you're ready to move to a private server, update `package.json`:

```json
"publish": {
  "provider": "generic",
  "url": "https://your-server.com/updates"
}
```

Your server needs to host:
- Update files (`.dmg`, `.zip`)
- Metadata file (`latest-mac.yml`)

The `latest-mac.yml` format:
```yaml
version: 1.0.1
files:
  - url: Messengerify-1.0.1-mac.zip
    sha512: <file-hash>
    size: 12345678
path: Messengerify-1.0.1-mac.zip
sha512: <file-hash>
releaseDate: '2025-12-14T10:00:00.000Z'
```

## Alternative Providers

electron-updater supports multiple providers without code changes:

- **S3**: Amazon S3 bucket
- **Spaces**: Digital Ocean Spaces
- **Generic**: Any HTTP server
- **Bitbucket**: Bitbucket downloads
- **GitLab**: GitLab releases

Just update the `publish` config in `package.json` - no changes needed in `main.ts`!

## Testing Updates

Testing auto-updates locally is tricky. Options:

1. **Use a test GitHub repo**: Create releases there first
2. **Mock the update server**: Use `electron-updater-dev-server`
3. **Change the feed URL**: Point to a local server during development

## Code Signing (Recommended for macOS)

For production apps, you should code sign your builds:

1. Get an Apple Developer account
2. Create certificates in Xcode
3. Add to `package.json`:
```json
"mac": {
  "identity": "Your Name (TEAM_ID)",
  "hardenedRuntime": true,
  "entitlements": "build/entitlements.mac.plist",
  "entitlementsInherit": "build/entitlements.mac.plist"
}
```

Without code signing, macOS will show security warnings to users.
