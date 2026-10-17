import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import FileNestLogo from './FileNestLogo';
import {
  checkAdminStatus,
  isAdminRegistered,
  registerAdminAccount,
  loginAdmin,
  AdminSession
} from '../lib/adminAuth';

interface AdminAuthProps {
  onLoginSuccess: (session: AdminSession) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminAuth({ onLoginSuccess, notify }: AdminAuthProps) {
  const [isRegistered, setIsRegistered] = useState<boolean>(() => isAdminRegistered());
  const [isCheckingStatus, setIsCheckingStatus] = useState<boolean>(true);

  // Form states for Admin Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form states for Initial Admin Setup (only visible when 0 admins exist)
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check server status on mount to ensure single-admin status is accurate across devices
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        const status = await checkAdminStatus();
        if (isMounted) {
          setIsRegistered(status.isRegistered);
        }
      } catch {
        // Fallback to local
      } finally {
        if (isMounted) {
          setIsCheckingStatus(false);
        }
      }
    };
    fetchStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!loginIdentifier.trim() || !loginPassword) {
      setErrorMsg('Please enter both your admin email/username and password.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await loginAdmin({
        identifier: loginIdentifier,
        password: loginPassword
      });
      notify(`Welcome back, ${session.fullName || session.username}!`, 'success');
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid administrator credentials. Access denied.');
      notify(err?.message || 'Login failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your entry.');
      return;
    }

    setIsLoading(true);
    try {
      const session = await registerAdminAccount({
        fullName: regFullName,
        username: regUsername,
        email: regEmail,
        password: regPassword
      });
      setIsRegistered(true);
      notify('Master Admin account created! Public registration is now permanently locked.', 'success');
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to setup administrator.');
      notify(err?.message || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingStatus) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="inline-flex p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl mb-4 animate-pulse">
          <FileNestLogo className="w-10 h-10" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Securing Administrator Portal...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
      {/* Header Card */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 rounded-2xl shadow-xs mb-4">
          <FileNestLogo className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <span>FileNest Admin Portal</span>
          <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
          {isRegistered
            ? 'Restricted Access • Authorized Single Administrator Only'
            : 'Initial Setup • Configure the Single Master Administrator'}
        </p>
      </div>

      {/* Security Status Banner */}
      <div className="mb-6 p-4 rounded-2xl border transition-all duration-200 shadow-xs bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                Single-Admin Protection
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                {isRegistered ? 'Registration Locked' : 'Initial Setup'}
              </span>
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px] sm:text-xs">
              Access is restricted strictly to the designated administrator (<strong>krish kumar jaiswal</strong>). Multi-entry or foreign accounts are strictly blocked.
            </p>
          </div>
        </div>
      </div>

      {/* Main Auth Form Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8">
        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isRegistered ? (
          /* ========================================================== */
          /* SINGLE ADMIN SIGN IN FORM (NO MULTI-ADMIN TABS)           */
          /* ========================================================== */
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email or Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="krish or krishkumarjaiswal2081@gmail.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your administrator password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !loginIdentifier.trim() || !loginPassword}
                className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Authenticating Admin...</span>
                ) : (
                  <>
                    <span>Sign In to Admin Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="pt-3 text-center border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
                Strict single-administrator security policy active. Public registration is locked to protect portal integrity.
              </p>
            </div>
          </form>
        ) : (
          /* ========================================================== */
          /* INITIAL MASTER ADMIN SETUP (ONLY ON EMPTY DATABASE)        */
          /* ========================================================== */
          <form onSubmit={handleInitialRegister} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#2563EB]" />
              <p className="leading-relaxed">
                You are configuring the <strong>only administrator</strong> for FileNest. After setup, registration will be permanently closed.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="e.g. Master Administrator"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="admin@filenest.com"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Username *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Creating Master Admin...</span>
                ) : (
                  <>
                    <span>Create Single Admin &amp; Lock Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
