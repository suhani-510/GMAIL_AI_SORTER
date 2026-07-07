const express = require('express');
const { google } = require('googleapis');
const Groq = require('groq-sdk');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://gmail-sorter-frontend.onrender.com',
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// ─── UserTokens Schema — Google tokens ab yahan store honge, session mein nahi ──
const UserTokensSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  personalTokens: Object,
  collegeTokens: Object,
});
const UserTokens = mongoose.model('UserTokens', UserTokensSchema);

// ─── MongoDB Schema ───────────────────────────────────────────────────────────
const EmailSchema = new mongoose.Schema({
  userId: String,
  messageId: String,
  from: String,
  subject: String,
  category: String,
  source: String,
  date: { type: Date, default: Date.now }
});
EmailSchema.index({ userId: 1, messageId: 1 }, { unique: true });
const Email = mongoose.model('Email', EmailSchema);

// ─── Groq ─────────────────────────────────────────────────────────────────────
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─── Google OAuth ─────────────────────────────────────────────────────────────
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

const oauth2ClientCollege = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI_COLLEGE
);

// ─── JWT helpers ──────────────────────────────────────────────────────────────
function signToken(email) {
  return jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

function authenticateJWT(req, res, next) {
  const header = req.headers.authorization;
  const token = header && header.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.userEmail = payload.email;
    next();
  });
}

// ─── Helper: classify ─────────────────────────────────────────────────────────
async function classifyEmail(from, subject) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    max_tokens: 10,
    messages: [{
      role: 'user',
      content: `Classify this email into EXACTLY one category:
Hackathon | CodeContest | CollegeInfo | Jobs | Social | Finance | OTP | Promotions | Other

Rules:
- Hackathon = hackathon events, tech fests, build competitions
- CodeContest = coding contests, leetcode, codeforces, competitive programming
- CollegeInfo = college updates, university emails, campus notices
- Jobs = job offers, internships, hiring, recruitment
- Social = social media notifications
- Finance = bank, payments, transactions
- OTP = one time password, verification codes
- Promotions = sales, discounts, newsletters
- Other = anything else

From: ${from}
Subject: ${subject}

Reply with just ONE category word, nothing else.`
    }]
  });
  return completion.choices[0].message.content.trim();
}

// ─── Helper: fetch + save ─────────────────────────────────────────────────────
async function fetchAndSave(messages, gmailClient, source, userId) {
  const results = [];
  for (const m of messages) {
    const existing = await Email.findOne({ userId, messageId: m.id });
    if (existing) { results.push(existing); continue; }

    const msg = await gmailClient.users.messages.get({
      userId: 'me', id: m.id, format: 'metadata'
    });
    const headers = msg.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';

    const category = await classifyEmail(from, subject);
    const email = new Email({ userId, messageId: m.id, from, subject, category, source });
    await email.save();
    results.push(email);
  }
  return results;
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

app.get('/api/status', authenticateJWT, async (req, res) => {
  const user = await UserTokens.findOne({ email: req.userEmail });
  res.json({
    personalConnected: !!(user && user.personalTokens),
    collegeConnected: !!(user && user.collegeTokens),
    userId: req.userEmail
  });
});

// Personal Gmail login
app.get('/auth/personal', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  });
  res.redirect(url);
});

app.get('/auth/personal/callback', async (req, res) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();

    await UserTokens.findOneAndUpdate(
      { email: data.email },
      { email: data.email, personalTokens: tokens },
      { upsert: true }
    );

    const jwtToken = signToken(data.email);
    res.redirect(`${process.env.FRONTEND_URL || 'https://gmail-sorter-frontend.onrender.com'}?token=${jwtToken}&personal=connected`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL || 'https://gmail-sorter-frontend.onrender.com'}?error=personal_failed`);
  }
});

// College Gmail login
app.get('/auth/college', (req, res) => {
  const url = oauth2ClientCollege.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly'],
    state: req.query.token || ''
  });
  res.redirect(url);
});

app.get('/auth/college/callback', async (req, res) => {
  try {
    const { tokens } = await oauth2ClientCollege.getToken(req.query.code);
    const payload = jwt.verify(req.query.state, process.env.JWT_SECRET);

    await UserTokens.findOneAndUpdate(
      { email: payload.email },
      { collegeTokens: tokens },
      { upsert: true }
    );

    res.redirect(`${process.env.FRONTEND_URL || 'https://gmail-sorter-frontend.onrender.com'}?college=connected`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL || 'https://gmail-sorter-frontend.onrender.com'}?error=college_failed`);
  }
});

// Fetch all emails
app.get('/api/emails', authenticateJWT, async (req, res) => {
  try {
    const user = await UserTokens.findOne({ email: req.userEmail });
    if (!user) return res.status(401).json({ error: 'Pehle login karo' });

    const allEmails = [];

    if (user.personalTokens) {
      oauth2Client.setCredentials(user.personalTokens);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const list = await gmail.users.messages.list({ userId: 'me', maxResults: 15 });
      if (list.data.messages) {
        const emails = await fetchAndSave(list.data.messages, gmail, 'Personal', req.userEmail);
        allEmails.push(...emails);
      }
    }

    if (user.collegeTokens) {
      oauth2ClientCollege.setCredentials(user.collegeTokens);
      const gmailCollege = google.gmail({ version: 'v1', auth: oauth2ClientCollege });
      const list2 = await gmailCollege.users.messages.list({ userId: 'me', maxResults: 15 });
      if (list2.data.messages) {
        const emails = await fetchAndSave(list2.data.messages, gmailCollege, 'College', req.userEmail);
        allEmails.push(...emails);
      }
    }

    const grouped = allEmails.reduce((acc, email) => {
      const cat = email.category || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push({
        id: email.messageId,
        from: email.from,
        subject: email.subject,
        category: email.category,
        source: email.source,
        date: email.date
      });
      return acc;
    }, {});

    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Personal Gmail: http://localhost:${PORT}/auth/personal`);
  console.log(`College Gmail:  http://localhost:${PORT}/auth/college`);
});