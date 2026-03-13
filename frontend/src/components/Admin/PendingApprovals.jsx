import React, { useState, useEffect } from 'react';
import {
  Check as CheckIcon, Close as CloseIcon, AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon, Search as SearchIcon, FilterAlt as FilterIcon
} from '@mui/icons-material';
import { approvalAPI } from '../../api';

const PendingApprovals = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState({}); // { [id]: 'comment text' }
  const [actionLoading, setActionLoading] = useState({}); // { [id]: 'approve'|'reject'|null }

  const [showFilters, setShowFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    company_name: '', date_from: '', date_to: '', ctc_min: ''
  });

  useEffect(() => {
    fetchPendingApprovals();
  }, [advFilters]);

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

  const handleApprove = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'approve' }));
    try {
      await approvalAPI.approve(id, { comment: comments[id] || null });
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to approve submission:', err);
      alert('Failed to approve. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleReject = async (id) => {
    setActionLoading(prev => ({ ...prev, [id]: 'reject' }));
    try {
      await approvalAPI.reject(id, { reason: comments[id] || null });
      setApprovals(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Failed to reject submission:', err);
      alert('Failed to reject. Please try again.');
    } finally {
      setActionLoading(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleCommentChange = (id, value) => {
    setComments(prev => ({ ...prev, [id]: value }));
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="text-gray-500 mt-1">{approvals.length} experience(s) awaiting review</p>
        </div>
        <button
          onClick={fetchPendingApprovals}
          className="text-gray-400 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-gray-50"
          title="Refresh"
        >
          <RefreshIcon />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-2">
        <div className="flex-1 flex items-center px-3 gap-2">
          <SearchIcon className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by company name..."
            className="flex-1 py-2 outline-none text-gray-700 placeholder-gray-400"
            value={advFilters.company_name}
            onChange={(e) => setAdvFilters({ ...advFilters, company_name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && fetchPendingApprovals()}
          />
        </div>
        <div className="h-px md:h-auto md:w-px bg-gray-200 mx-2"></div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-4 py-2 font-medium rounded-lg text-sm transition-colors ${showFilters ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <FilterIcon fontSize="small" />
          More Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Submission Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" value={advFilters.date_from} onChange={e => setAdvFilters({ ...advFilters, date_from: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none text-gray-700" title="From" />
              <span className="text-gray-400">-</span>
              <input type="date" value={advFilters.date_to} onChange={e => setAdvFilters({ ...advFilters, date_to: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none text-gray-700" title="To" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Min CTC Offered (LPA)</label>
            <div className="flex gap-2">
              <input type="number" placeholder="Min CTC" value={advFilters.ctc_min} onChange={e => setAdvFilters({ ...advFilters, ctc_min: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none" />
              <button onClick={fetchPendingApprovals} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors font-medium">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval List */}
      <div className="space-y-6">
        {approvals.map((item) => {
          const isActing = actionLoading[item.id];
          return (
            <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {item.company_name}
                    <span className="text-gray-400 font-light">—</span>
                    {item.role_applied}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {item.first_name && item.last_name
                      ? <>by <span className="font-medium text-gray-700">{item.first_name} {item.last_name}</span> • </>
                      : null
                    }
                    Submitted: {item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : 'N/A'}
                    {item.overall_difficulty && <> • Difficulty: {item.overall_difficulty}</>}
                  </p>
                </div>
                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-medium border border-orange-200 flex-shrink-0">
                  Pending
                </span>
              </div>

              {/* Comment + Actions Row */}
              <div className="flex gap-3 items-center mt-6 flex-col sm:flex-row">
                <input
                  type="text"
                  placeholder="Add a comment (optional)..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-400 w-full"
                  value={comments[item.id] || ''}
                  onChange={(e) => handleCommentChange(item.id, e.target.value)}
                  disabled={!!isActing}
                />
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={!!isActing}
                    className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    {isActing === 'approve'
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      : <CheckIcon fontSize="small" />
                    }
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    disabled={!!isActing}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                  >
                    {isActing === 'reject'
                      ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      : <CloseIcon fontSize="small" />
                    }
                    Reject
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {approvals.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <AccessTimeIcon fontSize="large" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No pending approvals</h3>
            <p className="text-gray-500 mt-1">All caught up! New submissions will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingApprovals;
