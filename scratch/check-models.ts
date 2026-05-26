import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('.env.local not found');
    return;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const match = envContent.match(/GROQ_API_KEY\s*=\s*(.+)/);
  if (!match) {
    console.error('GROQ_API_KEY not found in .env.local');
    return;
  }
  
  const apiKey = match[1].replace(/['"]/g, '').trim();
  console.log('Using API Key (first 10 chars):', apiKey.substring(0, 10));
  
  const groq = new Groq({ apiKey });
  try {
    const list = await groq.models.list();
    console.log('Available models:');
    list.data.forEach((model) => {
      console.log(`- ${model.id}`);
    });
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

main();
