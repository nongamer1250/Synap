const fs = require('fs');
const path = require('path');
const https = require('https');

const LOGOS = {
  'iit-delhi': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/IIT_Delhi_Logo.svg/300px-IIT_Delhi_Logo.svg.png',
  'iit-bombay': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1d/IIT_Bombay_Logo.svg/300px-IIT_Bombay_Logo.svg.png',
  'iit-madras': 'https://upload.wikimedia.org/wikipedia/en/thumb/6/69/IIT_Madras_Logo.svg/300px-IIT_Madras_Logo.svg.png',
  'bits-pilani': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Birla_Institute_of_Technology_and_Science%2C_Pilani_logo.svg/300px-Birla_Institute_of_Technology_and_Science%2C_Pilani_logo.svg.png',
  'delhi-university': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/07/Delhi_University_logo.svg/300px-Delhi_University_logo.svg.png',
  'iit-kharagpur': 'https://upload.wikimedia.org/wikipedia/en/thumb/1/1c/IIT_Kharagpur_Logo.svg/300px-IIT_Kharagpur_Logo.svg.png',
  'iisc-bangalore': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b0/Indian_Institute_of_Science_logo.svg/300px-Indian_Institute_of_Science_logo.svg.png',
  'aiims-delhi': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/08/All_India_Institute_of_Medical_Sciences_Delhi_logo.svg/300px-All_India_Institute_of_Medical_Sciences_Delhi_logo.svg.png'
};

const outputDir = path.join(__dirname, '..', 'public', 'logos');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function downloadFile(name, url) {
  return new Promise((resolve, reject) => {
    const dest = path.join(outputDir, `${name}.png`);
    const file = fs.createWriteStream(dest);

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(url, options, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${name}: Status code ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log(`Downloaded ${name} successfully to ${dest}`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function downloadAll() {
  console.log('Starting download of Indian university logos...');
  for (const [name, url] of Object.entries(LOGOS)) {
    try {
      await downloadFile(name, url);
    } catch (error) {
      console.error(`Error downloading ${name}:`, error.message);
    }
  }
  console.log('Finished logo downloads!');
}

downloadAll();
