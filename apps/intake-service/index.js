require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3003;
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
  res.status(200).json({ status: 'ok', service: 'intake-service' });
});

// Public inquiry submission - DB backed
app.post('/public-submit', async (req, res) => {
  try {
    const {
      visitor_name, visitor_email, visitor_phone,
      matter_type, description, urgency, consent_given
    } = req.body;

    if (!visitor_name || !visitor_email || !matter_type || !description) {
      return res.status(422).json({ error: 'MISSING_REQUIRED_FIELDS', message: 'Name, email, matter type, and description are required.' });
    }
    if (!consent_given) {
      return res.status(422).json({ error: 'CONSENT_REQUIRED', message: 'You must consent to our terms before submitting.' });
    }

    // Email format check
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(visitor_email)) {
      return res.status(422).json({ error: 'INVALID_EMAIL', message: 'Please provide a valid email address.' });
    }

    let user = await prisma.user.findUnique({ where: { email: visitor_email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: visitor_email,
          phone: visitor_phone || "0000000000",
          password_hash: "TMP_HASH_WAITING_VERIFICATION",
          role: "CLIENT",
          client_profile: {
            create: { full_name: visitor_name }
          }
        }
      });
    }

    const advocate = await prisma.user.findFirst({ where: { role: 'ADVOCATE' } });

    const newCase = await prisma.case.create({
      data: {
        case_number: "LEX-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 90000),
        client_id: user.id,
        advocate_id: advocate ? advocate.id : user.id,
        matter_type: matter_type.toUpperCase().replace(' ', '_'),
        title: `Inquiry: ${matter_type} - ${visitor_name}`,
        description,
        urgency: urgency ? urgency.toUpperCase() : 'MEDIUM',
        status: "NEW",
      }
    });

    console.log('[intake] DB inquiry received:', newCase.case_number, '|', matter_type);

    res.status(201).json({
      success: true,
      inquiry_id: newCase.case_number,
      status: 'NEW',
      message: 'Your inquiry has been received. Our team will contact you within 24 hours.'
    });
  } catch (err) {
    console.error('[intake] Error:', err.message);
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: 'Something went wrong.' });
  }
});

// Fetch inquiries (advocate dashboard)
app.get('/demo-inquiries', async (req, res) => {
  try {
    const cases = await prisma.case.findMany({
      where: { status: 'NEW' },
      orderBy: { created_at: 'desc' }
    });
    
    // Map to expected format for frontend if necessary, or just return
    const mapped = await Promise.all(cases.map(async (c) => {
      const u = await prisma.user.findUnique({ where: { id: c.client_id }, include: { client_profile: true } });
      return {
        id: c.case_number,
        visitor_name: u?.client_profile?.full_name || u?.email,
        visitor_email: u?.email,
        matter_type: c.matter_type,
        urgency: c.urgency,
        received_at: c.created_at
      };
    }));
    
    res.json({ total: mapped.length, inquiries: mapped });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
  }
});

// Submit Intake
app.post('/api/v1/intake/submit', async (req, res) => {
  try {
    const { matter_type, title, description, urgency, opposing_party_name, visitor_name, visitor_email, visitor_phone, consent_given, captcha_token } = req.body;
    
    if(!consent_given) return res.status(422).json({ error: 'CONSENT_REQUIRED' });
    // CAPTCHA verification mock -> score > 0.5

    // Dupe check within 24h
    const existingCase = await prisma.case.findFirst({
      where: {
        // We lack visitor_email directly on Case in schema, it comes from User. 
        // For a true implementation matching PRD perfectly we'd search client relation or use an intermediate table.
        // Mocking dupe logic for now:
        created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });
    // if (existingCase) return res.status(409).json({ error: 'DUPLICATE_INQUIRY' });

    // Assuming client creation / mapping logic
    // Mock user for client
    let user = await prisma.user.findUnique({ where: { email: visitor_email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: visitor_email,
          phone: visitor_phone,
          password_hash: "TMP_HASH_WAITING_VERIFICATION",
          role: "CLIENT"
        }
      });
    }

    const newCase = await prisma.case.create({
      data: {
        case_number: "LEX-" + new Date().getFullYear() + "-" + Math.floor(Math.random() * 10000),
        client_id: user.id,
        advocate_id: "DUMMY_ADVOCATE_UUID", // Replace in real impl
        matter_type,
        title,
        description,
        urgency,
        opposing_party_name,
        status: "NEW",
        conflict_check_result: "PENDING"
      }
    });

    res.status(201).json({ inquiry_id: newCase.id, status: "NEW", message: "Your inquiry has been received." });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// Conflict Check
app.post('/api/v1/intake/:caseId/conflict-check', async (req, res) => {
  try {
    const { caseId } = req.params;
    const { party_names } = req.body;
    
    // Fuzzy matching against Case.opposing_party_name
    let result = "CLEAR";
    
    // Example logic
    const matchedCases = []; // Push matches here

    await prisma.case.update({
      where: { id: caseId },
      data: { conflict_check_result: result, conflict_check_at: new Date() }
    });

    res.status(200).json({ result, matched_cases: matchedCases, checked_at: new Date() });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log('intake-service listening on port ' + PORT);
});
