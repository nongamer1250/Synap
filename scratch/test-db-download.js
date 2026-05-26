const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Helper to load .env.local
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

async function testDownload() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin access in test
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the latest PDF upload
    const { data: uploads, error: uploadErr } = await supabase
      .from('uploads')
      .select('*')
      .eq('file_type', 'pdf')
      .order('created_at', { ascending: false })
      .limit(1);

    if (uploadErr || !uploads || uploads.length === 0) {
      console.error('No PDF uploads found in DB:', uploadErr);
      return;
    }

    const upload = uploads[0];
    console.log('Latest upload record:', upload);

    // Extract path
    const urlParts = upload.file_url.split('/uploads/');
    const storagePath = urlParts[1];
    console.log('Storage path:', storagePath);

    // Download from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('uploads')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Download error:', downloadError);
      return;
    }

    const fileBuffer = Buffer.from(await fileData.arrayBuffer());
    console.log('Downloaded file size:', fileBuffer.length, 'bytes');

    // Parse PDF
    const pdf = require('../node_modules/pdf-parse/lib/pdf-parse.js');
    const parsed = await pdf(fileBuffer);
    console.log('Parsed successfully!');
    console.log('Pages:', parsed.numpages);
    console.log('Text length:', parsed.text.length);
    console.log('Text preview:', JSON.stringify(parsed.text.trim().substring(0, 300)));
  } catch (err) {
    console.error('Exception:', err);
  }
}

testDownload();
