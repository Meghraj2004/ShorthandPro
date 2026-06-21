// src/pages/LoginPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import tablerIcons from '../icons/tablerIcons';

const { IconPencil, IconMail, IconLock, IconEye, IconEyeOff } = tablerIcons;

export default function LoginPage() {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      const msg = {
        'auth/user-not-found':  'No account found with this email.',
        'auth/wrong-password':  'Incorrect password.',
        'auth/invalid-email':   'Invalid email address.',
        'auth/too-many-requests': 'Too many attempts. Try again later.',
      }[err.code] || err.message || 'Login failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!form.email) { toast.error('Enter your email first'); return; }
    try {
      await resetPassword(form.email);
      toast.success('Password reset email sent!');
    } catch {
      toast.error('Could not send reset email.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink via-ink-light to-ink-deep
                    flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white text-3xl font-bold">
            <IconPencil className="text-primary-400" size={36} />
            Shorthand<span className="text-primary-400">Pro</span>
          </div>
          <p className="text-white/50 text-sm mt-2">Practice Smarter. Qualify Faster.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in</h2>
          <p className="text-gray-500 text-sm mb-6">Welcome back to your practice hub</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={handleReset}
                className="text-primary-500 text-sm hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60
                         text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-500 font-semibold hover:underline">
              Register free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
