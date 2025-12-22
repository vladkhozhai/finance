/**
 * PWA Icon Generator Script
 * Generates all required PWA icons from a base SVG
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');

// FinanceFlow logo as SVG - Wallet with dollar sign
const baseSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <!-- Wallet shape -->
  <rect x="80" y="140" width="352" height="232" rx="24" fill="white" opacity="0.95"/>
  <!-- Wallet flap -->
  <path d="M80 180 L80 164 Q80 140 104 140 L408 140 Q432 140 432 164 L432 180 Q432 156 408 156 L104 156 Q80 156 80 180" fill="white" opacity="0.7"/>
  <!-- Card slot -->
  <rect x="300" y="200" width="100" height="60" rx="8" fill="#0a0a0a" opacity="0.1"/>
  <!-- Dollar sign -->
  <text x="200" y="310" font-family="system-ui, -apple-system, sans-serif" font-size="140" font-weight="700" fill="#059669" text-anchor="middle">$</text>
</svg>
`;

// Maskable version with more padding
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#059669;stop-opacity:1" />
    </linearGradient>
  </defs>
  <!-- Background - full bleed for maskable -->
  <rect width="512" height="512" fill="url(#bg)"/>
  <!-- Wallet shape - centered with safe zone padding -->
  <rect x="120" y="170" width="272" height="172" rx="20" fill="white" opacity="0.95"/>
  <!-- Wallet flap -->
  <path d="M120 200 L120 188 Q120 170 140 170 L372 170 Q392 170 392 188 L392 200 Q392 182 372 182 L140 182 Q120 182 120 200" fill="white" opacity="0.7"/>
  <!-- Card slot -->
  <rect x="300" y="210" width="70" height="44" rx="6" fill="#0a0a0a" opacity="0.1"/>
  <!-- Dollar sign -->
  <text x="220" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="100" font-weight="700" fill="#059669" text-anchor="middle">$</text>
</svg>
`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const maskableSizes = [192, 512];

async function generateIcons() {
  console.log('Creating icons directory...');
  await mkdir(iconsDir, { recursive: true });

  console.log('Generating regular icons...');
  for (const size of sizes) {
    const outputPath = join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(Buffer.from(baseSvg))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  Created: icon-${size}x${size}.png`);
  }

  console.log('Generating maskable icons...');
  for (const size of maskableSizes) {
    const outputPath = join(iconsDir, `icon-maskable-${size}x${size}.png`);
    await sharp(Buffer.from(maskableSvg))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`  Created: icon-maskable-${size}x${size}.png`);
  }

  // Generate apple-touch-icon (180x180)
  const appleTouchIconPath = join(iconsDir, 'apple-touch-icon.png');
  await sharp(Buffer.from(baseSvg))
    .resize(180, 180)
    .png()
    .toFile(appleTouchIconPath);
  console.log('  Created: apple-touch-icon.png');

  // Generate favicon (32x32)
  const faviconPath = join(iconsDir, 'favicon-32x32.png');
  await sharp(Buffer.from(baseSvg))
    .resize(32, 32)
    .png()
    .toFile(faviconPath);
  console.log('  Created: favicon-32x32.png');

  // Generate favicon-16x16
  const favicon16Path = join(iconsDir, 'favicon-16x16.png');
  await sharp(Buffer.from(baseSvg))
    .resize(16, 16)
    .png()
    .toFile(favicon16Path);
  console.log('  Created: favicon-16x16.png');

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
