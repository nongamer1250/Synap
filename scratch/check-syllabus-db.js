const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log('Testing connection...');
  
  const { data: uploadData, error: uploadError } = await supabase.from('uploads').select('count', { count: 'exact', head: true });
  console.log('Uploads count response:', { data: uploadData, error: uploadError });

  console.log('Checking syllabi table...');
  const { data: syllabiData, error: syllabiError } = await supabase.from('syllabi').select('*').limit(1);
  console.log('syllabi query:', { data: syllabiData, error: syllabiError });

  console.log('Checking syllabus_topics table...');
  const { data: topicsData, error: topicsError } = await supabase.from('syllabus_topics').select('*').limit(1);
  console.log('syllabus_topics query:', { data: topicsData, error: topicsError });
}

main();
