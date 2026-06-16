const https = require('https');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log('🔑 Nyckel:', OPENAI_API_KEY ? `sk-...${OPENAI_API_KEY.slice(-4)}` : '❌ Saknas');

const testSdp = `v=0\r\no=- 1234 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=mid:0\r\n`;

const options = {
  hostname: 'api.openai.com',
  path: '/v1/realtime?model=gpt-4o-realtime-preview',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Type': 'application/sdp',
    'Content-Length': Buffer.byteLength(testSdp),
  },
};

console.log('🚀 URL:', `https://${options.hostname}${options.path}`);
console.log('🚀 SDP längd:', testSdp.length);

const req = https.request(options, (res) => {
  console.log('📡 Status:', res.statusCode);
  console.log('📡 StatusText:', res.statusMessage);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('📡 Full response:');
    console.log(data);
  });
});

req.on('error', (e) => console.error('❌ Error:', e));
req.write(testSdp);
req.end();
