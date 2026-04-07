require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3006;
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
  res.status(200).json({ status: 'ok', service: 'document-service' });
});

// POST pre-signed upload URL
app.post('/api/v1/documents/upload-url', async (req, res) => {
  try {
    const { case_id, file_name, file_type, file_size_bytes } = req.body;
    
    if (file_size_bytes > 26214400) return res.status(413).json({ error: 'FILE_TOO_LARGE' });

    const allowedTypes = ['PDF', 'JPEG', 'PNG', 'DOCX', 'XLSX'];
    if (!allowedTypes.includes(file_type)) return res.status(415).json({ error: 'UNSUPPORTED_FILE_TYPE' });

    // Mocking S3 presigned URL generation since we don't have real S3 integrated here
    const documentId = crypto.randomUUID();
    const storageKey = `cases/${case_id}/documents/${documentId}/1/${file_name}`;
    const uploadUrl = `https://mock-s3-bucket.s3.ap-south-1.amazonaws.com/${storageKey}?AWSAccessKeyId=MOCK&Signature=MOCK&Expires=${Date.now() + 15*60*1000}`;

    res.status(200).json({
      upload_url: uploadUrl,
      document_id: documentId,
      storage_key: storageKey
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// POST confirm upload
app.post('/api/v1/documents/confirm', async (req, res) => {
  try {
    const { document_id, request_id } = req.body;
    // Under normal circumstances, verify S3 object exists using AWS SDK headObject.
    // Here we mock verification.

    // Then create Document record
    // Mock record creation:
    res.status(200).json({
      document_id,
      virus_scan_status: "PENDING",
      message: "File received. Virus scan in progress."
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// Demo documents
let DEMO_DOCS = [
  { id: "d1", name: "Property Sale Agreement.pdf", date: "Apr 3, 2026", size: "2.4 MB", case: "C-2026-001" },
  { id: "d2", name: "Complaint Filing Copy.pdf", date: "Mar 28, 2026", size: "1.1 MB", case: "C-2026-002" },
  { id: "d3", name: "Notice from Opposing Party.pdf", date: "Mar 20, 2026", size: "840 KB", case: "C-2026-001" },
];

app.get('/demo-documents', (req, res) => {
  res.status(200).json(DEMO_DOCS);
});

// Demo upload simulation
app.post('/demo-upload', (req, res) => {
  const { file_name, file_size, case_id } = req.body;
  
  if (!file_name || !file_size || !case_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const newDoc = {
    id: `d${DEMO_DOCS.length + 1}`,
    name: file_name,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    size: file_size,
    case: case_id
  };
  
  DEMO_DOCS.push(newDoc); // Store in memory for demo session
  res.status(201).json(newDoc);
});

if (require.main === module) {
  app.listen(PORT, () => {
  console.log('document-service listening on port ' + PORT); 
} else {
  module.exports = app;
}
});
