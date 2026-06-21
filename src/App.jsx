// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage     from './pages/LoginPage';
import RegisterPage  from './pages/RegisterPage';
import HomePage      from './pages/HomePage';
import PracticePage  from './pages/PracticePage';
import DashboardPage from './pages/DashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import AdminPage     from './pages/AdminPage';

// Layout
import Navbar from './components/Navbar';

// ─── Route Guards ────────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { currentUser, isAdmin } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!isAdmin)     return <Navigate to="/" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/" replace /> : children;
}

// ─── App Shell ───────────────────────────────────────────────────
function AppShell() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser && <Navbar />}
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* Student */}
        <Route path="/"            element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/practice"    element={<PrivateRoute><PracticePage /></PrivateRoute>} />
        <Route path="/dashboard"   element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/leaderboard" element={<PrivateRoute><LeaderboardPage /></PrivateRoute>} />

        {/* Admin only */}
        <Route path="/admin/*" element={<AdminRoute><AdminPage /></AdminRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            fontSize: '14px',
            borderRadius: '10px',
          },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
