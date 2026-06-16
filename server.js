const express = require('express');
const cors = require('cors');
const https = require('https');
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/session', async (req, res) => {
  const { sdp } = req.body;
  if (!sdp) {
    console.error('❌ Inget SDP mottaget');
    return res.status(400).json({ error: 'SDP krävs' });
  }

  console.log('📥 SDP mottaget, längd:', sdp.length);
  console.log('🚀 Skickar till OpenAI...');

  const postData = sdp;
  const options = {
    hostname: 'api.openai.com',
    path: '/v1/realtime?model=gpt-4o-realtime-preview',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/sdp',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const openaiReq = https.request(options, (openaiRes) => {
    console.log('📡 OpenAI status:', openaiRes.statusCode);
    let data = '';
    openaiRes.on('data', (chunk) => data += chunk);
    openaiRes.on('end', () => {
      if (openaiRes.statusCode === 201 || openaiRes.statusCode === 200) {
        console.log('✅ SDP answer mottaget, längd:', data.length);
        res.json({ sdp: data });
      } else {
        console.error('❌ OpenAI fel:', data);
        res.status(openaiRes.statusCode).json({ error: data });
      }
    });
  });

  openaiReq.on('error', (e) => {
    console.error('❌ Request fel:', e);
    res.status(500).json({ error: e.message });
  });

  openaiReq.write(postData);
  openaiReq.end();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Ona backend körs på port ${PORT}`);
  console.log(`🔑 OpenAI nyckel: ${OPENAI_API_KEY ? '✅ Inladdad' : '❌ Saknas!'}`);
});
