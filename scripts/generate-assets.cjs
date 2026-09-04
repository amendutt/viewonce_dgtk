const fs = require('fs');
const path = require('path');
const jpeg = require('jpeg-js');
const { PNG } = require('pngjs');

const raw = fs.readFileSync('public/viewonce-logo.jpg');
const decoded = jpeg.decode(raw, { useTArray: true });
const W = decoded.width;
const H = decoded.height;

console.log(`Original dimensions: ${W}x${H}`);

// 1. Generate transparent full logo (light/silver text)
// Bounding box with padding
const cropX1 = Math.max(0, 95 - 20);
const cropX2 = Math.min(W - 1, 821 + 20);
const cropY1 = Math.max(0, 104 - 16);
const cropY2 = Math.min(H - 1, 216 + 16);
const cropW = cropX2 - cropX1 + 1;
const cropH = cropY2 - cropY1 + 1;

console.log(`Cropped logo dimensions: ${cropW}x${cropH}`);

const logoLightPng = new PNG({ width: cropW, height: cropH });
const logoDarkPng = new PNG({ width: cropW, height: cropH });

for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = cropX1 + x;
    const srcY = cropY1 + y;
    const srcIdx = (srcY * W + srcX) * 4;
    const dstIdx = (y * cropW + x) * 4;

    const r = decoded.data[srcIdx];
    const g = decoded.data[srcIdx + 1];
    const b = decoded.data[srcIdx + 2];
    const brightness = (r + g + b) / 3;

    let alpha = 0;
    if (brightness > 40) {
      alpha = 255;
    } else if (brightness > 12) {
      alpha = Math.round(((brightness - 12) / (40 - 12)) * 255);
    }

    // Light logo (original silver/off-white)
    logoLightPng.data[dstIdx] = r;
    logoLightPng.data[dstIdx + 1] = g;
    logoLightPng.data[dstIdx + 2] = b;
    logoLightPng.data[dstIdx + 3] = alpha;

    // Dark logo (#0f172a) for white background
    logoDarkPng.data[dstIdx] = 15;
    logoDarkPng.data[dstIdx + 1] = 23;
    logoDarkPng.data[dstIdx + 2] = 42;
    logoDarkPng.data[dstIdx + 3] = alpha;
  }
}

fs.writeFileSync('public/viewonce-logo.png', PNG.sync.write(logoLightPng));
fs.writeFileSync('public/viewonce-logo-dark.png', PNG.sync.write(logoDarkPng));
console.log('Generated public/viewonce-logo.png and public/viewonce-logo-dark.png');

// 2. Generate Square Icon / Favicon from the stylized "V"
const vX1 = 93;
const vX2 = 197;
const vY1 = 104;
const vY2 = 216;
const vW = vX2 - vX1 + 1;
const vH = vY2 - vY1 + 1;

// Resample / scale to a 64x64 favicon with dark background (#090d16) and subtle border
const ICON_SIZE = 64;
const faviconPng = new PNG({ width: ICON_SIZE, height: ICON_SIZE });

const targetVH = 42;
const scale = targetVH / vH;
const targetVW = Math.round(vW * scale);
const offsetX = Math.round((ICON_SIZE - targetVW) / 2);
const offsetY = Math.round((ICON_SIZE - targetVH) / 2);

for (let y = 0; y < ICON_SIZE; y++) {
  for (let x = 0; x < ICON_SIZE; x++) {
    const dstIdx = (y * ICON_SIZE + x) * 4;
    
    // Check if within the centered V region
    const relX = x - offsetX;
    const relY = y - offsetY;

    if (relX >= 0 && relX < targetVW && relY >= 0 && relY < targetVH) {
      const srcX = Math.min(vX2, vX1 + Math.round(relX / scale));
      const srcY = Math.min(vY2, vY1 + Math.round(relY / scale));
      const srcIdx = (srcY * W + srcX) * 4;

      const r = decoded.data[srcIdx];
      const g = decoded.data[srcIdx + 1];
      const b = decoded.data[srcIdx + 2];
      const brightness = (r + g + b) / 3;

      if (brightness > 20) {
        faviconPng.data[dstIdx] = r;
        faviconPng.data[dstIdx + 1] = g;
        faviconPng.data[dstIdx + 2] = b;
        faviconPng.data[dstIdx + 3] = 255;
        continue;
      }
    }

    // Background: elegant deep dark #0f172a
    faviconPng.data[dstIdx] = 10;
    faviconPng.data[dstIdx + 1] = 15;
    faviconPng.data[dstIdx + 2] = 26;
    faviconPng.data[dstIdx + 3] = 255;
  }
}

const faviconBuf = PNG.sync.write(faviconPng);
fs.writeFileSync('public/favicon.png', faviconBuf);
fs.writeFileSync('public/viewonce-icon.png', faviconBuf);

// Create standard ICO file wrapping the PNG
const icoHeader = Buffer.alloc(6 + 16);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // image type 1 = icon
icoHeader.writeUInt16LE(1, 4); // number of images = 1

// Directory entry
icoHeader.writeUInt8(64, 6); // width 64
icoHeader.writeUInt8(64, 7); // height 64
icoHeader.writeUInt8(0, 8); // palette colors
icoHeader.writeUInt8(0, 9); // reserved
icoHeader.writeUInt16LE(1, 10); // color planes
icoHeader.writeUInt16LE(32, 12); // bits per pixel
icoHeader.writeUInt32LE(faviconBuf.length, 14); // image size
icoHeader.writeUInt32LE(22, 18); // image offset

const icoFile = Buffer.concat([icoHeader, faviconBuf]);
fs.writeFileSync('public/favicon.ico', icoFile);
console.log('Generated public/favicon.png and public/favicon.ico');

// Also copy to src/assets for direct import in components if needed
if (!fs.existsSync('src/assets')) fs.mkdirSync('src/assets', { recursive: true });
fs.copyFileSync('public/viewonce-logo.png', 'src/assets/viewonce-logo.png');
fs.copyFileSync('public/viewonce-logo-dark.png', 'src/assets/viewonce-logo-dark.png');
fs.copyFileSync('public/viewonce-icon.png', 'src/assets/viewonce-icon.png');
console.log('Copied to src/assets/');
