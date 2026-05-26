import { getVideoTranscript } from '../lib/ai/youtube';

async function main() {
  try {
    console.log('Fetching transcript...');
    const transcript = await getVideoTranscript('JP7ITIXGpHk');
    console.log('Transcript length:', transcript.length);
    console.log('Start of transcript:', transcript.substring(0, 500));
  } catch (error) {
    console.error('Error fetching transcript:', error);
  }
}

main();
