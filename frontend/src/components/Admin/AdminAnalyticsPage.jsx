import React, { useEffect, useState } from 'react';
import {
    TrendingUp as TrendingUpIcon,
    Business as BusinessIcon,
    EmojiEvents as TrophyIcon,
    Psychology as ConfidenceIcon,
    AttachMoney as MoneyIcon,
    People as PeopleIcon,
    BarChart as BarChartIcon,
} from '@mui/icons-material';

const token = () => localStorage.getItem('token');

const AdminAnalyticsPage = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/admin/analytics/dashboard', {
                headers: { Authorization: `Bearer ${token()}` },
            });
            const json = await res.json();
            setData(json.data);
        } catch (e) {
            console.error('Analytics fetch error:', e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
        </div>
    );

    const overall = data?.overall || {};
    const companies = data?.companyStats || [];
    const recent = data?.recentActivity || [];

    const totalSelections = companies.reduce((sum, c) => sum + parseInt(c.selections || 0), 0);
    const totalSubmissions = companies.reduce((sum, c) => sum + parseInt(c.total_submissions || 0), 0);
    const overallSelectionRate = totalSubmissions > 0 ? ((totalSelections / totalSubmissions) * 100).toFixed(1) : 0;

    return (
        <div
            className="max-w-7xl mx-auto space-y-8"
            style={{ fontFamily: '"Manrope", "Inter", "Segoe UI", Roboto, Arial, sans-serif' }}
        >

            {/* Summary KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                    {
                        label: 'Avg. CTC Offered',
                        value: overall.avg_ctc ? `₹${Number(overall.avg_ctc).toFixed(1)} LPA` : 'N/A',
                        icon: <MoneyIcon fontSize="small" />,
                        color: 'emerald',
                        sub: 'across all experiences',
                    },
                    {
                        label: 'Total Submissions',
                        value: overall.total_experiences ?? '—',
                        icon: <PeopleIcon fontSize="small" />,
                        color: 'blue',
                        sub: 'student reports',
                    },
                    {
                        label: 'Overall Selection Rate',
                        value: `${overallSelectionRate}%`,
                        icon: <TrophyIcon fontSize="small" />,
                        color: 'amber',
                        sub: 'pass across all drives',
                    },
                    {
                        label: 'Companies Tracked',
                        value: companies.length,
                        icon: <BusinessIcon fontSize="small" />,
                        color: 'indigo',
                        sub: 'with experience reports',
                    },
                ].map(({ label, value, icon, color, sub }) => (
                    <div key={label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                            <div className={`w-8 h-8 rounded-lg bg-${color}-50 text-${color}-600 flex items-center justify-center`}>
                                {icon}
                            </div>
                        </div>
                        <div className={`text-2xl font-bold text-${color}-700 mb-1`}>{value}</div>
                        <p className="text-xs text-gray-400">{sub}</p>
                    </div>
                ))}
            </div>

            {/* Company-wise Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <BarChartIcon fontSize="small" className="text-indigo-500" />
                    <h3 className="text-lg font-bold text-gray-800">Company-wise Breakdown</h3>
                    <span className="ml-auto text-xs text-gray-400">{companies.length} companies</span>
                </div>

                {companies.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">No company data available yet.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="text-left px-6 py-3">Company</th>
                                    <th className="text-center px-4 py-3">Reports</th>
                                    <th className="text-center px-4 py-3">Selected</th>
                                    <th className="text-center px-4 py-3">Selection Rate</th>
                                    <th className="text-center px-4 py-3">Avg Confidence</th>
                                    <th className="px-6 py-3">Selection Rate Bar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {companies.map((c, i) => {
                                    const rate = c.total_submissions > 0
                                        ? ((c.selections / c.total_submissions) * 100).toFixed(1)
                                        : 0;
                                    const barColor = rate >= 50 ? 'bg-emerald-500' : rate >= 25 ? 'bg-amber-400' : 'bg-red-400';
                                    const rateColor = rate >= 50 ? 'text-emerald-600' : rate >= 25 ? 'text-amber-600' : 'text-red-500';

                                    return (
                                        <tr key={c.company_name} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                                        {c.company_name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{c.company_name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center font-medium text-gray-700">{c.total_submissions}</td>
                                            <td className="px-4 py-3 text-center font-medium text-emerald-600">{c.selections}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`font-bold ${rateColor}`}>{rate}%</span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {c.avg_confidence ? (
                                                    <span className="flex items-center justify-center gap-1 text-gray-600">
                                                        <ConfidenceIcon fontSize="inherit" className="text-purple-400" />
                                                        {Number(c.avg_confidence).toFixed(1)}/10
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(rate, 100)}%` }} />
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center gap-2">
                    <TrendingUpIcon fontSize="small" className="text-indigo-500" />
                    <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                    <span className="ml-auto text-xs text-gray-400">Latest 5 submissions</span>
                </div>
                {recent.length === 0 ? (
                    <div className="p-10 text-center text-gray-400 text-sm">No recent activity yet.</div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recent.map((act) => (
                            <div key={act.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                    {act.first_name?.[0]}{act.last_name?.[0]}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-gray-900">{act.first_name} {act.last_name}</p>
                                    <p className="text-xs text-gray-500">{act.company_name} · {act.role_applied}</p>
                                </div>
                                <p className="text-xs text-gray-400 flex-shrink-0">
                                    {act.submitted_at ? new Date(act.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default AdminAnalyticsPage;
