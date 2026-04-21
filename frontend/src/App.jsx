import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/LoginPage';
import Register from './components/Auth/RegisterPage';
import AdminDashboard from './components/Admin/AdminDashboard';
import StudentDashboard from './components/Student/StudentDashboard';
import JuniorDashboard from './components/Junior/JuniorDashboard';
import ProtectedRoute from './components/Protected/ProtectedRoute';

function App() {
  console.log('🚀 App Component is rendering...');
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} /> 
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/companies" element={<AdminDashboard />} />
              <Route path="/admin/companies/:batch" element={<AdminDashboard />} />
              <Route path="/admin/drives" element={<AdminDashboard />} />
              <Route path="/admin/drives/:batch" element={<AdminDashboard />} />
              <Route path="/admin/experiences" element={<AdminDashboard />} />
              <Route path="/admin/approvals" element={<AdminDashboard />} />
              <Route path="/admin/analytics" element={<AdminDashboard />} />
              <Route path="/admin/experience-access" element={<AdminDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['junior']} />}>
              <Route path="/junior/dashboard" element={<JuniorDashboard />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
