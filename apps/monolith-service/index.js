require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({
  origin: function (origin, callback) {
    const allowed = [
      'http://localhost:4000',
      'http://localhost:3000',
      /\.vercel\.app$/,
    ];
    if (!origin || allowed.some(p => typeof p === 'string' ? p === origin : p.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Provide a central health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'monolith-service', message: 'LexDesk Unified Backend Running' });
});

// Mount all microservices
try {
  app.use(require('../admin-service/index'));
} catch (err) { console.error('Failed to load admin-service', err.message); }

try {
  app.use(require('../ai-service/index'));
} catch (err) { console.error('Failed to load ai-service', err.message); }

try {
  app.use(require('../auth-service/index'));
} catch (err) { console.error('Failed to load auth-service', err.message); }

try {
  app.use(require('../billing-service/index'));
} catch (err) { console.error('Failed to load billing-service', err.message); }

try {
  app.use(require('../booking-service/index'));
} catch (err) { console.error('Failed to load booking-service', err.message); }

try {
  app.use(require('../case-service/index'));
} catch (err) { console.error('Failed to load case-service', err.message); }

try {
  app.use(require('../document-service/index'));
} catch (err) { console.error('Failed to load document-service', err.message); }

try {
  app.use(require('../intake-service/index'));
} catch (err) { console.error('Failed to load intake-service', err.message); }

try {
  app.use(require('../messaging-service/index'));
} catch (err) { console.error('Failed to load messaging-service', err.message); }

try {
  app.use(require('../notification-service/index'));
} catch (err) { console.error('Failed to load notification-service', err.message); }

try {
  app.use(require('../public-service/index'));
} catch (err) { console.error('Failed to load public-service', err.message); }

app.listen(PORT, () => {
  console.log(`🚀 Monolithic unified backend started successfully on port ${PORT}`);
});
