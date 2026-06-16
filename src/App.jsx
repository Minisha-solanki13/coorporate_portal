import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import HRDashboard from './components/HRDashboard';

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Check localStorage on mount for session persistence
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setInitializing(false);
  }, []);

  const handleLoginSuccess = (userToken, userData) => {
    setToken(userToken);
    setUser(userData);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (initializing) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-slate-900">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Role-based Dashboard routing
  switch (user.role) {
    case 'employee':
      return <EmployeeDashboard token={token} user={user} onLogout={handleLogout} />;
    case 'manager':
      return <ManagerDashboard token={token} user={user} onLogout={handleLogout} />;
    case 'hr':
      return <HRDashboard token={token} user={user} onLogout={handleLogout} />;
    default:
      return (
        <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div class="text-center bg-white border p-8 rounded-2xl shadow max-w-sm">
            <h2 class="text-lg font-bold text-red-600">Access Error</h2>
            <p class="text-slate-500 text-sm mt-2">Your user account does not have a recognized organizational role. Please contact HR.</p>
            <button onClick={handleLogout} class="mt-6 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold py-2 px-4 rounded-xl">Sign Out</button>
          </div>
        </div>
      );
  }
}
