import React, { useState, useEffect, useCallback } from 'react';
import { experienceAPI } from '../../api';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  HourglassEmpty as PendingIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const difficultyColor = {
  easy: 'bg-violet-100 text-violet-700 border-violet-200',
  medium: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  hard: 'bg-rose-100 text-rose-700 border-rose-200',
};

const resultColor = {
  pass: { icon: <CheckIcon className="text-[#6d5dfc]" fontSize="small" />, label: 'Selected ✅', cls: 'text-[#5b47d6]' },
  fail: { icon: <CancelIcon className="text-rose-400" fontSize="small" />, label: 'Not Selected', cls: 'text-rose-600' },
  not_sure: { icon: <HourglassIcon />, label: 'Awaiting Result', cls: 'text-amber-600' },
};

function HourglassIcon() {
  return <PendingIcon className="text-[#a89bff]" fontSize="small" />;
}

const statusConfig = {
  pending: { label: 'Under Review', cls: 'bg-[#f3f0ff] text-[#5b47d6] border-[#e3ddff]', icon: '⏳' },
  accepted: { label: 'Approved', cls: 'bg-[#eef2ff] text-[#4338ca] border-[#d7d2ff]', icon: '✅' },
  rejected: { label: 'Rejected', cls: 'bg-red-100 text-red-800 border-red-200', icon: '❌' },
};

const ExperienceDetail = ({ experienceId, onBack, onDeleted }) => {
  const [exp, setExp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRound, setExpandedRound] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!experienceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await experienceAPI.getById(experienceId);
      setExp(res.data.data);
    } catch (err) {
      setError('Failed to load experience details.');
    } finally {
      setLoading(false);
    }
  }, [experienceId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d5dfc]" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p className="text-rose-600 font-medium">{error}</p>
      <button onClick={fetchDetail} className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
        Retry
      </button>
    </div>
  );

  if (!exp) return null;

  const status = statusConfig[exp.approval_status] || statusConfig.pending;
  const res = resultColor[exp.result];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-[#6d5dfc] transition-colors group"
        >
          <ArrowBackIcon fontSize="small" className="group-hover:-translate-x-1 transition-transform" />
          Back to My Experiences
        </button>
        <button
          onClick={async () => {
            const confirmDelete = window.confirm('Delete this experience? This action cannot be undone.');
            if (!confirmDelete) return;
            setDeleting(true);
            try {
              await experienceAPI.delete(experienceId);
              if (onDeleted) onDeleted();
              else onBack();
            } catch (err) {
              alert(err.response?.data?.message || 'Failed to delete experience');
            } finally {
              setDeleting(false);
            }
          }}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-rose-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <DeleteIcon fontSize="small" />
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-xl bg-[#ede9fe] text-[#6d5dfc] flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {(exp.company_name || '?')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-900">{exp.company_name}</h1>
              <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${status.cls}`}>
                {status.icon} {status.label}
              </span>
            </div>
            <p className="text-slate-500 text-sm mb-4">{exp.role_applied} · Submitted {exp.submitted_at ? new Date(exp.submitted_at).toLocaleDateString() : 'N/A'}</p>

            {/* Stats Row */}
            <div className="flex flex-wrap gap-4 text-sm">
              {res && (
                <div className={`flex items-center gap-1.5 font-semibold ${res.cls}`}>
                  {res.icon} {res.label}
                </div>
              )}
              {exp.ctc_offered && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <MoneyIcon fontSize="small" className="text-slate-400" />
                  ₹{exp.ctc_offered} LPA
                </div>
              )}
              {exp.interview_duration && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <TimeIcon fontSize="small" className="text-slate-400" />
                  {exp.interview_duration} min
                </div>
              )}
              {exp.confidence_level && (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <StarIcon fontSize="small" className="text-[#a89bff]" />
                  Confidence: {exp.confidence_level}/10
                </div>
              )}
              {exp.overall_difficulty && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${difficultyColor[exp.overall_difficulty] || 'bg-slate-100 text-slate-600'}`}>
                  {exp.overall_difficulty}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Admin Feedback */}
        {exp.approval_status === 'accepted' && exp.admin_comments && (
          <div className="mt-4 bg-[#f3f0ff] border border-[#e3ddff] rounded-lg p-3 text-sm text-[#5b47d6]">
            <span className="font-semibold">Admin Note: </span>{exp.admin_comments}
          </div>
        )}
        {exp.approval_status === 'rejected' && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
            <span className="font-semibold">Rejection Reason: </span>
            {exp.rejection_reason ? exp.rejection_reason : 'Not provided by admin.'}
          </div>
        )}
      </div>

      {/* Overall Feedback */}
      {exp.overall_feedback && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
          <h3 className="font-semibold text-slate-800 mb-2">Overall Feedback</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{exp.overall_feedback}</p>
        </div>
      )}

      {/* Interview Rounds */}
      {exp.rounds && exp.rounds.length > 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
            <h3 className="font-semibold text-slate-800">Interview Rounds ({exp.rounds.length})</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {exp.rounds.map((round) => {
              const isOpen = expandedRound === round.round_number;
              const tableQs = round.questions || [];
              const jsonbQs = Array.isArray(round.questions_jsonb)
                ? round.questions_jsonb.filter(q => q?.question_text)
                : [];
              const allQs = tableQs.length > 0 ? tableQs : jsonbQs;

              return (
                <div key={round.round_number}>
                  {/* Round Header — click to expand */}
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                    onClick={() => setExpandedRound(isOpen ? null : round.round_number)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#ede9fe] text-[#5b47d6] text-sm font-bold flex items-center justify-center">
                        {round.round_number}
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 text-sm">{round.round_type}</span>
                        {round.duration_minutes && (
                          <span className="ml-2 text-xs text-slate-500">· {round.duration_minutes} min</span>
                        )}
                        {allQs.length > 0 && (
                          <span className="ml-2 text-xs text-[#6d5dfc]">· {allQs.length} question{allQs.length > 1 ? 's' : ''}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {round.difficulty_level && (
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${difficultyColor[round.difficulty_level] || 'bg-slate-100 text-slate-600'}`}>
                          {round.difficulty_level}
                        </span>
                      )}
                      {isOpen ? <CollapseIcon className="text-slate-400" fontSize="small" /> : <ExpandIcon className="text-slate-400" fontSize="small" />}
                    </div>
                  </button>

                  {/* Round Detail */}
                  {isOpen && (
                    <div className="px-5 pb-5 space-y-4 bg-slate-50/30">
                      {/* Topics */}
                      {round.topics && round.topics.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Topics</p>
                          <div className="flex flex-wrap gap-1.5">
                            {round.topics.map((t, i) => (
                              <span key={i} className="bg-[#ede9fe] text-[#5b47d6] text-xs px-2.5 py-1 rounded-full font-medium">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills Tested */}
                      {round.skills_tested && round.skills_tested.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Skills Tested</p>
                          <div className="flex flex-wrap gap-1.5">
                            {round.skills_tested.map((s, i) => (
                              <span key={i} className="bg-[#f3e8ff] text-[#7c3aed] text-xs px-2.5 py-1 rounded-full font-medium">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Questions */}
                      {allQs.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Questions Asked ({allQs.length})</p>
                          <div className="space-y-2">
                            {allQs.map((q, qi) => (
                              <div key={qi} className="bg-white border border-slate-200 rounded-lg p-3">
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-sm text-slate-800 font-medium leading-snug">{q.question_text}</p>
                                  <div className="flex gap-1 flex-shrink-0">
                                    {q.is_common && (
                                      <span className="bg-amber-100 text-amber-700 text-xs px-1.5 py-0.5 rounded font-medium">Common</span>
                                    )}
                                    {q.difficulty && (
                                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium border ${difficultyColor[q.difficulty] || 'bg-slate-100 text-slate-600'}`}>
                                        {q.difficulty}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {q.category && <p className="text-xs text-slate-500 mt-1">Category: {q.category}</p>}
                                {q.answer_provided && (
                                  <details className="mt-2">
                                    <summary className="text-xs text-[#6d5dfc] cursor-pointer hover:text-[#4b3ccf] font-medium">
                                      My Answer ▾
                                    </summary>
                                    <p className="text-xs text-slate-600 mt-1 bg-[#f3f0ff] rounded p-2 leading-relaxed">
                                      {q.answer_provided}
                                    </p>
                                  </details>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Approach Used */}
                      {round.approach_used && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Approach Used</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{round.approach_used}</p>
                        </div>
                      )}

                      {/* Interviewer Feedback */}
                      {round.interviewer_feedback && (
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Interviewer Feedback</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{round.interviewer_feedback}</p>
                        </div>
                      )}

                      {/* Tips */}
                      {round.tips_and_insights && (
                        <div className="border-l-2 border-[#b9afff] pl-3">
                          <p className="text-xs font-semibold text-[#6d5dfc] mb-1">💡 Tips & Insights</p>
                          <p className="text-sm text-slate-600 leading-relaxed">{round.tips_and_insights}</p>
                        </div>
                      )}

                      {allQs.length === 0 && !round.tips_and_insights && !round.approach_used && (
                        <p className="text-xs text-slate-400 italic">No additional details recorded for this round.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-400 mb-5">
          <p className="text-sm">No rounds data recorded for this experience.</p>
        </div>
      )}
    </div>
  );
};

export default ExperienceDetail;


