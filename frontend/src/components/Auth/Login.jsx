import React, { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { AuthContext } from '../../context/AuthContext';
import {
  Mail as MailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Warning as WarningIcon,
} from '@mui/icons-material';

const Login = () => {
  const { login, googleLogin, error: authError } = useContext(AuthContext);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [googleToken, setGoogleToken] = useState('');
  const [availableRoles, setAvailableRoles] = useState([]);
  const [showRolePicker, setShowRolePicker] = useState(false);

  const navigateByRole = (role) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'student') navigate('/student/dashboard');
    else navigate('/junior/dashboard');
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const user = await login(data.email, data.password);
      if (user) {
        navigateByRole(user.active_role || user.role);
      }
    } catch (err) {
      console.error('Login failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    const idToken = credentialResponse?.credential;
    if (!idToken) return;

    setGoogleLoading(true);
    try {
      const result = await googleLogin(idToken);
      if (result?.roleSelectionRequired) {
        setGoogleToken(idToken);
        setAvailableRoles(result.availableRoles || []);
        setShowRolePicker(true);
      } else if (result?.user) {
        navigateByRole(result.user.active_role || result.user.role);
      }
    } catch (err) {
      console.error('Google login failed', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRoleSelection = async (role) => {
    setGoogleLoading(true);
    try {
      const result = await googleLogin(googleToken, role);
      if (result?.user) {
        setShowRolePicker(false);
        navigateByRole(result.user.active_role || result.user.role);
      }
    } catch (err) {
      console.error('Role-specific Google login failed', err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 bg-[#f8fafc] rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="hidden lg:flex items-center justify-center p-10 bg-[#f8fafc]">
            <div className="w-full max-w-xl">
              <img src="/Login_image.jpg" alt="Placement Portal" className="w-full h-auto object-contain" />
            </div>
          </div>

          <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-8 text-center">
                <h1 className="text-5xl font-extrabold text-[#0f172a] tracking-tight">Welcome Back</h1>
                <p className="text-[#334e74] mt-2">Sign in to your Placement Portal account</p>
              </div>

              {authError && (
                <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <WarningIcon className="text-red-600 flex-shrink-0 text-lg" style={{ marginTop: '2px' }} />
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-[#0f172a] mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <MailIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: '20px' }} />
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Please enter a valid email',
                        },
                      })}
                      className="w-full pl-11 pr-4 py-3 bg-[#e8eef7] border border-[#d7deea] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-[#0f172a] mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: '20px' }} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters',
                        },
                      })}
                      className="w-full pl-11 pr-12 py-3 bg-[#e8eef7] border border-[#d7deea] rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <VisibilityOff style={{ fontSize: '20px' }} /> : <Visibility style={{ fontSize: '20px' }} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    Remember me
                  </label>
                  <a href="#!" className="text-indigo-600 hover:text-indigo-700 font-medium">Forgot password?</a>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl text-white font-semibold bg-gradient-to-r from-[#4f46e5] to-[#6366f1] hover:from-[#4338ca] hover:to-[#4f46e5] disabled:from-gray-400 disabled:to-gray-400 transition shadow-md"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-gray-300" />
                <span className="text-sm text-gray-500 font-medium">OR</span>
                <div className="h-px flex-1 bg-gray-300" />
              </div>

              <div className="flex justify-center">
                <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => console.error('Google Sign-In failed')} useOneTap={false} text="signin_with" />
              </div>
              {googleLoading && <p className="text-center text-sm text-gray-500 mt-2">Processing Google sign in...</p>}

              <p className="text-center text-sm text-slate-600 mt-6">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">Sign up here</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {showRolePicker && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Choose Portal</h3>
            <p className="text-sm text-slate-600 mb-4">This Google account can access multiple portals.</p>
            <div className="space-y-2">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleSelection(role)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium capitalize"
                >
                  Continue as {role}
                </button>
              ))}
            </div>
            <button onClick={() => setShowRolePicker(false)} className="w-full mt-4 text-sm text-slate-500 hover:text-slate-700">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
