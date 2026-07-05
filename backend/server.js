const express = require('express');
const { google } = require('googleapis');
const Groq = require('groq-sdk');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

const app = express();

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://gmail-sorter-frontend.onrender.com',
  credentials: true
}));
app.use(express.json());

// ─── MongoDB ──────────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err));

// ─── Session ──────────────────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'gmail-ai-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

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

app.get('/api/status', (req, res) => {
  res.json({
    personalConnected: !!req.session.personalTokens,
    collegeConnected: !!req.session.collegeTokens,
    userId: req.session.userId
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
    req.session.userId = data.email;
    req.session.personalTokens = tokens;
    res.redirect(`${process.env.FRONTEND_URL || 'https://gmail-sorter-frontend.onrender.com'}?personal=connected`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL || 'https://gmail-sorter-frontend.onrender.com'}?error=personal_failed`);
  }
});

// College Gmail login
app.get('/auth/college', (req, res) => {
  const url = oauth2ClientCollege.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
  res.redirect(url);
});

app.get('/auth/college/callback', async (req, res) => {
  try {
    const { tokens } = await oauth2ClientCollege.getToken(req.query.code);
    req.session.collegeTokens = tokens;
    res.redirect(`${process.env.FRONTEND_URL || 'https://gmail-sorter-frontend.onrender.com'}?college=connected`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL || 'https://gmail-sorter-frontend.onrender.com'}?error=college_failed`);
  }
});

// Fetch all emails
app.get('/api/emails', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Pehle login karo' });
  }
  try {
    const userId = req.session.userId;
    const allEmails = [];

    if (req.session.personalTokens) {
      oauth2Client.setCredentials(req.session.personalTokens);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const list = await gmail.users.messages.list({ userId: 'me', maxResults: 15 });
      if (list.data.messages) {
        const emails = await fetchAndSave(list.data.messages, gmail, 'Personal', userId);
        allEmails.push(...emails);
      }
    }

    if (req.session.collegeTokens) {
      oauth2ClientCollege.setCredentials(req.session.collegeTokens);
      const gmailCollege = google.gmail({ version: 'v1', auth: oauth2ClientCollege });
      const list2 = await gmailCollege.users.messages.list({ userId: 'me', maxResults: 15 });
      if (list2.data.messages) {
        const emails = await fetchAndSave(list2.data.messages, gmailCollege, 'College', userId);
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

// Logout
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Personal Gmail: http://localhost:${PORT}/auth/personal`);
  console.log(`College Gmail:  http://localhost:${PORT}/auth/college`);
});
