import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { TextField, Button, Paper, Typography, Alert, Box, MenuItem } from '@mui/material';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    phone: '',
    department: '',
    batch_year: new Date().getFullYear(),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Smart Role Detection based on email
  useEffect(() => {
    const email = formData.email;
    if (email) {
      if (email.includes('@placement')) {
        setFormData(prev => ({ ...prev, role: 'admin' }));
      } else if (/\.xx\d{2}/.test(email)) {
        // Matches patterns like .xx23, .xx24 inside the email
        setFormData(prev => ({ ...prev, role: 'student' }));
      }
    }
  }, [formData.email]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'batch_year' ? parseInt(value) : value,
    }));
  };

  const validateForm = () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = await register({
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || undefined,
        department: formData.department || undefined,
        batch_year: formData.batch_year || undefined,
      });

      if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'student') navigate('/student/dashboard');
      else navigate('/junior/dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Paper elevation={3} className="p-8 w-full max-w-lg">
        <Box className="text-center mb-6">
          <div className="text-4xl mb-2">📊</div>
          <Typography variant="h5" component="h1" className="font-bold">
            Register
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Create your account
          </Typography>
        </Box>

        {error && <Alert severity="error" className="mb-4" onClose={() => setError('')}>{error}</Alert>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <TextField
              label="First Name"
              name="first_name"
              fullWidth
              value={formData.first_name}
              onChange={handleChange}
              required
            />
            <TextField
              label="Last Name"
              name="last_name"
              fullWidth
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <TextField
            label="Email"
            name="email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={handleChange}
            required
          />

          <TextField
            label="Password"
            name="password"
            type="password"
            fullWidth
            value={formData.password}
            onChange={handleChange}
            helperText="Minimum 8 characters"
            required
          />

          <TextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            fullWidth
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <TextField
              select
              label="Role"
              name="role"
              fullWidth
              value={formData.role}
              onChange={handleChange}
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="junior">Junior</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>

            <TextField
              label="Batch Year"
              name="batch_year"
              type="number"
              fullWidth
              value={formData.batch_year}
              onChange={handleChange}
            />
          </div>

          <TextField
            label="Department (Optional)"
            name="department"
            fullWidth
            value={formData.department}
            onChange={handleChange}
          />

          <TextField
            label="Phone (Optional)"
            name="phone"
            type="tel"
            fullWidth
            value={formData.phone}
            onChange={handleChange}
          />

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            size="large"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-medium">
            Login here
          </Link>
        </div>
      </Paper>
    </div>
  );
};

export default RegisterPage;
