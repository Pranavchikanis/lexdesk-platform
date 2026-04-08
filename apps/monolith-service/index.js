require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 8080;

let prisma;
try { prisma = new PrismaClient(); } catch(e) { console.warn('Prisma unavailable:', e.message); }

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

app.use(express.json());

// Provide a central health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'monolith-service', message: 'LexDesk Unified Backend Running' });
});

// ── Demo data endpoints (always available) ─────────────────────────────────

const DEMO_CASES = [
  { id: 'C-2026-001', case_number: 'LEX-2026-00101', title: 'Property Dispute — Pune District Court', matter_type: 'CIVIL', status: 'ACTIVE', urgency: 'HIGH', court_name: 'Pune District Court', next_hearing: '2026-04-14', created_at: new Date().toISOString() },
  { id: 'C-2026-002', case_number: 'LEX-2026-00102', title: 'Consumer Complaint — NCDRC', matter_type: 'CONSUMER', status: 'UNDER_REVIEW', urgency: 'MEDIUM', court_name: 'NCDRC, New Delhi', next_hearing: '2026-04-12', created_at: new Date().toISOString() },
  { id: 'C-2026-003', case_number: 'LEX-2026-00103', title: 'Employment Dispute — Labour Court', matter_type: 'LABOUR', status: 'ACTIVE', urgency: 'LOW', court_name: 'Labour Court, Mumbai', next_hearing: '2026-04-20', created_at: new Date().toISOString() },
];

const DEMO_DOCS = [
  { id: 'd1', title: 'Property Sale Agreement.pdf', type: 'PDF', case_id: 'C-2026-001', uploaded_at: new Date(Date.now() - 3600000).toISOString(), size_kb: 842 },
  { id: 'd2', title: 'Court Notice — Apr 14.pdf', type: 'PDF', case_id: 'C-2026-001', uploaded_at: new Date(Date.now() - 86400000).toISOString(), size_kb: 310 },
  { id: 'd3', title: 'Consumer Complaint Filing.pdf', type: 'PDF', case_id: 'C-2026-002', uploaded_at: new Date(Date.now() - 172800000).toISOString(), size_kb: 1200 },
  { id: 'd4', title: 'Identity Proof — Aadhaar.pdf', type: 'PDF', case_id: 'C-2026-002', uploaded_at: new Date(Date.now() - 259200000).toISOString(), size_kb: 450 },
];

let DEMO_MSGS = [
  { id: 'm1', content: 'Your hearing for the Property Dispute case is confirmed for April 14th at 10:30 AM. Please bring original documents.', sender: 'Adv. Rajan Sharma', role: 'ADVOCATE', created_at: new Date(Date.now() - 10800000).toISOString(), read: false },
  { id: 'm2', content: 'The Consumer Complaint has been filed. Expect acknowledgement within 5 business days.', sender: 'Adv. Rajan Sharma', role: 'ADVOCATE', created_at: new Date(Date.now() - 86400000).toISOString(), read: false },
  { id: 'm3', content: 'All documents received. I will review and revert by tomorrow.', sender: 'Adv. Rajan Sharma', role: 'ADVOCATE', created_at: new Date(Date.now() - 172800000).toISOString(), read: true },
];

app.get('/demo-cases', (req, res) => res.json(DEMO_CASES));

app.get('/demo-documents', (req, res) => res.json(DEMO_DOCS));

app.get('/demo-messages', (req, res) => res.json(DEMO_MSGS));

// ── Advocate Dashboard Demo Endpoints ──────────────────────────────────────

const DEMO_ALL_CASES = [
  { id: 'C-2026-001', title: 'Property Dispute', client: 'Rahul Sharma', status: 'HEARING', next_action: 'Hearing — Apr 14', urgency: 'HIGH' },
  { id: 'C-2026-002', title: 'Consumer Complaint vs Apex Corp', client: 'Priya Mehta', status: 'DRAFTING', next_action: 'Draft Reply — Apr 18', urgency: 'MEDIUM' },
  { id: 'C-2026-003', title: 'Employment Dispute', client: 'Rahul Sharma', status: 'NEGOTIATION', next_action: 'Settlement Call — Apr 22', urgency: 'LOW' },
  { id: 'C-2026-004', title: 'Property Registration Dispute', client: 'Anjali Mehta', status: 'INTAKE', next_action: 'Initial Consultation', urgency: 'MEDIUM' },
  { id: 'C-2026-005', title: 'Cheque Bounce — Section 138', client: 'Vikram Singh', status: 'HEARING', next_action: 'Cross-examination — Apr 30', urgency: 'HIGH' },
];

const DEMO_INQUIRIES = [
  { id: 'INQ-001', visitor_name: 'Anjali Mehta', visitor_email: 'anjali@example.com', visitor_phone: '+91 98765 43210', matter_type: 'PROPERTY', description: 'Dispute regarding inheritance of ancestral property in Pune.', urgency: 'HIGH', status: 'PENDING', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'INQ-002', visitor_name: 'Vikram Singh', visitor_email: 'vikram@example.com', visitor_phone: '+91 87654 32109', matter_type: 'CRIMINAL', description: 'Cheque bounce case — Section 138 NI Act.', urgency: 'HIGH', status: 'PENDING', created_at: new Date(Date.now() - 7200000).toISOString() },
];

app.get('/demo-dashboard-stats', (req, res) => res.json({
  active_cases: 3,
  pending_intakes: 2,
  upcoming_hearings: 3,
  monthly_revenue: '₹1,25,000',
}));

app.get('/demo-all-cases', (req, res) => res.json(DEMO_ALL_CASES));

app.get('/demo-inquiries', (req, res) => res.json({ inquiries: DEMO_INQUIRIES }));


app.post('/demo-messages', (req, res) => {
  const { content, sender } = req.body;
  const msg = { id: `m${Date.now()}`, content, sender: sender || 'Client', role: 'CLIENT', created_at: new Date().toISOString(), read: true };
  DEMO_MSGS.unshift(msg);
  res.status(201).json(msg);
});

// ── Public inquiry submission ───────────────────────────────────────────────
app.post('/public-submit', async (req, res) => {
  const { visitor_name, visitor_email, visitor_phone, matter_type, description, urgency, consent_given } = req.body;
  if (!visitor_name || !visitor_email || !matter_type || !consent_given) {
    return res.status(400).json({ error: 'MISSING_REQUIRED_FIELDS', message: 'Name, email, matter type and consent are required.' });
  }
  const inquiry_id = `INQ-${Date.now()}`;
  console.log(`[intake] New inquiry from ${visitor_name} <${visitor_email}> — ${matter_type}`);

  // Try DB save, fall back to in-memory acknowledgement
  if (prisma) {
    try {
      await prisma.intake.create({
        data: { visitor_name, visitor_email, visitor_phone: visitor_phone || null, matter_type, description, urgency: urgency || 'NORMAL', consent_given: true, status: 'PENDING' }
      });
    } catch(e) {
      console.warn('[intake] DB save failed, returning in-memory ack:', e.message);
    }
  }
  res.status(201).json({ success: true, inquiry_id, message: `Thank you ${visitor_name}! We will contact you at ${visitor_email} within 24 hours.` });
});

// ── Mount all microservices ────────────────────────────────────────────────

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
