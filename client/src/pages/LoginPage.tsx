import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import api from '../utils/api';
import { KeyRound, Mail, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sessionExpired = searchParams.get('expired') === 'true';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Authenticate with Supabase Auth
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (sbError) {
        throw sbError;
      }

      const token = data.session?.access_token;
      if (!token) {
        throw new Error('Failed to retrieve authentication token from Supabase.');
      }

      // 2. Fetch/Verify the user profile with the backend using the Supabase JWT
      const response = await api.post('/auth/login', { token });

      const { user } = response.data;
      login(token, user);
      navigate('/clinic');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.error || 
        err.message || 
        'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-healthcareBg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 p-8 flex flex-col gap-6 relative overflow-hidden">
        {/* Banner decorations */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>

        {/* Head */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl text-white font-bold font-heading text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 mb-4">
            D
          </div>
          <h2 className="font-heading font-bold text-2xl text-slate-800">Welcome Back</h2>
          <p className="text-xs text-slate-400 mt-1">Access your clinic database panel</p>
        </div>

        {sessionExpired && (
          <div className="bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-100 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={14} />
            Session expired. Please log in again.
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-100 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@dentacare.com"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <Link to="/forgot-password" style={{ display: 'none' }} className="text-[10px] text-blue-600 font-semibold hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <KeyRound size={16} />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between mt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4"
              />
              <span className="text-xs text-slate-500 font-medium">Remember session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-500/10 transition-all mt-2 active:scale-95 disabled:bg-blue-300"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 font-bold hover:underline">
            Register Clinic
          </Link>
        </div>
      </div>
    </div>
  );
};
