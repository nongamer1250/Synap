const { YoutubeTranscript } = require('youtube-transcript');

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n/g, ' ');
}

async function getVideoTranscript(videoId) {
  // Try proxy pathway directly for testing
  try {
    console.log('Testing proxy fallback path...');
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en`;
    const proxyWatchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`;
    
    const res = await fetch(proxyWatchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Failed to fetch watch page via proxy: ${res.status} ${res.statusText}`);
    }
    
    const html = await res.text();
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
      throw new Error('Failed to parse ytInitialPlayerResponse JSON');
    }
    
    const playerResponse = JSON.parse(jsonStr);
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error('No caption tracks found in player response');
    }
    
    console.log('Tracks found:', captionTracks.map(t => t.languageCode));
    const track = captionTracks.find(t => t.languageCode?.startsWith('en')) || captionTracks[0];
    const baseUrl = track.baseUrl;
    
    let xml = '';
    try {
      console.log('Trying direct fetch of timedtext...');
      const transcriptRes = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (transcriptRes.ok) {
        xml = await transcriptRes.text();
      }
      console.log('Direct timedtext fetch size:', xml.length);
    } catch (e) {
      console.warn('Direct timedtext fetch failed, trying via proxy:', e);
    }
    
    if (!xml || xml.length === 0) {
      console.log('Timedtext size is 0, trying via proxy...');
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
      console.log('Proxy timedtext fetch size:', xml.length);
    }
    
    if (!xml || xml.length === 0) {
      throw new Error('Transcript XML is empty');
    }
    
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
    
    const fullTranscript = results.join(' ')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
      
    if (fullTranscript.length < 50) {
      throw new Error('Transcript is too short.');
    }
    
    return fullTranscript;
  } catch (err) {
    console.error('Execution error:', err);
    throw err;
  }
}

// Test with Rickroll (which is reliable for test runs)
getVideoTranscript('dQw4w9WgXcQ')
  .then(text => {
    console.log('SUCCESS!');
    console.log('Length:', text.length);
    console.log('Snippet:', text.slice(0, 300));
  })
  .catch(err => {
    console.error('FAIL:', err);
  });
