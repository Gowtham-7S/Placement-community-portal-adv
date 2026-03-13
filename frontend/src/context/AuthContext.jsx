import React, { createContext, useState, useEffect } from 'react';
import api from '../api/axiosConfig';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeRole, setActiveRole] = useState(localStorage.getItem('activeRole'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const setSession = (sessionToken, sessionUser) => {
    localStorage.setItem('token', sessionToken);
    setToken(sessionToken);

    const role = sessionUser.active_role || sessionUser.role;
    if (role) {
      localStorage.setItem('activeRole', role);
      setActiveRole(role);
    }

    setUser(sessionUser);
  };

  // Check if user is logged in on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          // Verify token and get user details
          const res = await api.get('/auth/me');
          const loadedUser = res.data.data;
          setUser(loadedUser);
          if (loadedUser?.active_role || loadedUser?.role) {
            const role = loadedUser.active_role || loadedUser.role;
            setActiveRole(role);
            localStorage.setItem('activeRole', role);
          }
        } catch (err) {
          console.error('Failed to load user', err);
          localStorage.removeItem('token');
          localStorage.removeItem('activeRole');
          setToken(null);
          setActiveRole(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      setSession(token, user);
      setLoading(false);
      return user; // Return user for redirection logic in component
    } catch (err) {
      setLoading(false);
      let msg = err.response?.data?.message;
      if (!msg && err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        msg = err.response.data.errors.map(e => e.msg).join(', ');
      }
      msg = msg || 'Login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const googleLogin = async (idToken, preferredRole = null) => {
    setLoading(true);
    setError(null);
    try {
      const payload = { id_token: idToken };
      if (preferredRole) payload.preferred_role = preferredRole;

      const res = await api.post('/auth/google', payload);
      const { token: sessionToken, user: sessionUser } = res.data;
      setSession(sessionToken, sessionUser);
      setLoading(false);
      return { roleSelectionRequired: false, user: sessionUser };
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.code === 'ROLE_SELECTION_REQUIRED') {
        setLoading(false);
        return {
          roleSelectionRequired: true,
          availableRoles: resp.available_roles || [],
        };
      }

      setLoading(false);
      let msg = resp?.message;
      if (!msg && resp?.errors && Array.isArray(resp.errors)) {
        msg = resp.errors.map(e => e.msg).join(', ');
      }
      msg = msg || 'Google login failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/register', userData);
      const { token, user } = res.data;
      setSession(token, user);
      setLoading(false);
      return user;
    } catch (err) {
      setLoading(false);
      let msg = err.response?.data?.message;
      if (!msg && err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        msg = err.response.data.errors.map(e => e.msg).join(', ');
      }
      msg = msg || 'Registration failed';
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('activeRole');
    setToken(null);
    setActiveRole(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, activeRole, loading, error, login, googleLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
