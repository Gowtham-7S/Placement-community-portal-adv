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
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyAPI.getAll({ limit: 100 });
      setCompanies(response.data.data || []);
    } catch (error) {
      console.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (company = null) => {
    handleMenuClose();
    if (company) {
      setFormData({
        name: company.name || '',
        description: company.description || '',
      });
      setEditingId(company.id);
    } else {
      setFormData({ name: '', description: '' });
      setEditingId(null);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      if (editingId) {
        await companyAPI.update(editingId, payload);
      } else {
        await companyAPI.create(payload);
      }

      setModalOpen(false);
      fetchCompanies();
    } catch (error) {
      const msg = error.response?.data?.errors?.map((x) => x.message).join(', ') || 'Operation failed';
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

  const handleCardClick = (company) => {
    setSelectedCompany(company);
    setDetailsOpen(true);
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
      'bg-primary/20 text-primary',
      'bg-emerald-100 text-emerald-700',
      'bg-amber-100 text-amber-700',
      'bg-cyan-100 text-cyan-700',
      'bg-rose-100 text-rose-700',
    ];
    return colors[letter.charCodeAt(0) % colors.length];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
          <p className="text-gray-500 mt-1">Add company name and full description.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors w-full md:w-auto justify-center"
        >
          <AddIcon fontSize="small" />
          Add Company
        </button>
      </div>

      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm mb-8 flex items-center gap-2">
        <SearchIcon className="text-gray-400 ml-2" />
        <input
          type="text"
          placeholder="Search by company name or description..."
          className="flex-1 py-2 outline-none text-gray-700 placeholder-gray-400"
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
            className="text-left bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group relative"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${getInitialColor(company.name?.[0] || 'C')}`}>
                  {(company.name?.[0] || 'C').toUpperCase()}
                </div>
                <button
                  onClick={(e) => handleMenuClick(e, company.id)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <MoreVertIcon />
                </button>
              </div>

              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {company.name}
              </h3>
              <p
                className="text-[1.05rem] text-gray-600 mt-2 line-clamp-4 whitespace-pre-wrap leading-8"
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
          <h3 className="text-lg font-medium text-gray-900">No companies found</h3>
          <p className="text-gray-500">Try adjusting your search terms</p>
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
        <DialogTitle className="font-bold border-b border-gray-100">{editingId ? 'Edit Company' : 'Add New Company'}</DialogTitle>
        <DialogContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
              label="Description"
              name="description"
              multiline
              rows={8}
              fullWidth
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              required
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
          </form>
        </DialogContent>
        <DialogActions className="p-4 border-t border-gray-100">
          <Button onClick={() => setModalOpen(false)} className="text-gray-500">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" className="bg-indigo-600 hover:bg-indigo-700 shadow-none">
            {editingId ? 'Update Company' : 'Add Company'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle className="font-bold border-b border-gray-100">
          {selectedCompany?.name || 'Company Details'}
        </DialogTitle>
        <DialogContent className="pt-6">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Description</p>
            <p
              className="text-[1.08rem] text-slate-800 whitespace-pre-wrap leading-8"
              style={{ fontFamily: 'Inter, "Segoe UI", Roboto, Arial, sans-serif' }}
            >
              {selectedCompany?.description || 'No description provided.'}
            </p>
          </div>
        </DialogContent>
        <DialogActions className="p-4 border-t border-gray-100">
          <Button onClick={() => setDetailsOpen(false)} variant="contained" className="bg-indigo-600 hover:bg-indigo-700 shadow-none">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CompanyManagement;
