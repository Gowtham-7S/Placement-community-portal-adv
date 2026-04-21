import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  ArrowBack as ArrowBackIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Add as AddIcon,
  AttachMoney as MoneyIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterAlt as FilterIcon,
  Layers as LayersIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { driveAPI, companyAPI } from '../../api';

const emptyRound = {
  round_name: '',
  round_description: '',
  mode: 'online',
  expected_date: '',
};

const createEmptyForm = (batch = '') => ({
  company_id: '',
  role_name: '',
  interview_date: '',
  registration_deadline: '',
  eligible_batches: batch,
  requirements: '',
  location: '',
  ctc: '',
  total_positions: '',
  rounds: [],
});

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

const formatBatchLabel = (batch = '') => String(batch);

const DriveManagement = () => {
  const navigate = useNavigate();
  const { batch: selectedBatch = '' } = useParams();
  const isBatchView = Boolean(selectedBatch);

  const [view, setView] = useState('list');
  const [drives, setDrives] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [showFilters, setShowFilters] = useState(false);
  const [advFilters, setAdvFilters] = useState({
    date_from: '',
    date_to: '',
    ctc_min: '',
    ctc_max: '',
    batch: '',
  });

  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [newBatch, setNewBatch] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [driveForm, setDriveForm] = useState(createEmptyForm(selectedBatch));

  const [editOpen, setEditOpen] = useState(false);
  const [editDrive, setEditDrive] = useState(null);
  const [editForm, setEditForm] = useState(createEmptyForm(selectedBatch));
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteDrive, setDeleteDrive] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await driveAPI.getBatches();
      const payload = response?.data?.data || [];
      setBatches(Array.isArray(payload) ? payload : []);
    } catch (err) {
      console.error('Failed to load drive batches:', err);
      setError('Failed to load drive batches. Please try again.');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDrives = useCallback(async () => {
    if (!isBatchView) {
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

      const response = await driveAPI.getAll(payload);
      setDrives(response?.data?.data || []);
    } catch (err) {
      console.error('Failed to load drives:', err);
      setError('Failed to load drives. Please try again.');
      setDrives([]);
    } finally {
      setLoading(false);
    }
  }, [advFilters.ctc_max, advFilters.ctc_min, advFilters.date_from, advFilters.date_to, isBatchView, selectedBatch]);

  const fetchCompanies = useCallback(async () => {
    if (!isBatchView) {
      setCompanies([]);
      return;
    }

    try {
      const res = await companyAPI.getAll({ limit: 200, batch: selectedBatch });
      setCompanies(res?.data?.data || []);
    } catch (err) {
      console.error('Failed to load companies:', err);
      setCompanies([]);
    }
  }, [isBatchView, selectedBatch]);

  useEffect(() => {
    setDriveForm(createEmptyForm(selectedBatch));
    setEditForm(createEmptyForm(selectedBatch));
    setSelectedDrive(null);
    setView('list');
    setSearchTerm('');
    setFilterStatus('All Status');
    setShowFilters(false);
    setAdvFilters({ date_from: '', date_to: '', ctc_min: '', ctc_max: '', batch: '' });
  }, [selectedBatch]);

  useEffect(() => {
    if (isBatchView) {
      fetchDrives();
      fetchCompanies();
      return;
    }

    fetchBatches();
  }, [fetchBatches, fetchCompanies, fetchDrives, isBatchView]);

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
      return { ...prev, rounds };
    });
  };

  const handleOpenAddModal = () => {
    setDriveForm(createEmptyForm(selectedBatch));
    setFormError('');
    setAddOpen(true);
  };

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      setBatchSaving(true);
      await driveAPI.createBatch({ batch: newBatch.trim() });
      setBatchModalOpen(false);
      setNewBatch('');
      await fetchBatches();
    } catch (err) {
      const message = err.response?.data?.errors?.map((item) => item.message).join(', ')
        || err.response?.data?.message
        || 'Failed to create batch';
      alert(message);
    } finally {
      setBatchSaving(false);
    }
  };

  const handleAddDrive = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const effectiveBatch = selectedBatch || String(driveForm.eligible_batches || '').trim();
      if (!driveForm.company_id) {
        setFormError('Please select a company before creating the drive.');
        return;
      }

      if (!driveForm.interview_date && (!Array.isArray(driveForm.rounds) || driveForm.rounds.length === 0)) {
        setFormError('Add a tentative drive date or at least one round.');
        return;
      }

      const hasInvalidRound = (driveForm.rounds || []).some((round) => {
        const hasAnyValue = [round.round_name, round.round_description, round.mode, round.expected_date]
          .some((value) => String(value || '').trim() !== '');
        if (!hasAnyValue) return false;
        return !String(round.round_name || '').trim() || !String(round.expected_date || '').trim();
      });

      if (hasInvalidRound) {
        setFormError('Each added round needs a round name and expected date.');
        return;
      }

      const meaningfulRounds = (driveForm.rounds || []).filter((round) =>
        [round.round_name, round.round_description, round.mode, round.expected_date]
          .some((value) => String(value || '').trim() !== '')
      );

      const payload = Object.fromEntries(
        Object.entries(driveForm).filter(([_, value]) => value !== '' && value !== null)
      );
      if (effectiveBatch) {
        payload.eligible_batches = effectiveBatch;
      } else {
        delete payload.eligible_batches;
      }
      if (payload.role_name) payload.role_name = payload.role_name.trim();
      if (payload.requirements) payload.requirements = payload.requirements.trim();
      if (payload.location) payload.location = payload.location.trim();
      if (payload.ctc) payload.ctc = parseFloat(payload.ctc);
      if (payload.total_positions) payload.total_positions = parseInt(payload.total_positions, 10);
      if (payload.company_id) payload.company_id = parseInt(payload.company_id, 10);
      payload.rounds = meaningfulRounds.map((round, index) => ({
        ...round,
        round_name: String(round.round_name || '').trim(),
        round_description: String(round.round_description || '').trim(),
        round_number: index + 1,
      }));

      if (payload.rounds.length === 0) {
        delete payload.rounds;
      }

      await driveAPI.create(payload);
      setAddOpen(false);
      setDriveForm(createEmptyForm(selectedBatch));
      fetchDrives();
    } catch (err) {
      const msg = err.response?.data?.errors?.map((item) => item.message).join(', ')
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
      setSelectedDrive(response?.data?.data || drive);
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
      driveData = response?.data?.data || drive;
    } catch (err) {
      console.error('Failed to load drive details:', err);
    }

    setEditDrive(driveData);
    setEditForm({
      company_id: driveData.company_id || '',
      role_name: driveData.role_name || '',
      eligible_batches: selectedBatch || driveData.eligible_batches || '',
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
    setEditOpen(true);
  };

  const handleEditDrive = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);

    try {
      const effectiveBatch = selectedBatch || String(editForm.eligible_batches || '').trim();
      if (!editForm.role_name || !effectiveBatch || !editForm.requirements
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

      const payload = {
        ...Object.fromEntries(
          Object.entries(editForm).filter(([_, value]) => value !== '' && value !== null)
        ),
        eligible_batches: effectiveBatch,
      };

      if (payload.ctc) payload.ctc = parseFloat(payload.ctc);
      if (payload.total_positions) payload.total_positions = parseInt(payload.total_positions, 10);
      if (payload.company_id) payload.company_id = parseInt(payload.company_id, 10);
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
      const msg = err.response?.data?.errors?.map((item) => item.message).join(', ')
        || err.response?.data?.message
        || 'Failed to update drive';
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

  const formatCTC = (drive) => {
    if (drive.ctc) return `Rs.${drive.ctc} LPA`;
    return 'Not disclosed';
  };

  const getLogoBg = (name = '') => {
    const colors = [
      'bg-[#6d5dfc]/20 text-[#6d5dfc]',
      'bg-[#f3e8ff] text-[#7c3aed]',
      'bg-green-100 text-green-600',
      'bg-[#fef3c7] text-[#92400e]',
      'bg-[#e0f2fe] text-[#0369a1]',
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
      upcoming: 'bg-[#f3e8ff] text-[#7c3aed] border-[#e9d5ff]',
      ongoing: 'bg-[#6d5dfc]/20 text-[#6d5dfc] border-[#6d5dfc]/30',
      completed: 'bg-green-100 text-green-600 border-green-200',
      cancelled: 'bg-red-100 text-red-600 border-red-200',
    };
    const style = styleMap[status] || 'bg-slate-100 text-slate-600 border-slate-200';
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${style} capitalize`}>
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
            onClick={isBatchView ? fetchDrives : fetchBatches}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isBatchView) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Drive Batches</h1>
            <p className="text-slate-500 mt-1">Choose a batch to manage placement drives inside that academic cycle.</p>
          </div>
          <button
            type="button"
            onClick={() => setBatchModalOpen(true)}
            className="bg-[#6d5dfc] hover:bg-[#5b47d6] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
          >
            <LayersIcon fontSize="small" />
            Add Batch
          </button>
        </div>

        <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-8 flex items-center gap-2">
          <SearchIcon className="text-slate-400 ml-2" />
          <input
            type="text"
            placeholder="Search by batch..."
            className="flex-1 py-2 outline-none text-slate-700 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredBatches.map((entry) => (
            <button
              key={entry.batch}
              type="button"
              onClick={() => navigate(`/admin/drives/${entry.batch}`)}
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
                Open batch-specific drive management for this cycle.
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

        <Dialog open={batchModalOpen} onClose={() => setBatchModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle className="font-bold border-b border-slate-200">Add New Batch</DialogTitle>
          <form onSubmit={handleCreateBatch}>
            <DialogContent className="pt-6">
              <div className="space-y-4 py-2">
                <div className="bg-[#f6f8ff] border border-[#dfe6ff] rounded-lg p-4">
                  <p className="text-sm text-slate-700">
                    Create a drive batch card first, then open it and add drives inside that batch.
                  </p>
                </div>
                <TextField
                  label="Batch"
                  fullWidth
                  required
                  value={newBatch}
                  onChange={(e) => setNewBatch(e.target.value)}
                  placeholder="2023-2027"
                  helperText="Use YYYY-YYYY format"
                />
              </div>
            </DialogContent>
            <DialogActions className="p-4 border-t border-slate-200">
              <Button onClick={() => setBatchModalOpen(false)} className="text-slate-500">Cancel</Button>
              <Button type="submit" variant="contained" disabled={batchSaving} className="bg-[#6d5dfc] hover:bg-[#5b47d6] shadow-none">
                {batchSaving ? 'Creating...' : 'Create Batch'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </div>
    );
  }

  if (view === 'detail' && selectedDrive) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/drives')}
            className="flex items-center gap-2 text-slate-500 hover:text-[#6d5dfc]"
          >
            <ArrowBackIcon fontSize="small" />
            Back to batches
          </button>
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-slate-500 hover:text-[#6d5dfc]"
          >
            <ArrowBackIcon fontSize="small" />
            Back to drives
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center text-xl font-bold">
              {(selectedDrive.company_name || '?')[0]}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-900">
                  {selectedDrive.company_name} - {selectedDrive.role_name}
                </h1>
                <StatusBadge drive={selectedDrive} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm text-slate-600">
                <div>
                  <p className="text-xs text-slate-400">Date</p>
                  <p className="font-medium">
                    {selectedDrive.interview_date
                      ? new Date(selectedDrive.interview_date).toDateString()
                      : 'TBD'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">LPA</p>
                  <p className="font-medium">{formatCTC(selectedDrive)}</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Positions</p>
                  <p className="font-medium">{selectedDrive.filled_positions || 0} Filled</p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">Mode</p>
                  <p className="font-medium capitalize">{getRoundModesLabel(selectedDrive)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-[#f3f0ff] rounded-xl p-4">
              <p className="text-xs text-slate-500">ELIGIBLE BATCHES</p>
              <p className="font-semibold text-slate-900 mt-1">
                {selectedDrive.eligible_batches || selectedBatch || 'N/A'}
              </p>
            </div>

            <div className="bg-[#f3f0ff] rounded-xl p-4">
              <p className="text-xs text-slate-500">REQUIREMENTS</p>
              <p className="font-semibold text-slate-900 mt-1">{selectedDrive.requirements || 'N/A'}</p>
            </div>

            <div className="bg-[#f3f0ff] rounded-xl p-4">
              <p className="text-xs text-slate-500">MODE</p>
              <p className="font-semibold text-slate-900 mt-1 capitalize">{getRoundModesLabel(selectedDrive) || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-900">Interview Rounds</h3>
            <span className="text-sm text-slate-400">{(selectedDrive.rounds || []).length} Phases Total</span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {(selectedDrive.rounds || []).map((round, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-xl p-5"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs bg-[#e0e7ff] text-[#4338ca] px-2 py-1 rounded-full">
                    ROUND {index + 1}
                  </span>
                </div>

                <h4 className="text-lg font-semibold text-slate-900 mb-1">
                  {round.round_name || `Round ${index + 1}`}
                </h4>

                <p className="text-sm text-slate-600 mb-3">
                  {round.round_description || 'No description provided.'}
                </p>

                <div className="text-xs text-slate-500 flex justify-between">
                  <span>
                    {round.expected_date
                      ? new Date(round.expected_date).toDateString()
                      : 'TBD'}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      round.mode === 'online'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}
                  >
                    {round.mode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-screen">
      <button
        type="button"
        onClick={() => navigate('/admin/drives')}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-[#6d5dfc] mb-6"
      >
        <ArrowBackIcon fontSize="small" />
        Back to batches
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Placement Drives - {formatBatchLabel(selectedBatch)}</h1>
          <p className="text-slate-500 mt-1">Manage and track placement drives for this academic cycle.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#6d5dfc] hover:bg-[#5b47d6] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
        >
          <AddIcon fontSize="small" />
          Add Drive
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card sx={{ borderRadius: 3, border: '1px solid #d1fae5', boxShadow: '0 8px 20px rgba(16,185,129,0.12)' }}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#6d5dfc]">Completed Drives</p>
                <h3 className="text-3xl font-bold text-[#5b47d6] mt-2">{completedDrivesCount}</h3>
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
                <p className="text-xs font-semibold uppercase tracking-wide text-[#7c3aed]">Ongoing Drives</p>
                <h3 className="text-3xl font-bold text-[#7c3aed] mt-2">{ongoingDrivesCount}</h3>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#f3e8ff] text-[#7c3aed] flex items-center justify-center">
                <EventAvailableIcon />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card sx={{ borderRadius: 3, border: '1px solid #bfdbfe', boxShadow: '0 8px 20px rgba(59,130,246,0.12)' }}>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#4338ca]">Upcoming Drives</p>
                <h3 className="text-3xl font-bold text-[#4338ca] mt-2">{upcomingDrivesCount}</h3>
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
            className="flex-1 py-2 outline-none text-slate-700 placeholder-slate-400"
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
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Date Range</label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={advFilters.date_from}
                onChange={(e) => setAdvFilters({ ...advFilters, date_from: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none text-slate-700"
                title="From"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={advFilters.date_to}
                onChange={(e) => setAdvFilters({ ...advFilters, date_to: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none text-slate-700"
                title="To"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">CTC Range (LPA)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={advFilters.ctc_min}
                onChange={(e) => setAdvFilters({ ...advFilters, ctc_min: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none"
              />
              <span className="text-slate-400">-</span>
              <input
                type="number"
                placeholder="Max"
                value={advFilters.ctc_max}
                onChange={(e) => setAdvFilters({ ...advFilters, ctc_max: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-[#6d5dfc] focus:border-[#6d5dfc] outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Selected Batch</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={selectedBatch}
                readOnly
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500 outline-none"
              />
              <button
                onClick={fetchDrives}
                className="px-4 py-2 bg-[#6d5dfc] text-white rounded-lg text-sm hover:bg-[#5b47d6] transition-colors font-medium"
              >
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
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative"
          >
            <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <button
                onClick={(e) => handleEditOpen(e, drive)}
                className="p-2 rounded-lg text-slate-500 hover:text-[#6d5dfc] hover:bg-[#eff2ff] transition-colors"
                title="Edit drive"
              >
                <EditIcon fontSize="small" />
              </button>
              <button
                onClick={(e) => handleDeleteOpen(e, drive)}
                className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-[#fee2e2] transition-colors"
                title="Delete drive"
              >
                <DeleteIcon fontSize="small" />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
              <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-bold ${getLogoBg(drive.company_name)}`}>
                {(drive.company_name || '?')[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-slate-900 truncate">{drive.company_name}</h3>
                    <p className="text-sm text-slate-500 truncate">{drive.role_name}</p>
                  </div>
                  <StatusBadge drive={drive} />
                </div>

                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <CalendarIcon fontSize="inherit" className="text-slate-400" />
                    <span>{drive.interview_date ? new Date(drive.interview_date).toLocaleDateString() : 'TBD'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MoneyIcon fontSize="inherit" className="text-slate-400" />
                    <span>{formatCTC(drive)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <PeopleIcon fontSize="inherit" className="text-slate-400" />
                    <span>{(drive.filled_positions || 0)}/{drive.total_positions || 0} filled</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BusinessIcon fontSize="inherit" className="text-slate-400" />
                    <span>{getRoundModesLabel(drive) || 'N/A'}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-xs font-semibold bg-[#eef2ff] text-[#4338ca] px-3 py-1 rounded-full">
                    Batch: {selectedBatch}
                  </span>
                  {drive.requirements && (
                    <span className="text-xs font-semibold bg-[#ecfdf5] text-[#065f46] px-3 py-1 rounded-full">
                      Req: {drive.requirements.split(',')[0]}
                    </span>
                  )}
                  <span className="text-xs font-semibold bg-[#fef3c7] text-[#92400e] px-3 py-1 rounded-full">
                    Mode: {getRoundModesLabel(drive)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredDrives.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">No drives found</h3>
            <p className="text-slate-500">
              {drives.length === 0
                ? `No drives have been created yet for ${formatBatchLabel(selectedBatch)}.`
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}
      </div>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Delete Drive
          <button onClick={() => setDeleteOpen(false)} className="text-slate-400 hover:text-slate-600">
            <CloseIcon />
          </button>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete the drive for
            <strong> {deleteDrive?.company_name}</strong> - <strong>{deleteDrive?.role_name}</strong>?
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

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
          <div>
            <p className="text-xl font-bold text-slate-900">Add New Drive</p>
            <p className="text-sm text-slate-500 mt-1">Create a drive quickly now and fill optional details whenever they are available.</p>
          </div>
          <button onClick={() => setAddOpen(false)} className="text-slate-400 hover:text-slate-600">
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

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50/60 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Basic Information</h3>
              <p className="text-xs text-slate-500 mt-1">Only company and one date source are essential. Everything else can stay blank.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormControl fullWidth required>
                <InputLabel>Company *</InputLabel>
                <Select
                  name="company_id"
                  value={driveForm.company_id}
                  onChange={handleDriveFormChange}
                  label="Company *"
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={company.id}>{company.name}</MenuItem>
                  ))}
                </Select>
                <FormHelperText>Select the company conducting the drive</FormHelperText>
              </FormControl>

              <TextField
                label="Role / Job Title"
                name="role_name"
                value={driveForm.role_name}
                onChange={handleDriveFormChange}
                fullWidth
                placeholder="e.g. Software Engineer"
                helperText="Optional. If left empty, a default drive title will be used."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Batch"
                name="eligible_batches"
                value={selectedBatch || driveForm.eligible_batches}
                onChange={handleDriveFormChange}
                fullWidth
                disabled={isBatchView}
                helperText="Optional batch label for this drive."
              />
              <TextField
                label="Tentative Drive Date"
                name="interview_date"
                type="date"
                value={driveForm.interview_date}
                onChange={handleDriveFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Use this when rounds are not finalized yet."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Registration Deadline"
                name="registration_deadline"
                type="date"
                value={driveForm.registration_deadline}
                onChange={handleDriveFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                helperText="Optional closing date for registrations."
              />
              <TextField
                label="Location"
                name="location"
                value={driveForm.location}
                onChange={handleDriveFormChange}
                fullWidth
                placeholder="e.g. Chennai / Remote"
                helperText="Optional drive location."
              />
            </div>

            <TextField
              label="Requirements"
              name="requirements"
              value={driveForm.requirements}
              onChange={handleDriveFormChange}
              fullWidth
              multiline
              rows={3}
              placeholder="e.g. Strong DSA, OOP, and system design basics"
              helperText="Optional notes, criteria, or preparation pointers."
            />

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Compensation and Capacity</h3>
                  <p className="text-xs text-slate-500 mt-1">These fields are now optional and can be added later.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField
                  label="Expected CTC (LPA)"
                  name="ctc"
                  type="number"
                  inputProps={{ min: 0, step: 0.1 }}
                  value={driveForm.ctc}
                  onChange={handleDriveFormChange}
                  fullWidth
                  placeholder="e.g. 12.5"
                />
                <TextField
                  label="Total Positions"
                  name="total_positions"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={driveForm.total_positions}
                  onChange={handleDriveFormChange}
                  fullWidth
                  placeholder="e.g. 25"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Round Details</h4>
                  <p className="text-xs text-slate-500 mt-1">Optional. Add rounds now if the process is already planned.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddRound(setDriveForm)}
                  className="text-sm text-[#6d5dfc] hover:text-[#5b47d6] font-medium flex items-center gap-1"
                >
                  <AddIcon fontSize="small" />
                  Add Round
                </button>
              </div>

              {driveForm.rounds.length === 0 && (
                <div className="border border-dashed border-slate-300 rounded-xl p-4 text-sm text-slate-500 bg-slate-50">
                  No rounds added yet. You can still create the drive using the tentative drive date above.
                </div>
              )}

              <div className="space-y-3">
                {driveForm.rounds.map((round, index) => (
                  <div key={index} className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
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
                        label="Round Name"
                        value={round.round_name}
                        onChange={(e) => handleRoundChange(index, 'round_name', e.target.value, setDriveForm)}
                        fullWidth
                        placeholder="e.g. Aptitude Test"
                        helperText="Required only if you keep this round."
                      />
                      <FormControl fullWidth>
                        <InputLabel>Mode</InputLabel>
                        <Select
                          value={round.mode}
                          onChange={(e) => handleRoundChange(index, 'mode', e.target.value, setDriveForm)}
                          label="Mode"
                        >
                          <MenuItem value="online">Online</MenuItem>
                          <MenuItem value="offline">Offline</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        label="Expected Date"
                        type="date"
                        value={round.expected_date}
                        onChange={(e) => handleRoundChange(index, 'expected_date', e.target.value, setDriveForm)}
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        helperText="Required only if you keep this round."
                      />
                      <TextField
                        label="Description"
                        value={round.round_description}
                        onChange={(e) => handleRoundChange(index, 'round_description', e.target.value, setDriveForm)}
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

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Edit Drive - {editDrive?.company_name}
          <button onClick={() => setEditOpen(false)} className="text-slate-400 hover:text-slate-600">
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
              onChange={(e) => setEditForm((prev) => ({ ...prev, role_name: e.target.value }))}
              required
              fullWidth
            />

            <TextField
              label="Batch *"
              value={selectedBatch || editForm.eligible_batches}
              onChange={(e) => setEditForm((prev) => ({ ...prev, eligible_batches: e.target.value }))}
              required
              fullWidth
              disabled={isBatchView}
              helperText="This drive remains scoped to the selected batch."
            />

            <TextField
              label="Requirements *"
              value={editForm.requirements}
              onChange={(e) => setEditForm((prev) => ({ ...prev, requirements: e.target.value }))}
              required
              fullWidth
              multiline
              rows={3}
            />

            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="Expected CTC (LPA) *"
                type="number"
                inputProps={{ min: 0, step: 0.1 }}
                value={editForm.ctc}
                onChange={(e) => setEditForm((prev) => ({ ...prev, ctc: e.target.value }))}
                required
                fullWidth
              />
              <TextField
                label="Total Positions *"
                type="number"
                inputProps={{ min: 1 }}
                value={editForm.total_positions}
                onChange={(e) => setEditForm((prev) => ({ ...prev, total_positions: e.target.value }))}
                required
                fullWidth
              />
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-900">Round Details</h4>
                <button
                  type="button"
                  onClick={() => handleAddRound(setEditForm)}
                  className="text-sm text-[#6d5dfc] hover:text-[#5b47d6] font-medium flex items-center gap-1"
                >
                  <AddIcon fontSize="small" />
                  Add Round
                </button>
              </div>
              <div className="space-y-3">
                {editForm.rounds.map((round, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
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
