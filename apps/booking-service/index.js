require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3004;
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
  res.status(200).json({ status: 'ok', service: 'booking-service' });
});

// GET slots
app.get('/api/v1/booking/availability', async (req, res) => {
  try {
    const { date } = req.query;
    if(!date) return res.status(400).json({ error: 'INVALID_DATE_FORMAT' });
    
    // Return dummy slots
    res.status(200).json({
      date,
      slots: [
        { slot_id: "slot_1", start: new Date(new Date(date).setHours(10,0,0,0)), end: new Date(new Date(date).setHours(11,0,0,0)), available: true, consultation_types: ["VIDEO"] }
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// POST appointments (Book a slot)
app.post('/api/v1/booking/appointments', async (req, res) => {
  try {
    const { slot_id, consultation_type, visitor_name, visitor_email, visitor_phone, matter_summary, captcha_token } = req.body;
    
    const appt = await prisma.appointment.create({
      data: {
        visitor_name,
        visitor_email,
        visitor_phone,
        advocate_id: "DUMMY_ADVOCATE_UUID",
        consultation_type,
        matter_summary,
        slot_start: new Date(),
        slot_end: new Date(Date.now() + 60*60*1000),
        status: "PENDING_PAYMENT"
      }
    });

    res.status(201).json({
      appointment_id: appt.id,
      status: "PENDING_PAYMENT",
      payment: { razorpay_order_id: "order_" + appt.id, amount_inr: 500000, currency: "INR" }
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// POST Razorpay webhook
app.post('/api/v1/booking/payments/verify', async (req, res) => {
  // Webhook proxy simulated
  res.status(200).send("OK");
});

app.listen(PORT, () => {
  console.log('booking-service listening on port ' + PORT);
});
