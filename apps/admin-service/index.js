require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3010;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'admin-service' });
});

// GET Audit Logs
app.get('/api/v1/admin/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({ orderBy: { created_at: 'desc' }, take: 100 });
    res.status(200).json(logs);
  } catch(err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// GET Pending Testimonials for approval
app.get('/api/v1/admin/testimonials/pending', async (req, res) => {
  try {
    const pending = await prisma.testimonial.findMany({ where: { is_approved: false } });
    res.status(200).json(pending);
  } catch(err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// PATCH Approve Testimonial
app.patch('/api/v1/admin/testimonials/:id/approve', async (req, res) => {
  try {
    const testimonial = await prisma.testimonial.update({
      where: { id: req.params.id },
      data: { is_approved: true }
    });
    // Log in DB using trigger ideally, or explicitly:
    await prisma.auditLog.create({
      data: { actor_role: 'ADMIN', action: 'TESTIMONIAL_APPROVED', resource_type: 'Testimonial', resource_id: req.params.id, ip_address: req.ip || '127.0.0.1' }
    });
    res.status(200).json(testimonial);
  } catch(err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log('admin-service listening on port ' + PORT);
});
