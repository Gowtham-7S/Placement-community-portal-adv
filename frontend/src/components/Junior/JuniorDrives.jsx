import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  AttachMoney as MoneyIcon,
  FilterAlt as FilterIcon,
  ArrowBack as ArrowBackIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import { Card, CardContent } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { juniorAPI } from '../../api';

const formatBatchLabel = (batch = '') => String(batch);
const normalizeRangeFilters = (filters) => {
  const normalized = { ...filters };

  if (normalized.date_from && normalized.date_to && normalized.date_from > normalized.date_to) {
    [normalized.date_from, normalized.date_to] = [normalized.date_to, normalized.date_from];
  }

  const minCtc = normalized.ctc_min === '' ? null : Number(normalized.ctc_min);
  const maxCtc = normalized.ctc_max === '' ? null : Number(normalized.ctc_max);

  if (minCtc !== null && maxCtc !== null && !Number.isNaN(minCtc) && !Number.isNaN(maxCtc) && minCtc > maxCtc) {
    normalized.ctc_min = String(maxCtc);
    normalized.ctc_max = String(minCtc);
  }

  return normalized;
};

const JuniorDrives = () => {
  const [view, setView] = useState('batches');
  const [drives, setDrives] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [showFilters, setShowFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    date_from: '', date_to: '', ctc_min: '', ctc_max: '',
  });

  const fetchDriveBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await juniorAPI.getDriveBatches();
      setBatches(response?.data?.data || []);
    } catch (err) {
      console.error('Failed to load drive batches:', err);
      setError('Failed to load drive batches. Please try again.');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDrives = useCallback(async () => {
    if (!selectedBatch) {
      setDrives([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const filters = normalizeRangeFilters(advFilters);
      const payload = { limit: 100, batch: selectedBatch };
      if (filters.date_from) payload.date_from = filters.date_from;
      if (filters.date_to) payload.date_to = filters.date_to;
      if (filters.ctc_min) payload.ctc_min = filters.ctc_min;
      if (filters.ctc_max) payload.ctc_max = filters.ctc_max;

      const response = await juniorAPI.getDrives(payload);
      setDrives(response?.data?.data || []);
    } catch (err) {
      console.error('Failed to load drives:', err);
      setError('Failed to load drives. Please try again.');
      setDrives([]);
    } finally {
      setLoading(false);
    }
  }, [advFilters.ctc_max, advFilters.ctc_min, advFilters.date_from, advFilters.date_to, selectedBatch]);

  useEffect(() => {
    if (view === 'batches') {
      fetchDriveBatches();
      return;
    }

    fetchDrives();
  }, [fetchDriveBatches, fetchDrives, view]);

  const openBatch = (batch) => {
    setSelectedBatch(batch);
    setSelectedDrive(null);
    setSearchTerm('');
    setFilterStatus('All Status');
    setShowFilters(false);
    setAdvFilters({ date_from: '', date_to: '', ctc_min: '', ctc_max: '' });
    setView('list');
  };

  const handleDriveClick = async (drive) => {
    try {
      const response = await juniorAPI.getDriveById(drive.id);
      setSelectedDrive(response?.data?.data || drive);
    } catch (err) {
      console.error('Failed to load drive details:', err);
      setSelectedDrive(drive);
    }
    setView('detail');
  };

  const handleBackToBatches = () => {
    setSelectedDrive(null);
    setSelectedBatch('');
    setDrives([]);
    setSearchTerm('');
    setView('batches');
  };

  const handleBackToDrives = () => {
    setSelectedDrive(null);
    setView('list');
  };

  const formatCTC = (drive) => {
    if (drive.ctc) return `Rs. ${drive.ctc} LPA`;
    return 'Not disclosed';
  };

  const getLogoBg = (name = '') => {
    const colors = [
      'bg-[#ede9fe] text-[#5b47d6]',
      'bg-[#f3e8ff] text-[#7c3aed]',
      'bg-[#e0e7ff] text-[#4338ca]',
      'bg-[#f5f3ff] text-[#6d5dfc]',
      'bg-[#e9d5ff] text-[#7e22ce]',
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

  const filteredBatches = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return batches.filter((entry) => String(entry.batch || '').toLowerCase().includes(term));
  }, [batches, searchTerm]);

  const filteredDrives = useMemo(() => drives.filter((drive) => {
    const actualStatus = getActualStatus(drive);
    const statusMatch = filterStatus === 'All Status' || actualStatus === filterStatus.toLowerCase();
    const searchMatch =
      (drive.company_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      || (drive.role_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  }), [drives, filterStatus, searchTerm]);

  const completedDrivesCount = drives.filter((drive) => getActualStatus(drive) === 'completed').length;
  const ongoingDrivesCount = drives.filter((drive) => getActualStatus(drive) === 'ongoing').length;
  const upcomingDrivesCount = drives.filter((drive) => getActualStatus(drive) === 'upcoming').length;

  const StatusBadge = ({ drive }) => {
    const status = getActualStatus(drive);
    const styleMap = {
      upcoming: 'bg-violet-100 text-violet-700 border-violet-200',
      ongoing: 'bg-[#eef2ff] text-[#5b47d6] border-[#d7d2ff]',
      completed: 'bg-[#f3e8ff] text-[#7c3aed] border-[#e9d5ff]',
      cancelled: 'bg-red-100 text-red-600 border-red-200',
    };
    const style = styleMap[status] || 'bg-slate-100 text-slate-600 border-slate-200';
    return (
      <span className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border ${style} capitalize`}>
        {getStatusLabel(status)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d5dfc]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={view === 'batches' ? fetchDriveBatches : fetchDrives}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (view === 'batches') {
    return (
      <div className="w-full min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Drive Batches</h1>
            <p className="text-sm text-slate-600 leading-relaxed mt-1">Choose your academic batch to browse relevant placement drives.</p>
          </div>
        </div>

        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-8 flex items-center gap-2">
          <SearchIcon className="text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Search by batch..."
            className="flex-1 py-2 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBatches.map((entry) => (
            <button
              key={entry.batch}
              type="button"
              onClick={() => openBatch(entry.batch)}
              className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-6 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] text-[#5b47d6] flex items-center justify-center">
                  <LayersIcon />
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  {entry.drive_count} drives
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mt-6 group-hover:text-[#6d5dfc] transition-colors">
                {formatBatchLabel(entry.batch)}
              </h3>
              <p className="text-slate-500 mt-2">
                Open drive listings curated for this batch.
              </p>
            </button>
          ))}
        </div>

        {filteredBatches.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-slate-900">No batches found</h3>
            <p className="text-slate-500">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    );
  }

  if (view === 'detail' && selectedDrive) {
    return (
      <div className="w-full">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <button
            onClick={handleBackToBatches}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#6d5dfc] transition-colors"
          >
            <ArrowBackIcon fontSize="small" />
            Back to batches
          </button>
          <button
            onClick={handleBackToDrives}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#6d5dfc] transition-colors"
          >
            <ArrowBackIcon fontSize="small" />
            Back to drives
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex gap-5">
                    <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${getLogoBg(selectedDrive.company_name)}`}>
                      {(selectedDrive.company_name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge drive={selectedDrive} />
                        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{selectedBatch}</span>
                      </div>
                      <h2 className="text-3xl font-semibold tracking-tight text-slate-900 leading-tight">
                        {selectedDrive.company_name} - <span className="text-slate-600 font-medium">{selectedDrive.role_name}</span>
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#6d5dfc]/10 text-[#6d5dfc]">
                      <CalendarIcon fontSize="small" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Date</p>
                      <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                        {selectedDrive.interview_date ? new Date(selectedDrive.interview_date).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#f3e8ff] text-[#7c3aed]">
                      <MoneyIcon fontSize="small" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">CTC</p>
                      <p className="text-sm text-slate-600 leading-relaxed font-semibold">{formatCTC(selectedDrive)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-[#ede9fe] text-[#5b47d6]">
                      <PeopleIcon fontSize="small" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Positions</p>
                      <p className="text-sm text-slate-600 leading-relaxed font-semibold">
                        {selectedDrive.filled_positions || 0} / {selectedDrive.total_positions || 0} Filled
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-900">Interview Rounds</h3>
                <span className="text-[11px] font-semibold tracking-wide text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  {(selectedDrive.rounds || []).length} Total Rounds
                </span>
              </div>
              <div className="space-y-4">
                {(selectedDrive.rounds || []).length === 0 && (
                  <div className="text-center text-sm text-slate-600 leading-relaxed">No round details available for this drive.</div>
                )}
                {(selectedDrive.rounds || []).map((round, index) => (
                  <div key={round.id || index} className="group bg-white p-5 rounded-xl border border-slate-200 hover:border-[#6d5dfc]/40 transition-colors shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <div className="size-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 font-bold">
                          {round.round_number || index + 1}
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold tracking-tight text-slate-900">{round.round_name}</h4>
                          <div className="flex items-center gap-2 mt-1 text-[11px] font-medium uppercase tracking-wider text-slate-500">
                            <span>{round.mode || 'TBD'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{round.expected_date ? new Date(round.expected_date).toLocaleDateString() : 'TBD'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed ml-14">
                      {round.round_description || 'No description provided for this round.'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h4 className="text-lg font-semibold tracking-tight text-slate-900 mb-6">Drive Details</h4>
              <div className="space-y-6">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">Batch</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedDrive.eligible_batches || selectedBatch || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">Primary Requirements</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {selectedDrive.requirements || 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">Drive Mode</p>
                  <p className="text-sm text-slate-600 leading-relaxed capitalize">
                    {getRoundModesLabel(selectedDrive) || 'Not specified'}
                  </p>
                </div>
              </div>
              <div className="mt-8 p-4 bg-[#f5f3ff] rounded-lg border border-[#ede9fe]">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">Company Location</p>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {selectedDrive.location || 'Location not specified'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen">
      <button
        type="button"
        onClick={handleBackToBatches}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#6d5dfc] mb-6 transition-colors"
      >
        <ArrowBackIcon fontSize="small" />
        Back to batches
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Placement Drives - {formatBatchLabel(selectedBatch)}</h1>
          <p className="text-sm text-slate-600 leading-relaxed mt-1">Browse and track placement drives for your batch.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card sx={{ borderRadius: 3, border: '1px solid #d1fae5', boxShadow: '0 8px 20px rgba(16,185,129,0.12)' }}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Completed Drives</p>
                <h3 className="text-3xl font-semibold tracking-tight text-[#5b47d6] mt-2">{completedDrivesCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#ede9fe] text-[#5b47d6] flex items-center justify-center">
                <CheckCircleOutlineIcon />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #fed7aa', boxShadow: '0 8px 20px rgba(251,146,60,0.12)' }}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Ongoing Drives</p>
                <h3 className="text-3xl font-semibold tracking-tight text-[#7c3aed] mt-2">{ongoingDrivesCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center">
                <EventAvailableIcon />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #e0e7ff', boxShadow: '0 8px 20px rgba(109,93,252,0.12)' }}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">Upcoming Drives</p>
                <h3 className="text-3xl font-semibold tracking-tight text-[#4338ca] mt-2">{upcomingDrivesCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#e0e7ff] text-[#4338ca] flex items-center justify-center">
                <CalendarIcon />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-2">
        <div className="flex-1 flex items-center px-3 gap-2">
          <SearchIcon className="text-slate-400" />
          <input
            type="text"
            placeholder="Search drives by company or role..."
            className="flex-1 py-2 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-px md:h-auto md:w-px bg-slate-200 mx-2" />
        <select
          className="bg-transparent text-sm font-medium text-slate-600 outline-none px-4 py-2 cursor-pointer hover:bg-slate-50 rounded-lg transition-colors"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option>All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <div className="h-px md:h-auto md:w-px bg-slate-200 mx-2" />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1 px-4 py-2 font-medium rounded-lg text-sm transition-colors ${showFilters ? 'bg-[#f3f0ff] text-[#5b47d6]' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          <FilterIcon fontSize="small" />
          More Filters
        </button>
      </div>

      {showFilters && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in-up">
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">Date Range</label>
            <div className="flex items-center gap-2">
              <input type="date" value={advFilters.date_from} onChange={(e) => setAdvFilters({ ...advFilters, date_from: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none" title="From" />
              <span className="text-slate-400">-</span>
              <input type="date" value={advFilters.date_to} onChange={(e) => setAdvFilters({ ...advFilters, date_to: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none" title="To" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">CTC Range (LPA)</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" value={advFilters.ctc_min} onChange={(e) => setAdvFilters({ ...advFilters, ctc_min: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none" />
              <span className="text-slate-400">-</span>
              <input type="number" placeholder="Max" value={advFilters.ctc_max} onChange={(e) => setAdvFilters({ ...advFilters, ctc_max: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-2">Selected Batch</label>
            <div className="flex gap-2">
              <input type="text" readOnly value={selectedBatch} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium bg-slate-50 text-slate-500 outline-none" />
              <button onClick={fetchDrives} className="px-4 py-2 bg-[#6d5dfc] text-white rounded-lg text-sm font-medium hover:bg-[#5b47d6] transition-colors">
                Refresh
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
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-lg font-bold ${getLogoBg(drive.company_name)}`}>
                {(drive.company_name || '?')[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-[#6d5dfc] transition-colors truncate">
                    {drive.company_name}
                  </h3>
                  <div className="hidden md:block">
                    <StatusBadge drive={drive} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 leading-relaxed items-center">
                  <span className="flex items-center gap-1">
                    <BusinessIcon fontSize="inherit" className="text-slate-400" />
                    {drive.role_name}
                  </span>
                  <span className="hidden md:inline text-slate-300">|</span>
                  <span className="text-xs font-semibold bg-[#eef2ff] text-[#4338ca] px-2.5 py-1 rounded-full">
                    {selectedBatch}
                  </span>
                  {drive.interview_date && (
                    <>
                      <span className="hidden md:inline text-slate-300">|</span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon fontSize="inherit" className="text-slate-400" />
                        {new Date(drive.interview_date).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto mt-2 md:mt-0 gap-1">
                <div className="md:text-right">
                  <div className="text-lg font-semibold tracking-tight text-slate-900">{formatCTC(drive)}</div>
                  {drive.total_positions && (
                    <div className="text-[11px] font-medium uppercase tracking-wider text-slate-500">{drive.total_positions} positions</div>
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
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900">No drives found</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {drives.length === 0
                ? `No drives have been created yet for ${formatBatchLabel(selectedBatch)}.`
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JuniorDrives;
