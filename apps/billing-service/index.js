require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3008;
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
  res.status(200).json({ status: 'ok', service: 'billing-service' });
});

// POST invoice
app.post('/api/v1/billing/invoices', async (req, res) => {
  try {
    const { case_id, line_items, gst_rate_percent, due_date } = req.body;
    
    // Calculate totals
    const subtotal_inr = line_items.reduce((acc, item) => acc + (item.quantity * item.rate_inr), 0);
    const gst_rate = gst_rate_percent || 18.00;
    const gst_amount_inr = Math.round(subtotal_inr * (gst_rate / 100));
    const total_inr = subtotal_inr + gst_amount_inr;

    // Fetch case — try by UUID first, then fall back to case_number
    let c = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(case_id);
    if (isUuid) {
      c = await prisma.case.findUnique({ where: { id: case_id } });
    }
    if (!c) {
      c = await prisma.case.findUnique({ where: { case_number: case_id } });
    }
    if (!c) return res.status(404).json({ error: 'CASE_NOT_FOUND', message: `No case found for id/number: ${case_id}` });

    const inv = await prisma.invoice.create({
      data: {
        invoice_number: "INV-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 10000),
        case_id: c.id,
        client_id: c.client_id,
        advocate_id: c.advocate_id,
        status: "ISSUED", // Auto-issue so it appears in client billing immediately
        line_items,
        subtotal_inr,
        gst_rate_percent: gst_rate,
        gst_amount_inr,
        total_inr,
        due_date: new Date(due_date),
        issued_at: new Date(),
      }
    });

    res.status(201).json(inv);
  } catch(err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// PATCH Issue Invoice
app.patch('/api/v1/billing/invoices/:id/issue', async (req, res) => {
  try {
    const inv = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { status: "ISSUED", issued_at: new Date() }
    });
    res.status(200).json(inv);
  } catch(err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// GET invoices
app.get('/api/v1/billing/invoices', async (req, res) => {
  try {
    const { client_id, advocate_id, case_id } = req.query;
    
    let whereClause = {};
    if (client_id) whereClause.client_id = client_id;
    if (advocate_id) whereClause.advocate_id = advocate_id;
    if (case_id) whereClause.case_id = case_id;

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });
    
    // Add case names to the payload
    const mapped = await Promise.all(invoices.map(async inv => {
      const c = await prisma.case.findUnique({ where: { id: inv.case_id } });
      return { ...inv, case_title: c ? c.title : "Unknown Case" };
    }));

    res.status(200).json(mapped);
  } catch(err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// POST mock payment
app.post('/api/v1/billing/invoices/:id/pay', async (req, res) => {
  try {
    // This is a direct mock endpoint to transition to PAID bypassing payment gateways
    const inv = await prisma.invoice.findUnique({ where: { id: req.params.id } });
    if (!inv) return res.status(404).json({ error: 'INVOICE_NOT_FOUND' });

    // Mock payment gateway record
    const payment = await prisma.payment.create({
      data: {
        reference_type: "INVOICE",
        reference_id: inv.id,
        payer_id: inv.client_id,
        gateway: "RAZORPAY",
        gateway_order_id: "order_" + Math.random().toString(36).substring(7),
        gateway_payment_id: "pay_" + Math.random().toString(36).substring(7),
        amount_inr: inv.total_inr,
        status: "CAPTURED",
      }
    });

    const updatedInv = await prisma.invoice.update({
      where: { id: req.params.id },
      data: { 
        status: "PAID", 
        paid_at: new Date(),
        amount_paid_inr: inv.total_inr
      }
    });

    res.status(200).json({ success: true, payment_id: payment.id, invoice: updatedInv });
  } catch(err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log('billing-service listening on port ' + PORT);
});
