async function getTranscriptWithProxy(videoId) {
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log('Fetching watch page via proxy...');
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(watchUrl)}`;
    
    const res = await fetch(proxyUrl);
    if (!res.ok) {
      throw new Error(`Proxy request failed: ${res.statusText}`);
    }
    
    const data = await res.json();
    const html = data.contents;
    
    if (!html) {
      throw new Error('Proxy returned empty contents');
    }
    
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
    
    console.log('Caption tracks found:', captionTracks.map(t => ({ languageCode: t.languageCode, name: t.name.simpleText })));
    
    const track = captionTracks[0]; // Take the first track
    console.log('Fetching transcript XML from:', track.baseUrl);
    
    const transcriptRes = await fetch(track.baseUrl);
    if (!transcriptRes.ok) {
      throw new Error(`Failed to fetch transcript XML: ${transcriptRes.statusText}`);
    }
    
    const xml = await transcriptRes.text();
    console.log('XML length:', xml.length);
    
    // Parse XML
    const results = [];
    const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
    let match;
    while ((match = pRegex.exec(xml)) !== null) {
      let text = match[3].replace(/<[^>]+>/g, '').trim();
      if (text) results.push(text);
    }
    
    if (results.length === 0) {
      // Try classic format
      const classicRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
      let cMatch;
      const textMatches = [...xml.matchAll(classicRegex)];
      results.push(...textMatches.map(m => m[3]));
    }
    
    const fullText = results.join(' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
    console.log('Successfully extracted transcript!');
    console.log('Preview:', fullText.substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

getTranscriptWithProxy('JP7ITIXGpHk');
