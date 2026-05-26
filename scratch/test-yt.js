const { YoutubeTranscript } = require('youtube-transcript');

async function test() {
  try {
    console.log('Fetching transcript with youtube-transcript...');
    const result = await YoutubeTranscript.fetchTranscript('dQw4w9WgXcQ');
    console.log('Successfully fetched transcript!');
    console.log('Snippet length:', result.length);
    console.log('First 3 items:', result.slice(0, 3));
    console.log('Transcript text length:', result.map(t => t.text).join(' ').length);
  } catch (err) {
    console.error('Error fetching transcript:', err);
  }
}

test();
