const HF_API_KEY = process.env.HF_API_KEY || 'your_hf_api_key_placeholder';
const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

async function test() {
  try {
    console.log('Sending batch request to the new HuggingFace Inference Router...');
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: ['Hello world', 'Another text to embed'] }),
      }
    );

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data is array of arrays:', Array.isArray(data) && Array.isArray(data[0]));
    console.log('Batch length:', data.length);
    console.log('First embedding dimension:', data[0].length);
  } catch (err) {
    console.error('Error during batch fetch:', err);
  }
}

test();
