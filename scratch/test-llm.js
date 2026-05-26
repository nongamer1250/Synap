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
    console.log('Loaded .env.local');
  }
}

loadEnv();

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error('GROQ_API_KEY is not set');
    return;
  }
  const groq = new Groq({ apiKey });
  const models = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'qwen/qwen3-32b',
    'meta-llama/llama-4-scout-17b-16e-instruct'
  ];

  for (const model of models) {
    try {
      console.log(`Testing ${model}...`);
      const res = await groq.chat.completions.create({
        model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });
      console.log(`  Success with ${model}:`, JSON.stringify(res.choices[0].message.content.trim()));
    } catch (err) {
      console.warn(`  Failed for ${model}:`, err.message);
    }
  }
}

testGroq();
