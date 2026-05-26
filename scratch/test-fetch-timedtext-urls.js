async function test() {
  const url1 = 'https://www.youtube.com/api/timedtext?v=JP7ITIXGpHk&ei=Gn4Uav_2OuaG3LUPqpbJ4Ao&caps=asr&opi=112496729&exp=xpe&xoaf=5&xowf=1&hl=en&ip=0.0.0.0&ipbits=0&expire=1779753098&sparams=ip,ipbits,expire,v,ei,caps,opi,exp,xoaf&signature=CA257FF046727F7CD59C9CDE35059B8FAB2EEBE9.DDF7B20602F05E7FDA97179EDF06D488EB2AF931&key=yt8&kind=asr&lang=en';
  
  try {
    console.log('Fetching first URL...');
    const res = await fetch(url1);
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Length:', text.length);
    console.log('Preview:', text.slice(0, 500));
  } catch (err) {
    console.error(err);
  }
}
test();
