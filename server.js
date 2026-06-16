const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Skapa Realtime-session och returnera client_secret
app.post('/session', (req, res) => {
  console.log('📥 Skapar Realtime-session...');

  const body = JSON.stringify({
    model: 'gpt-4o-realtime-preview',
    voice: 'nova',
  });

  const options = {
    hostname: 'api.openai.com',
    path: '/v1/realtime/sessions',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  };

  const openaiReq = https.request(options, (openaiRes) => {
    console.log('📡 OpenAI status:', openaiRes.statusCode);
    let data = '';
    openaiRes.on('data', (chunk) => data += chunk);
    openaiRes.on('end', () => {
      console.log('📡 OpenAI svar:', data);
      if (openaiRes.statusCode === 200 || openaiRes.statusCode === 201) {
        const parsed = JSON.parse(data);
        const clientSecret = parsed.client_secret?.value;
        if (!clientSecret) {
          console.error('❌ Ingen client_secret i svaret');
          return res.status(500).json({ error: 'Ingen client_secret', raw: data });
        }
        console.log('✅ client_secret erhållen');
        res.json({ client_secret: clientSecret });
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

  openaiReq.write(body);
  openaiReq.end();
});

app.listen(PORT, '192.168.86.20', () => {
  console.log(`🚀 Ona backend körs på port ${PORT}`);
  console.log(`🔑 OpenAI nyckel: ${OPENAI_API_KEY ? '✅ Inladdad' : '❌ Saknas!'}`);
});
