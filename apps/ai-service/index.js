require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3011;

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
  res.status(200).json({ status: 'ok', service: 'ai-service' });
});

// POST AI Chat
app.post('/api/v1/ai/chat', async (req, res) => {
  try {
    const { message, session_id } = req.body;
    
    // MOCK LLM response logic based on PRD classification rules
    const lower = message.toLowerCase();
    let classification = "OUT_OF_SCOPE";
    let reply = "I can only assist with legal queries. This is general information, not legal advice.";
    let cta = null;

    if (lower.includes("divorce") || lower.includes("marriage")) {
      classification = "FAMILY";
      reply = "Divorce falls under family law. You should book a consultation for tailored advice. This is general information, not legal advice.";
      cta = { type: "BOOKING", url: "/book" };
    } else if (lower.includes("murder") || lower.includes("police")) {
      classification = "CRIMINAL";
      reply = "Criminal matters require urgent attention. Please submit an inquiry. This is general information, not legal advice.";
      cta = { type: "INTAKE", url: "/inquiry" };
    }

    res.status(200).json({
      reply,
      classification,
      cta
    });
  } catch(err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log('ai-service listening on port ' + PORT);
});
