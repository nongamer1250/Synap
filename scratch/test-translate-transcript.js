const fs = require('fs');

async function testTranslateTranscript() {
  const videoId = 'JP7ITIXGpHk';
  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const translateUrl = `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(targetUrl)}`;
  
  try {
    console.log('Fetching watch page via Google Translate proxy...');
    const res = await fetch(translateUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Proxy request failed: ${res.statusText}`);
    }
    
    const html = await res.text();
    console.log('HTML length:', html.length);
    
    const startToken = 'var ytInitialPlayerResponse = ';
    const startIndex = html.indexOf(startToken);
    if (startIndex === -1) {
      throw new Error('Could not find ytInitialPlayerResponse in HTML');
    }
    
    const jsonStart = startIndex + startToken.length;
    let depth = 0;
    let jsonStr = '';
    
    for (let i = jsonStart; i < html.length; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') {
        depth--;
        if (depth === 0) {
          jsonStr = html.slice(jsonStart, i + 1);
          break;
        }
      }
    }
    
    if (!jsonStr) {
      throw new Error('Failed to parse ytInitialPlayerResponse JSON boundaries');
    }
    
    // We need to clean up any Google Translate HTML escapings in the JSON if there are any,
    // though usually inside script tags they are untouched.
    const playerResponse = JSON.parse(jsonStr);
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error('No caption tracks found in player response');
    }
    
    console.log('Caption tracks found:', captionTracks.map(t => ({ languageCode: t.languageCode, name: t.name?.simpleText })));
    
    const track = captionTracks[0];
    let baseUrl = track.baseUrl;
    console.log('Original caption track URL:', baseUrl);
    
    // Sometimes Google Translate rewrites URLs inside the JSON, let's restore it if it did
    if (baseUrl.includes('translate.google.com')) {
      console.log('Restoring rewritten Google Translate URL...');
      // Extract original URL from Google Translate wrapper
      // e.g. https://translate.google.com/translate_p?hl=en&sl=en&tl=es&u=https://www.youtube.com/api/timedtext...
      const urlMatch = baseUrl.match(/u=([^&]+)/);
      if (urlMatch) {
        baseUrl = decodeURIComponent(urlMatch[1]);
        console.log('Restored URL:', baseUrl);
      }
    }
    
    console.log('Fetching transcript XML from:', baseUrl);
    
    // Try direct fetch (which works on local, let's see if we can do it)
    const transcriptRes = await fetch(baseUrl);
    if (!transcriptRes.ok) {
      throw new Error(`Failed to fetch transcript XML: ${transcriptRes.statusText}`);
    }
    
    const xml = await transcriptRes.text();
    console.log('XML length:', xml.length);
    
    // Parse XML
    const results = [];
    const classicRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    let match;
    const matches = [...xml.matchAll(classicRegex)];
    results.push(...matches.map(m => m[3]));
    
    if (results.length === 0) {
      const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
      while ((match = pRegex.exec(xml)) !== null) {
        let text = match[3].replace(/<[^>]+>/g, '').trim();
        if (text) results.push(text);
      }
    }
    
    const fullText = results.join(' ')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
      
    console.log('Successfully extracted transcript!');
    console.log('Preview (300 chars):', fullText.substring(0, 300));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testTranslateTranscript();
