import React, { useState, useEffect, useCallback } from 'react';
import {
    Article as ArticleIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    Visibility as VisibilityIcon,
    Delete as DeleteIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosConfig';

const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
};

const RESULT_COLORS = {
    pass: 'text-green-600',
    fail: 'text-red-500',
    not_sure: 'text-amber-600',
};

const AdminExperienceManagement = () => {
    const [experiences, setExperiences] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [page, setPage] = useState(1);
    const limit = 20;

    // Modal state
    const [selectedExperience, setSelectedExperience] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const fetchExperiences = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            if (statusFilter) params.status = statusFilter;
            if (debouncedSearch) params.company_name = debouncedSearch;

            const res = await axiosInstance.get('/admin/submissions/all', { params });
            setExperiences(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err) {
            console.error('Failed to load experiences:', err);
        } finally {
            setLoading(false);
        }
    }, [page, limit, statusFilter, debouncedSearch]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 350);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        fetchExperiences();
    }, [fetchExperiences]);

    // Handle search and status filter changes - reset to page 1
    useEffect(() => {
        if (page !== 1) {
            setPage(1);
        }
    }, [debouncedSearch, statusFilter, page]);

    const handleViewDetails = async (experience) => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/admin/experiences/${experience.id}/details`);
            setSelectedExperience(response.data.data);
            setShowModal(true);
        } catch (error) {
            console.error('Failed to load experience details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedExperience(null);
    };

    const handleDeleteExperience = async (experienceId, closeAfter = false) => {
        if (!experienceId) return;
        const confirmDelete = window.confirm('Delete this experience? This action cannot be undone.');
        if (!confirmDelete) return;
        setDeletingId(experienceId);
        try {
            await axiosInstance.delete(`/admin/experiences/${experienceId}`);
            if (closeAfter) {
                handleCloseModal();
            }
            fetchExperiences();
        } catch (err) {
            console.error('Failed to delete experience:', err);
            alert(err.response?.data?.message || 'Failed to delete experience');
        } finally {
            setDeletingId(null);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">All Experiences</h1>
                    <p className="text-gray-500 mt-1 text-base">{total} total submissions across all statuses</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center px-3 gap-2">
                    <SearchIcon className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search experiences by company, student name, or roll number..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="flex-1 py-2 outline-none text-base text-gray-700 placeholder-gray-400"
                    />
                    {searchInput && (
                        <button
                            onClick={() => setSearchInput('')}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                            title="Clear search"
                        >
                            <CloseIcon fontSize="small" />
                        </button>
                    )}
                </div>
                <div className="h-px md:h-auto md:w-px bg-gray-200 mx-2"></div>
                <div className="flex items-center gap-2 px-2">
                    <FilterIcon fontSize="small" className="text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-transparent text-sm font-medium text-gray-600 outline-none px-2 py-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <ArticleIcon fontSize="small" className="text-indigo-500" />
                    <h3 className="text-lg font-bold text-gray-800">Submissions</h3>
                    <span className="ml-auto text-sm text-gray-400">{total} record{total !== 1 ? 's' : ''}</span>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-16">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                    </div>
                ) : experiences.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <ArticleIcon sx={{ fontSize: 40 }} className="mb-2 opacity-30" />
                        <p className="text-sm">No experiences found</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[15px]">
                                <thead>
                                    <tr className="bg-gray-50 text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="text-left px-6 py-3">Student</th>
                                        <th className="text-left px-4 py-3">Company</th>
                                        <th className="text-left px-4 py-3">Role</th>
                                        <th className="text-center px-4 py-3">Result</th>
                                        <th className="text-center px-4 py-3">Status</th>
                                        <th className="text-center px-4 py-3">Submitted</th>
                                        <th className="text-center px-6 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {experiences.map((exp) => (
                                        <tr key={exp.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                        {exp.first_name?.[0]}{exp.last_name?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">
                                                            {exp.first_name} {exp.last_name}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            Roll: {exp.register_number || 'N/A'}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                        {exp.company_name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{exp.company_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">{exp.role_applied}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-semibold capitalize ${RESULT_COLORS[exp.result] || 'text-gray-500'}`}>
                                                    {exp.result === 'pass' ? '✅ Selected' : exp.result === 'fail' ? '❌ Not Selected' : '⏳ Awaiting'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[exp.approval_status] || 'bg-gray-100 text-gray-600'}`}>
                                                    {exp.approval_status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center text-xs text-gray-400">
                                                {exp.submitted_at ? new Date(exp.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <button
                                                    onClick={() => handleViewDetails(exp)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                                                >
                                                    <VisibilityIcon fontSize="small" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteExperience(exp.id)}
                                                    disabled={deletingId === exp.id}
                                                    className="ml-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                    {deletingId === exp.id ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
                                <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        ← Prev
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Experience Details Modal */}
            {showModal && selectedExperience && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900">Experience Details</h2>
                                <button
                                    onClick={handleCloseModal}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Student Information */}
                            <div className="bg-slate-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Student Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Name</label>
                                        <p className="text-gray-900">{selectedExperience.first_name} {selectedExperience.last_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Roll Number</label>
                                        <p className="text-gray-900">{selectedExperience.register_number || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Company & Role Information */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Company & Role</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Company</label>
                                        <p className="text-gray-900">{selectedExperience.company_name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Role Applied</label>
                                        <p className="text-gray-900">{selectedExperience.role_applied}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Result</label>
                                        <p className={`font-semibold capitalize ${RESULT_COLORS[selectedExperience.result] || 'text-gray-500'}`}>
                                            {selectedExperience.result === 'pass' ? '✅ Selected' : selectedExperience.result === 'fail' ? '❌ Not Selected' : '⏳ Awaiting'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Offer Received</label>
                                        <p className="text-gray-900">{selectedExperience.offer_received ? 'Yes' : 'No'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-sm font-medium text-gray-500">Submitted Date</label>
                                        <p className="text-gray-900">
                                            {selectedExperience.submitted_at ? new Date(selectedExperience.submitted_at).toLocaleDateString('en-IN', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            }) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Questions Asked */}
                            <div className="bg-green-50 rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Questions Asked</h3>
                                {selectedExperience.rounds && selectedExperience.rounds.length > 0 ? (
                                    <div className="space-y-4">
                                        {selectedExperience.rounds.map((round, index) => (
                                            <div key={round.id} className="bg-white rounded-lg p-4 border border-green-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-md font-semibold text-gray-900">
                                                        Round {round.round_number}: {round.round_type.replace('_', ' ')}
                                                    </h4>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        round.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                                                        round.difficulty_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                        {round.difficulty_level}
                                                    </span>
                                                </div>

                                                {round.detailed_questions && round.detailed_questions.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <h5 className="text-sm font-medium text-gray-700">Questions:</h5>
                                                        {round.detailed_questions.map((question, qIndex) => (
                                                            <div key={question.id || qIndex} className="bg-gray-50 rounded p-3">
                                                                <div className="flex items-start gap-3">
                                                                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                                        {qIndex + 1}
                                                                    </span>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm text-gray-900 mb-2">{question.question_text}</p>
                                                                        <div className="flex flex-wrap gap-2 text-xs">
                                                                            {question.category && (
                                                                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                                    {question.category}
                                                                                </span>
                                                                            )}
                                                                            {question.difficulty && (
                                                                                <span className={`px-2 py-1 rounded ${
                                                                                    question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                                                                    question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                                                    'bg-red-100 text-red-800'
                                                                                }`}>
                                                                                    {question.difficulty}
                                                                                </span>
                                                                            )}
                                                                            {question.is_common && (
                                                                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                                                                    Common
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {question.answer_provided && (
                                                                            <div className="mt-2">
                                                                                <p className="text-xs font-medium text-gray-600">Answer:</p>
                                                                                <p className="text-sm text-gray-800 bg-white p-2 rounded border mt-1">
                                                                                    {question.answer_provided}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : round.questions && Array.isArray(round.questions) && round.questions.length > 0 ? (
                                                    <div className="space-y-3">
                                                        <h5 className="text-sm font-medium text-gray-700">Questions:</h5>
                                                        {round.questions.map((question, qIndex) => (
                                                            <div key={qIndex} className="bg-gray-50 rounded p-3">
                                                                <div className="flex items-start gap-3">
                                                                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                                        {qIndex + 1}
                                                                    </span>
                                                                    <div className="flex-1">
                                                                        <p className="text-sm text-gray-900">{question}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-500 italic">No questions recorded for this round</p>
                                                )}

                                                {round.topics && Array.isArray(round.topics) && round.topics.length > 0 && (
                                                    <div className="mt-3">
                                                        <h5 className="text-sm font-medium text-gray-700 mb-2">Topics Covered:</h5>
                                                        <div className="flex flex-wrap gap-2">
                                                            {round.topics.map((topic, tIndex) => (
                                                                <span key={tIndex} className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
                                                                    {topic}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {round.problem_statement && (
                                                    <div className="mt-3">
                                                        <h5 className="text-sm font-medium text-gray-700 mb-1">Problem Statement:</h5>
                                                        <p className="text-sm text-gray-800 bg-white p-2 rounded border">{round.problem_statement}</p>
                                                    </div>
                                                )}

                                                {round.approach_used && (
                                                    <div className="mt-3">
                                                        <h5 className="text-sm font-medium text-gray-700 mb-1">Approach Used:</h5>
                                                        <p className="text-sm text-gray-800 bg-white p-2 rounded border">{round.approach_used}</p>
                                                    </div>
                                                )}

                                                {round.tips_and_insights && (
                                                    <div className="mt-3">
                                                        <h5 className="text-sm font-medium text-gray-700 mb-1">Tips & Insights:</h5>
                                                        <p className="text-sm text-gray-800 bg-white p-2 rounded border">{round.tips_and_insights}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic">No round details available</p>
                                )}
                            </div>

                            {/* Feedback */}
                            {selectedExperience.overall_feedback && (
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Overall Feedback</h3>
                                    <p className="text-gray-700 whitespace-pre-wrap">{selectedExperience.overall_feedback}</p>
                                </div>
                            )}

                            {/* Admin Comments */}
                            {selectedExperience.admin_comments && (
                                <div className="bg-orange-50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Admin Comments</h3>
                                    <p className="text-gray-700">{selectedExperience.admin_comments}</p>
                                </div>
                            )}

                            {/* Rejection Reason */}
                            {selectedExperience.rejection_reason && (
                                <div className="bg-red-50 rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Rejection Reason</h3>
                                    <p className="text-gray-700">{selectedExperience.rejection_reason}</p>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
                            <button
                                onClick={() => handleDeleteExperience(selectedExperience.id, true)}
                                disabled={deletingId === selectedExperience.id}
                                className="px-5 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {deletingId === selectedExperience.id ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                onClick={handleCloseModal}
                                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminExperienceManagement;
