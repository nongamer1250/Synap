const fs = require('fs');
const path = require('path');
const Groq = require('groq-sdk');

function loadEnv() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index === -1) return;
      const key = trimmed.substring(0, index).trim();
      let val = trimmed.substring(index + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    });
  }
}

loadEnv();

async function main() {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  try {
    const list = await groq.models.list();
    console.log('Available models:');
    const ids = list.data.map(m => m.id);
    console.log(ids);
  } catch (e) {
    console.error('Error listing models:', e);
  }
}

main();
