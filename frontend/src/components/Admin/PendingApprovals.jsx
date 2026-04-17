import React, { useEffect, useState } from 'react';
import {
  Check as CheckIcon, Close as CloseIcon, AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon, Search as SearchIcon, FilterAlt as FilterIcon
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosConfig';
import { approvalAPI, experienceAccessAPI } from '../../api';

const PendingApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({}); // { [id]: 'approve'|'reject'|null }

  const [accessByRoll, setAccessByRoll] = useState({});
  const [accessLoading, setAccessLoading] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    company_name: '', date_from: '', date_to: '', ctc_min: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  useEffect(() => {
    fetchPendingApprovals();
  }, [advFilters]);

  useEffect(() => {
    fetchAccessList();
  }, []);

  const fetchAccessList = async () => {
    try {
      setAccessLoading(true);
      const response = await experienceAccessAPI.getAll();
      const list = response.data.data || [];
      const map = {};
      list.forEach((row) => {
        const key = (row.roll_number || '').trim().toLowerCase();
        if (key) map[key] = row;
      });
      setAccessByRoll(map);
    } catch (err) {
      console.error('Failed to load experience access list:', err);
    } finally {
      setAccessLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);

      const payload = { limit: 50 };
      if (advFilters.company_name) payload.company_name = advFilters.company_name;
      if (advFilters.date_from) payload.date_from = advFilters.date_from;
      if (advFilters.date_to) payload.date_to = advFilters.date_to;
      if (advFilters.ctc_min) payload.ctc_min = advFilters.ctc_min;

      const response = await approvalAPI.getPending(payload);
      setApprovals(response.data.data || []);
    } catch (err) {
      console.error('Failed to load pending approvals:', err);
      setError('Failed to load pending approvals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (item) => {
    if (!item?.id) return;
    setShowModal(true);
    setSelectedId(item.id);
    setSelectedDetails(null);
    setDetailsError(null);
    setRejectError('');
    setRejectionReason('');
    setDetailsLoading(true);
    try {
      const response = await axiosInstance.get(`/admin/experiences/${item.id}/details`);
      setSelectedDetails(response.data.data);
    } catch (err) {
      console.error('Failed to load experience details:', err);
      setDetailsError('Failed to load details. Please try again.');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setShowModal(false);
    setSelectedId(null);
    setSelectedDetails(null);
    setDetailsError(null);
    setRejectError('');
    setRejectionReason('');
  };

  const handleApprove = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
    try {
      await approvalAPI.approve(id, { comment: null });
      setApprovals(prev => prev.filter(a => a.id !== id));
      closeDetails();
    } catch (err) {
      console.error('Failed to approve submission:', err);
      alert('Failed to approve. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      setRejectError('Please provide a rejection reason.');
      return;
    }
    setActionLoading(prev => ({ ...prev, [id]: 'reject' }));
    try {
      await approvalAPI.reject(id, { reason: rejectionReason.trim() });
      setApprovals(prev => prev.filter(a => a.id !== id));
      closeDetails();
    } catch (err) {
      console.error('Failed to reject submission:', err);
      alert('Failed to reject. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const getAccessInfo = (rollNumber) => {
    const key = (rollNumber || '').trim().toLowerCase();
    return key ? accessByRoll[key] : null;
  };

  const selectedItem = approvals.find(a => a.id === selectedId) || null;
  const accessInfo = getAccessInfo(selectedDetails?.register_number || selectedItem?.register_number);
  const studentName = accessInfo?.student_name || [selectedDetails?.first_name, selectedDetails?.last_name].filter(Boolean).join(' ') || 'N/A';
  const rollNumber = accessInfo?.roll_number || selectedDetails?.register_number || 'N/A';
  const studentEmail = accessInfo?.email || 'N/A';
  const accessCompany = accessInfo?.company_name || selectedDetails?.company_name || 'N/A';

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d5dfc]"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchPendingApprovals}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors inline-flex items-center gap-2"
        >
          <RefreshIcon fontSize="small" />
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pending Approvals</h1>
          <p className="text-slate-500 mt-1">{approvals.length} experience(s) awaiting review</p>
        </div>
        <button
          onClick={fetchPendingApprovals}
          className="text-slate-400 hover:text-[#6d5dfc] transition-colors p-2 rounded-lg hover:bg-slate-50"
          title="Refresh"
        >
          <RefreshIcon />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-2">
        <div className="flex-1 flex items-center px-3 gap-2">
          <SearchIcon className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by company name..."
            className="flex-1 py-2 outline-none text-slate-700 placeholder-slate-400"
            value={advFilters.company_name}
            onChange={(e) => setAdvFilters({ ...advFilters, company_name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && fetchPendingApprovals()}
          />
        </div>
        <div className="h-px md:h-auto md:w-px bg-slate-200 mx-2"></div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-4 py-2 font-medium rounded-lg text-sm transition-colors ${showFilters ? 'bg-[#f3f0ff] text-[#5b47d6]' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <FilterIcon fontSize="small" />
          More Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Submission Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" value={advFilters.date_from} onChange={e => setAdvFilters({ ...advFilters, date_from: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none text-slate-700" title="From" />
              <span className="text-slate-400">-</span>
              <input type="date" value={advFilters.date_to} onChange={e => setAdvFilters({ ...advFilters, date_to: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none text-slate-700" title="To" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Min CTC Offered (LPA)</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min CTC" value={advFilters.ctc_min} onChange={e => setAdvFilters({ ...advFilters, ctc_min: e.target.value })} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none" />
              <button onClick={fetchPendingApprovals} className="px-4 py-2 bg-[#6d5dfc] text-white rounded-lg text-sm hover:bg-[#5b47d6] transition-colors font-medium">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval List */}
      <div className="space-y-6">
        {approvals.map((item) => {
          const accessRow = getAccessInfo(item.register_number);
          const summaryName = accessRow?.student_name || [item.first_name, item.last_name].filter(Boolean).join(' ') || 'N/A';
          const summaryRoll = accessRow?.roll_number || item.register_number || 'N/A';
          const summaryEmail = accessRow?.email || 'N/A';
          return (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.company_name} - {item.role_applied}
                  </h3>
                  <p className="text-sm text-slate-600 mt-2">
                    Student: <span className="font-medium text-slate-800">{summaryName}</span>
                  </p>
                  <p className="text-sm text-slate-500">
                    Roll: {summaryRoll} | Email: {summaryEmail}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted: {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'N/A'}
                  </p>
                  {accessLoading && (
                    <p className="text-xs text-slate-400 mt-1">Loading access details...</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openDetails(item)}
                    className="text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:text-[#6d5dfc] hover:border-[#c7bfff] transition-colors"
                  >
                    View Details
                  </button>
                  <span className="bg-[#f3e8ff] text-[#7c3aed] px-3 py-1 rounded-full text-xs font-medium border border-[#e9d5ff] flex-shrink-0">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {approvals.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <AccessTimeIcon fontSize="large" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No pending approvals</h3>
            <p className="text-slate-500 mt-1">All caught up! New submissions will appear here.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {(selectedDetails?.company_name || selectedItem?.company_name || 'Company')} - {(selectedDetails?.role_applied || selectedItem?.role_applied || 'Role')}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Pending Approvals</p>
                </div>
                <button
                  onClick={closeDetails}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  aria-label="Close"
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {detailsLoading && (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6d5dfc]"></div>
                </div>
              )}

              {detailsError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-red-600 text-sm font-medium">{detailsError}</p>
                </div>
              )}

              {!detailsLoading && !detailsError && (
                <>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Student Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-500">Name</label>
                        <p className="text-slate-900">{studentName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">Roll Number</label>
                        <p className="text-slate-900">{rollNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">Email</label>
                        <p className="text-slate-900">{studentEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">Company Name</label>
                        <p className="text-slate-900">{accessCompany}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#eef2ff] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Company & Role</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-500">Company</label>
                        <p className="text-slate-900">{selectedDetails?.company_name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">Role Applied</label>
                        <p className="text-slate-900">{selectedDetails?.role_applied || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">Submitted Date</label>
                        <p className="text-slate-900">
                          {selectedDetails?.submitted_at ? new Date(selectedDetails.submitted_at).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          }) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">Anonymous</label>
                        <p className="text-slate-900">{selectedDetails?.is_anonymous ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Interview Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm font-medium text-slate-500">Overall Difficulty</label>
                        <p className="text-slate-900">{selectedDetails?.overall_difficulty || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">CTC Offered</label>
                        <p className="text-slate-900">{selectedDetails?.ctc_offered || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-500">Offer Received</label>
                        <p className="text-slate-900">{selectedDetails?.offer_received ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#f5f3ff] rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Student Feedback</h3>
                    <p className="text-slate-700 whitespace-pre-wrap">
                      {selectedDetails?.overall_feedback || 'No feedback provided.'}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">
                      Interview Rounds ({selectedDetails?.rounds?.length || 0})
                    </h3>
                    {selectedDetails?.rounds?.length > 0 ? (
                      <div className="space-y-4">
                        {selectedDetails.rounds.map((round, idx) => (
                          <div key={round.id || `${selectedDetails.id}-round-${idx}`} className="bg-white rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-md font-semibold text-slate-900">
                                Round {round.round_number || idx + 1}: {(round.round_type || 'Round').replace(/_/g, ' ')}
                              </h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                round.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                                round.difficulty_level === 'medium' ? 'bg-amber-100 text-amber-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {round.difficulty_level || 'N/A'}
                              </span>
                            </div>

                            {round.detailed_questions && round.detailed_questions.length > 0 ? (
                              <div className="space-y-3">
                                <h5 className="text-sm font-medium text-slate-700">Questions:</h5>
                                {round.detailed_questions.map((question, qIndex) => (
                                  <div key={question.id || qIndex} className="bg-slate-50 rounded p-3">
                                    <div className="flex items-start gap-3">
                                      <span className="flex-shrink-0 w-6 h-6 bg-[#6d5dfc] text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {qIndex + 1}
                                      </span>
                                      <div className="flex-1">
                                        <p className="text-sm text-slate-900 mb-2">{question.question_text}</p>
                                        {question.category && (
                                          <span className="bg-[#e0e7ff] text-[#4338ca] px-2 py-1 rounded text-xs">
                                            {question.category}
                                          </span>
                                        )}
                                        {question.difficulty && (
                                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                            question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                            question.difficulty === 'medium' ? 'bg-amber-100 text-amber-800' :
                                            'bg-red-100 text-red-800'
                                          }`}>
                                            {question.difficulty}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : round.questions && Array.isArray(round.questions) && round.questions.length > 0 ? (
                              <div className="space-y-3">
                                <h5 className="text-sm font-medium text-slate-700">Questions:</h5>
                                {round.questions.map((question, qIndex) => (
                                  <div key={qIndex} className="bg-slate-50 rounded p-3">
                                    <div className="flex items-start gap-3">
                                      <span className="flex-shrink-0 w-6 h-6 bg-[#6d5dfc] text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {qIndex + 1}
                                      </span>
                                      <div className="flex-1">
                                        <p className="text-sm text-slate-900">{question}</p>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : round.questions ? (
                              <div className="mt-2">
                                <h5 className="text-sm font-medium text-slate-700">Questions:</h5>
                                <p className="text-sm text-slate-800 bg-white p-2 rounded border mt-1 whitespace-pre-wrap">
                                  {round.questions}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 italic">No questions recorded for this round</p>
                            )}

                            {round.topics && Array.isArray(round.topics) && round.topics.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-slate-700 mb-2">Topics Covered:</h5>
                                <div className="flex flex-wrap gap-2">
                                  {round.topics.map((topic, tIndex) => (
                                    <span key={tIndex} className="bg-[#ede9fe] text-[#4b3ccf] px-2 py-1 rounded text-xs">
                                      {topic}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {round.problem_statement && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-slate-700 mb-1">Problem Statement:</h5>
                                <p className="text-sm text-slate-800 bg-white p-2 rounded border">{round.problem_statement}</p>
                              </div>
                            )}

                            {round.approach_used && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-slate-700 mb-1">Approach Used:</h5>
                                <p className="text-sm text-slate-800 bg-white p-2 rounded border">{round.approach_used}</p>
                              </div>
                            )}

                            {round.tips_and_insights && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-slate-700 mb-1">Tips and Insights:</h5>
                                <p className="text-sm text-slate-800 bg-white p-2 rounded border">{round.tips_and_insights}</p>
                              </div>
                            )}

                            {round.common_mistakes && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-slate-700 mb-1">Common Mistakes:</h5>
                                <p className="text-sm text-slate-800 bg-white p-2 rounded border">{round.common_mistakes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No round details available</p>
                    )}
                  </div>

                  <div className="bg-red-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Rejection Reason (required if rejecting)</h3>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => {
                        setRejectionReason(e.target.value);
                        if (rejectError) setRejectError('');
                      }}
                      placeholder="Provide feedback for rejection..."
                      className="w-full min-h-[110px] border border-slate-300 rounded-lg p-3 text-sm outline-none focus:border-[#6d5dfc] focus:ring-1 focus:ring-[#6d5dfc] bg-white"
                    />
                    {rejectError && (
                      <p className="text-sm text-red-600 mt-2">{rejectError}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={closeDetails}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedId)}
                disabled={!selectedId || actionLoading[selectedId] === 'reject'}
                className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium flex items-center gap-2"
              >
                {actionLoading[selectedId] === 'reject'
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  : <CloseIcon fontSize="small" />
                }
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedId)}
                disabled={!selectedId || actionLoading[selectedId] === 'approve'}
                className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium flex items-center gap-2"
              >
                {actionLoading[selectedId] === 'approve'
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  : <CheckIcon fontSize="small" />
                }
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;
