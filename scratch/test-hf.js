const HF_API_KEY = process.env.HF_API_KEY || 'your_hf_api_key_placeholder';
const HF_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

async function test() {
  try {
    console.log('Sending request to the new HuggingFace Inference Router...');
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${HF_MODEL}/pipeline/feature-extraction`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${HF_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: 'Hello world' }),
      }
    );

    console.log('Response status:', response.status);
    console.log('Response status text:', response.statusText);
    const data = await response.json();
    console.log('Response data type:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('Response data length:', Array.isArray(data) ? data.length : 'N/A');
    console.log('Snippet of data (first 5 elements of embedding):', Array.isArray(data) ? data.slice(0, 5) : data);
  } catch (err) {
    console.error('Error during fetch:', err);
  }
}

test();
