require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3007;
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

const ENCRYPTION_KEY = process.env.MESSAGE_ENCRYPTION_KEY || '12345678901234567890123456789012'; // 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'messaging-service' });
});

// POST Message
app.post('/api/v1/messages', async (req, res) => {
  try {
    const { case_id, sender_id, content, attachment_id } = req.body;
    
    if (!content) return res.status(422).json({ error: 'CONTENT_REQUIRED' });

    // Validate Case Status - normally handled by middleware fetching case details
    const targetCase = await prisma.case.findUnique({ where: { id: case_id } });
    if (!targetCase) return res.status(404).json({ error: 'CASE_NOT_FOUND' });
    if (targetCase.status === 'CLOSED') return res.status(403).json({ error: 'CASE_IS_CLOSED' });

    const content_encrypted = encrypt(content);

    const msg = await prisma.message.create({
      data: {
        case_id,
        sender_id, // Ensure sender is party to case (mock passing here)
        content_encrypted,
        attachment_id
      }
    });

    res.status(201).json({
      id: msg.id,
      case_id: msg.case_id,
      sender_id: msg.sender_id,
      content: content, // return plaintext to sender immediate response
      attachment_id: msg.attachment_id,
      created_at: msg.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// GET Messages
app.get('/api/v1/messages', async (req, res) => {
  try {
    const { caseId } = req.query;
    if (!caseId) return res.status(400).json({ error: "CASE_ID_REQUIRED" });

    const messages = await prisma.message.findMany({ where: { case_id: caseId }, orderBy: { created_at: 'asc' } });
    
    // Decrypt on output
    const decryptedOutput = messages.map(msg => ({
      ...msg,
      content: decrypt(msg.content_encrypted),
      content_encrypted: undefined // remove encrypted blob from output
    }));

    res.status(200).json(decryptedOutput);
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// Demo messages
let DEMO_MESSAGES = [
  { id: "m1", from: "Adv. Rajan Sharma", preview: "The court has rescheduled the hearing. Please review the new date and confirm attendance.", time: "2h ago", unread: true },
  { id: "m2", from: "LexDesk Support", preview: "Your monthly invoice INV-2026-04 has been generated. Amount: ₹12,500.", time: "Yesterday", unread: true },
  { id: "m3", from: "Adv. Preethi Iyer", preview: "Good news — the Labour Court has ruled in our favor. Settlement will be processed within 30 days.", time: "Mar 29", unread: false },
];

app.get('/demo-messages', (req, res) => {
  res.status(200).json(DEMO_MESSAGES);
});

// Demo send message simulation
app.post('/demo-messages', (req, res) => {
  const { content, sender } = req.body;
  if (!content) return res.status(400).json({ error: "Missing content" });
  
  const newMsg = {
    id: `m${DEMO_MESSAGES.length + 1}`,
    from: sender || "Client User",
    preview: content,
    time: "Just now",
    unread: false
  };
  
  DEMO_MESSAGES.unshift(newMsg); // add to top
  res.status(201).json(newMsg);
  
  // Simulate an auto-reply after 3 seconds asynchronously
  setTimeout(() => {
    DEMO_MESSAGES.unshift({
      id: `m${DEMO_MESSAGES.length + 2}`,
      from: "Adv. Rajan Sharma",
      preview: "I have received your message. I'll review and get back to you shortly.",
      time: "Just now",
      unread: true
    });
  }, 3000);
});

if (require.main === module) {
  app.listen(PORT, () => {
  console.log('messaging-service listening on port ' + PORT); 
} else {
  module.exports = app;
}
});
