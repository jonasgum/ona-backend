const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (reason) => console.error('Rejected:', reason));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/session', (req, res) => {
  const { sdp } = req.body;
  if (!sdp) return res.status(400).json({ error: 'SDP krävs' });

  console.log('SDP received, length:', sdp.length);

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/realtime?model=gpt-realtime-2',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/sdp',
      'Content-Length': Buffer.byteLength(sdp),
    },
  };

  console.log('Sending to:', options.path);

  const openaiReq = https.request(options, (openaiRes) => {
    console.log('OpenAI status:', openaiRes.statusCode);
    let data = '';
    openaiRes.on('data', (chunk) => data += chunk);
    openaiRes.on('end', () => {
      console.log('OpenAI response:', data.substring(0, 300));
      if (openaiRes.statusCode === 200 || openaiRes.statusCode === 201) {
        res.json({ sdp: data });
      } else {
        res.status(openaiRes.statusCode).json({ error: data });
      }
    });
  });

  openaiReq.on('error', (e) => {
    console.error('Request error:', e);
    res.status(500).json({ error: e.message });
  });

  openaiReq.write(sdp);
  openaiReq.end();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenAI key: ${OPENAI_API_KEY ? 'loaded' : 'MISSING'}`);
});
