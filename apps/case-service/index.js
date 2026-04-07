require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3005;
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
  res.status(200).json({ status: 'ok', service: 'case-service' });
});

// GET all cases (ADVOCATE view)
app.get('/api/v1/cases', async (req, res) => {
  try {
    const cases = await prisma.case.findMany();
    res.status(200).json(cases);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// GET specific case
app.get('/api/v1/cases/:id', async (req, res) => {
  try {
    const caseItem = await prisma.case.findUnique({ where: { id: req.params.id } });
    if (!caseItem) return res.status(404).json({ error: 'CASE_NOT_FOUND' });
    
    // SEC-11 restriction mapping (In real life check caller role via JWT middleware)
    // If caller is CLIENT:
    // delete caseItem.internal_notes;
    
    res.status(200).json(caseItem);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// PATCH status (Transition machine)
app.patch('/api/v1/cases/:id/status', async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    // Fetch current status
    const existing = await prisma.case.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'CASE_NOT_FOUND' });
    
    // Dummy state transition rule example (NEW -> UNDER_REVIEW)
    const validTransitions = {
      'NEW': ['UNDER_REVIEW', 'REJECTED'],
      'UNDER_REVIEW': ['CONFLICT_FLAGGED', 'ACCEPTED', 'REJECTED'],
      'CONFLICT_FLAGGED': ['UNDER_REVIEW'],
      'ACCEPTED': ['ACTIVE'],
      'ACTIVE': ['ON_HOLD', 'CLOSED'],
      'ON_HOLD': ['ACTIVE']
    };

    if (!validTransitions[existing.status]?.includes(status)) {
      return res.status(422).json({
        error: "INVALID_STATE_TRANSITION",
        current_status: existing.status,
        allowed_transitions: validTransitions[existing.status] || []
      });
    }

    if (status === 'REJECTED' && !reason) {
      return res.status(422).json({ error: "REQUIRED_REASON" });
    }

    const updated = await prisma.case.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.status(200).json({
      id: updated.id,
      previous_status: existing.status,
      new_status: updated.status,
      updated_at: updated.updated_at
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// POST close case
app.post('/api/v1/cases/:id/close', async (req, res) => {
  try {
    // Check if open invoices exist
    const draftInvoicesCount = await prisma.invoice.count({
      where: { case_id: req.params.id, status: { in: ['DRAFT', 'ISSUED'] } }
    });

    if (draftInvoicesCount > 0) {
      return res.status(409).json({ error: 'OUTSTANDING_INVOICES', message: 'Resolve billing first.' });
    }

    const updated = await prisma.case.update({
      where: { id: req.params.id },
      data: { status: 'CLOSED', closed_at: new Date() }
    });

    res.status(200).json({ message: 'CASE_CLOSED', id: updated.id });
  } catch(err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// Demo cases (Client View)
app.get('/demo-cases', async (req, res) => {
  const staticDemo = [
    { id: "C-2026-001", title: "Property Dispute — Pune District Court", status: "ACTIVE", statusColor: "#34d399", court: "Pune District Court", next_date: "Tomorrow, 10:30 AM", advocate: "Adv. Rajan Sharma" },
    { id: "C-2026-002", title: "Consumer Complaint — NCDRC", status: "UNDER REVIEW", statusColor: "#fbbf24", court: "NCDRC, New Delhi", next_date: "Deadline: Apr 12, 2026", advocate: "Adv. Rajan Sharma" },
    { id: "C-2026-003", title: "Employment Dispute — Labour Court", status: "CLOSED", statusColor: "#6b7280", court: "Labour Court, Pune", next_date: "Resolved: Mar 2026", advocate: "Adv. Preethi Iyer" },
  ];

  try {
    const realCases = await prisma.case.findMany({
      where: { status: { not: 'NEW' } } // Exclude intake queue items
    });
    
    const mappedReal = await Promise.all(realCases.map(async c => {
      const adv = await prisma.user.findUnique({ where: { id: c.advocate_id }, include: { advocate_profile: true } });
      return {
        id: c.case_number,
        title: c.title,
        status: (c.status || "").replace('_', ' '),
        statusColor: c.status === "ACTIVE" ? "#34d399" : "#fbbf24",
        court: c.court_name || "Assigned Court",
        next_date: c.next_hearing_date ? "Upcoming Hearing" : "Pending Action",
        advocate: adv?.advocate_profile?.full_name || "Assigned Advocate"
      };
    }));

    res.status(200).json([...mappedReal, ...staticDemo]);
  } catch (err) {
    res.status(200).json(staticDemo);
  }
});

// Demo cases (Advocate View - All firm cases)
app.get('/demo-all-cases', async (req, res) => {
  const staticDemo = [
    { id: "C-2026-001", client: "Anjali Mehta", title: "Property Dispute", stage: "HEARING", status: "ACTIVE", next_action: "Submit Evidence", deadline: "Apr 10" },
    { id: "C-2026-002", client: "Anjali Mehta", title: "Consumer Complaint", stage: "DRAFTING", status: "UNDER REVIEW", next_action: "Review Notice", deadline: "Apr 12" },
    { id: "C-2026-004", client: "Rakesh Singh", title: "Corporate Restructuring", stage: "NEGOTIATION", status: "ACTIVE", next_action: "Client Meeting", deadline: "Apr 15" },
    { id: "C-2026-005", client: "Priya Sharma", title: "Divorce Proceedings", stage: "INTAKE", status: "NEW", next_action: "Conflict Check", deadline: "Apr 08" },
  ];

  try {
    const realCases = await prisma.case.findMany();
    const mappedReal = await Promise.all(realCases.map(async c => {
      const client = await prisma.user.findUnique({ where: { id: c.client_id }, include: { client_profile: true } });
      let stage = "INTAKE";
      if (c.status === "UNDER_REVIEW") stage = "DRAFTING";
      if (c.status === "ACTIVE") stage = "NEGOTIATION";
      if (c.status === "CLOSED") stage = "CLOSED";
      
      return {
        id: c.case_number,
        client: client?.client_profile?.full_name || client?.email || "Unknown Client",
        title: c.title,
        stage: stage,
        status: c.status,
        next_action: "Pending Action",
        deadline: "TBD"
      };
    }));
    
    res.status(200).json([...mappedReal, ...staticDemo]);
  } catch (err) {
    res.status(200).json(staticDemo);
  }
});

// Demo dashboard stats (Advocate View)
app.get('/demo-dashboard-stats', async (req, res) => {
  try {
    const activeCount = await prisma.case.count({ where: { status: 'ACTIVE' } });
    const intakeCount = await prisma.case.count({ where: { status: 'NEW' } });
    
    res.status(200).json({
      active_cases: 24 + activeCount,
      pending_intakes: 5 + intakeCount,
      upcoming_hearings: 3,
      monthly_revenue: "₹1,45,000"
    });
  } catch(err) {
    res.status(200).json({
      active_cases: 24,
      pending_intakes: 5,
      upcoming_hearings: 3,
      monthly_revenue: "₹1,45,000"
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
  console.log('case-service listening on port ' + PORT); 
} else {
  module.exports = app;
}
});
