import React, { useState, useEffect } from 'react';
import { juniorAPI } from '../../api';
import {
  TrendingUp as TrendingIcon,
  Star as StarIcon,
  ArrowBack as ArrowBackIcon,
  AttachMoney as MoneyIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckCircleIcon,
  Search as SearchIcon,
  Business as BusinessIcon,
  Campaign as CampaignIcon,
  Article as ArticleIcon,
  EmojiEvents as EmojiEventsIcon,
} from '@mui/icons-material';

const difficultyColor = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
};

const resultColor = {
  pass: 'text-green-600',
  fail: 'text-red-500',
  not_sure: 'text-yellow-600',
};

const resultLabel = { pass: 'Selected ✅', fail: 'Not Selected', not_sure: 'Awaiting Result' };

const CompanyBrowser = () => {
  const [view, setView] = useState('list'); // 'list' | 'company'
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [expandedExp, setExpandedExp] = useState(null);
  const [stats, setStats] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expLoading, setExpLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [companiesRes, statsRes, topicsRes] = await Promise.all([
        juniorAPI.getCompanyInsights({ limit: 100 }),
        juniorAPI.getStats(),
        juniorAPI.getTrendingTopics(8),
      ]);
      setCompanies(companiesRes.data.data || []);
      setStats(statsRes.data.data);
      setTopics(topicsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load junior data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openCompany = async (company) => {
    setSelectedCompany(company);
    setView('company');
    setExpLoading(true);
    try {
      const res = await juniorAPI.getCompanyExperiences(company.company_name, { limit: 20 });
      setExperiences(res.data.data || []);
    } catch (err) {
      console.error('Failed to load experiences:', err);
    } finally {
      setExpLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c =>
    c.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );

  // ---- COMPANY DETAIL VIEW ----
  if (view === 'company' && selectedCompany) {
    return (
      <div className="w-full">
        <button
          onClick={() => { setView('list'); setExperiences([]); setExpandedExp(null); }}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowBackIcon fontSize="small" />
          Back to Companies
        </button>

        {/* Company Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-bold">
              {selectedCompany.company_name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedCompany.company_name}</h2>
              <p className="text-gray-500 text-sm">{selectedCompany.total_submissions} interview report(s)</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-indigo-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-indigo-700">{selectedCompany.total_submissions}</div>
              <div className="text-xs text-gray-500 mt-1">Total Reports</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-green-700">{selectedCompany.selection_rate ?? 0}%</div>
              <div className="text-xs text-gray-500 mt-1">Selection Rate</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-yellow-700">{selectedCompany.avg_confidence ? Number(selectedCompany.avg_confidence).toFixed(1) : 'N/A'}</div>
              <div className="text-xs text-gray-500 mt-1">Avg. Confidence</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-purple-700">{selectedCompany.avg_ctc ? `₹${Number(selectedCompany.avg_ctc).toFixed(1)} LPA` : 'N/A'}</div>
              <div className="text-xs text-gray-500 mt-1">CTC</div>
            </div>
          </div>
        </div>

        {/* Experience Cards */}
        {expLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
          </div>
        ) : experiences.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
            No approved experiences found for this company yet.
          </div>
        ) : (
          <div className="space-y-4">
            {experiences.map((exp) => (
              <div key={exp.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedExp(expandedExp === exp.id ? null : exp.id)}
                >
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{exp.role_applied}</h3>
                      <p className="text-sm text-gray-500 mt-1">by {exp.author}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className={`text-sm font-semibold ${resultColor[exp.result] || 'text-gray-600'}`}>
                        {resultLabel[exp.result] || exp.result}
                      </span>
                      {exp.overall_difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[exp.overall_difficulty] || 'bg-gray-100 text-gray-600'}`}>
                          {exp.overall_difficulty}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-3">
                    {exp.confidence_level && (
                      <span className="flex items-center gap-1"><StarIcon fontSize="inherit" /> Confidence: {exp.confidence_level}/10</span>
                    )}
                    {exp.ctc_offered && (
                      <span className="flex items-center gap-1"><MoneyIcon fontSize="inherit" /> ₹{exp.ctc_offered} LPA</span>
                    )}
                    {exp.interview_duration && (
                      <span className="flex items-center gap-1"><TimeIcon fontSize="inherit" /> {exp.interview_duration} min</span>
                    )}
                  </div>
                </div>

                {expandedExp === exp.id && (
                  <div className="border-t border-gray-100 px-5 pb-5 pt-4 space-y-4">
                    {exp.overall_feedback && (
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">Overall Feedback</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{exp.overall_feedback}</p>
                      </div>
                    )}
                    {exp.rounds && exp.rounds.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-2">Interview Rounds</h4>
                        <div className="space-y-3">
                          {exp.rounds.map((round) => {
                            // Merge questions from questions table + inline JSONB
                            const tableQuestions = round.questions || [];
                            const jsonbQuestions = Array.isArray(round.questions_jsonb)
                              ? round.questions_jsonb.filter(q => typeof q === 'object' && q.question_text)
                              : (typeof round.questions_jsonb === 'string'
                                ? [] // raw text fallback
                                : []);
                            // De-duplicate: prefer table questions, fall back to JSONB
                            const allQuestions = tableQuestions.length > 0 ? tableQuestions : jsonbQuestions;

                            return (
                              <div key={round.round_number} className="bg-gray-50 rounded-lg p-4 space-y-3">
                                {/* Round Header */}
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-sm text-gray-800">
                                    Round {round.round_number}: {round.round_type}
                                  </span>
                                  {round.difficulty_level && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColor[round.difficulty_level] || 'bg-gray-100 text-gray-600'}`}>
                                      {round.difficulty_level}
                                    </span>
                                  )}
                                </div>

                                {round.duration_minutes && (
                                  <p className="text-xs text-gray-500">⏱ {round.duration_minutes} minutes</p>
                                )}

                                {/* Topics */}
                                {round.topics && round.topics.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {round.topics.map((t, i) => (
                                      <span key={i} className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">{t}</span>
                                    ))}
                                  </div>
                                )}

                                {/* Questions Asked */}
                                {allQuestions.length > 0 && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-700 mb-2">❓ Questions Asked:</p>
                                    <div className="space-y-2">
                                      {allQuestions.map((q, qi) => (
                                        <div key={qi} className="bg-white border border-gray-200 rounded-lg p-3">
                                          <div className="flex items-start justify-between gap-2">
                                            <p className="text-sm text-gray-800 font-medium leading-snug">{q.question_text}</p>
                                            <div className="flex gap-1 flex-shrink-0">
                                              {q.is_common && (
                                                <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded font-medium">Common</span>
                                              )}
                                              {q.difficulty && (
                                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${difficultyColor[q.difficulty] || 'bg-gray-100 text-gray-600'}`}>
                                                  {q.difficulty}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                          {q.category && (
                                            <p className="text-xs text-gray-500 mt-1">Category: {q.category}</p>
                                          )}
                                          {q.answer_provided && (
                                            <details className="mt-2">
                                              <summary className="text-xs text-indigo-600 cursor-pointer hover:text-indigo-800 font-medium">
                                                View sample answer ▾
                                              </summary>
                                              <p className="text-xs text-gray-600 mt-1 leading-relaxed bg-indigo-50 rounded p-2">
                                                {q.answer_provided}
                                              </p>
                                            </details>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Tips */}
                                {round.tips_and_insights && (
                                  <p className="text-xs text-gray-600 italic border-l-2 border-indigo-300 pl-2">💡 {round.tips_and_insights}</p>
                                )}
                              </div>
                            );
                          })}

                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- LIST VIEW ----
  return (
      <div className="w-full">
      {/* Stats Banner */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Companies', value: stats.total_companies, color: 'indigo', icon: <BusinessIcon fontSize="small" />, sub: 'registered' },
            { label: 'Active Drives', value: stats.active_drives, color: 'blue', icon: <CampaignIcon fontSize="small" />, sub: 'currently open' },
            { label: 'Experiences', value: stats.total_experiences, color: 'purple', icon: <ArticleIcon fontSize="small" />, sub: 'shared by seniors' },
            { label: 'Selections', value: stats.total_selections, color: 'green', icon: <EmojiEventsIcon fontSize="small" />, sub: 'placements secured' },
          ].map(({ label, value, color, icon, sub }) => (
            <div key={label} className={`bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                <div className={`w-8 h-8 rounded-lg bg-${color}-50 text-${color}-600 flex items-center justify-center`}>
                  {icon}
                </div>
              </div>
              <div className={`text-3xl font-bold text-${color}-700 mb-1`}>{value ?? '—'}</div>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-6">
        {/* Company Grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Companies</h2>
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
              {filteredCompanies.length} result{filteredCompanies.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Enhanced Search Bar */}
          <div className="flex items-center gap-2 mb-5 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
            <SearchIcon className="text-gray-400" fontSize="small" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 py-1 outline-none text-sm text-gray-700 placeholder-gray-400"
            />
          </div>

          {filteredCompanies.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
              {companies.length === 0
                ? 'No approved experiences yet. Check back after seniors submit their reports.'
                : 'No companies match your search.'}
            </div>
          ) : (
            <div className={`grid gap-4 ${filteredCompanies.length === 1 ? 'grid-cols-1 max-w-md' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
              {filteredCompanies.map((c) => {
                const selRate = c.selection_rate ?? 0;
                const colorClass = selRate >= 50 ? 'text-emerald-600' : selRate >= 25 ? 'text-amber-500' : 'text-red-500';
                const barClass = selRate >= 50 ? 'bg-emerald-500' : selRate >= 25 ? 'bg-amber-400' : 'bg-red-400';
                return (
                  <div
                    key={c.company_name}
                    onClick={() => openCompany(c)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group relative overflow-hidden"
                  >
                    {/* Hover top accent strip */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Card Header */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors flex-shrink-0">
                        {c.company_name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h3 className="font-bold text-gray-900 group-hover:text-emerald-700 transition-colors truncate text-sm">
                          {c.company_name}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">{c.total_submissions} interview report(s)</p>
                      </div>
                      {c.avg_ctc ? (
                        <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-lg flex-shrink-0">
                          ₹{Number(c.avg_ctc).toFixed(1)} LPA
                        </span>
                      ) : null}
                    </div>

                    {/* Selection Rate Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-gray-400 flex items-center gap-1">
                          <CheckCircleIcon fontSize="inherit" /> Selection Rate
                        </span>
                        <span className={`font-bold ${colorClass}`}>{selRate}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barClass}`}
                          style={{ width: `${Math.min(selRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trending Topics Sidebar */}
        {topics.length > 0 && (
          <div className="w-full xl:w-72 flex-shrink-0">
            <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingIcon className="text-indigo-500" fontSize="small" />
              Trending Topics
            </h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex flex-wrap gap-2">
                {topics.map((t, i) => (
                  <span
                    key={i}
                    className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-medium border border-indigo-100"
                  >
                    {t.topic}
                    <span className="ml-1 text-indigo-400">×{t.frequency}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyBrowser;
