async function testAlloriginsGet() {
  const baseUrl = 'https://www.youtube.com/api/timedtext?v=JP7ITIXGpHk&ei=A38UaoW9CL6KqL8P-7CPqQg&caps=asr&opi=112496729&exp=xpe&xoaf=5&xowf=1&hl=en-GB&ip=0.0.0.0&ipbits=0&expire=1779753331&sparams=ip,ipbits,expire,v,ei,caps,opi,exp,xoaf&signature=1AE5A36A00F75F11F1F8165F5EBFBF0B84D3D74B.148DA7C5EA26ED6A82EA8C22DA6BEA6EE5EA8CAE&key=yt8&kind=asr&lang=en';
  
  const getUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(baseUrl)}`;
  
  try {
    console.log('Fetching timedtext via Allorigins GET...');
    const res = await fetch(getUrl);
    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Contents length:', data.contents?.length);
    if (data.contents) {
      console.log('Preview:', data.contents.slice(0, 300));
    }
  } catch (err) {
    console.error(err);
  }
}
testAlloriginsGet();
