import React, { useState, useEffect } from 'react';
import { LogOut, Calendar, Clock, Briefcase, UserCheck, Save, Send, ShieldCheck, CheckCircle2, ChevronRight, Bell, Info } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from 'recharts';

export default function EmployeeDashboard({ token, user, onLogout }) {
  const [review, setReview] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchReview = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reviews/my-review`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) setReview(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/users/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReview();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRatingChange = (qId, val) => {
    setReview(prev => ({
      ...prev,
      ratings: prev.ratings.map(r => r.questionId === qId ? { ...r, employeeRating: parseInt(val) } : r)
    }));
  };

  const handleCommentChange = (qId, val) => {
    setReview(prev => ({
      ...prev,
      ratings: prev.ratings.map(r => r.questionId === qId ? { ...r, employeeComment: val } : r)
    }));
  };

  const showStatusMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleSaveDraft = async () => {
    setSaveLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reviews/save-draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ratings: review.ratings })
      });
      if (res.ok) {
        showStatusMsg('Draft saved successfully!');
        fetchReview();
      } else {
        const d = await res.json();
        showStatusMsg(d.message || 'Error saving draft', 'error');
      }
    } catch (err) {
      showStatusMsg('Server connection failed', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Basic verification: check if all ratings are entered (greater than 0)
    const incomplete = review.ratings.some(r => r.employeeRating === 0);
    if (incomplete) {
      showStatusMsg('Please select a rating for all 20 questions before submitting.', 'error');
      return;
    }

    setSaveLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reviews/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ratings: review.ratings })
      });
      if (res.ok) {
        showStatusMsg('Performance assessment submitted to manager successfully!');
        fetchReview();
      } else {
        const d = await res.json();
        showStatusMsg(d.message || 'Error submitting review', 'error');
      }
    } catch (err) {
      showStatusMsg('Server connection failed', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleMarkAsRead = async (notifyId) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || ''}/api/users/notifications/read/${notifyId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusStepClass = (stepStatus) => {
    const statusOrder = ['Draft', 'Submitted', 'Manager Reviewed', 'HR Finalized'];
    const currentIdx = statusOrder.indexOf(review?.status || 'Draft');
    const stepIdx = statusOrder.indexOf(stepStatus);

    if (currentIdx >= stepIdx) {
      return 'bg-indigo-600 text-white ring-4 ring-indigo-100';
    }
    return 'bg-slate-200 text-slate-500';
  };

  // Format chart data for RadarChart (comparison of ratings)
  const chartData = review?.ratings?.slice(0, 7).map(r => ({
    subject: `Q${r.questionId}`,
    Employee: r.employeeRating,
    Manager: r.managerRating || 0,
    fullMark: 5,
  })) || [];

  const unreadNotifications = notifications.filter(n => !n.read);

  if (loading || !review) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-slate-50">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-4 text-slate-600 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div class="min-h-screen bg-slate-50 pb-12">
      {/* Top Navigation */}
      <nav class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <span class="flex items-center justify-center h-10 w-10 rounded-lg bg-indigo-600 text-white shadow-md">
                📈
              </span>
              <span class="ml-3 font-bold text-xl text-slate-800 tracking-tight">Performance Pro</span>
              <span class="ml-2 bg-indigo-50 text-indigo-700 font-medium text-xs px-2 py-0.5 rounded-full border border-indigo-150">
                Employee Dashboard
              </span>
            </div>

            <div class="flex items-center gap-4">
              {/* Notification Center */}
              <div class="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  class="relative p-2 text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <Bell class="h-5 w-5" />
                  {unreadNotifications.length > 0 && (
                    <span class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div class="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 animate-fade-in">
                    <h3 class="px-4 py-2 text-sm font-bold text-slate-800 border-b border-slate-100 flex justify-between items-center">
                      <span>Notifications</span>
                      {unreadNotifications.length > 0 && <span class="bg-indigo-50 text-indigo-600 text-[11px] px-2 py-0.5 rounded-full">{unreadNotifications.length} unread</span>}
                    </h3>
                    <div class="max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p class="text-xs text-slate-400 text-center py-6">No new notifications</p>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n._id} 
                            onClick={() => handleMarkAsRead(n._id)}
                            class={`px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-xs border-b border-slate-50 flex items-start justify-between ${!n.read ? 'bg-indigo-50/40 font-medium' : ''}`}
                          >
                            <div class="pr-2 text-slate-600">{n.message}</div>
                            {!n.read && <span class="h-2 w-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1"></span>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile and Logout */}
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
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 gap-8">
        
        {/* Toast Alerts */}
        {message.text && (
          <div class={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            <Info class="h-5 w-5 flex-shrink-0" />
            <span class="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        {/* Top Section: Dashboard Header & Profile Metrics */}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Welcome User Profile */}
          <div class="bg-gradient-to-br from-indigo-700 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-3">
                <div class="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h1 class="text-xl font-bold">{user.name}</h1>
                  <p class="text-indigo-200 text-sm">{user.department}</p>
                </div>
              </div>
              <div class="mt-6 space-y-2 text-sm text-indigo-100">
                <p><span class="font-medium text-indigo-300">Email:</span> {user.email}</p>
                <p><span class="font-medium text-indigo-300">Reporting Manager:</span> {review?.managerId?.name || 'Unassigned'}</p>
              </div>
            </div>
            
            <div class="mt-8 pt-4 border-t border-indigo-600/40 flex justify-between items-center text-xs text-indigo-200">
              <span>Performance Cycle: 2026</span>
              <span class="px-2 py-0.5 rounded-full bg-white/10">{review?.status || 'Draft'}</span>
            </div>
          </div>

          {/* Employee System Metrics Grid */}
          <div class="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attendance</span>
                <UserCheck class="h-5 w-5 text-emerald-500" />
              </div>
              <div class="mt-4">
                <h3 class="text-2xl font-bold text-slate-800">{user.attendancePercentage}%</h3>
                <p class="text-slate-500 text-xs mt-1">Excellent record</p>
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hours worked</span>
                <Clock class="h-5 w-5 text-indigo-500" />
              </div>
              <div class="mt-4">
                <h3 class="text-2xl font-bold text-slate-800">{user.hoursWorked} hrs</h3>
                <p class="text-slate-500 text-xs mt-1">Target: 160 hrs</p>
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Projects</span>
                <Briefcase class="h-5 w-5 text-amber-500" />
              </div>
              <div class="mt-4">
                <h3 class="text-2xl font-bold text-slate-800">{user.projectsContributed}</h3>
                <p class="text-slate-500 text-xs mt-1">Active contributions</p>
              </div>
            </div>

            <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leaves Taken</span>
                <Calendar class="h-5 w-5 text-rose-500" />
              </div>
              <div class="mt-4">
                <h3 class="text-2xl font-bold text-slate-800">{user.sickLeaves + user.paidLeaves}</h3>
                <p class="text-slate-500 text-xs mt-1">Sick: {user.sickLeaves} | Paid: {user.paidLeaves}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Status Stepper */}
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 class="text-sm font-bold text-slate-700 mb-6 uppercase tracking-wider">Evaluation Process Tracker</h2>
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <span class={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${getStatusStepClass('Draft')}`}>1</span>
              <div>
                <h3 class="text-sm font-semibold text-slate-800">Self Assessment</h3>
                <p class="text-slate-500 text-xs">Fill out & submit form</p>
              </div>
            </div>
            <ChevronRight class="hidden sm:block text-slate-300" />
            
            <div class="flex items-center gap-3 w-full sm:w-auto">
              <span class={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${getStatusStepClass('Submitted')}`}>2</span>
              <div>
                <h3 class="text-sm font-semibold text-slate-800">Manager Evaluation</h3>
                <p class="text-slate-500 text-xs">Awaiting manager response</p>
              </div>
            </div>
            <ChevronRight class="hidden sm:block text-slate-300" />

            <div class="flex items-center gap-3 w-full sm:w-auto">
              <span class={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${getStatusStepClass('Manager Reviewed')}`}>3</span>
              <div>
                <h3 class="text-sm font-semibold text-slate-800">HR Discussion</h3>
                <p class="text-slate-500 text-xs">HR finalizing grading</p>
              </div>
            </div>
            <ChevronRight class="hidden sm:block text-slate-300" />

            <div class="flex items-center gap-3 w-full sm:w-auto">
              <span class={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${getStatusStepClass('HR Finalized')}`}>4</span>
              <div>
                <h3 class="text-sm font-semibold text-slate-800">Final Decision</h3>
                <p class="text-slate-500 text-xs">Appraisal & updates live</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section: Main Review Block */}
        {review?.status === 'HR Finalized' ? (
          /* HR Finalized View: Render Appraisal results */
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              <h2 class="text-xl font-bold text-slate-800 border-b pb-4">Appraisal & Final Review Details</h2>
              
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-indigo-50 border border-indigo-150 p-4 rounded-xl">
                  <span class="text-xs text-indigo-500 font-semibold uppercase tracking-wider block">Final Grade Score</span>
                  <span class="text-3xl font-extrabold text-indigo-900 block mt-2">{review.calculatedScores?.finalScore} / 5</span>
                </div>
                <div class="bg-emerald-50 border border-emerald-150 p-4 rounded-xl">
                  <span class="text-xs text-emerald-500 font-semibold uppercase tracking-wider block">Salary Appraisal</span>
                  <span class="text-3xl font-extrabold text-emerald-950 block mt-2">+{review.appraisalPercentage}%</span>
                </div>
                <div class="bg-amber-50 border border-amber-150 p-4 rounded-xl">
                  <span class="text-xs text-amber-500 font-semibold uppercase tracking-wider block">Promotion Recommendation</span>
                  <span class="text-xl font-bold text-amber-950 block mt-2.5">
                    {review.promotionRecommended ? '🎉 Recommended!' : 'Not Eligible'}
                  </span>
                </div>
              </div>

              <div class="space-y-2 mt-6">
                <h3 class="font-bold text-sm text-slate-700 uppercase tracking-wider">HR Final Remarks</h3>
                <p class="p-4 bg-slate-50 border rounded-xl text-slate-600 text-sm leading-relaxed">
                  {review.hrRemarks || "No final remarks submitted by HR."}
                </p>
              </div>

              {/* overall manager feedback & discussion notes */}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-slate-100">
                <div class="space-y-2">
                  <h3 class="font-bold text-xs text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                    📝 Manager Evaluation Summary
                  </h3>
                  <p class="p-4 bg-amber-50/30 border border-amber-100/70 rounded-xl text-slate-600 text-sm leading-relaxed italic whitespace-pre-line">
                    {review.managerFeedback ? `"${review.managerFeedback}"` : "No overall manager feedback submitted."}
                  </p>
                </div>
                <div class="space-y-2">
                  <h3 class="font-bold text-xs text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    🤝 Management Discussion Notes
                  </h3>
                  <p class="p-4 bg-emerald-50/30 border border-emerald-100/70 rounded-xl text-slate-600 text-sm leading-relaxed italic whitespace-pre-line">
                    {review.discussionNotes ? `"${review.discussionNotes}"` : "No discussion notes recorded."}
                  </p>
                </div>
              </div>

              {/* Show Audit Logs Summary */}
              <div class="space-y-4 pt-4 border-t">
                <h3 class="font-bold text-sm text-slate-700 uppercase tracking-wider">Performance Audit Log</h3>
                <div class="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {review.auditTrail?.map((log, idx) => (
                    <div key={idx} class="text-xs bg-slate-50 border p-2.5 rounded-lg flex justify-between text-slate-500">
                      <span><strong>{log.action}</strong> - {log.details}</span>
                      <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Radar rating comparisons */}
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center">
              <h3 class="font-bold text-slate-700 text-sm uppercase tracking-wider mb-6 text-center">Self vs Manager Rating (Preview)</h3>
              <div class="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" radius="80%" data={chartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} />
                    <Radar name="Employee" dataKey="Employee" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                    <Radar name="Manager" dataKey="Manager" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div class="mt-4 flex gap-4 text-xs font-semibold">
                <span class="flex items-center gap-1"><span class="h-3.5 w-3.5 bg-indigo-600 rounded"></span> Employee (Self)</span>
                <span class="flex items-center gap-1"><span class="h-3.5 w-3.5 bg-amber-500 rounded"></span> Manager</span>
              </div>
            </div>
          </div>
        ) : (
          /* Active Review Form */
          <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
              <div>
                <h2 class="text-xl font-bold text-slate-800">Employee Self-Assessment Form</h2>
                <p class="text-xs text-slate-500 mt-1">Please rate your performance on a scale of 1 to 5 for each parameter and include comments.</p>
              </div>

              {review?.status === 'Draft' && (
                <div class="flex items-center gap-3">
                  <button
                    onClick={handleSaveDraft}
                    disabled={saveLoading}
                    class="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                  >
                    <Save class="h-4 w-4" /> Save Draft
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={saveLoading}
                    class="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-md shadow-indigo-500/20 disabled:opacity-50"
                  >
                    <Send class="h-4 w-4" /> Submit Review
                  </button>
                </div>
              )}
            </div>

            {/* Questions list */}
            <div class="space-y-8 divide-y divide-slate-100">
              {review?.ratings?.map((item) => (
                <div key={item.questionId} class={`pt-6 first:pt-0 grid grid-cols-1 lg:grid-cols-12 gap-6 ${review.status !== 'Draft' ? 'opacity-85' : ''}`}>
                  <div class="lg:col-span-4 space-y-2">
                    <span class="inline-flex items-center justify-center h-6 w-6 rounded bg-slate-100 text-slate-600 text-xs font-extrabold">
                      {item.questionId}
                    </span>
                    <h3 class="text-sm font-semibold text-slate-800 leading-snug">{item.questionText}</h3>
                  </div>

                  <div class="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Rate input */}
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Self Rating (1-5)</label>
                      {review.status === 'Draft' ? (
                        <div class="space-y-2">
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={item.employeeRating || 1}
                            onChange={(e) => handleRatingChange(item.questionId, e.target.value)}
                            class="w-full accent-indigo-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                          />
                          <div class="flex justify-between text-xs font-bold text-indigo-600 px-1">
                            <span>1 (Needs Work)</span>
                            <span class="bg-indigo-100 px-2 py-0.5 rounded text-indigo-700">Value: {item.employeeRating || 'Not Selected'}</span>
                            <span>5 (Exceptional)</span>
                          </div>
                        </div>
                      ) : (
                        <div class="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((stars) => (
                            <span 
                              key={stars}
                              class={`h-8 w-8 rounded flex items-center justify-center text-sm font-extrabold ${item.employeeRating >= stars ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                            >
                              {stars}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Comment input */}
                    <div>
                      <label class="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Self Comments</label>
                      {review.status === 'Draft' ? (
                        <textarea
                          rows="2"
                          value={item.employeeComment}
                          onChange={(e) => handleCommentChange(item.questionId, e.target.value)}
                          placeholder="Provide details about your contribution or self-rating..."
                          class="w-full border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg p-2 text-sm bg-slate-50/50"
                        />
                      ) : (
                        <p class="text-sm p-3 bg-slate-50 border rounded-lg text-slate-600 italic leading-normal">
                          {item.employeeComment || "No comments entered."}
                        </p>
                      )}
                    </div>

                    {/* Manager Override (Read-Only) */}
                    {review.status !== 'Draft' && review.status !== 'Submitted' && (
                      <div class="sm:col-span-2 pt-3 mt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label class="block text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1.5">Manager Adjusted Rating</label>
                          <div class="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((stars) => (
                              <span 
                                key={stars}
                                class={`h-7 w-7 rounded flex items-center justify-center text-xs font-bold ${item.managerRating >= stars ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400'}`}
                              >
                                {stars}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label class="block text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">Manager Feedback</label>
                          <p class="text-xs p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg text-slate-600 italic">
                            {item.managerComment || "No manager comment."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Manager Feedback (visible once manager reviews, but before HR finalization) */}
            {review?.status === 'Manager Reviewed' && review?.managerFeedback && (
              <div class="pt-8 border-t border-slate-200 space-y-4">
                <div class="bg-amber-50/50 border border-amber-100 rounded-2xl p-6">
                  <h3 class="text-sm font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                    📝 Overall Manager Summary & Evaluation
                  </h3>
                  <p class="text-xs text-slate-500 mb-4">Your manager has completed their evaluation and provided the following high-level feedback summary:</p>
                  <div class="bg-white border border-slate-150 rounded-xl p-4 text-sm text-slate-700 italic leading-relaxed whitespace-pre-line">
                    "{review?.managerFeedback}"
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
