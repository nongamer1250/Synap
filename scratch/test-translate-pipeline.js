async function testTranslatePipeline() {
  const videoId = 'JP7ITIXGpHk';
  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const translateUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(targetUrl)}`;
  
  try {
    console.log('1. Fetching watch page via Google Translate proxy...');
    const res = await fetch(translateUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Google Translate proxy request failed: ${res.status} ${res.statusText}`);
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
    
    const playerResponse = JSON.parse(jsonStr);
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error('No caption tracks found in player response');
    }
    
    console.log('Tracks found:', captionTracks.map(t => ({ languageCode: t.languageCode, name: t.name?.simpleText || t.name?.runs?.[0]?.text })));
    
    const track = captionTracks.find(t => t.languageCode?.startsWith('en')) || captionTracks[0];
    let baseUrl = track.baseUrl;
    console.log('Target caption track URL:', baseUrl);
    
    // 2. Fetch timedtext XML
    let xml = '';
    try {
      console.log('2. Trying direct fetch of timedtext...');
      const transcriptRes = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (transcriptRes.ok) {
        xml = await transcriptRes.text();
      }
      console.log('   Direct fetch XML length:', xml.length);
    } catch (e) {
      console.warn('   Direct fetch failed:', e.message);
    }
    
    if (!xml || xml.length === 0) {
      console.log('3. Direct fetch returned 0 bytes, trying via Allorigins Raw...');
      const proxyTrackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;
      const proxyTranscriptRes = await fetch(proxyTrackUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!proxyTranscriptRes.ok) {
        throw new Error(`Failed to fetch transcript XML via proxy: ${proxyTranscriptRes.statusText}`);
      }
      xml = await proxyTranscriptRes.text();
      console.log('   Proxy fetch XML length:', xml.length);
    }
    
    if (!xml || xml.length === 0) {
      throw new Error('Transcript XML is empty');
    }
    
    // 3. Parse XML
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
      .replace(/\s+/g, ' ')
      .trim();
      
    console.log('SUCCESS! Transcript length:', fullText.length);
    console.log('Preview (500 chars):\n', fullText.substring(0, 500));
  } catch (err) {
    console.error('Pipeline error:', err.message);
  }
}

testTranslatePipeline();
