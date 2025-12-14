import * as https from 'https';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { app } from 'electron';

export interface UpdateInfo {
  version: string;
  downloadUrl: string;
  fileName: string;
  checksum?: string;
  releaseNotes?: string;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
    size: number;
  }>;
}

/**
 * Check GitHub Releases for a newer version
 */
export async function checkForUpdates(): Promise<UpdateInfo | null> {
  const currentVersion = app.getVersion();
  console.log('Current version:', currentVersion);

  try {
    const release = await fetchLatestRelease();
    const latestVersion = release.tag_name.replace(/^v/, '');

    console.log('Latest version:', latestVersion);

    if (compareVersions(currentVersion, latestVersion)) {
      // Find the appropriate asset for the current platform/architecture
      const arch = process.arch; // 'arm64' or 'x64'
      const assetName = `Messengerify-${latestVersion}-${arch}-mac.zip`;

      const asset = release.assets.find(a => a.name === assetName);

      if (!asset) {
        console.log('No matching asset found for', assetName);
        return null;
      }

      return {
        version: latestVersion,
        downloadUrl: asset.browser_download_url,
        fileName: asset.name,
        releaseNotes: release.body
      };
    }

    console.log('No update available');
    return null;
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return null;
  }
}

/**
 * Fetch latest release from GitHub API
 */
function fetchLatestRelease(): Promise<GitHubRelease> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/auduongtuan/messengerify/releases/latest',
      headers: {
        'User-Agent': 'Messengerify',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    https.get(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const release = JSON.parse(data);
            resolve(release);
          } catch (error) {
            reject(new Error('Failed to parse GitHub response'));
          }
        } else {
          reject(new Error(`GitHub API returned ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Compare two semver version strings
 * Returns true if latest > current
 */
export function compareVersions(current: string, latest: string): boolean {
  const stripV = (v: string) => v.replace(/^v/, '');
  const parsedCurrent = stripV(current).split('.').map(Number);
  const parsedLatest = stripV(latest).split('.').map(Number);

  const [currMajor = 0, currMinor = 0, currPatch = 0] = parsedCurrent;
  const [latestMajor = 0, latestMinor = 0, latestPatch = 0] = parsedLatest;

  if (latestMajor > currMajor) return true;
  if (latestMajor === currMajor && latestMinor > currMinor) return true;
  if (latestMajor === currMajor && latestMinor === currMinor && latestPatch > currPatch) return true;

  return false;
}

/**
 * Download a file from URL to destination path
 */
export function downloadUpdate(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    let downloadStarted = false;

    const handleResponse = (response: any) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          fs.unlink(dest, () => {});
          return downloadUpdate(redirectUrl, dest).then(resolve).catch(reject);
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(dest, () => {});
        return reject(new Error(`Download failed with status ${response.statusCode}`));
      }

      downloadStarted = true;
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });

      file.on('error', (err) => {
        file.close();
        fs.unlink(dest, () => {});
        reject(err);
      });
    };

    const request = https.get(url, {
      headers: {
        'User-Agent': 'Messengerify'
      }
    }, handleResponse);

    request.on('error', (err) => {
      if (!downloadStarted) {
        file.close();
        fs.unlink(dest, () => {});
      }
      reject(err);
    });
  });
}

/**
 * Verify file checksum (SHA512)
 */
export async function verifyChecksum(filePath: string, expectedChecksum: string): Promise<boolean> {
  return new Promise((resolve) => {
    const hash = crypto.createHash('sha512');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      const actualChecksum = hash.digest('base64');
      resolve(actualChecksum === expectedChecksum);
    });

    stream.on('error', () => {
      resolve(false);
    });
  });
}
