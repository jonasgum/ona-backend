const https = require('https');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
console.log('🔑 Nyckel:', OPENAI_API_KEY ? `sk-...${OPENAI_API_KEY.slice(-4)}` : '❌ Saknas');

// Riktig SDP med opus codec (som WebRTC använder)
const testSdp = `v=0\r\no=- 1234567890 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE 0\r\na=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\nc=IN IP4 0.0.0.0\r\na=rtcp:9 IN IP4 0.0.0.0\r\na=ice-ufrag:test\r\na=ice-pwd:testpassword123456789012\r\na=ice-options:trickle\r\na=fingerprint:sha-256 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00\r\na=setup:actpass\r\na=mid:0\r\na=extmap:1 urn:ietf:params:rtp-hdrext:ssrc-audio-level\r\na=sendrecv\r\na=rtcp-mux\r\na=rtpmap:111 opus/48000/2\r\na=fmtp:111 minptime=10;useinbandfec=1\r\n`;

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

console.log('🚀 Skickar SDP med opus codec...');

const req = https.request(options, (res) => {
  console.log('📡 Status:', res.statusCode);
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('📡 Svar:');
    console.log(data.substring(0, 500));
  });
});

req.on('error', (e) => console.error('❌ Error:', e));
req.write(testSdp);
req.end();
