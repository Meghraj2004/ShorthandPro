# ShorthandPro 🖊️
> A full-stack shorthand & stenography practice platform built with **React + Firebase**.

---

## 📁 Project Structure

```
shorthandpro/
├── public/
│   └── index.html
├── src/
│   ├── firebase/
│   │   ├── config.js       ← Firebase init (PUT YOUR CONFIG HERE)
│   │   ├── firestore.js    ← All database operations
│   │   └── storage.js      ← Audio file upload/download
│   ├── context/
│   │   └── AuthContext.jsx ← Auth state across entire app
│   ├── components/
│   │   └── Navbar.jsx
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── PracticePage.jsx    ← Audio player + typing
│   │   ├── DashboardPage.jsx   ← Charts + history
│   │   ├── LeaderboardPage.jsx ← Real-time rankings
│   │   └── AdminPage.jsx       ← Full admin panel
│   ├── App.jsx             ← Routing
│   ├── index.js
│   └── index.css
├── firestore.rules         ← Firestore security rules
├── storage.rules           ← Storage security rules
├── firestore.indexes.json  ← Required composite indexes
├── firebase.json           ← Hosting + deploy config
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## 🚀 Setup Instructions

### Step 1 — Create Firebase Project
1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add Project** → Name it `ShorthandPro`
3. Disable Google Analytics (optional) → **Create Project**

### Step 2 — Enable Firebase Services
In the Firebase console:
- **Authentication** → Get Started → Enable **Email/Password**
- **Firestore Database** → Create database → Start in **production mode** → Choose region
- **Storage** → Get started → Start in **production mode**

### Step 3 — Get Your Config
1. Project Settings (⚙️ gear icon) → General → scroll to **Your Apps**
2. Click **</>** (Web app) → Register app → Copy the config object
3. Open `src/firebase/config.js` and **replace all placeholder values**

```js
const firebaseConfig = {
  apiKey:            "REPLACE_THIS",
  authDomain:        "REPLACE_THIS",
  projectId:         "REPLACE_THIS",
  storageBucket:     "REPLACE_THIS",
  messagingSenderId: "REPLACE_THIS",
  appId:             "REPLACE_THIS"
};
```

### Step 4 — Install & Run
```bash
cd shorthandpro
npm install
npm start
```
App runs at `http://localhost:3000`

---

## 🔑 Creating Your First Admin Account

1. Register normally through the app (`/register`)
2. Go to **Firebase Console → Firestore → users collection**
3. Find your user document
4. Change `role: "student"` → `role: "admin"`
5. Reload the app — you'll see the **Admin** link in the navbar

---

## 📦 Deploying to Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (in project folder)
firebase init
# Select: Hosting, Firestore, Storage
# Public directory: build
# Single page app: Yes

# Build the React app
npm run build

# Deploy everything
firebase deploy
```

Your site will be live at: `https://YOUR_PROJECT_ID.web.app`

---

## 🗄️ Firestore Data Structure

```
users/{uid}
  name, email, role, currentSpeed, unlockedSpeeds[],
  totalSessions, totalPoints, streak, avatarInitials

passages/{id}
  title, language (en|mr), wpm (60|80|100|120|140|160),
  category, passageText, audioURL, audioPath,
  duration, active, playCount, uploadedBy, createdAt

sessions/{id}
  uid, passageId, passageTitle, language, wpm,
  typedText, accuracy, effectiveWpm, grade, points, createdAt

leaderboard/{uid}
  uid, name, avatarInitials, totalPoints, weeklyPoints, lastActive
```

---

## 🔒 Security Rules
Rules are in `firestore.rules` and `storage.rules`.
- Students can only read/write their own data
- Only admins can upload/delete passages
- Sessions are immutable (no edits after saving)

Deploy rules:
```bash
firebase deploy --only firestore:rules,storage
```

---

## ✨ Features Built

| Feature | Details |
|---|---|
| Auth | Email/Password login, register, forgot password |
| Languages | English 🇬🇧 & Marathi 🇮🇳 |
| Speed Levels | 60, 80, 100, 120, 140, 160 WPM |
| Speed Unlock | 3 sessions ≥ threshold accuracy to unlock next level |
| Audio Player | Play/pause, seek, rewind/forward, playback speed |
| Passage Viewer | Toggle to show original text for self-checking |
| Typing + Accuracy | Word-by-word comparison, grade, feedback |
| Session Saving | Every attempt saved to Firestore automatically |
| Dashboard | Accuracy trend chart, speed breakdown, session history, achievements |
| Leaderboard | Real-time weekly points ranking via onSnapshot |
| Admin — Overview | Recent activity, platform stats |
| Admin — Students | View all users, promote/demote admin |
| Admin — Content | Upload passages + audio, activate/deactivate, delete |
| Admin — Reports | Platform analytics, export buttons |
| Admin — Settings | Toggle platform features (registration, leaderboard, etc.) |

---

## 📞 What to Build Next
- [ ] Certificate generation (PDF) on speed level completion
- [ ] Email notifications via Firebase Extensions
- [ ] Weekly leaderboard auto-reset via Cloud Functions
- [ ] Mobile app (React Native + same Firebase backend)
- [ ] OCR input (photo of handwritten shorthand)
