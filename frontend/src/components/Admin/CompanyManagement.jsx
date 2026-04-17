import React, { useEffect, useState } from 'react';
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
} from '@mui/icons-material';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    website: '',
    description: '',
    parent_org: '',
    overall_description: '',
    job_role: { title: '', eligibility: '', compensation: '', bonuses: '' },
    internship: { duration: '', schedule: '', stipend: '' },
    selection_process: { steps: '' },
    location: { city: '', address: '' },
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getAll({ limit: 100 });
      const payload = response?.data?.data?.data || response?.data?.data || [];
      setCompanies(Array.isArray(payload) ? payload : []);
    } catch (error) {
      console.error('Failed to load companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const normalizeSteps = (steps) => {
    if (Array.isArray(steps)) return steps.filter(Boolean).join('\n');
    return steps || '';
  };

  const resetForm = () => {
    setFormData({
      name: '',
      website: '',
      description: '',
      parent_org: '',
      overall_description: '',
      job_role: { title: '', eligibility: '', compensation: '', bonuses: '' },
      internship: { duration: '', schedule: '', stipend: '' },
      selection_process: { steps: '' },
      location: { city: '', address: '' },
    });
  };

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
        resetForm();
      } finally {
        setModalLoading(false);
      }
    } else {
      resetForm();
      setEditingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const steps = formData.selection_process.steps
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
      const payload = {
        name: formData.name.trim(),
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
      const msg = Array.isArray(validationErrors) && validationErrors.length > 0
        ? validationErrors.map((x) => x.message).join(', ')
        : (error.response?.data?.message || error.message || 'Operation failed');
      alert(msg);
    }
  };

  const handleDelete = async () => {
    handleMenuClose();
    if (!selectedCompanyId) return;
    if (window.confirm('Are you sure you want to delete this company?')) {
      try {
        await companyAPI.delete(selectedCompanyId);
        fetchCompanies();
      } catch (error) {
        console.error('Failed to delete company');
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

  const filteredCompanies = companies.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(term) ||
      (c.description || '').toLowerCase().includes(term)
    );
  });

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

  return (
    <div className="max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
          <p className="text-slate-500 mt-1">Add company name and full description.</p>
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

              <h3 className="text-lg font-bold text-slate-900 group-hover:text-[#6d5dfc] transition-colors">
                {company.name}
              </h3>
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
          <p className="text-slate-500">Try adjusting your search terms</p>
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
        <MenuItem onClick={() => handleOpenModal(companies.find((c) => c.id === selectedCompanyId))}>Edit Company</MenuItem>
        <MenuItem onClick={handleDelete} className="text-red-600">Delete</MenuItem>
      </Menu>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle className="font-bold border-b border-slate-200">{editingId ? 'Edit Company' : 'Add New Company'}</DialogTitle>
        <DialogContent className="pt-6">
          {modalLoading && (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6d5dfc]"></div>
            </div>
          )}
          {!modalLoading && (
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
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
              InputProps={{
                sx: {
                  '& textarea': {
                    fontSize: '1.08rem',
                    lineHeight: 1.8,
                    fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif',
                  },
                },
              }}
              InputLabelProps={{
                sx: {
                  fontSize: '1rem',
                  fontWeight: 600,
                },
              }}
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
                    <label className="text-sm font-medium text-slate-500">Website</label>
                    <p className="text-slate-900">{selectedCompany?.website || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Parent Org</label>
                    <p className="text-slate-900">{selectedCompany?.parent_org || 'N/A'}</p>
                  </div>
                  <div>
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
                    {selectedCompany.selection_process.steps.map((step, idx) => (
                      <li key={`${selectedCompany.id}-step-${idx}`} className="text-sm">{step}</li>
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



