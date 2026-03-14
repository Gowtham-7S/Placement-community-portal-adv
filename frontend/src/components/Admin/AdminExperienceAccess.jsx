import React, { useEffect, useState } from 'react';
import {
  PersonAddAlt as PersonAddAltIcon,
  DeleteOutline as DeleteOutlineIcon,
  Search as SearchIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosConfig';

const AdminExperienceAccess = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const [importMode, setImportMode] = useState('selected_last_round');
  const [excelFile, setExcelFile] = useState(null);
  const [form, setForm] = useState({
    email: '',
    roll_number: '',
    student_name: '',
    company_name: '',
  });

  const fetchAccessList = async (searchTerm = '') => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.get('/admin/experience-access', {
        params: searchTerm ? { search: searchTerm } : {},
      });
      setItems(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load access list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessList();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const email = (form.email || '').toLowerCase().trim();
      const rollNumber = (form.roll_number || '').trim();
      const studentName = (form.student_name || '').trim();
      const companyName = (form.company_name || '').trim();
      const isBasicEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const isBitsathy = email.endsWith('@bitsathy.ac.in');

      if (!email || !isBasicEmail || !isBitsathy) {
        setError('Use a valid bitsathy.ac.in email address');
        setSubmitting(false);
        return;
      }
      if (!rollNumber) {
        setError('Roll number is required');
        setSubmitting(false);
        return;
      }

      await axiosInstance.post('/admin/experience-access', {
        email,
        roll_number: rollNumber,
        student_name: studentName,
        company_name: companyName,
      });
      setSuccess('Access saved successfully');
      setForm({ email: '', roll_number: '', student_name: '', company_name: '' });
      fetchAccessList(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save access');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id) => {
    setError('');
    setSuccess('');
    try {
      await axiosInstance.delete(`/admin/experience-access/${id}`);
      setSuccess('Access removed successfully');
      fetchAccessList(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove access');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAccessList(search.trim());
  };

  const onImportExcel = async (e) => {
    e.preventDefault();
    if (!excelFile) {
      setError('Please choose an Excel file first');
      return;
    }

    setImporting(true);
    setError('');
    setSuccess('');
    setImportSummary(null);
    try {
      const formData = new FormData();
      formData.append('file', excelFile);
      formData.append('mode', importMode);

      const res = await axiosInstance.post('/admin/experience-access/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setImportSummary(res.data.data || null);
      setSuccess('Excel imported successfully');
      fetchAccessList(search);
    } catch (err) {
      setError(err.response?.data?.message || 'Excel import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <h2 className="text-xl font-bold text-slate-900">Experience Access Control</h2>
        <p className="text-sm text-slate-500 mt-1">
          Only listed students can submit interview experiences.
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <PersonAddAltIcon fontSize="small" className="text-[#6d5dfc]" />
          <h3 className="text-base font-semibold text-slate-800">Add Student Access</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="email"
            value={form.email}
            onChange={(e) => {
              const next = e.target.value.toLowerCase().trim().replace(/\s+/g, '');
              setForm((prev) => ({ ...prev, email: next }));
            }}
            placeholder="Email (e.g. user@bitsathy.ac.in)"
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#6d5dfc]"
            required
          />
          <input
            type="text"
            value={form.roll_number}
            onChange={(e) => setForm((prev) => ({ ...prev, roll_number: e.target.value }))}
            placeholder="Roll Number"
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#6d5dfc]"
            required
          />
          <input
            type="text"
            value={form.student_name}
            onChange={(e) => setForm((prev) => ({ ...prev, student_name: e.target.value }))}
            placeholder="Student Name"
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#6d5dfc]"
          />
          <input
            type="text"
            value={form.company_name}
            onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
            placeholder="Company Name"
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#6d5dfc]"
          />
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 rounded-lg text-white font-medium md:col-span-4 ${submitting ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#6d5dfc] hover:bg-[#5b47d6]'}`}
          >
            {submitting ? 'Saving...' : 'Save Access'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-3">{success}</p>}
      </form>

      <form onSubmit={onImportExcel} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <UploadFileIcon fontSize="small" className="text-[#6d5dfc]" />
          <h3 className="text-base font-semibold text-slate-800">Import From Excel</h3>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Expected columns: Roll Number, Email (bitsathy.ac.in), Result, Rounds Attended, Total Rounds (or similar names).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />

          <select
            value={importMode}
            onChange={(e) => setImportMode(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#6d5dfc]"
          >
            <option value="selected_last_round">Selected + Last Round (Recommended)</option>
            <option value="selected_only">Selected/Placed Only</option>
          </select>

          <button
            type="submit"
            disabled={importing}
            className={`px-4 py-2 rounded-lg text-white font-medium ${importing ? 'bg-slate-300 cursor-not-allowed' : 'bg-[#6d5dfc] hover:bg-[#5b47d6]'}`}
          >
            {importing ? 'Importing...' : 'Import Excel'}
          </button>
        </div>

        {importSummary && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
            <p className="font-medium text-slate-800">Import Summary</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2 text-xs text-slate-700">
              <div>Total rows: {importSummary.totalRows}</div>
              <div>Eligible: {importSummary.eligibleRows}</div>
              <div>Imported: {importSummary.importedCount}</div>
              <div>Skipped: {importSummary.skippedCount}</div>
              <div>Mode: {importSummary.mode}</div>
            </div>
            {Array.isArray(importSummary.skippedRows) && importSummary.skippedRows.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-slate-700 mb-1">Sample skipped rows:</p>
                <ul className="text-xs text-slate-600 list-disc ml-4">
                  {importSummary.skippedRows.slice(0, 5).map((row) => (
                    <li key={`${row.row}-${row.reason}`}>Row {row.row}: {row.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </form>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center gap-3">
          <h3 className="text-base font-semibold text-slate-800">Allowed Students</h3>
          <form onSubmit={handleSearch} className="md:ml-auto flex items-center gap-2">
            <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2">
              <SearchIcon fontSize="small" className="text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email / roll number / name"
                className="outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-2 text-sm bg-[#6d5dfc] text-white rounded-lg hover:bg-[#5b47d6]"
            >
              Search
            </button>
          </form>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No students added yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Register Number</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Added On</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{item.email || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{item.roll_number || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{item.student_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-700">{item.company_name || '-'}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onDelete(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminExperienceAccess;




