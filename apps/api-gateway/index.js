require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Define service routes and their internal ports
const routes = {
  '/api/v1/auth': 'http://localhost:3001',
  '/api/v1/public': 'http://localhost:3002',
  '/api/v1/intake': 'http://localhost:3003',
  '/api/v1/booking': 'http://localhost:3004',
  '/api/v1/cases': 'http://localhost:3005',
  '/api/v1/documents': 'http://localhost:3006',
  '/api/v1/messages': 'http://localhost:3007',
  '/api/v1/billing': 'http://localhost:3008',
  '/api/v1/notifications': 'http://localhost:3009',
  '/api/v1/admin': 'http://localhost:3010',
  '/api/v1/ai': 'http://localhost:3011',
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'api-gateway' });
});

// Setup proxy middleware for each route
for (const [path, target] of Object.entries(routes)) {
  app.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        // We keep the path intact so the downstream service receives /api/v1/...
      },
      onError: (err, req, res) => {
        console.error(`Error proxying to ${target}:`, err.message);
        res.status(503).json({ error: 'SERVICE_UNAVAILABLE', details: err.message });
      }
    })
  );
}

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
