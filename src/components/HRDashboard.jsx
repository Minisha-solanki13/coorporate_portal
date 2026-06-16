import React, { useState, useEffect } from 'react';
import { LogOut, Search, Filter, ShieldAlert, Award, TrendingUp, AlertCircle, PlusCircle, CheckCircle, RefreshCw, Star, Info, UserPlus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function HRDashboard({ token, user, onLogout }) {
  const [reviews, setReviews] = useState([]);
  const [dbStats, setDbStats] = useState({ totalUsers: 0, totalReviews: 0, finalizedReviews: 0, pendingHR: 0, pendingManager: 0 });
  const [selectedReview, setSelectedReview] = useState(null);
  
  // HR Form Inputs
  const [hrRemarks, setHrRemarks] = useState('');
  const [discussionNotes, setDiscussionNotes] = useState('');
  const [appraisalPercentage, setAppraisalPercentage] = useState(0);
  const [promotionRecommended, setPromotionRecommended] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Register New User
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('password123');
  const [regRole, setRegRole] = useState('employee');
  const [regDept, setRegDept] = useState('Engineering');
  const [regManagerId, setRegManagerId] = useState('');
  const [regSick, setRegSick] = useState(2);
  const [regPaid, setRegPaid] = useState(8);
  const [regHours, setRegHours] = useState(155);
  const [regProj, setRegProj] = useState(3);
  const [regAttendance, setRegAttendance] = useState(95);

  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchData = async () => {
    try {
      // Fetch reviews
      const revRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reviews/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (revRes.status === 401) {
        onLogout();
        return;
      }
      const revData = await revRes.json();
      if (revRes.ok) setReviews(revData);

      // Fetch stats
      const statRes = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/users/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statRes.status === 401) {
        onLogout();
        return;
      }
      const statData = await statRes.json();
      if (statRes.ok) setDbStats(statData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showStatusMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleOpenFinalize = (rev) => {
    setSelectedReview(rev);
    setHrRemarks(rev.hrRemarks || '');
    setDiscussionNotes(rev.discussionNotes || '');
    setAppraisalPercentage(rev.appraisalPercentage || 0);
    setPromotionRecommended(rev.promotionRecommended || false);
  };

  const handleCloseFinalize = () => {
    setSelectedReview(null);
    setDiscussionNotes('');
  };

  const handleFinalize = async () => {
    setSubmitLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reviews/hr-finalize/${selectedReview._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          hrRemarks,
          discussionNotes,
          appraisalPercentage: parseFloat(appraisalPercentage),
          promotionRecommended
        })
      });

      if (res.ok) {
        showStatusMsg('Appraisal finalized and overall score calculated successfully!');
        handleCloseFinalize();
        fetchData();
      } else {
        const d = await res.json();
        showStatusMsg(d.message || 'Error finalizing review', 'error');
      }
    } catch (err) {
      showStatusMsg('Server connection failed', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          role: regRole,
          department: regDept,
          managerId: regManagerId || null,
          sickLeaves: parseInt(regSick),
          paidLeaves: parseInt(regPaid),
          hoursWorked: parseInt(regHours),
          projectsContributed: parseInt(regProj),
          attendancePercentage: parseInt(regAttendance)
        })
      });

      if (res.ok) {
        showStatusMsg(`User ${regName} registered successfully!`);
        setShowRegisterForm(false);
        // Clear inputs
        setRegName('');
        setRegEmail('');
        setRegManagerId('');
        fetchData();
      } else {
        const d = await res.json();
        showStatusMsg(d.message || 'Registration failed', 'error');
      }
    } catch (err) {
      showStatusMsg('Server connection failed', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter(rev => {
    const empName = rev.employeeId?.name || '';
    const empEmail = rev.employeeId?.email || '';
    const dept = rev.employeeId?.department || '';
    const matchesSearch = empName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          empEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDepartment === '' || dept.toLowerCase() === filterDepartment.toLowerCase();
    const matchesStatus = filterStatus === '' || rev.status === filterStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Unique departments for filter list
  const departments = [...new Set(reviews.map(r => r.employeeId?.department).filter(Boolean))];

  // System calculations for visual comparison inside finalizer
  const calculateSystemScore = (emp) => {
    if (!emp) return 0;
    const att = (emp.attendancePercentage / 100) * 5;
    const proj = (Math.min(emp.projectsContributed, 5) / 5) * 5;
    const hrs = (Math.min(emp.hoursWorked, 160) / 160) * 5;
    return parseFloat((att * 0.40 + proj * 0.30 + hrs * 0.30).toFixed(2));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Submitted': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Manager Reviewed': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HR Finalized': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Analytics Chart Data
  const chartData = reviews
    .filter(r => r.status === 'HR Finalized')
    .slice(0, 8)
    .map(r => ({
      name: r.employeeId?.name.split(' ')[0] || 'Unknown',
      Self: r.calculatedScores?.employeeAvg || 0,
      Manager: r.calculatedScores?.managerAvg || 0,
      Final: r.calculatedScores?.finalScore || 0
    }));

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-slate-50">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-4 text-slate-600 font-medium">Loading HR Console...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-slate-50 pb-12">
      {/* Navbar */}
      <nav class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <span class="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-900 text-white shadow-md">
                💼
              </span>
              <span class="ml-3 font-bold text-xl text-slate-800 tracking-tight">Performance Pro</span>
              <span class="ml-2 bg-indigo-900/10 text-indigo-950 font-medium text-xs px-2 py-0.5 rounded-full border border-indigo-900/25">
                HR / Admin Portal
              </span>
            </div>

            <div class="flex items-center gap-4">
              <div class="hidden sm:flex flex-col text-right">
                <span class="text-sm font-semibold text-slate-700">{user.name}</span>
                <span class="text-xs text-slate-500">{user.department}</span>
              </div>
              <button 
                onClick={onLogout}
                class="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut class="h-4.5 w-4.5" />
                <span class="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8 animate-fade-in">
        
        {/* Toast Alerts */}
        {message.text && (
          <div class={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            <AlertCircle class="h-5 w-5 flex-shrink-0" />
            <span class="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        {/* Aggregate Stats Cards */}
        <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Users</span>
            <h3 class="text-3xl font-extrabold text-slate-800 mt-2">{dbStats.totalUsers}</h3>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Reviews</span>
            <h3 class="text-3xl font-extrabold text-slate-800 mt-2">{dbStats.totalReviews}</h3>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-emerald-500 border-l-4">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">HR Finalized</span>
            <h3 class="text-3xl font-extrabold text-emerald-700 mt-2">{dbStats.finalizedReviews}</h3>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-amber-500 border-l-4">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending HR</span>
            <h3 class="text-3xl font-extrabold text-amber-700 mt-2">{dbStats.pendingHR}</h3>
          </div>
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-indigo-500 border-l-4 col-span-2 lg:col-span-1">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Manager</span>
            <h3 class="text-3xl font-extrabold text-indigo-700 mt-2">{dbStats.pendingManager}</h3>
          </div>
        </div>

        {/* Quick action tools */}
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div class="flex items-center gap-2">
            <h2 class="font-bold text-slate-800 text-base">HR Management Suite</h2>
            <span class="text-xs text-slate-500">Configure parameters & user cycles</span>
          </div>

          <div class="flex gap-3">
            <button
              onClick={() => setShowRegisterForm(!showRegisterForm)}
              class="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <UserPlus class="h-4.5 w-4.5" /> Register Employee
            </button>
            <button
              onClick={fetchData}
              class="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition"
            >
              <RefreshCw class="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* User Registration Form Collapse */}
        {showRegisterForm && (
          <form onSubmit={handleRegisterUser} class="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-4 animate-fade-in">
            <h3 class="font-bold text-slate-850 text-base border-b pb-2">Register New Corporate User</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                <input type="text" required value={regName} onChange={(e)=>setRegName(e.target.value)} placeholder="E.g. Richard Hendricks" class="w-full border p-2 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Corporate Email</label>
                <input type="email" required value={regEmail} onChange={(e)=>setRegEmail(e.target.value)} placeholder="E.g. richard@company.com" class="w-full border p-2 rounded-lg text-sm bg-slate-50/50 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Temporary Password</label>
                <input type="text" required value={regPassword} onChange={(e)=>setRegPassword(e.target.value)} class="w-full border p-2 rounded-lg text-sm bg-slate-50/50" />
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Role</label>
                <select value={regRole} onChange={(e)=>setRegRole(e.target.value)} class="w-full border p-2 rounded-lg text-sm bg-slate-50/50">
                  <option value="employee">Employee (Self-Assessment)</option>
                  <option value="manager">Manager (Evaluation Overrides)</option>
                  <option value="hr">HR/Admin (Finalizes Appraisal)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Department</label>
                <select value={regDept} onChange={(e)=>setRegDept(e.target.value)} class="w-full border p-2 rounded-lg text-sm bg-slate-50/50">
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1">Reporting Manager ID (Mongoose ObjectId)</label>
                <input type="text" value={regManagerId} onChange={(e)=>setRegManagerId(e.target.value)} placeholder="Paste Manager's ID (Optional)" class="w-full border p-2 rounded-lg text-sm bg-slate-50/50" />
              </div>
            </div>

            <div class="pt-4 border-t">
              <h4 class="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-3">Pre-fill System metrics for Employee (Leave & Hour Parameters)</h4>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Sick Leaves</label>
                  <input type="number" value={regSick} onChange={(e)=>setRegSick(e.target.value)} class="w-full border p-1.5 rounded-lg text-sm text-center" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Paid Leaves</label>
                  <input type="number" value={regPaid} onChange={(e)=>setRegPaid(e.target.value)} class="w-full border p-1.5 rounded-lg text-sm text-center" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Working Hours</label>
                  <input type="number" value={regHours} onChange={(e)=>setRegHours(e.target.value)} class="w-full border p-1.5 rounded-lg text-sm text-center" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Projects Contributed</label>
                  <input type="number" value={regProj} onChange={(e)=>setRegProj(e.target.value)} class="w-full border p-1.5 rounded-lg text-sm text-center" />
                </div>
                <div class="col-span-2 md:col-span-1">
                  <label class="block text-xs font-semibold text-slate-500 mb-1">Attendance %</label>
                  <input type="number" value={regAttendance} onChange={(e)=>setRegAttendance(e.target.value)} class="w-full border p-1.5 rounded-lg text-sm text-center" />
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-3">
              <button type="button" onClick={()=>setShowRegisterForm(false)} class="px-4 py-2 border rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition">Cancel</button>
              <button type="submit" disabled={submitLoading} class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">Create User</button>
            </div>
          </form>
        )}

        {/* Comparison Console Modal / Panel */}
        {selectedReview && (
          <div class="bg-indigo-950 border border-indigo-900 rounded-2xl p-6 text-white shadow-xl space-y-6">
            <h3 class="font-extrabold text-lg flex items-center gap-2 border-b border-indigo-900 pb-3">
              <Award class="text-indigo-400 h-6 w-6" /> Finalizing Appraisal: {selectedReview.employeeId?.name}
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Score comparisons */}
              <div class="bg-slate-900/60 p-4 border border-indigo-900/50 rounded-xl space-y-2">
                <span class="block text-xs text-slate-400 font-bold uppercase tracking-wider">Employee Avg (40%)</span>
                <span class="block text-2xl font-black text-indigo-400">{selectedReview.calculatedScores?.employeeAvg || 0} / 5</span>
              </div>
              <div class="bg-slate-900/60 p-4 border border-indigo-900/50 rounded-xl space-y-2">
                <span class="block text-xs text-slate-400 font-bold uppercase tracking-wider">Manager Avg (40%)</span>
                <span class="block text-2xl font-black text-amber-400">{selectedReview.calculatedScores?.managerAvg || 0} / 5</span>
              </div>
              <div class="bg-slate-900/60 p-4 border border-indigo-900/50 rounded-xl space-y-2">
                <span class="block text-xs text-slate-400 font-bold uppercase tracking-wider">System Score (20%)</span>
                <span class="block text-2xl font-black text-emerald-400">
                  {calculateSystemScore(selectedReview.employeeId)} / 5
                </span>
                <span class="block text-[10px] text-slate-500">Based on Hours, Projects & Leaves</span>
              </div>
              <div class="bg-indigo-900/40 p-4 border border-indigo-500/30 rounded-xl space-y-2">
                <span class="block text-xs text-indigo-300 font-bold uppercase tracking-wider">Estimated Final Rating</span>
                <span class="block text-3xl font-black text-white">
                  {((selectedReview.calculatedScores?.employeeAvg * 0.40) + 
                    (selectedReview.calculatedScores?.managerAvg * 0.40) + 
                    (calculateSystemScore(selectedReview.employeeId) * 0.20)).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Manager Evaluation Feedback block */}
            {selectedReview.managerFeedback && (
              <div class="bg-slate-900/60 p-5 border border-indigo-900/50 rounded-xl space-y-2">
                <span class="block text-xs text-amber-450 font-bold uppercase tracking-wider">Manager Evaluation Summary</span>
                <p class="text-sm text-slate-200 italic leading-relaxed whitespace-pre-line">
                  "{selectedReview.managerFeedback}"
                </p>
              </div>
            )}

            {/* Decision panel inputs */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-indigo-900">
              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-300">Appraisal Increment (%)</label>
                <input 
                  type="number" 
                  value={appraisalPercentage} 
                  onChange={(e) => setAppraisalPercentage(e.target.value)} 
                  class="w-full bg-slate-900 border border-indigo-850 p-2.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-white"
                  placeholder="E.g. 12"
                  disabled={selectedReview.status === 'HR Finalized'}
                />
              </div>

              <div class="space-y-1">
                <label class="block text-xs font-bold text-slate-300">Promotion Eligibility</label>
                <div class="flex items-center h-11">
                  <label class="relative flex items-center gap-2 cursor-pointer text-sm font-semibold">
                    <input 
                      type="checkbox" 
                      checked={promotionRecommended} 
                      onChange={(e) => setPromotionRecommended(e.target.checked)} 
                      class="rounded bg-slate-900 border-indigo-850 h-5 w-5 accent-indigo-500"
                      disabled={selectedReview.status === 'HR Finalized'}
                    />
                    Recommend for Promotion
                  </label>
                </div>
              </div>

              {/* Management Discussion Notes field */}
              <div class="md:col-span-3 space-y-1">
                <label class="block text-xs font-bold text-slate-300">Management Discussion Notes</label>
                <textarea 
                  rows="3" 
                  value={discussionNotes} 
                  onChange={(e) => setDiscussionNotes(e.target.value)} 
                  placeholder="Detail discussion outcomes or notes between manager, employee, and HR..."
                  class="w-full bg-slate-900 border border-indigo-850 p-2.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-white"
                  disabled={selectedReview.status === 'HR Finalized'}
                />
              </div>

              <div class="md:col-span-3 space-y-1">
                <label class="block text-xs font-bold text-slate-300">Final Panel / HR Remarks</label>
                <textarea 
                  rows="2" 
                  value={hrRemarks} 
                  onChange={(e) => setHrRemarks(e.target.value)} 
                  placeholder="Detail the final appraisal decision remarks..."
                  class="w-full bg-slate-900 border border-indigo-850 p-2.5 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-white"
                  disabled={selectedReview.status === 'HR Finalized'}
                />
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-3 border-t border-indigo-900">
              <button 
                type="button" 
                onClick={handleCloseFinalize} 
                class="px-4 py-2 bg-indigo-900/50 border border-indigo-800 rounded-lg text-sm hover:bg-indigo-900 text-indigo-200 transition"
              >
                {selectedReview.status === 'HR Finalized' ? 'Close' : 'Cancel'}
              </button>
              {selectedReview.status !== 'HR Finalized' && (
                <button 
                  type="button"
                  onClick={handleFinalize}
                  disabled={submitLoading}
                  class="px-5 py-2 bg-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-500 text-white transition disabled:opacity-50"
                >
                  Complete Appraisal & Save
                </button>
              )}
            </div>
          </div>
        )}

        {/* Performance graphs side-by-side with employee lists */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Employee Directory table */}
          <div class="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-3">
              <div>
                <h3 class="font-bold text-slate-800 text-base">Active Performance Cycles</h3>
                <p class="text-xs text-slate-500">Full audit directory of company evaluations</p>
              </div>

              {/* Filtering Controls */}
              <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div class="relative flex-1 sm:flex-none">
                  <span class="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                    <Search class="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e)=>setSearchTerm(e.target.value)}
                    placeholder="Search name..."
                    class="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs w-full sm:w-40 focus:outline-none"
                  />
                </div>

                <select 
                  value={filterStatus} 
                  onChange={(e)=>setFilterStatus(e.target.value)}
                  class="border border-slate-250 p-1.5 rounded-lg text-xs bg-white text-slate-600 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="Draft">Draft</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Manager Reviewed">Manager Reviewed</option>
                  <option value="HR Finalized">HR Finalized</option>
                </select>
              </div>
            </div>

            {/* List Table */}
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-slate-100 text-sm text-left">
                <thead>
                  <tr class="text-slate-400 text-xs font-bold uppercase tracking-wider bg-slate-50">
                    <th class="px-4 py-3">Employee Name</th>
                    <th class="px-4 py-3">Department</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Self / Mgr / Sys</th>
                    <th class="px-4 py-3">Final Rating</th>
                    <th class="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan="6" class="text-center py-8 text-xs text-slate-400">No evaluations match search criteria</td>
                    </tr>
                  ) : (
                    filteredReviews.map((rev) => (
                      <tr key={rev._id} class="hover:bg-slate-50/50 transition">
                        <td class="px-4 py-3">
                          <span class="block font-bold text-slate-800">{rev.employeeId?.name}</span>
                          <span class="block text-[10px] text-slate-450 font-normal">{rev.employeeId?.email}</span>
                        </td>
                        <td class="px-4 py-3">{rev.employeeId?.department}</td>
                        <td class="px-4 py-3">
                          <span class={`px-2 py-0.5 border rounded-full text-[10px] font-bold ${getStatusBadge(rev.status)}`}>
                            {rev.status}
                          </span>
                        </td>
                        <td class="px-4 py-3 text-xs text-slate-500">
                          {rev.calculatedScores?.employeeAvg || 0} / {rev.calculatedScores?.managerAvg || 0} / {calculateSystemScore(rev.employeeId)}
                        </td>
                        <td class="px-4 py-3 font-extrabold text-indigo-700">
                          {rev.status === 'HR Finalized' ? rev.calculatedScores?.finalScore : '-'}
                        </td>
                        <td class="px-4 py-3 text-right">
                          {rev.status === 'Manager Reviewed' ? (
                            <button
                              onClick={() => handleOpenFinalize(rev)}
                              class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              Finalize
                            </button>
                          ) : rev.status === 'HR Finalized' ? (
                            <button
                              onClick={() => handleOpenFinalize(rev)}
                              class="border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              View Final
                            </button>
                          ) : (
                            <span class="text-xs font-bold text-slate-400 bg-slate-50 border p-1 px-2.5 rounded-lg">Awaiting</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Analytics visualization panel */}
          <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="font-bold text-slate-800 text-base">Company Performance Trends</h3>
              <p class="text-xs text-slate-500 mt-1">Comparison scores of finalized performance reviews</p>
            </div>

            {chartData.length === 0 ? (
              <div class="py-24 text-center text-xs text-slate-450 border border-dashed rounded-2xl my-6">
                No finalized reviews yet to render graph.
              </div>
            ) : (
              <div class="h-64 w-full my-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="Self" fill="#818cf8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Manager" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Final" fill="#047857" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div class="bg-slate-50 border p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-slate-500 leading-normal">
              <Info class="h-4.5 w-4.5 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>HR dashboard relies on JWT permissions to restrict regular employee route tampering. Finalized parameters will write to the audit trail immediately.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
