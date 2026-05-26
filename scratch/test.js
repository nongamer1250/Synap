const url = 'https://youtu.be/JP7ITIXGpHk?si=A4Rx4hcvymfqy3IN';
const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
const match = url.match(regExp);
const videoId = match && match[2].length === 11 ? match[2] : null;
console.log('Video ID extracted:', videoId);
