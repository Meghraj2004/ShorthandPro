// src/pages/RegisterPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import tablerIcons from '../icons/tablerIcons';

const { IconPencil, IconMail, IconLock, IconUser, IconEye, IconEyeOff } = tablerIcons;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form.name.trim(), form.email, form.password);
      toast.success('Account created! Welcome to ShorthandPro 🎉');
      navigate('/');
    } catch (err) {
      const msg = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email':        'Invalid email address.',
        'auth/weak-password':        'Password is too weak.',
      }[err.code] || err.message || 'Registration failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink via-ink-light to-ink-deep
                    flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-white text-3xl font-bold">
            <IconPencil className="text-primary-400" size={36} />
            Shorthand<span className="text-primary-400">Pro</span>
          </div>
          <p className="text-white/50 text-sm mt-2">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create account</h2>
          <p className="text-gray-500 text-sm mb-6">Start your shorthand journey today</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <IconUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text" required value={form.name} onChange={set('name')}
                  placeholder="Rahul Sharma"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email" required value={form.email} onChange={set('email')}
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
                  type={showPw ? 'text' : 'password'} required value={form.password} onChange={set('password')}
                  placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <div className="relative">
                <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPw ? 'text' : 'password'} required value={form.confirm} onChange={set('confirm')}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl
                             focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-60
                         text-white font-semibold py-3 rounded-xl transition-colors text-sm mt-2"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-500 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
