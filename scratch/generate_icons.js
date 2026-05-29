const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, '..', 'public', 'icon.svg');
const publicDir = path.join(__dirname, '..', 'public');
const appDir = path.join(__dirname, '..', 'app');

async function main() {
  console.log('Generating high-resolution PNGs and favicon...');

  try {
    // Generate png icons for public folder (used by manifest.json)
    await sharp(svgPath)
      .resize(48, 48)
      .png()
      .toFile(path.join(publicDir, 'icon-48.png'));
      
    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(publicDir, 'icon-192.png'));
      
    await sharp(svgPath)
      .resize(512, 512)
      .png()
      .toFile(path.join(publicDir, 'icon-512.png'));

    // Generate apple touch icon
    await sharp(svgPath)
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    // Generate icon.png for nextjs auto-detection in app/
    await sharp(svgPath)
      .resize(192, 192)
      .png()
      .toFile(path.join(appDir, 'icon.png'));

    // For favicon.ico, we can convert to PNG first then write as favicon.ico
    // ICO format is basically a wrapper around one or more PNG/BMP images,
    // but for search engines and modern browsers, a 32x32 PNG renamed to favicon.ico or a simple ICO file is standard.
    // Sharp can output direct ICO if we use the right options, or we can just write a 32x32 PNG as favicon.ico since modern browsers accept it,
    // but to be 100% correct, let's write a standard 32x32 PNG to favicon.png, and generate a real ICO file if possible, or write a 32x32 PNG as favicon.ico which is widely supported,
    // or let's create a standard ICO buffer. 
    // Wait, let's generate a 32x32 PNG and write it to public/favicon.ico and app/favicon.ico!
    // Many sites actually serve a PNG file renamed to .ico at the root, and browsers/Google index it perfectly as long as the Content-Type is image/x-icon or image/png.
    // Even better, we can write public/favicon.ico and also include a public/favicon.png!
    
    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));

    await sharp(svgPath)
      .resize(32, 32)
      .png()
      .toFile(path.join(appDir, 'favicon.ico'));

    console.log('All icons generated successfully!');
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

main();
