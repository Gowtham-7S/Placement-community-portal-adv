import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { driveAPI } from '../../api';
import {
  Business as BusinessIcon,
  Campaign as CampaignIcon,
  Description as DescriptionIcon,
  HourglassEmpty as HourglassIcon,
  TrendingUp as TrendingUpIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';

const AdminAnalytics = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');

      const [analyticsResponse, drivesResponse] = await Promise.all([
        fetch('/api/admin/analytics/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        driveAPI.getAll({ status: 'upcoming', limit: 5 }),
      ]);

      if (!analyticsResponse.ok) throw new Error('Failed to fetch stats');

      const result = await analyticsResponse.json();
      const upcomingDrives = drivesResponse.data.data || [];

      setStats({
        ...result.data,
        upcomingDrives,
      });
    } catch (err) {
      console.error(err);
      setStats({
        overall: {
          total_companies: 0,
          total_drives: 0,
          total_experiences: 0,
          pending_approvals: 0,
        },
        recentActivity: [],
        upcomingDrives: [],
        companyStats: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const getDriveStatus = (drive) =>
    (drive?.computed_status || drive?.actual_status || drive?.drive_status || 'upcoming');

  const statusBadgeStyles = {
    upcoming: 'bg-green-100 text-green-700',
    ongoing: 'bg-[#e0e7ff] text-[#4338ca]',
    completed: 'bg-slate-200 text-slate-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d5dfc]" />
      </div>
    );
  }

  return (
    <div
      className="max-w-7xl mx-auto"
      style={{ fontFamily: '"Manrope", "Inter", "Segoe UI", Roboto, Arial, sans-serif' }}
    >
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
          Welcome back, {user?.name ? user.name.split(' ')[0] : 'Admin'}
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Here is what is happening in placements today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard
          title="Total Companies"
          value={stats?.overall?.total_companies || 0}
          subtitle={stats?.overall?.total_companies > 0 ? `${stats.overall.total_companies} registered` : 'None yet'}
          subtitleColor="text-[#6d5dfc]"
          icon={<BusinessIcon fontSize="small" />}
          bgClass="bg-[#6d5dfc]/10"
          iconClass="text-[#6d5dfc]"
        />
        <DashboardCard
          title="Total Drives"
          value={stats?.overall?.total_drives || 0}
          subtitle={`${stats?.upcomingDrives?.length || 0} upcoming`}
          subtitleColor="text-[#6d5dfc]"
          icon={<CampaignIcon fontSize="small" />}
          bgClass="bg-[#6d5dfc]/10"
          iconClass="text-[#6d5dfc]"
        />
        <DashboardCard
          title="Experiences Shared"
          value={stats?.overall?.total_experiences || 0}
          subtitle={stats?.overall?.total_experiences > 0 ? 'Total submissions' : 'None yet'}
          subtitleColor="text-green-500"
          icon={<DescriptionIcon fontSize="small" />}
          bgClass="bg-green-50"
          iconClass="text-green-600"
        />
        <DashboardCard
          title="Pending Approvals"
          value={stats?.overall?.pending_approvals || 0}
          subtitle={stats?.overall?.pending_approvals > 0 ? 'Needs review' : 'All reviewed'}
          subtitleColor={stats?.overall?.pending_approvals > 0 ? 'text-[#7c3aed]' : 'text-green-500'}
          icon={<HourglassIcon fontSize="small" />}
          bgClass="bg-[#f5f3ff]"
          iconClass="text-[#7c3aed]"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center gap-2">
            <TrendingUpIcon fontSize="small" className="text-[#6d5dfc]" />
            <h3 className="text-lg font-bold text-slate-800">Recent Experiences</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {stats?.recentActivity?.map((act) => (
              <div key={act.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-slate-100 text-slate-600">
                    {act.first_name?.[0]}
                    {act.last_name?.[0]}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900">{act.first_name} {act.last_name}</h4>
                    <p className="text-sm text-slate-500">{act.company_name} - {act.role_applied}</p>
                  </div>
                </div>
                <StatusBadge status={act.approval_status || 'pending'} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center gap-2">
            <CalendarIcon fontSize="small" className="text-[#6d5dfc]" />
            <h3 className="text-lg font-bold text-slate-800">Upcoming Drives</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {stats?.upcomingDrives?.length > 0 ? (
              stats.upcomingDrives.map((drive) => {
                const status = getDriveStatus(drive);
                return (
                  <div key={drive.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{drive.company_name}</h4>
                      <p className="text-sm text-slate-500">{drive.role_name}</p>
                      {drive.eligible_batches && (
                        <p className="text-sm text-slate-400 mt-1">Eligible: {drive.eligible_batches}</p>
                      )}
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-full ${
                          statusBadgeStyles[status] || statusBadgeStyles.upcoming
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                      <span className="text-sm font-medium text-slate-500 block">
                        {drive.interview_date ? new Date(drive.interview_date).toLocaleDateString() : 'TBD'}
                      </span>
                      {drive.location && <span className="text-sm text-slate-400">{drive.location}</span>}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm">No upcoming drives</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, subtitle, subtitleColor, icon, bgClass, iconClass }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all">
    <div className="flex justify-between items-start mb-4">
      <div className="text-slate-500 text-sm font-semibold">{title}</div>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${bgClass} ${iconClass}`}>
        {icon}
      </div>
    </div>
    <div className="text-4xl font-bold text-slate-800 mb-1">{value}</div>
    {subtitle && <div className={`text-sm font-medium ${subtitleColor}`}>{subtitle}</div>}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    approved: 'bg-green-100 text-green-700',
    pending: 'bg-amber-100 text-amber-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
};

export default AdminAnalytics;



