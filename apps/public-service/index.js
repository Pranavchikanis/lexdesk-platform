require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3002;
const prisma = new PrismaClient();

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

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'public-service' });
});

// GET Advocate Profile
app.get('/api/v1/public/profile', async (req, res) => {
  try {
    const profiles = await prisma.advocateProfile.findMany();
    // Assuming single advocate for now based on PRD
    if (profiles.length === 0) return res.status(404).json({ error: 'PROFILE_NOT_FOUND' });
    res.status(200).json(profiles[0]);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// GET Testimonials (Approved only)
app.get('/api/v1/public/testimonials', async (req, res) => {
  try {
    const testimonials = await prisma.testimonial.findMany({ where: { is_approved: true } });
    res.status(200).json(testimonials);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// POST Testimonial
app.post('/api/v1/cms/testimonials', async (req, res) => {
  // Normally auth middleware used here
  try {
    const { author_name, content } = req.body;
    
    // BCI constraint: strip out PII and explicit keywords
    const forbidden = ["best", "top-rated", "most experienced"];
    const hasForbidden = forbidden.some(word => content.toLowerCase().includes(word));
    if(hasForbidden) return res.status(400).json({ error: 'CONTENT_POLICY_VIOLATION' });

    const test = await prisma.testimonial.create({
      data: { author_name, content, is_approved: false }
    });
    res.status(201).json({ message: "Testimonial submitted for moderation", id: test.id });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// Other endpoints (Blog, Practice Areas, Fees) stubbed out for brevity...

if (require.main === module) {
  app.listen(PORT, () => {
  console.log('public-service listening on port ' + PORT); 
} else {
  module.exports = app;
}
});
