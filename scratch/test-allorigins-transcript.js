async function getTranscriptWithAllorigins(videoId) {
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const proxyWatchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`;
    
    console.log('Fetching watch page via Allorigins Raw...');
    const res = await fetch(proxyWatchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch watch page: ${res.status} ${res.statusText}`);
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
      throw new Error('Failed to parse ytInitialPlayerResponse boundaries');
    }
    
    const playerResponse = JSON.parse(jsonStr);
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error('No caption tracks found in player response');
    }
    
    console.log('Caption tracks found:', captionTracks.map(t => ({ languageCode: t.languageCode, name: t.name?.simpleText })));
    
    const track = captionTracks[0];
    console.log('Fetching transcript XML from:', track.baseUrl);
    
    // Test fetching directly first (simulating what Vercel might do, though this runs locally)
    const transcriptRes = await fetch(track.baseUrl);
    if (!transcriptRes.ok) {
      console.log('Direct transcript fetch failed, trying via Allorigins...');
      const proxyTrackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(track.baseUrl)}`;
      const proxyTranscriptRes = await fetch(proxyTrackUrl);
      if (!proxyTranscriptRes.ok) {
        throw new Error(`Proxy transcript fetch failed: ${proxyTranscriptRes.statusText}`);
      }
      const xml = await proxyTranscriptRes.text();
      parseAndPrintXml(xml);
    } else {
      console.log('Direct transcript fetch succeeded!');
      const xml = await transcriptRes.text();
      parseAndPrintXml(xml);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

function parseAndPrintXml(xml) {
  console.log('XML length:', xml.length);
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
    
  console.log('Success! Full text snippet (first 300 chars):');
  console.log(fullText.substring(0, 300));
}

getTranscriptWithAllorigins('JP7ITIXGpHk');
