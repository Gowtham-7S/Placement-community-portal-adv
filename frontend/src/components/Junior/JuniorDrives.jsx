import React, { useCallback, useEffect, useState } from 'react';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  FilterAlt as FilterIcon,
} from '@mui/icons-material';
import { Card, CardContent } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { juniorAPI } from '../../api';

const JuniorDrives = () => {
  const [view, setView] = useState('list');
  const [drives, setDrives] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [showFilters, setShowFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    date_from: '', date_to: '', ctc_min: '', ctc_max: '', batch: ''
  });

  const fetchDrives = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = { limit: 100 };
      if (advFilters.date_from) payload.date_from = advFilters.date_from;
      if (advFilters.date_to) payload.date_to = advFilters.date_to;
      if (advFilters.ctc_min) payload.ctc_min = advFilters.ctc_min;
      if (advFilters.ctc_max) payload.ctc_max = advFilters.ctc_max;
      if (advFilters.batch) payload.batch = advFilters.batch;

      const response = await juniorAPI.getDrives(payload);
      setDrives(response.data.data || []);
    } catch (err) {
      console.error('Failed to load drives:', err);
      setError('Failed to load drives. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [advFilters.batch, advFilters.ctc_max, advFilters.ctc_min, advFilters.date_from, advFilters.date_to]);

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  const handleDriveClick = async (drive) => {
    try {
      const response = await juniorAPI.getDriveById(drive.id);
      setSelectedDrive(response.data.data || drive);
    } catch (err) {
      console.error('Failed to load drive details:', err);
      setSelectedDrive(drive);
    }
    setView('detail');
  };

  const handleBack = () => {
    setSelectedDrive(null);
    setView('list');
  };

  const formatCTC = (drive) => {
    if (drive.ctc) return `Rs. ${drive.ctc} LPA`;
    return 'Not disclosed';
  };

  const getLogoBg = (name = '') => {
    const colors = [
      'bg-emerald-100 text-emerald-700',
      'bg-orange-100 text-orange-600',
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-indigo-100 text-indigo-600',
    ];
    return colors[(name.charCodeAt(0) || 0) % colors.length];
  };

  const getRoundModesLabel = (drive) => {
    const modes = new Set((drive.rounds || []).map((round) => round.mode).filter(Boolean));
    if (modes.size === 1) return Array.from(modes)[0];
    if (modes.size > 1) return 'mixed';
    return drive.mode || '';
  };

  const getActualStatus = (drive) => {
    const status = drive.computed_status || drive.actual_status || drive.drive_status;
    if (status === 'cancelled') return 'cancelled';
    return status || 'upcoming';
  };

  const getStatusLabel = (status) => {
    const map = {
      upcoming: 'Upcoming',
      ongoing: 'Ongoing',
      completed: 'Completed',
      cancelled: 'Cancelled',
    };
    return map[status] || status;
  };

  const filteredDrives = drives.filter(drive => {
    const actualStatus = getActualStatus(drive);
    const statusMatch = filterStatus === 'All Status' || actualStatus === filterStatus.toLowerCase();
    const searchMatch =
      (drive.company_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (drive.role_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });

  const completedDrivesCount = drives.filter((d) => getActualStatus(d) === 'completed').length;
  const ongoingDrivesCount = drives.filter((d) => getActualStatus(d) === 'ongoing').length;
  const upcomingDrivesCount = drives.filter((d) => getActualStatus(d) === 'upcoming').length;

  const StatusBadge = ({ drive }) => {
    const status = getActualStatus(drive);
    const styleMap = {
      upcoming: 'bg-orange-100 text-orange-600 border-orange-200',
      ongoing: 'bg-blue-100 text-blue-700 border-blue-200',
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      cancelled: 'bg-red-100 text-red-600 border-red-200',
    };
    const style = styleMap[status] || 'bg-gray-100 text-gray-600 border-gray-200';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${style} capitalize`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={fetchDrives}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (view === 'detail' && selectedDrive) {
    return (
      <div className="w-full">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 mb-6 transition-colors group"
        >
          Back to Drives
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${getLogoBg(selectedDrive.company_name)}`}>
              {(selectedDrive.company_name || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedDrive.company_name} - <span className="text-gray-600 font-medium">{selectedDrive.role_name}</span>
                </h1>
                <StatusBadge drive={selectedDrive} />
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon fontSize="small" className="text-gray-400" />
                  {selectedDrive.interview_date ? new Date(selectedDrive.interview_date).toLocaleDateString() : 'TBD'}
                </div>
                <div className="flex items-center gap-1.5">
                  <MoneyIcon fontSize="small" className="text-gray-400" />
                  {formatCTC(selectedDrive)}
                </div>
                {selectedDrive.total_positions && (
                  <div className="flex items-center gap-1.5">
                    <PeopleIcon fontSize="small" className="text-gray-400" />
                    {selectedDrive.filled_positions || 0}/{selectedDrive.total_positions} positions filled
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {selectedDrive.drive_details && (
                  <p className="text-gray-600 leading-relaxed">{selectedDrive.drive_details}</p>
                )}
                {selectedDrive.eligible_batches && (
                  <div>
                    <span className="font-semibold text-gray-900">Eligible Batches: </span>
                    <span className="text-gray-600">{selectedDrive.eligible_batches}</span>
                  </div>
                )}
                {selectedDrive.requirements && (
                  <div>
                    <span className="font-semibold text-gray-900">Requirements: </span>
                    <span className="text-gray-600">{selectedDrive.requirements}</span>
                  </div>
                )}
                {getRoundModesLabel(selectedDrive) && (
                  <div>
                    <span className="font-semibold text-gray-900">Mode: </span>
                    <span className="text-gray-600 capitalize">{getRoundModesLabel(selectedDrive)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 bg-gray-50/50">
            <h3 className="text-lg font-bold text-gray-900">Interview Rounds</h3>
          </div>
          <div className="p-6 space-y-4">
            {(selectedDrive.rounds || []).length === 0 && (
              <div className="text-center text-gray-500">No round details available for this drive.</div>
            )}
            {(selectedDrive.rounds || []).map((round, index) => (
              <div key={round.id || index} className="border border-gray-100 rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h4 className="text-base font-semibold text-gray-900">
                    Round {round.round_number || index + 1}: {round.round_name}
                  </h4>
                  <div className="text-xs text-gray-500 capitalize">{round.mode}</div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{round.round_description}</p>
                <div className="text-xs text-gray-500">
                  Expected Date: {round.expected_date ? new Date(round.expected_date).toLocaleDateString() : 'TBD'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Drives</h1>
          <p className="text-gray-500 mt-1">Browse and track placement drives</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card sx={{ borderRadius: 3, border: '1px solid #d1fae5', boxShadow: '0 8px 20px rgba(16,185,129,0.12)' }}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Completed Drives</p>
                <h3 className="text-3xl font-bold text-emerald-700 mt-2">{completedDrivesCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircleOutlineIcon />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #fed7aa', boxShadow: '0 8px 20px rgba(251,146,60,0.12)' }}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-orange-600">Ongoing Drives</p>
                <h3 className="text-3xl font-bold text-orange-700 mt-2">{ongoingDrivesCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
                <EventAvailableIcon />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #bfdbfe', boxShadow: '0 8px 20px rgba(59,130,246,0.12)' }}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Upcoming Drives</p>
                <h3 className="text-3xl font-bold text-blue-700 mt-2">{upcomingDrivesCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <CalendarIcon />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row gap-2">
        <div className="flex-1 flex items-center px-3 gap-2">
          <SearchIcon className="text-gray-400" />
          <input
            type="text"
            placeholder="Search drives by company or role..."
            className="flex-1 py-2 outline-none text-gray-700 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-px md:h-auto md:w-px bg-gray-200 mx-2"></div>
        <select
          className="bg-transparent text-sm font-medium text-gray-600 outline-none px-4 py-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option>All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="h-px md:h-auto md:w-px bg-gray-200 mx-2"></div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-4 py-2 font-medium rounded-lg text-sm transition-colors ${showFilters ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <FilterIcon fontSize="small" />
          More Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" value={advFilters.date_from} onChange={e => setAdvFilters({ ...advFilters, date_from: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700" title="From" />
              <span className="text-gray-400">-</span>
              <input type="date" value={advFilters.date_to} onChange={e => setAdvFilters({ ...advFilters, date_to: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700" title="To" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">CTC Range (LPA)</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" value={advFilters.ctc_min} onChange={e => setAdvFilters({ ...advFilters, ctc_min: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
              <span className="text-gray-400">-</span>
              <input type="number" placeholder="Max" value={advFilters.ctc_max} onChange={e => setAdvFilters({ ...advFilters, ctc_max: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Eligible Batch</label>
            <div className="flex gap-2">
              <input type="text" placeholder="e.g. 2024" value={advFilters.batch} onChange={e => setAdvFilters({ ...advFilters, batch: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
              <button onClick={fetchDrives} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700 transition-colors font-medium">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredDrives.map((drive) => (
          <div
            key={drive.id}
            onClick={() => handleDriveClick(drive)}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-lg font-bold ${getLogoBg(drive.company_name)}`}>
                {(drive.company_name || '?')[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                    {drive.company_name}
                  </h3>
                  <div className="hidden md:block">
                    <StatusBadge drive={drive} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 items-center">
                  <span className="flex items-center gap-1">
                    <BusinessIcon fontSize="inherit" className="text-gray-400" />
                    {drive.role_name}
                  </span>
                  {drive.interview_date && (
                    <>
                      <span className="hidden md:inline text-gray-300">|</span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon fontSize="inherit" className="text-gray-400" />
                        {new Date(drive.interview_date).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-2 md:mt-0 gap-1">
                <div className="md:text-right">
                  <div className="text-lg font-bold text-gray-900">{formatCTC(drive)}</div>
                  {drive.total_positions && (
                    <div className="text-xs text-gray-500">{drive.total_positions} positions</div>
                  )}
                </div>
                <div className="md:hidden">
                  <StatusBadge drive={drive} />
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredDrives.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
            <div className="text-2xl font-semibold text-gray-400 mb-4">Search</div>
            <h3 className="text-lg font-medium text-gray-900">No drives found</h3>
            <p className="text-gray-500">
              {drives.length === 0 ? 'No drives have been created yet.' : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JuniorDrives;
