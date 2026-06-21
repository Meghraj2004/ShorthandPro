# ShorthandPro
> A full-stack shorthand & stenography practice platform built with **React + Supabase**.

---

## Project Structure

```
shorthandpro/
├── public/
│   └── index.html
├── src/
│   ├── lib/
│   │   ├── supabase.js    ← Supabase client init
│   │   ├── database.js    ← All database operations
│   │   └── storage.js     ← Audio file upload/download
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
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

---

## Setup Instructions

### Step 1 - Environment Variables
Create a `.env` file in the project root with your Supabase credentials:

```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 2 - Install & Run
```bash
npm install
npm start
```
App runs at `http://localhost:3000`

---

## Creating Your First Admin Account

1. Register normally through the app (`/register`)
2. Go to **Supabase Dashboard → Table Editor → users table**
3. Find your user record
4. Change `role: "student"` to `role: "admin"`
5. Reload the app — you'll see the **Admin** link in the navbar

---

## Database Schema

```
users
  id, uid, name, email, role (student|admin), language,
  current_speed, total_sessions, total_points, streak,
  avatar_initials, unlocked_speeds[], last_active, created_at

passages
  id, title, language (en|mr), wpm (60|80|100|120|140|160),
  category, passage_text, audio_url, audio_path,
  duration, active, play_count, uploaded_by, created_at

sessions
  id, uid, passage_id, passage_title, language, wpm,
  typed_text, accuracy, effective_wpm, grade, word_count, points, created_at

leaderboard
  id, uid, name, avatar_initials, total_points, weekly_points,
  best_accuracy, best_wpm, last_active
```

---

## Features Built

| Feature | Details |
|---|---|
| Auth | Email/Password login, register, forgot password |
| Languages | English & Marathi |
| Speed Levels | 60, 80, 100, 120, 140, 160 WPM |
| Speed Unlock | 3 sessions >= threshold accuracy to unlock next level |
| Audio Player | Play/pause, seek, rewind/forward, playback speed |
| Passage Viewer | Toggle to show original text for self-checking |
| Typing + Accuracy | Word-by-word comparison, grade, feedback |
| Session Saving | Every attempt saved automatically |
| Dashboard | Accuracy trend chart, speed breakdown, session history, achievements |
| Leaderboard | Real-time weekly points ranking |
| Admin - Overview | Recent activity, platform stats |
| Admin - Students | View all users, promote/demote admin |
| Admin - Content | Upload passages + audio, activate/deactivate, delete |
| Admin - Reports | Platform analytics, export buttons |
| Admin - Settings | Toggle platform features (registration, leaderboard, etc.) |

---

## Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Charts**: Recharts
- **Icons**: @tabler/icons-react
