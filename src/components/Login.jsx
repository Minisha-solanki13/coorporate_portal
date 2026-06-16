import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Gradients */}
      <div class="absolute -top-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-20"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500 rounded-full blur-3xl opacity-20"></div>

      <div class="max-w-md w-full space-y-8 animate-slide-up bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl z-10">
        <div>
          <div class="mx-auto h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck class="h-8 w-8 text-white" />
          </div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
            Corporate Portal
          </h2>
          <p class="mt-2 text-center text-sm text-slate-400">
            Employee Performance Management System
          </p>
        </div>

        {error && (
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form class="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div class="rounded-md space-y-4">
            <div>
              <label for="email-address" class="block text-sm font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail class="h-5 w-5" />
                </span>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  class="appearance-none relative block w-full pl-10 pr-3 py-2.5 border border-slate-600 placeholder-slate-500 text-white rounded-lg bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock class="h-5 w-5" />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  class="appearance-none relative block w-full pl-10 pr-3 py-2.5 border border-slate-600 placeholder-slate-500 text-white rounded-lg bg-slate-700/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? (
                <Loader class="h-5 w-5 animate-spin" />
              ) : (
                <span class="flex items-center gap-1">
                  Sign In <ArrowRight class="h-4 w-4" />
                </span>
              )}
            </button>
          </div>
        </form>

        {/* Demo Credentials Help Card */}
        <div class="mt-6 pt-6 border-t border-slate-700">
          <p class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Quick-Login Test Roles
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickLogin('employee@company.com', 'employee123')}
              class="bg-slate-700/30 hover:bg-slate-700 border border-slate-600/50 rounded-lg p-2 text-left transition"
            >
              <span class="block text-xs font-bold text-slate-300">Employee</span>
              <span class="block text-[10px] text-slate-500 mt-1">Jane Doe</span>
            </button>
            <button
              onClick={() => handleQuickLogin('manager@company.com', 'manager123')}
              class="bg-slate-700/30 hover:bg-slate-700 border border-slate-600/50 rounded-lg p-2 text-left transition"
            >
              <span class="block text-xs font-bold text-slate-300">Manager</span>
              <span class="block text-[10px] text-slate-500 mt-1">John Smith</span>
            </button>
            <button
              onClick={() => handleQuickLogin('hr@company.com', 'hr123')}
              class="bg-slate-700/30 hover:bg-slate-700 border border-slate-600/50 rounded-lg p-2 text-left transition"
            >
              <span class="block text-xs font-bold text-slate-300">HR Admin</span>
              <span class="block text-[10px] text-slate-500 mt-1">Sarah Connor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
