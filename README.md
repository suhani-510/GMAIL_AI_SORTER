# Gmail AI Sorter

## Local Run Instructions

### Backend:
```
cd backend
npm install
node server.js
```

### Frontend:
```
cd frontend
npm install
npm start
```

### In the Browser:
1. localhost:3000/auth/personal  → Personal Gmail login
2. localhost:3000/auth/college   → College Gmail login (optional)
3. localhost:3001                → React app

---

## Production Deploy

### Step 1 — MongoDB Atlas
1. mongodb.com/atlas → Free account
2. New Cluster → M0 Free
3. Database Access → Create a user
4. Network Access → 0.0.0.0/0
5. Copy the connection string

### Step 2 — Backend → Render.com
1. Create a repository on GitHub and upload the backend folder
2. render.com → New Web Service
3. Environment Variables:
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   REDIRECT_URI=https://YOUR-APP.onrender.com/auth/personal/callback
   REDIRECT_URI_COLLEGE=https://YOUR-APP.onrender.com/auth/college/callback
   GROQ_API_KEY=...
   MONGODB_URI=mongodb+srv://...
   FRONTEND_URL=https://YOUR-APP.vercel.app
   SESSION_SECRET=random_string
   NODE_ENV=production

### Step 3 — Frontend → Vercel.com
1. vercel.com → New Project → frontend folder
2. Environment Variable:
   REACT_APP_BACKEND_URL=https://YOUR-APP.onrender.com
3. Deploy

### Step 4 — Google Cloud Console
Add the authorized redirect URIs:
- https://YOUR-APP.onrender.com/auth/personal/callback
- https://YOUR-APP.onrender.com/auth/college/callback

Authorized JavaScript Origins:
- https://YOUR-APP.vercel.app
