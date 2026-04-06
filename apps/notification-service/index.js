require('dotenv').config();
const express = require('express');
const cors = require('cors');
// const { Queue, Worker } = require('bullmq'); // Skipped for mock

const app = express();
const PORT = process.env.PORT || 3009;

const corsOptions = {
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
};
app.use(cors(corsOptions));
app.use(express.json());

/* Expected normally: 
const emailQueue = new Queue('emails');
const emailWorker = new Worker('emails', async job => {
  // logic to send via SMTP/SendGrid
});
*/

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'notification-service' });
});

app.post('/api/v1/notifications/dispatch', (req, res) => {
  // Internal endpoint
  const { user_id, type, event, data } = req.body;
  console.log(`[Notification Dispatch] Event: ${event} -> User: ${user_id} via ${type}`);
  res.status(202).json({ message: "QUEUED" });
});

app.listen(PORT, () => {
  console.log('notification-service listening on port ' + PORT);
});
