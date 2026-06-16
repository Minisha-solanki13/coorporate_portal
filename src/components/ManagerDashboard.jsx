import React, { useState, useEffect } from 'react';
import { LogOut, Calendar, Clock, Briefcase, UserCheck, CheckCircle2, ChevronRight, AlertCircle, Users, ArrowLeft, Save, Star } from 'lucide-react';

export default function ManagerDashboard({ token, user, onLogout }) {
  const [reports, setReports] = useState([]);
  const [selectedReview, setSelectedReview] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [managerFeedback, setManagerFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchReports = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reviews/pending-manager`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (res.ok) setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleOpenReview = (reviewItem) => {
    setSelectedReview(reviewItem);
    // Pre-populate manager ratings with employee ratings if manager ratings are not yet filled
    const initialRatings = reviewItem.ratings.map(r => ({
      questionId: r.questionId,
      questionText: r.questionText,
      employeeRating: r.employeeRating,
      employeeComment: r.employeeComment,
      managerRating: r.managerRating || r.employeeRating || 1,
      managerComment: r.managerComment || ''
    }));
    setRatings(initialRatings);
    setManagerFeedback(reviewItem.managerFeedback || '');
  };

  const handleCloseReview = () => {
    setSelectedReview(null);
    setRatings([]);
    setManagerFeedback('');
  };

  const handleRatingChange = (qId, val) => {
    setRatings(prev => prev.map(r => r.questionId === qId ? { ...r, managerRating: parseInt(val) } : r));
  };

  const handleCommentChange = (qId, val) => {
    setRatings(prev => prev.map(r => r.questionId === qId ? { ...r, managerComment: val } : r));
  };

  const showStatusMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleSubmitReview = async () => {
    setSubmitLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/reviews/manager-submit/${selectedReview._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ratings, managerFeedback })
      });
      if (res.ok) {
        showStatusMsg('Evaluation submitted successfully!');
        handleCloseReview();
        fetchReports();
      } else {
        const d = await res.json();
        showStatusMsg(d.message || 'Error submitting review', 'error');
      }
    } catch (err) {
      showStatusMsg('Server connection failed', 'error');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Draft':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Submitted':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Manager Reviewed':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'HR Finalized':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-slate-50">
        <div class="text-center">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p class="mt-4 text-slate-600 font-medium">Loading Direct Reports...</p>
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
              <span class="flex items-center justify-center h-10 w-10 rounded-lg bg-amber-500 text-white shadow-md">
                📊
              </span>
              <span class="ml-3 font-bold text-xl text-slate-800 tracking-tight">Performance Pro</span>
              <span class="ml-2 bg-amber-50 text-amber-700 font-medium text-xs px-2 py-0.5 rounded-full border border-amber-150">
                Manager Workspace
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

      {/* Main Content Area */}
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Toast Alerts */}
        {message.text && (
          <div class={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            <AlertCircle class="h-5 w-5 flex-shrink-0" />
            <span class="text-sm font-semibold">{message.text}</span>
          </div>
        )}

        {!selectedReview ? (
          /* List of Direct Reports */
          <div class="space-y-6">
            <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div class="flex items-center gap-3">
                <div class="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                  <Users class="h-6 w-6" />
                </div>
                <div>
                  <h1 class="text-xl font-bold text-slate-800">Your Team Evaluation</h1>
                  <p class="text-slate-500 text-xs mt-0.5">Manage and review self-assessments submitted by your direct reports.</p>
                </div>
              </div>
            </div>

            {reports.length === 0 ? (
              <div class="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                <Users class="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 class="font-bold text-slate-700 text-base">No Direct Reports Found</h3>
                <p class="text-slate-500 text-sm mt-1">Contact HR to assign employee reports to your account.</p>
              </div>
            ) : (
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((item) => {
                  const emp = item.employeeId;
                  return (
                    <div key={item._id} class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                      <div class="space-y-4">
                        <div class="flex justify-between items-start">
                          <div>
                            <h2 class="font-bold text-slate-800 text-base">{emp.name}</h2>
                            <p class="text-xs text-slate-400 mt-0.5">{emp.email}</p>
                          </div>
                          <span class={`px-2.5 py-0.5 border rounded-full text-xs font-semibold ${getStatusBadge(item.status)}`}>
                            {item.status}
                          </span>
                        </div>

                        {/* System metrics breakdown */}
                        <div class="grid grid-cols-2 gap-3 pt-3 border-t text-xs">
                          <div class="flex items-center gap-1.5 text-slate-600">
                            <UserCheck class="h-4 w-4 text-emerald-500 flex-shrink-0" />
                            <span>Attend: <strong>{emp.attendancePercentage}%</strong></span>
                          </div>
                          <div class="flex items-center gap-1.5 text-slate-600">
                            <Clock class="h-4 w-4 text-indigo-500 flex-shrink-0" />
                            <span>Hours: <strong>{emp.hoursWorked} hrs</strong></span>
                          </div>
                          <div class="flex items-center gap-1.5 text-slate-600">
                            <Briefcase class="h-4 w-4 text-amber-500 flex-shrink-0" />
                            <span>Proj: <strong>{emp.projectsContributed}</strong></span>
                          </div>
                          <div class="flex items-center gap-1.5 text-slate-600">
                            <Calendar class="h-4 w-4 text-rose-500 flex-shrink-0" />
                            <span>Leaves: <strong>{emp.sickLeaves + emp.paidLeaves}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Review triggers */}
                      <div class="mt-6 pt-4 border-t">
                        {item.status === 'Submitted' ? (
                          <button
                            onClick={() => handleOpenReview(item)}
                            class="w-full flex items-center justify-center gap-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-4 rounded-xl text-sm font-semibold transition shadow-sm"
                          >
                            Review Assessment <ChevronRight class="h-4 w-4" />
                          </button>
                        ) : item.status === 'Manager Reviewed' || item.status === 'HR Finalized' ? (
                          <button
                            onClick={() => handleOpenReview(item)}
                            class="w-full flex items-center justify-center gap-1 border border-slate-200 hover:bg-slate-50 text-slate-600 py-2 px-4 rounded-xl text-sm font-semibold transition"
                          >
                            View Evaluation <ChevronRight class="h-4 w-4" />
                          </button>
                        ) : (
                          <div class="text-center py-2 text-xs font-semibold text-slate-400 bg-slate-50 border rounded-xl">
                            Self Assessment in Draft (Read-Only)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Assessment Review Console */
          <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
              <div>
                <button 
                  onClick={handleCloseReview}
                  class="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
                >
                  <ArrowLeft class="h-4 w-4" /> Back to Team
                </button>
                <h2 class="text-xl font-bold text-slate-800">Reviewing {selectedReview.employeeId.name}</h2>
                <p class="text-xs text-slate-500 mt-1">Review employee self-rating, adjust to correct manager rating, and provide your feedback.</p>
              </div>

              {selectedReview.status === 'Submitted' && (
                <button
                  onClick={handleSubmitReview}
                  disabled={submitLoading}
                  class="flex items-center gap-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  <CheckCircle2 class="h-4.5 w-4.5" /> Submit Manager Evaluation
                </button>
              )}
            </div>

            {/* Assessment question list editor */}
            <div class="space-y-8 divide-y divide-slate-100">
              {ratings.map((item) => (
                <div key={item.questionId} class="pt-6 first:pt-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Question description */}
                  <div class="lg:col-span-4 space-y-2">
                    <span class="inline-flex items-center justify-center h-6 w-6 rounded bg-slate-100 text-slate-600 text-xs font-extrabold">
                      {item.questionId}
                    </span>
                    <h3 class="text-sm font-semibold text-slate-800 leading-snug">{item.questionText}</h3>
                  </div>

                  {/* Rating comparison and Manager inputs */}
                  <div class="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Employee Rating (read only) */}
                    <div class="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3.5 space-y-2">
                      <span class="block text-xs font-bold text-indigo-700 uppercase tracking-wider">Employee Self-Rating</span>
                      <div class="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <span 
                            key={stars}
                            class={`h-7 w-7 rounded flex items-center justify-center text-xs font-extrabold ${item.employeeRating >= stars ? 'bg-indigo-600 text-white' : 'bg-slate-200/50 text-slate-400'}`}
                          >
                            {stars}
                          </span>
                        ))}
                      </div>
                      <p class="text-xs text-slate-500 leading-normal italic">
                        " {item.employeeComment || "No comments entered."} "
                      </p>
                    </div>

                    {/* Manager rating and comment overrides */}
                    <div class="bg-amber-50/50 border border-amber-100 rounded-xl p-3.5 space-y-2.5">
                      <span class="block text-xs font-bold text-amber-700 uppercase tracking-wider">Manager Adjusted Rating</span>
                      {selectedReview.status === 'Submitted' ? (
                        <>
                          <div class="space-y-1.5">
                            <input
                              type="range"
                              min="1"
                              max="5"
                              step="1"
                              value={item.managerRating || 1}
                              onChange={(e) => handleRatingChange(item.questionId, e.target.value)}
                              class="w-full accent-amber-500 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div class="flex justify-between text-[10px] font-bold text-amber-700">
                              <span>1 (Low)</span>
                              <span class="bg-amber-100 px-1.5 py-0.5 rounded text-amber-800">Value: {item.managerRating}</span>
                              <span>5 (High)</span>
                            </div>
                          </div>
                          <textarea
                            rows="2"
                            value={item.managerComment}
                            onChange={(e) => handleCommentChange(item.questionId, e.target.value)}
                            placeholder="Add manager comments or reasons for score adjustment..."
                            class="w-full border border-slate-250 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 rounded-lg p-2 text-xs bg-white"
                          />
                        </>
                      ) : (
                        <>
                          <div class="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((stars) => (
                              <span 
                                key={stars}
                                class={`h-7 w-7 rounded flex items-center justify-center text-xs font-bold ${item.managerRating >= stars ? 'bg-amber-500 text-white' : 'bg-slate-200/50 text-slate-400'}`}
                              >
                                {stars}
                              </span>
                            ))}
                          </div>
                          <p class="text-xs text-slate-600 leading-normal italic">
                            " {item.managerComment || "No comment."} "
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall Feedback Section */}
            <div class="pt-8 border-t border-slate-200 space-y-4">
              <div class="bg-amber-50/50 border border-amber-100 rounded-2xl p-6">
                <h3 class="text-sm font-bold text-amber-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                  📝 Overall Manager Summary & Evaluation
                </h3>
                <p class="text-slate-500 text-xs mb-4">Provide a high-level summary of the employee's performance, strengths, and development areas for this cycle.</p>
                {selectedReview.status === 'Submitted' ? (
                  <textarea
                    rows="4"
                    value={managerFeedback}
                    onChange={(e) => setManagerFeedback(e.target.value)}
                    placeholder="Enter overall evaluation, key highlights, or discussion points..."
                    class="w-full border border-slate-350 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 rounded-xl p-4 text-sm bg-white"
                  />
                ) : (
                  <div class="bg-white border border-slate-150 rounded-xl p-4 text-sm text-slate-700 italic leading-relaxed whitespace-pre-line">
                    {selectedReview.managerFeedback || "No overall evaluation summary provided."}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
