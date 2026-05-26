async function searchAllChunks() {
  const chunkIds = [
    '1c83d1381fa1fb8f7913',
    '20a652222ace9552aa08',
    '2106564466c76e0413ef',
    '381656aad274e711ab51',
    '5776a7c2a20667472988',
    '7530907bfaf459aebad7',
    '921ff77af8e56e18f440',
    '9886d04804c00b0ad4e5',
    '99bf1701d17a540349b5',
    'b503d11c115d95e4bf2b',
    'd36527eaba507dae730a'
  ];

  for (const chunkId of chunkIds) {
    try {
      const url = `https://downsub.com/js/chunk-${chunkId}.js`;
      console.log('Fetching chunk:', url);
      const res = await fetch(url);
      const text = await res.text();
      console.log('  Length:', text.length);
      
      // Look for string literals starting with /
      const regex = /"[a-zA-Z0-9_\-/]{3,100}"|'[a-zA-Z0-9_\-/]{3,100}'/g;
      let match;
      const paths = new Set();
      while ((match = regex.exec(text)) !== null) {
        const path = match[0].slice(1, -1);
        if (path.startsWith('/') && (path.includes('ajax') || path.includes('download') || path.includes('sub') || path.includes('api') || path.includes('extract'))) {
          paths.add(path);
        }
      }
      if (paths.size > 0) {
        console.log('  Found Paths:', Array.from(paths));
      }
    } catch (err) {
      console.error(err);
    }
  }
}
searchAllChunks();
