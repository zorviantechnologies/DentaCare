import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../utils/supabase';
import api from '../utils/api';
import { ShieldCheck, Mail, Lock, User, PlusCircle, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [clinicName, setClinicName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Sign up user in Supabase Auth
      const { data, error: sbError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: ownerName,
          },
        },
      });

      if (sbError) {
        throw sbError;
      }

      const supabaseUserId = data.user?.id;
      if (!supabaseUserId) {
        throw new Error('Failed to retrieve registered User ID from Supabase.');
      }

      // 2. Register the clinic and owner user in the backend database
      const response = await api.post('/auth/register', {
        clinicName,
        ownerName,
        email,
        supabaseUserId,
      });

      // 3. Retrieve auth session token (try session from signup, otherwise sign in immediately)
      let token = data.session?.access_token;
      if (!token) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          throw signInError;
        }
        token = signInData.session?.access_token;
      }

      if (!token) {
        throw new Error('Failed to retrieve authentication token from Supabase.');
      }

      const { user } = response.data;
      login(token, user);
      navigate('/clinic');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.error || 
        err.message || 
        'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-healthcareBg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-slate-100 p-8 flex flex-col gap-6 relative overflow-hidden">
        {/* Decorative backdrop */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>

        {/* Head */}
        <div className="text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl text-white font-bold font-heading text-2xl flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 mb-4">
            D
          </div>
          <h2 className="font-heading font-bold text-2xl text-slate-800">Register Clinic</h2>
          <p className="text-xs text-slate-400 mt-1">Start your 14-day free trial on the Free tier</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-800 p-3 rounded-xl border border-red-100 text-xs font-semibold flex items-center gap-2">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Clinic name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <PlusCircle size={16} />
              </span>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                placeholder="Apex Dental Studio"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Owner name (Doctor)</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Dr. Ramesh Sharma"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

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
                placeholder="owner@clinic.com"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock size={16} />
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-500/10 transition-all mt-2 active:scale-95 disabled:bg-blue-300"
          >
            {loading ? 'Creating workspace...' : 'Register and Setup Clinic'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 border-t border-slate-100 pt-4">
          Already registered?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};
