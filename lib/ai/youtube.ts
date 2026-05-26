/**
 * Synap — YouTube Link Parsing & Transcript Helper
 * Extracts video transcripts and details.
 */

import { YoutubeTranscript } from 'youtube-transcript';

export function extractVideoId(url: string): string | null {
  if (!url) return null;
  // Regex to match YouTube watch, embed, shorts, youtu.be, etc.
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export interface YouTubeDetails {
  title: string;
  thumbnailUrl: string;
  author: string;
}

export async function getVideoDetails(videoId: string): Promise<YouTubeDetails> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title || `YouTube Video ${videoId}`,
        thumbnailUrl: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
        author: data.author_name || 'YouTube Creator',
      };
    }
  } catch (error) {
    console.error('Error fetching YouTube details:', error);
  }

  // Fallback if oEmbed fails or is blocked
  return {
    title: `YouTube Video ${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    author: 'YouTube',
  };
}

export async function getVideoTranscript(videoId: string): Promise<string> {
  // 1. Try standard youtube-transcript library first (highly optimized for local dev)
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    if (transcriptItems && transcriptItems.length > 0) {
      const fullTranscript = transcriptItems
        .map((item) => decodeHtmlEntities(item.text))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (fullTranscript.length >= 50) {
        console.log('[YouTube Transcript Scraper] Successfully retrieved transcript via standard library.');
        return fullTranscript;
      }
    }
  } catch (error) {
    console.warn('Standard YoutubeTranscript fetch failed, trying Vcyon API fallback:', error);
  }

  // 2. Try Vcyon Developer API (extremely stable on Vercel production servers)
  try {
    console.log('[YouTube Transcript Scraper] Fetching transcript via Vcyon API...');
    const res = await fetch(`https://api.vcyon.com/v1/youtube/transcript?videoId=${videoId}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data?.segments) {
        const rawTranscript = json.data.segments
          .map((item: any) => item.text)
          .join(' ');
        const fullTranscript = decodeHtmlEntities(rawTranscript)
          .replace(/\s+/g, ' ')
          .trim();
        if (fullTranscript.length >= 50) {
          console.log('[YouTube Transcript Scraper] Successfully retrieved transcript via Vcyon API.');
          return fullTranscript;
        }
      }
    } else {
      console.warn(`[YouTube Transcript Scraper] Vcyon API returned non-OK status: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    console.warn('[YouTube Transcript Scraper] Vcyon API fetch failed, trying emergency Translate proxy scraper:', error);
  }

  // 3. Fallback: Scrape the watch page via Google Translate proxy
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}&hl=en`;
    const translateUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(watchUrl)}`;
    
    console.log('[YouTube Transcript Scraper] Fetching watch page via Google Translate proxy...');
    const res = await fetch(translateUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      throw new Error(`Google Translate proxy watch page fetch failed: ${res.status} ${res.statusText}`);
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
      throw new Error('Failed to parse ytInitialPlayerResponse JSON boundaries');
    }
    
    const playerResponse = JSON.parse(jsonStr);
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error('No caption tracks found in player response');
    }
    
    // Select English track or fallback to first track
    const track = captionTracks.find(t => t.languageCode?.startsWith('en')) || captionTracks[0];
    const baseUrl = track.baseUrl;
    console.log('[YouTube Transcript Scraper] Selected caption track URL:', baseUrl);
    
    // Fetch timedtext XML (direct fetch first, fallback to Allorigins with retries)
    let xml = '';
    try {
      console.log('[YouTube Transcript Scraper] Trying direct fetch of timedtext...');
      const transcriptRes = await fetch(baseUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (transcriptRes.ok) {
        xml = await transcriptRes.text();
      }
      console.log('[YouTube Transcript Scraper] Direct timedtext fetch length:', xml.length);
    } catch (e) {
      console.warn('[YouTube Transcript Scraper] Direct timedtext fetch failed:', e);
    }
    
    // If direct fetch fails or returns empty body, use Allorigins with retries
    if (!xml || xml.length === 0) {
      const maxRetries = 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`[YouTube Transcript Scraper] Timedtext via proxy attempt ${attempt}/${maxRetries}...`);
          const proxyTrackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;
          const proxyTranscriptRes = await fetch(proxyTrackUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
          });
          if (proxyTranscriptRes.ok) {
            xml = await proxyTranscriptRes.text();
            if (xml && xml.length > 0) {
              console.log('[YouTube Transcript Scraper] Proxy timedtext fetch successful! length:', xml.length);
              break;
            }
          }
        } catch (e) {
          console.warn(`[YouTube Transcript Scraper] Proxy timedtext fetch attempt ${attempt} failed:`, e);
        }
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
        }
      }
    }
    
    if (!xml || xml.length === 0) {
      throw new Error('Failed to retrieve captions XML data from all endpoints');
    }
    
    // Parse XML captions (supports srv3 and classic formats)
    const results: string[] = [];
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
      throw new Error('Transcript is too short to generate notes.');
    }
    
    return fullTranscript;
  } catch (proxyError) {
    console.error('[YouTube Transcript Scraper] Pipeline error:', proxyError);
    throw new Error('No captions or subtitles are available for this video. Please upload an audio file instead.');
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n/g, ' '); // Replace linebreaks in captions with spaces
}
