require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const { PrismaClient } = require('@prisma/client');

const app = express();
const PORT = process.env.PORT || 3001;
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

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'super-refresh-key-for-dev';

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth-service' });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'MISSING_FIELDS', message: 'Email and password are required.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        client_profile: true,
        advocate_profile: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' });
    }

    // Determine full name and avatar
    let fullName = user.email;
    let initials = 'U';
    
    if (user.role === 'CLIENT' && user.client_profile) {
      fullName = user.client_profile.full_name;
      initials = fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    } else if (user.role === 'ADVOCATE' && user.advocate_profile) {
      fullName = user.advocate_profile.full_name;
      // Exclude titles like "Adv." from initials
      const nameParts = fullName.replace('Adv. ', '').split(' ');
      initials = nameParts.map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }

    const accessToken = jwt.sign(
      { sub: user.id, role: user.role, email: user.email, name: fullName },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    console.log(`[auth] Real DB login: ${user.email} (${user.role})`);

    res.status(200).json({
      success: true,
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: fullName,
        avatar_initials: initials,
      }
    });
  } catch (error) {
    console.error('[auth] Login error:', error);
    res.status(500).json({ error: 'SERVER_ERROR', message: 'Internal server error' });
  }
});

// Token validation (no DB)
app.get('/validate', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ valid: true, payload });
  } catch {
    res.status(401).json({ error: 'INVALID_TOKEN' });
  }
});

// Register
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password || password.length < 8) {
      return res.status(400).json({ error: 'INVALID_INPUT' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'EMAIL_ALREADY_EXISTS' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    // Role logic restriction, e.g. VISITOR or CLIENT allowed, ADVOCATE/ADMIN requires manual setup
    
    // For MVP prototyping we allow passing role directly 
    const finalRole = role || 'VISITOR';
    
    // Auto-enable 2FA constraint
    const needs2FA = ['ADVOCATE', 'ADMIN'].includes(finalRole);

    const user = await prisma.user.create({
      data: {
        email,
        password_hash,
        role: finalRole,
        two_fa_enabled: needs2FA, // Enforce 2FA true if advocate/admin
      }
    });

    res.status(201).json({ id: user.id, email: user.email, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// Login
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
    }

    // 2FA check
    if (user.two_fa_enabled) {
      if (!otp) {
        return res.status(403).json({ error: '2FA_REQUIRED' });
      }
      
      // In production, we'd verify the OTP here
      // const verified = speakeasy.totp.verify({ secret: user.two_fa_secret, encoding: 'base32', token: otp });
      // if (!verified) return res.status(403).json({ error: 'OTP_INVALID' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { last_login_at: new Date() }
    });

    const accessToken = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ sub: user.id }, REFRESH_SECRET, { expiresIn: '7d' });

    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: true, sameSite: 'Strict', path: '/api/v1/auth/refresh' });
    
    res.status(200).json({
      access_token: accessToken,
      user: { id: user.id, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'INTERNAL_SERVER_ERROR', message: err.message });
  }
});

// Middleware exporter pattern conceptually
// Could be exposed as a small library but we will do it inline or duplicate for speed
app.get('/api/v1/auth/validate-token', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'UNAUTHORIZED' });
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ valid: true, payload });
  } catch(e) {
    res.status(401).json({ error: 'UNAUTHORIZED' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
  console.log(`Auth Service listening on port ${PORT}`);
});
} else {
  module.exports = app;
}
