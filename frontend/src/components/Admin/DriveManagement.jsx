import React, { useState, useEffect } from 'react';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon, ArrowBack as ArrowBackIcon,
  People as PeopleIcon, Business as BusinessIcon, Add as AddIcon,
  AttachMoney as MoneyIcon, Close as CloseIcon,
  Edit as EditIcon, Delete as DeleteIcon, FilterAlt as FilterIcon,
} from '@mui/icons-material';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Select, InputLabel, FormControl, FormHelperText,
  Typography, Card, CardContent,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { driveAPI, companyAPI } from '../../api';

const DriveManagement = () => {
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

  // Add Drive modal state
  const [addOpen, setAddOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const emptyRound = {
    round_name: '',
    round_description: '',
    mode: 'online',
    expected_date: '',
  };

  const emptyForm = {
    company_id: '',
    role_name: '',
    eligible_batches: '',
    requirements: '',
    ctc: '',
    total_positions: '',
    rounds: [{ ...emptyRound }],
  };
  const [driveForm, setDriveForm] = useState(emptyForm);

  // Edit Drive modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editDrive, setEditDrive] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDrive, setDeleteDrive] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDrives();
    fetchCompanies();
  }, []);

  const fetchDrives = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = { limit: 100 };
      if (advFilters.date_from) payload.date_from = advFilters.date_from;
      if (advFilters.date_to) payload.date_to = advFilters.date_to;
      if (advFilters.ctc_min) payload.ctc_min = advFilters.ctc_min;
      if (advFilters.ctc_max) payload.ctc_max = advFilters.ctc_max;
      if (advFilters.batch) payload.batch = advFilters.batch;

      const response = await driveAPI.getAll(payload);
      setDrives(response.data.data || []);
    } catch (err) {
      console.error('Failed to load drives:', err);
      setError('Failed to load drives. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const res = await companyAPI.getAll({ limit: 200 });
      setCompanies(res.data.data || []);
    } catch (err) {
      console.error('Failed to load companies:', err);
    }
  };

  const handleDriveFormChange = (e) => {
    const { name, value } = e.target;
    setDriveForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoundChange = (index, field, value, formSetter) => {
    formSetter((prev) => {
      const rounds = [...(prev.rounds || [])];
      rounds[index] = { ...rounds[index], [field]: value };
      return { ...prev, rounds };
    });
  };

  const handleAddRound = (formSetter) => {
    formSetter((prev) => ({
      ...prev,
      rounds: [...(prev.rounds || []), { ...emptyRound }],
    }));
  };

  const handleRemoveRound = (index, formSetter) => {
    formSetter((prev) => {
      const rounds = [...(prev.rounds || [])];
      rounds.splice(index, 1);
      return { ...prev, rounds: rounds.length ? rounds : [{ ...emptyRound }] };
    });
  };

  const handleAddDrive = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (!driveForm.company_id || !driveForm.role_name || !driveForm.eligible_batches || !driveForm.requirements
        || driveForm.ctc === '' || driveForm.total_positions === '') {
        setFormError('Please fill all required fields.');
        return;
      }
      if (!Array.isArray(driveForm.rounds) || driveForm.rounds.length === 0) {
        setFormError('Please add at least one round.');
        return;
      }
      const hasInvalidRound = driveForm.rounds.some((round) =>
        !round.round_name || !round.round_description || !round.mode || !round.expected_date
      );
      if (hasInvalidRound) {
        setFormError('Please complete all round details.');
        return;
      }
      // Strip empty strings and convert numeric fields
      const payload = Object.fromEntries(
        Object.entries(driveForm).filter(([_, v]) => v !== '' && v !== null)
      );
      if (payload.ctc) payload.ctc = parseFloat(payload.ctc);
      if (payload.total_positions) payload.total_positions = parseInt(payload.total_positions);
      if (payload.company_id) payload.company_id = parseInt(payload.company_id);
      if (Array.isArray(payload.rounds)) {
        payload.rounds = payload.rounds.map((round, index) => ({
          ...round,
          round_number: index + 1,
        }));
      }
      await driveAPI.create(payload);
      setAddOpen(false);
      setDriveForm(emptyForm);
      fetchDrives();
    } catch (err) {
      const msg = err.response?.data?.errors?.map(e => e.message).join(', ')
        || err.response?.data?.message
        || 'Failed to create drive';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDriveClick = async (drive) => {
    try {
      const response = await driveAPI.getById(drive.id);
      setSelectedDrive(response.data.data || drive);
    } catch (err) {
      console.error('Failed to load drive details:', err);
      setSelectedDrive(drive);
    }
    setView('detail');
  };

  const handleEditOpen = async (e, drive) => {
    e.stopPropagation();
    setEditError('');
    let driveData = drive;
    try {
      const response = await driveAPI.getById(drive.id);
      driveData = response.data.data || drive;
    } catch (err) {
      console.error('Failed to load drive details:', err);
    }

    setEditDrive(driveData);
    setEditForm({
      company_id: driveData.company_id || '',
      role_name: driveData.role_name || '',
      eligible_batches: driveData.eligible_batches || '',
      requirements: driveData.requirements || '',
      ctc: driveData.ctc || '',
      total_positions: driveData.total_positions || '',
      rounds: Array.isArray(driveData.rounds) && driveData.rounds.length
        ? driveData.rounds.map((round) => ({
          round_name: round.round_name || '',
          round_description: round.round_description || '',
          mode: round.mode || 'online',
          expected_date: round.expected_date ? String(round.expected_date).split('T')[0] : '',
        }))
        : [{ ...emptyRound }],
    });
    setEditError('');
    setEditOpen(true);
  };

  const handleEditDrive = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    try {
      if (!editForm.role_name || !editForm.eligible_batches || !editForm.requirements
        || editForm.ctc === '' || editForm.total_positions === '') {
        setEditError('Please fill all required fields.');
        return;
      }
      if (!Array.isArray(editForm.rounds) || editForm.rounds.length === 0) {
        setEditError('Please add at least one round.');
        return;
      }
      const hasInvalidRound = editForm.rounds.some((round) =>
        !round.round_name || !round.round_description || !round.mode || !round.expected_date
      );
      if (hasInvalidRound) {
        setEditError('Please complete all round details.');
        return;
      }
      const payload = Object.fromEntries(
        Object.entries(editForm).filter(([_, v]) => v !== '' && v !== null)
      );
      if (payload.ctc) payload.ctc = parseFloat(payload.ctc);
      if (payload.total_positions) payload.total_positions = parseInt(payload.total_positions);
      if (payload.company_id) payload.company_id = parseInt(payload.company_id);
      if (Array.isArray(payload.rounds)) {
        payload.rounds = payload.rounds.map((round, index) => ({
          ...round,
          round_number: index + 1,
        }));
      }
      await driveAPI.update(editDrive.id, payload);
      setEditOpen(false);
      fetchDrives();
    } catch (err) {
      const msg = err.response?.data?.errors?.map(e => e.message).join(', ')
        || err.response?.data?.message || 'Failed to update drive';
      setEditError(msg);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteOpen = (e, drive) => {
    e.stopPropagation();
    setDeleteDrive(drive);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDrive) return;
    setDeleting(true);
    try {
      await driveAPI.delete(deleteDrive.id);
      setDeleteOpen(false);
      setDeleteDrive(null);
      fetchDrives();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete drive');
    } finally {
      setDeleting(false);
    }
  };

  const handleBack = () => {
    setSelectedDrive(null);
    setView('list');
  };

  // Helper to format CTC range
  const formatCTC = (drive) => {
    if (drive.ctc) return `₹${drive.ctc} LPA`;
    return 'Not disclosed';
  };

  // Helper to get a logo background color from company name
  const getLogoBg = (name = '') => {
    const colors = [
      'bg-primary/20 text-primary',
      'bg-orange-100 text-orange-600',
      'bg-green-100 text-green-600',
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

  // Compute actual status based on computed_status from backend
  const getActualStatus = (drive) => {
    const status = drive.computed_status || drive.actual_status || drive.drive_status;
    if (status === 'cancelled') return 'cancelled';
    return status || 'upcoming';
  };

  // Normalize DB status to readable label
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
      ongoing: 'bg-primary/20 text-primary border-primary/30',
      completed: 'bg-green-100 text-green-600 border-green-200',
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
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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

  // ---- DETAIL VIEW ----
  if (view === 'detail' && selectedDrive) {
    return (
      <div className="max-w-5xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-500 hover:text-indigo-600 mb-6 transition-colors group"
        >
          <ArrowBackIcon fontSize="small" className="group-hover:-translate-x-1 transition-transform" />
          Back to Drives
        </button>

        {/* Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold ${getLogoBg(selectedDrive.company_name)}`}>
              {(selectedDrive.company_name || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedDrive.company_name} — <span className="text-gray-600 font-medium">{selectedDrive.role_name}</span>
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

        {/* Interview Rounds */}
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

  // ---- LIST VIEW ----
  return (
    <div className="max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Placement Drives</h1>
          <p className="text-gray-500 mt-1">Manage and track placement drives</p>
        </div>
        <button
          onClick={() => { setDriveForm(emptyForm); setFormError(''); setAddOpen(true); }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
        >
          <AddIcon fontSize="small" />
          Add Drive
        </button>
      </div>

      {/* MUI Summary Cards */}
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

      {/* Search and Filters */}
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
          className={`flex items-center gap-1 px-4 py-2 font-medium rounded-lg text-sm transition-colors ${showFilters ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
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
              <input type="date" value={advFilters.date_from} onChange={e => setAdvFilters({ ...advFilters, date_from: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none text-gray-700" title="From" />
              <span className="text-gray-400">-</span>
              <input type="date" value={advFilters.date_to} onChange={e => setAdvFilters({ ...advFilters, date_to: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none text-gray-700" title="To" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">CTC Range (LPA)</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" value={advFilters.ctc_min} onChange={e => setAdvFilters({ ...advFilters, ctc_min: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none" />
              <span className="text-gray-400">-</span>
              <input type="number" placeholder="Max" value={advFilters.ctc_max} onChange={e => setAdvFilters({ ...advFilters, ctc_max: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Eligible Batch</label>
            <div className="flex gap-2">
              <input type="text" placeholder="e.g. 2024" value={advFilters.batch} onChange={e => setAdvFilters({ ...advFilters, batch: e.target.value })} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary focus:border-primary outline-none" />
              <button onClick={fetchDrives} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors font-medium">
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drives List */}
      <div className="space-y-4">
        {filteredDrives.map((drive) => (
          <div
            key={drive.id}
            onClick={() => handleDriveClick(drive)}
            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
          >
            {/* Edit / Delete action buttons */}
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={(e) => handleEditOpen(e, drive)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Edit drive"
              >
                <EditIcon fontSize="small" />
              </button>
              <button
                onClick={(e) => handleDeleteOpen(e, drive)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Delete drive"
              >
                <DeleteIcon fontSize="small" />
              </button>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Logo */}
              <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center text-lg font-bold ${getLogoBg(drive.company_name)}`}>
                {(drive.company_name || '?')[0].toUpperCase()}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                  <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
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

              {/* Right Side Stats */}
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
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900">No drives found</h3>
            <p className="text-gray-500">
              {drives.length === 0 ? 'No drives have been created yet.' : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Delete Drive
          <button onClick={() => setDeleteOpen(false)} className="text-gray-400 hover:text-gray-600">
            <CloseIcon />
          </button>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete the drive for
            <strong> {deleteDrive?.company_name}</strong> — <strong>{deleteDrive?.role_name}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Drive Modal */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Add New Drive
          <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-gray-600">
            <CloseIcon />
          </button>
        </DialogTitle>
        <form onSubmit={handleAddDrive}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {formError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {formError}
              </div>
            )}

            <FormControl fullWidth required>
              <InputLabel>Company *</InputLabel>
              <Select
                name="company_id"
                value={driveForm.company_id}
                onChange={handleDriveFormChange}
                label="Company *"
              >
                {companies.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </Select>
              <FormHelperText>Select the company conducting the drive</FormHelperText>
            </FormControl>

            <TextField
              label="Role / Job Title *"
              name="role_name"
              value={driveForm.role_name}
              onChange={handleDriveFormChange}
              required
              fullWidth
              placeholder="e.g. Software Engineer"
            />

            <TextField
              label="Eligibility / Criteria *"
              name="eligible_batches"
              value={driveForm.eligible_batches}
              onChange={handleDriveFormChange}
              required
              fullWidth
              placeholder="e.g. 7.5 CGPA, No active backlogs, CSE/IT"
            />

            <TextField
              label="Requirements *"
              name="requirements"
              value={driveForm.requirements}
              onChange={handleDriveFormChange}
              required
              fullWidth
              multiline
              rows={3}
              placeholder="e.g. Strong DSA, OOP, and system design basics"
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Expected CTC (LPA) *"
                name="ctc"
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                value={driveForm.ctc}
                onChange={handleDriveFormChange}
                required
                fullWidth
                placeholder="e.g. 12.5"
              />
              <TextField
                label="Total Positions *"
                name="total_positions"
                type="number"
                inputProps={{ min: 1 }}
                value={driveForm.total_positions}
                onChange={handleDriveFormChange}
                required
                fullWidth
              />
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Round Details</h4>
                <button
                  type="button"
                  onClick={() => handleAddRound(setDriveForm)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <AddIcon fontSize="small" />
                  Add Round
                </button>
              </div>
              <div className="space-y-3">
                {driveForm.rounds.map((round, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Round {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRound(index, setDriveForm)}
                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <TextField
                        label="Round Name *"
                        value={round.round_name}
                        onChange={(e) => handleRoundChange(index, 'round_name', e.target.value, setDriveForm)}
                        required
                        fullWidth
                        placeholder="e.g. Aptitude Test"
                      />
                      <FormControl fullWidth required>
                        <InputLabel>Mode *</InputLabel>
                        <Select
                          value={round.mode}
                          onChange={(e) => handleRoundChange(index, 'mode', e.target.value, setDriveForm)}
                          label="Mode *"
                        >
                          <MenuItem value="online">Online</MenuItem>
                          <MenuItem value="offline">Offline</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Expected Date *"
                        type="date"
                        value={round.expected_date}
                        onChange={(e) => handleRoundChange(index, 'expected_date', e.target.value, setDriveForm)}
                        required
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="Description *"
                        value={round.round_description}
                        onChange={(e) => handleRoundChange(index, 'round_description', e.target.value, setDriveForm)}
                        required
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Short description about this round"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setAddOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Drive'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Drive Modal */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Drive — {editDrive?.company_name}
          <button onClick={() => setEditOpen(false)} className="text-gray-400 hover:text-gray-600">
            <CloseIcon />
          </button>
        </DialogTitle>
        <form onSubmit={handleEditDrive}>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
                {editError}
              </div>
            )}

            <TextField
              label="Role / Job Title *"
              value={editForm.role_name}
              onChange={(e) => setEditForm(p => ({ ...p, role_name: e.target.value }))}
              required fullWidth
            />

            <TextField
              label="Eligibility / Criteria *"
              value={editForm.eligible_batches}
              onChange={(e) => setEditForm(p => ({ ...p, eligible_batches: e.target.value }))}
              required fullWidth
            />

            <TextField
              label="Requirements *"
              value={editForm.requirements}
              onChange={(e) => setEditForm(p => ({ ...p, requirements: e.target.value }))}
              required fullWidth multiline rows={3}
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Expected CTC (LPA) *"
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                value={editForm.ctc}
                onChange={(e) => setEditForm(p => ({ ...p, ctc: e.target.value }))}
                required fullWidth
              />
              <TextField
                label="Total Positions *"
                type="number"
                inputProps={{ min: 1 }}
                value={editForm.total_positions}
                onChange={(e) => setEditForm(p => ({ ...p, total_positions: e.target.value }))}
                required fullWidth
              />
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Round Details</h4>
                <button
                  type="button"
                  onClick={() => handleAddRound(setEditForm)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                >
                  <AddIcon fontSize="small" />
                  Add Round
                </button>
              </div>
              <div className="space-y-3">
                {editForm.rounds.map((round, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Round {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRound(index, setEditForm)}
                        className="text-xs text-red-500 hover:text-red-600 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <TextField
                        label="Round Name *"
                        value={round.round_name}
                        onChange={(e) => handleRoundChange(index, 'round_name', e.target.value, setEditForm)}
                        required
                        fullWidth
                      />
                      <FormControl fullWidth required>
                        <InputLabel>Mode *</InputLabel>
                        <Select
                          value={round.mode}
                          onChange={(e) => handleRoundChange(index, 'mode', e.target.value, setEditForm)}
                          label="Mode *"
                        >
                          <MenuItem value="online">Online</MenuItem>
                          <MenuItem value="offline">Offline</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Expected Date *"
                        type="date"
                        value={round.expected_date}
                        onChange={(e) => handleRoundChange(index, 'expected_date', e.target.value, setEditForm)}
                        required
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                      <TextField
                        label="Description *"
                        value={round.round_description}
                        onChange={(e) => handleRoundChange(index, 'round_description', e.target.value, setEditForm)}
                        required
                        fullWidth
                        multiline
                        rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setEditOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={editSubmitting}>
              {editSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default DriveManagement;
