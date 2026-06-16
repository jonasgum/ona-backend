const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

process.on('uncaughtException', (err) => console.error('Uncaught:', err));
process.on('unhandledRejection', (reason) => console.error('Rejected:', reason));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Steg 1: Skapa ephemeral client_secret
app.post('/session', (req, res) => {
  console.log('Creating Realtime session...');

  const body = JSON.stringify({
    model: 'gpt-4o-realtime-preview',
    voice: 'nova',
    instructions: 'Du är Ona Alta, en varm och peppande svensk AI-assistent som hjälper med larm och påminnelser.',
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
    console.log('OpenAI status:', openaiRes.statusCode);
    let data = '';
    openaiRes.on('data', (chunk) => data += chunk);
    openaiRes.on('end', () => {
      console.log('OpenAI response:', data.substring(0, 300));
      try {
        const parsed = JSON.parse(data);
        if (openaiRes.statusCode === 200 || openaiRes.statusCode === 201) {
          const clientSecret = parsed.client_secret?.value;
          if (!clientSecret) {
            return res.status(500).json({ error: 'No client_secret', raw: data });
          }
          console.log('client_secret obtained successfully');
          res.json({ 
            client_secret: clientSecret,
            model: parsed.model,
          });
        } else {
          res.status(openaiRes.statusCode).json({ error: data });
        }
      } catch (e) {
        console.error('Parse error:', e);
        res.status(500).json({ error: e.message, raw: data });
      }
    });
  });

  openaiReq.on('error', (e) => {
    console.error('Request error:', e);
    res.status(500).json({ error: e.message });
  });

  openaiReq.write(body);
  openaiReq.end();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`OpenAI key: ${OPENAI_API_KEY ? 'loaded' : 'MISSING'}`);
});
