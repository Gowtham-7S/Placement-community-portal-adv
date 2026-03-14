import React, { useState, useEffect } from 'react';
import { experienceAPI } from '../../api';
import ExperienceDetail from './ExperienceDetail';
import {
  WorkOutline as WorkIcon, CalendarToday as CalendarIcon,
  Add as AddIcon, ChevronRight as ChevronIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const StatusBadge = ({ status }) => {
  const map = {
    pending: { label: 'Under Review', cls: 'bg-[#f3f0ff] text-[#5b47d6] border-[#e3ddff]' },
    accepted: { label: 'Approved', cls: 'bg-[#eef2ff] text-[#4338ca] border-[#d7d2ff]' },
    rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-700 border-red-200' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${cls} capitalize`}>
      {label}
    </span>
  );
};

const ResultBadge = ({ result }) => {
  const map = {
    pass: 'bg-[#eef2ff] text-[#4338ca]',
    fail: 'bg-red-50 text-red-700',
    not_sure: 'bg-[#f3f0ff] text-[#5b47d6]',
    waitlisted: 'bg-[#f3f0ff] text-[#5b47d6]',
    withdrew: 'bg-slate-50 text-slate-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${map[result] || 'bg-slate-50 text-slate-600'}`}>
      {result?.replace('_', ' ')}
    </span>
  );
};

const MyExperiences = ({ onSubmitClick }) => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await experienceAPI.getMyExperiences({ limit: 50 });
      setExperiences(response.data.data || []);
    } catch (err) {
      console.error('Failed to load experiences:', err);
      setError('Failed to load your experiences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (experienceId) => {
    const confirmDelete = window.confirm('Delete this experience? This action cannot be undone.');
    if (!confirmDelete) return;
    setDeletingId(experienceId);
    try {
      await experienceAPI.delete(experienceId);
      setExperiences((prev) => prev.filter((exp) => exp.id !== experienceId));
    } catch (err) {
      console.error('Failed to delete experience:', err);
      alert(err.response?.data?.message || 'Failed to delete experience');
    } finally {
      setDeletingId(null);
    }
  };

  // Show detail view when a card is clicked
  if (selectedId) {
    return (
      <ExperienceDetail
        experienceId={selectedId}
        onBack={() => setSelectedId(null)}
        onDeleted={() => {
          setSelectedId(null);
          fetchExperiences();
        }}
      />
    );
  }

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d5dfc]"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p className="text-red-600 font-medium">{error}</p>
      <button
        onClick={fetchExperiences}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
      >
        Retry
      </button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Experiences</h2>
          <p className="text-sm text-slate-500 mt-0.5">{experiences.length} submission(s)</p>
        </div>
        {onSubmitClick && (
          <button
            onClick={onSubmitClick}
            className="bg-[#6d5dfc] hover:bg-[#5b47d6] text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <AddIcon fontSize="small" />
            Submit New
          </button>
        )}
      </div>

      {/* Experience Cards */}
      {experiences.length > 0 ? (
        <div className="space-y-3">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              onClick={() => setSelectedId(exp.id)}
              className="w-full text-left bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-[#d7d2ff] transition-all group cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') setSelectedId(exp.id); }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-lg bg-[#f3f0ff] text-[#6d5dfc] flex items-center justify-center text-lg font-bold flex-shrink-0 group-hover:bg-[#ede9fe] transition-colors">
                    {(exp.company_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#5b47d6] transition-colors">
                      {exp.company_name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-0.5 flex-wrap">
                      <span className="flex items-center gap-1">
                        <WorkIcon fontSize="inherit" className="text-slate-400" />
                        {exp.role_applied}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon fontSize="inherit" className="text-slate-400" />
                        {exp.submitted_at ? new Date(exp.submitted_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  {exp.result && <ResultBadge result={exp.result} />}
                  <StatusBadge status={exp.approval_status} />
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(exp.id); }}
                    disabled={deletingId === exp.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <DeleteIcon fontSize="small" />
                    {deletingId === exp.id ? 'Deleting...' : 'Delete'}
                  </button>
                  <ChevronIcon fontSize="small" className="text-slate-300 group-hover:text-[#6d5dfc] transition-colors ml-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-slate-900">No experiences yet</h3>
          <p className="text-slate-500 mt-1 text-sm">Share your interview experience to help juniors prepare.</p>
          {onSubmitClick && (
            <button
              onClick={onSubmitClick}
              className="mt-4 px-4 py-2 bg-[#6d5dfc] text-white rounded-lg text-sm hover:bg-[#5b47d6] transition-colors inline-flex items-center gap-2"
            >
              <AddIcon fontSize="small" />
              Submit Your First Experience
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MyExperiences;

