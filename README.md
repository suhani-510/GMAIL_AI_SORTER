📧 Gmail AI Sorter

An AI-powered Gmail inbox organizer that automatically classifies your emails into meaningful categories — Hackathons, Coding Contests, College Info, Jobs, Finance, OTPs, and more — using LLM-based classification.

🔗 Live App: gmail-sorter-frontend.onrender.com


✨ Features


🔐 Secure Google OAuth 2.0 login (supports both Personal and College Gmail accounts)
🤖 AI-based email classification using Groq (Llama 3.1)
🗂️ Auto-sorts emails into categories: Hackathon, CodeContest, CollegeInfo, Jobs, Social, Finance, OTP, Promotions, Other
💾 MongoDB-backed storage to avoid re-classifying already-seen emails
🖥️ Clean, Gmail-inspired UI built with React
🔄 One-click inbox refresh



🛠️ Tech Stack

LayerTechnologyFrontendReact (Create React App), AxiosBackendNode.js, ExpressDatabaseMongoDB Atlas + MongooseAuthGoogle OAuth 2.0 (googleapis), express-session + connect-mongoAI/LLMGroq SDK (Llama 3.1 8B Instant)HostingRender (Backend: Web Service · Frontend: Static Site)


📁 Project Structure

gmail-ai-sorter-complete/
├── backend/
│   ├── server.js          # Express server, routes, OAuth, AI classification
│   ├── package.json
│   └── .env                # (not committed)
├── frontend/
│   ├── src/
│   │   └── App.js          # Main React app (login screen + inbox UI)
│   ├── public/
│   ├── package.json
│   └── .env                # (not committed)
└── README.md


🚀 Getting Started (Local Development)

Prerequisites


Node.js (v18+)
A MongoDB Atlas cluster
A Google Cloud project with OAuth 2.0 credentials
A Groq API key (console.groq.com)


1. Clone the repository

bashgit clone https://github.com/suhani-510/GMAIL_AI_SORTER.git
cd GMAIL_AI_SORTER

2. Backend setup

bashcd backend
npm install

Create a .env file inside backend/:

envMONGODB_URI=your_mongodb_connection_string
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GROQ_API_KEY=your_groq_api_key
SESSION_SECRET=any_random_string
FRONTEND_URL=http://localhost:3001
REDIRECT_URI=http://localhost:3000/auth/personal/callback
REDIRECT_URI_COLLEGE=http://localhost:3000/auth/college/callback

Run the backend:

bashnpm start

3. Frontend setup

bashcd ../frontend
npm install

Create a .env file inside frontend/:

envREACT_APP_BACKEND_URL=http://localhost:3000

Run the frontend:

bashnpm start

The app will be available at http://localhost:3001 (backend at http://localhost:3000).


🌐 Deployment (Render)

This app is deployed as two separate services on Render:

Backend — Web Service


Root Directory: backend
Build Command: npm install
Start Command: npm start


Frontend — Static Site


Root Directory: frontend
Build Command: npm run build
Publish Directory: build


Required environment variables are set in each service's Environment tab on Render (same variables as the local .env files above, but pointing to the live URLs).


⚠️ Important: NODE_ENV=production must be set on the backend for secure cross-domain session cookies to work correctly on Render.




🔑 Google OAuth Setup

In Google Cloud Console → APIs & Services → Credentials:

Authorized JavaScript origins:

https://gmail-sorter-frontend.onrender.com
https://gmail-sorter-backend.onrender.com

Authorized redirect URIs:

https://gmail-sorter-backend.onrender.com/auth/personal/callback
https://gmail-sorter-backend.onrender.com/auth/college/callback

Add test users under OAuth consent screen → Test users while the app is in Testing mode.


📡 API Endpoints

MethodRouteDescriptionGET/auth/personalStart Google OAuth flow for personal GmailGET/auth/personal/callbackOAuth callback for personal GmailGET/auth/collegeStart Google OAuth flow for college GmailGET/auth/college/callbackOAuth callback for college GmailGET/api/statusCheck current login/connection statusGET/api/emailsFetch and classify emailsGET/auth/logoutDestroy session and log out
