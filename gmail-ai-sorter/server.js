const express = require('express');
const { google } = require('googleapis');
const Groq = require('groq-sdk');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: "https://gmail-ui.vercel.app"  // apna actual Vercel URL daalna
}));

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Personal Gmail OAuth
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// College Gmail OAuth
const oauth2ClientCollege = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI_COLLEGE
);

// Helper function - emails fetch + classify
async function fetchAndClassify(messages, gmailClient, source) {
  const emails = [];
  for (const m of messages) {
    const msg = await gmailClient.users.messages.get({
      userId: 'me',
      id: m.id,
      format: 'metadata'
    });
    const headers = msg.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find(h => h.name === 'From')?.value || 'Unknown';

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 15,        // thoda zyada room do
      temperature: 0,        // deterministic output, randomness kam
      messages: [{
        role: 'user',
        content: `Classify this email into EXACTLY one category:
Hackathon | CodeContest | CollegeInfo | Jobs | Social | Finance | OTP | Promotions | Other

Rules:
- Hackathon = hackathon events, tech fests, build competitions
- CodeContest = coding contests, leetcode, codeforces, competitive programming
- CollegeInfo = college updates, university emails, campus notices
- Jobs = job offers, internships, hiring, recruitment, naukri, linkedin jobs
- Social = social media notifications, friend activity
- Finance = bank, payments, transactions, billing
- OTP = one time password, verification codes, security alerts
- Promotions = sales, discounts, newsletters, marketing
- Other = anything else

From: ${from}
Subject: ${subject}

Reply with just ONE category word, nothing else.`
      }]
    });
    let raw = completion.choices[0].message.content.trim();

    let category = VALID_CATEGORIES.find(cat =>
      raw.toLowerCase().includes(cat.toLowerCase())
    ) || 'Other';

    emails.push({ from, subject, category, source });
  }

  return emails.reduce((acc, email) => {
    const cat = email.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(email);
    return acc;
  }, {});
}

// Personal Gmail login
app.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
  res.redirect(url);
});

// Personal Gmail callback
app.get('/callback', async (req, res) => {
  try {
    const { tokens } = await oauth2Client.getToken(req.query.code);
    oauth2Client.setCredentials(tokens);
    res.send('Personal Gmail connected! Ab <a href="/college-auth">College Gmail connect karo</a>');
  } catch (err) {
    res.send('Login failed: ' + err.message);
  }
});

// College Gmail login
app.get('/college-auth', (req, res) => {
  const url = oauth2ClientCollege.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/gmail.readonly']
  });
  res.redirect(url);
});

// College Gmail callback
app.get('/college-callback', async (req, res) => {
  try {
    const { tokens } = await oauth2ClientCollege.getToken(req.query.code);
    oauth2ClientCollege.setCredentials(tokens);
    res.send('College Gmail connected! Ab <a href="/all-emails">Emails dekho</a>');
  } catch (err) {
    res.send('College login failed: ' + err.message);
  }
});

// Dono accounts ke emails ek saath
app.get('/all-emails', async (req, res) => {
  try {
    const results = {};

    // Personal Gmail
    const gmail1 = google.gmail({ version: 'v1', auth: oauth2Client });
    const list1 = await gmail1.users.messages.list({ userId: 'me', maxResults: 10 });
    if (list1.data.messages) {
      const personal = await fetchAndClassify(list1.data.messages, gmail1, 'Personal');
      Object.entries(personal).forEach(([cat, list]) => {
        if (!results[cat]) results[cat] = [];
        results[cat].push(...list);
      });
    }

    // College Gmail
    const gmail2 = google.gmail({ version: 'v1', auth: oauth2ClientCollege });
    const list2 = await gmail2.users.messages.list({ userId: 'me', maxResults: 10 });
    if (list2.data.messages) {
      const college = await fetchAndClassify(list2.data.messages, gmail2, 'College');
      Object.entries(college).forEach(([cat, list]) => {
        if (!results[cat]) results[cat] = [];
        results[cat].push(...list);
      });
    }

    res.json(results);
  } catch (err) {
    res.send('Error: ' + err.message);
  }
});

app.listen(3000, () => {
  console.log('Server: http://localhost:3000');
  console.log('Step 1 - Personal Gmail: http://localhost:3000/auth');
  console.log('Step 2 - College Gmail:  http://localhost:3000/college-auth');
  console.log('Step 3 - Dono emails:    http://localhost:3000/all-emails');
});