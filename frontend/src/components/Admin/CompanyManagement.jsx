import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { companyAPI } from '../../api';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Menu,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
   Layers as LayersIcon,
} from '@mui/icons-material';

const createEmptyForm = (batch = '') => ({
  name: '',
  batch,
  website: '',
  description: '',
  parent_org: '',
  overall_description: '',
  job_role: { title: '', eligibility: '', compensation: '', bonuses: '' },
  internship: { duration: '', schedule: '', stipend: '' },
  selection_process: { steps: '' },
  location: { city: '', address: '' },
});

const formatBatchLabel = (batch = '') => String(batch).replace('-', '–');

const CompanyManagement = () => {
  const navigate = useNavigate();
  const { batch: selectedBatch = '' } = useParams();
  const isBatchView = Boolean(selectedBatch);

  const [companies, setCompanies] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(createEmptyForm(selectedBatch));
  const [searchTerm, setSearchTerm] = useState('');
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [newBatch, setNewBatch] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const normalizeSteps = (steps) => {
    if (Array.isArray(steps)) return steps.filter(Boolean).join('\n');
    return steps || '';
  };

  const resetForm = useCallback((batchValue = selectedBatch) => {
    setFormData(createEmptyForm(batchValue));
  }, [selectedBatch]);

  const fetchCompanies = useCallback(async () => {
    if (!selectedBatch) {
      setCompanies([]);
      return;
    }

    try {
      setLoading(true);
      const response = await companyAPI.getAll({ limit: 100, batch: selectedBatch });
      const payload = response?.data?.data?.data || response?.data?.data || [];
      setCompanies(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('Failed to load companies:', error);
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [selectedBatch]);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getBatches();
      const payload = response?.data?.data || [];
      setBatches(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('Failed to load company batches:', error);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    resetForm(selectedBatch);
  }, [resetForm, selectedBatch]);

  useEffect(() => {
    if (isBatchView) {
      fetchCompanies();
      return;
    }

    fetchBatches();
  }, [fetchBatches, fetchCompanies, isBatchView]);

  const handleOpenModal = async (company = null) => {
    handleMenuClose();
    setModalOpen(true);

    if (company?.id) {
      setModalLoading(true);
      setEditingId(company.id);
      try {
        const res = await companyAPI.getById(company.id);
        const full = res?.data?.data || res?.data || {};
        setFormData({
          name: full?.name || '',
          batch: full?.batch || selectedBatch,
          website: full?.website || '',
          description: full?.description || '',
          parent_org: full?.parent_org || '',
          overall_description: full?.overall_description || '',
          job_role: {
            title: full?.job_role?.title || '',
            eligibility: full?.job_role?.eligibility || '',
            compensation: full?.job_role?.compensation || '',
            bonuses: full?.job_role?.bonuses || '',
          },
          internship: {
            duration: full?.internship?.duration || '',
            schedule: full?.internship?.schedule || '',
            stipend: full?.internship?.stipend || '',
          },
          selection_process: { steps: normalizeSteps(full?.selection_process?.steps) },
          location: {
            city: full?.location?.city || '',
            address: full?.location?.address || '',
          },
        });
      } catch (error) {
        console.error('Failed to load company details:', error);
        resetForm(selectedBatch);
      } finally {
        setModalLoading(false);
      }
    } else {
      resetForm(selectedBatch);
      setEditingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const steps = formData.selection_process.steps
        .split('\n')
        .map((step) => step.trim())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        batch: selectedBatch,
        website: formData.website.trim() || null,
        description: formData.description.trim() || null,
        parent_org: formData.parent_org.trim() || null,
        overall_description: formData.overall_description.trim() || null,
        job_role: {
          title: formData.job_role.title.trim() || null,
          eligibility: formData.job_role.eligibility.trim() || null,
          compensation: formData.job_role.compensation.trim() || null,
          bonuses: formData.job_role.bonuses.trim() || null,
        },
        internship: {
          duration: formData.internship.duration.trim() || null,
          schedule: formData.internship.schedule.trim() || null,
          stipend: formData.internship.stipend.trim() || null,
        },
        selection_process: {
          steps: steps.length > 0 ? steps : null,
        },
        location: {
          city: formData.location.city.trim() || null,
          address: formData.location.address.trim() || null,
        },
      };

      if (editingId) {
        await companyAPI.update(editingId, payload);
      } else {
        await companyAPI.create(payload);
      }

      setModalOpen(false);
      fetchCompanies();
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const message = Array.isArray(validationErrors) && validationErrors.length > 0
        ? validationErrors.map((item) => item.message).join(', ')
        : (error.response?.data?.message || error.message || 'Operation failed');
      alert(message);
    }
  };

  const handleDelete = async () => {
    handleMenuClose();
    if (!selectedCompanyId) return;

    if (window.confirm(`Delete this company from ${formatBatchLabel(selectedBatch)}?`)) {
      try {
        await companyAPI.delete(selectedCompanyId);
        fetchCompanies();
      } catch (error) {
        console.error('Failed to delete company:', error);
      }
    }
  };

  const handleMenuClick = (event, id) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedCompanyId(id);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCompanyId(null);
  };

  const handleCardClick = async (company) => {
    if (!company?.id) return;
    setSelectedCompany(null);
    setDetailsOpen(true);
    setDetailsLoading(true);

    try {
      const res = await companyAPI.getById(company.id);
      const full = res?.data?.data || res?.data || null;
      setSelectedCompany(full);
    } catch (error) {
      console.error('Failed to load company details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredCompanies = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return companies.filter((company) => (
      (company.name || '').toLowerCase().includes(term) ||
      (company.description || '').toLowerCase().includes(term)
    ));
  }, [companies, searchTerm]);

  const filteredBatches = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return batches.filter((entry) => entry.batch.toLowerCase().includes(term));
  }, [batches, searchTerm]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      setBatchSaving(true);
      await companyAPI.createBatch({ batch: newBatch.trim() });
      setBatchModalOpen(false);
      setNewBatch('');
      await fetchBatches();
    } catch (error) {
      const validationErrors = error.response?.data?.errors;
      const message = Array.isArray(validationErrors) && validationErrors.length > 0
        ? validationErrors.map((item) => item.message).join(', ')
        : (error.response?.data?.message || error.message || 'Failed to create batch');
      alert(message);
    } finally {
      setBatchSaving(false);
    }
  };

  const getInitialColor = (letter = 'C') => {
    const colors = [
      'bg-[#6d5dfc]/20 text-[#6d5dfc]',
      'bg-[#ede9fe] text-[#5b47d6]',
      'bg-amber-100 text-amber-700',
      'bg-cyan-100 text-cyan-700',
      'bg-rose-100 text-rose-700',
    ];
    return colors[letter.charCodeAt(0) % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6d5dfc]" />
      </div>
    );
  }

  if (!isBatchView) {
    return (
      <div className="max-w-7xl mx-auto min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Company Batches</h1>
            <p className="text-slate-500 mt-1">Choose a batch to manage companies under that academic cycle.</p>
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
              onClick={() => navigate(`/admin/companies/${entry.batch}`)}
              className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all p-6 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#ede9fe] text-[#5b47d6] flex items-center justify-center">
                  <BusinessIcon />
                </div>
                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                  {entry.company_count} companies
                </span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mt-6 group-hover:text-[#6d5dfc] transition-colors">
                {formatBatchLabel(entry.batch)}
              </h3>
              <p className="text-slate-500 mt-2">
                Open batch-specific company management for this cycle.
              </p>
            </button>
          ))}
        </div>

        {filteredBatches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">??</div>
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
                    Create a batch card first, then open it and add companies inside that batch.
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

  return (
    <div className="max-w-7xl mx-auto min-h-screen">
      <button
        type="button"
        onClick={() => navigate('/admin/companies')}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-[#6d5dfc] mb-6"
      >
        <ArrowBackIcon fontSize="small" />
        Back to batches
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies • {formatBatchLabel(selectedBatch)}</h1>
          <p className="text-slate-500 mt-1">Add, edit, and delete companies linked to this batch.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-[#6d5dfc] hover:bg-[#5b47d6] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
        >
          <AddIcon fontSize="small" />
          Add Company
        </button>
      </div>

      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm mb-8 flex items-center gap-2">
        <SearchIcon className="text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by company name or description..."
          className="flex-1 py-2 outline-none text-slate-700 placeholder-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <button
            type="button"
            key={company.id}
            onClick={() => handleCardClick(company)}
            className="text-left bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group relative"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${getInitialColor(company.name?.[0] || 'C')}`}>
                  {(company.name?.[0] || 'C').toUpperCase()}
                </div>
                <button
                  onClick={(e) => handleMenuClick(e, company.id)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
                >
                  <MoreVertIcon />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 mb-2">
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#6d5dfc] transition-colors">
                  {company.name}
                </h3>
                <span className="text-[11px] font-semibold bg-[#eef2ff] text-[#4338ca] px-2.5 py-1 rounded-full">
                  {formatBatchLabel(company.batch)}
                </span>
              </div>

              <p
                className="text-[1.05rem] text-slate-600 mt-2 line-clamp-4 whitespace-pre-wrap leading-8"
                style={{ fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif' }}
              >
                {company.description || 'No description provided.'}
              </p>
            </div>
          </button>
        ))}
      </div>

      {filteredCompanies.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">??</div>
          <h3 className="text-lg font-medium text-slate-900">No companies found</h3>
          <p className="text-slate-500">
            {companies.length === 0
              ? `No companies have been added for ${formatBatchLabel(selectedBatch)} yet.`
              : 'Try adjusting your search terms'}
          </p>
        </div>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.5rem',
          },
        }}
      >
        <MenuItem onClick={() => handleOpenModal(companies.find((company) => company.id === selectedCompanyId))}>Edit Company</MenuItem>
        <MenuItem onClick={handleDelete} className="text-red-600">Delete</MenuItem>
      </Menu>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold border-b border-slate-200">
          {editingId ? `Edit Company • ${formatBatchLabel(selectedBatch)}` : `Add New Company • ${formatBatchLabel(selectedBatch)}`}
        </DialogTitle>
        <DialogContent className="pt-6">
          {modalLoading && (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6d5dfc]"></div>
            </div>
          )}
          {!modalLoading && (
            <form onSubmit={handleSubmit} className="space-y-6 py-4">
              <div className="bg-[#f6f8ff] border border-[#dfe6ff] rounded-lg p-4">
                <p className="text-sm font-medium text-slate-700">
                  This company will be saved under <span className="text-[#5b47d6] font-semibold">{formatBatchLabel(selectedBatch)}</span>.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Company Info</h3>
                <TextField
                  label="Company Name"
                  name="name"
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Website"
                  name="website"
                  fullWidth
                  value={formData.website}
                  onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Parent Org"
                  name="parent_org"
                  fullWidth
                  value={formData.parent_org}
                  onChange={(e) => setFormData((prev) => ({ ...prev, parent_org: e.target.value }))}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Description"
                  name="description"
                  multiline
                  rows={4}
                  fullWidth
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  variant="outlined"
                  size="small"
                />
              </div>

              <div className="bg-[#eef2ff] border border-[#e0e7ff] rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Job Role</h3>
                <TextField
                  label="Title"
                  fullWidth
                  value={formData.job_role.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, job_role: { ...prev.job_role, title: e.target.value } }))}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Eligibility"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.job_role.eligibility}
                  onChange={(e) => setFormData((prev) => ({ ...prev, job_role: { ...prev.job_role, eligibility: e.target.value } }))}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Compensation"
                  fullWidth
                  value={formData.job_role.compensation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, job_role: { ...prev.job_role, compensation: e.target.value } }))}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Bonuses"
                  fullWidth
                  value={formData.job_role.bonuses}
                  onChange={(e) => setFormData((prev) => ({ ...prev, job_role: { ...prev.job_role, bonuses: e.target.value } }))}
                  variant="outlined"
                  size="small"
                />
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Internship</h3>
                <TextField
                  label="Duration"
                  fullWidth
                  value={formData.internship.duration}
                  onChange={(e) => setFormData((prev) => ({ ...prev, internship: { ...prev.internship, duration: e.target.value } }))}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Schedule"
                  fullWidth
                  value={formData.internship.schedule}
                  onChange={(e) => setFormData((prev) => ({ ...prev, internship: { ...prev.internship, schedule: e.target.value } }))}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Stipend"
                  fullWidth
                  value={formData.internship.stipend}
                  onChange={(e) => setFormData((prev) => ({ ...prev, internship: { ...prev.internship, stipend: e.target.value } }))}
                  variant="outlined"
                  size="small"
                />
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Selection Process</h3>
                <TextField
                  label="Steps (one per line)"
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.selection_process.steps}
                  onChange={(e) => setFormData((prev) => ({ ...prev, selection_process: { steps: e.target.value } }))}
                  variant="outlined"
                  size="small"
                />
              </div>

              <div className="bg-[#f5f3ff] border border-[#ede9fe] rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Location</h3>
                <TextField
                  label="City"
                  fullWidth
                  value={formData.location.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: { ...prev.location, city: e.target.value } }))}
                  variant="outlined"
                  size="small"
                />
                <TextField
                  label="Address"
                  fullWidth
                  multiline
                  rows={3}
                  value={formData.location.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: { ...prev.location, address: e.target.value } }))}
                  variant="outlined"
                  size="small"
                />
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-3">Overall Details</h3>
                <TextField
                  label="Overall Description"
                  name="overall_description"
                  multiline
                  rows={4}
                  fullWidth
                  value={formData.overall_description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, overall_description: e.target.value }))}
                  variant="outlined"
                  size="small"
                />
              </div>
            </form>
          )}
        </DialogContent>
        <DialogActions className="p-4 border-t border-slate-200">
          <Button onClick={() => setModalOpen(false)} className="text-slate-500">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" className="bg-[#6d5dfc] hover:bg-[#5b47d6] shadow-none">
            {editingId ? 'Update Company' : 'Add Company'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="font-bold border-b border-slate-200">
          {selectedCompany?.name || 'Company Details'}
        </DialogTitle>
        <DialogContent className="pt-6">
          {detailsLoading && (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6d5dfc]"></div>
            </div>
          )}
          {!detailsLoading && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Company Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Name</label>
                    <p className="text-slate-900">{selectedCompany?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Batch</label>
                    <p className="text-slate-900">{formatBatchLabel(selectedCompany?.batch || selectedBatch)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Website</label>
                    <p className="text-slate-900">{selectedCompany?.website || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Parent Org</label>
                    <p className="text-slate-900">{selectedCompany?.parent_org || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-500">Description</label>
                    <p className="text-slate-900 whitespace-pre-wrap">{selectedCompany?.description || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#eef2ff] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Job Role</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Title</label>
                    <p className="text-slate-900">{selectedCompany?.job_role?.title || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Eligibility</label>
                    <p className="text-slate-900 whitespace-pre-wrap">{selectedCompany?.job_role?.eligibility || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Compensation</label>
                    <p className="text-slate-900">{selectedCompany?.job_role?.compensation || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Bonuses</label>
                    <p className="text-slate-900 whitespace-pre-wrap">{selectedCompany?.job_role?.bonuses || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Internship</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Duration</label>
                    <p className="text-slate-900">{selectedCompany?.internship?.duration || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Schedule</label>
                    <p className="text-slate-900">{selectedCompany?.internship?.schedule || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Stipend</label>
                    <p className="text-slate-900">{selectedCompany?.internship?.stipend || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Selection Process</h3>
                {selectedCompany?.selection_process?.steps?.length > 0 ? (
                  <ol className="list-decimal ml-5 text-slate-800 space-y-1">
                    {selectedCompany.selection_process.steps.map((step, index) => (
                      <li key={`${selectedCompany.id}-step-${index}`} className="text-sm">{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-slate-600 text-sm">N/A</p>
                )}
              </div>

              <div className="bg-[#f5f3ff] rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">City</label>
                    <p className="text-slate-900">{selectedCompany?.location?.city || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Address</label>
                    <p className="text-slate-900 whitespace-pre-wrap">{selectedCompany?.location?.address || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Overall Details</h3>
                <p className="text-slate-800 whitespace-pre-wrap">{selectedCompany?.overall_description || 'N/A'}</p>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions className="p-4 border-t border-slate-200">
          <Button onClick={() => setDetailsOpen(false)} variant="contained" className="bg-[#6d5dfc] hover:bg-[#5b47d6] shadow-none">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CompanyManagement;
