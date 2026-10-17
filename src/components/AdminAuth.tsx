import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Info,
  RotateCcw,
  UserPlus,
  LogIn
} from 'lucide-react';
import FileNestLogo from './FileNestLogo';
import {
  isAdminRegistered,
  getRegisteredAdminAccounts,
  registerAdminAccount,
  loginAdmin,
  resetAllAdminAccounts,
  AdminSession
} from '../lib/adminAuth';

interface AdminAuthProps {
  onLoginSuccess: (session: AdminSession) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminAuth({ onLoginSuccess, notify }: AdminAuthProps) {
  const [registeredAccounts, setRegisteredAccounts] = useState(() => getRegisteredAdminAccounts());
  const isRegistered = registeredAccounts.length > 0;

  // Tabs: 'login' | 'register' (Both always accessible)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Form states for Register
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Form states for Admin Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Reset confirmation modal state
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync registered accounts list from local storage and cloud server
  const refreshAccounts = async () => {
    const local = getRegisteredAdminAccounts();
    setRegisteredAccounts(local);

    try {
      const res = await fetch('/api/admin/accounts');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.accounts) && data.accounts.length > 0) {
          const map = new Map();
          local.forEach((a) => map.set(a.email.toLowerCase(), a));
          data.accounts.forEach((a: any) => {
            if (a.email) {
              map.set(a.email.toLowerCase(), a);
            }
          });
          setRegisteredAccounts(Array.from(map.values()));
        }
      }
    } catch {
      // offline fallback
    }
  };

  useEffect(() => {
    refreshAccounts();
  }, [activeTab]);

  const handleRegister = async (e: React.FormEvent) => {
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
      refreshAccounts();
      notify(`Admin account (${session.email}) created & signed in successfully!`, 'success');
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to register administrator account.');
      notify(err?.message || 'Registration failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsLoading(true);
    try {
      const session = await loginAdmin({
        identifier: loginIdentifier,
        password: loginPassword
      });
      notify(`Welcome back, ${session.fullName || session.username}!`, 'success');
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid credentials.');
      notify(err?.message || 'Login failed.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetAllAdminAccounts();
      refreshAccounts();
      setShowResetModal(false);
      setActiveTab('register');
      setLoginIdentifier('');
      setLoginPassword('');
      setErrorMsg(null);
      notify('All admin credentials have been reset. You can now register fresh admin credentials.', 'info');
    } catch (err: any) {
      notify(err?.message || 'Could not reset accounts', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-16">
      {/* Header Card */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3.5 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 rounded-2xl shadow-xs mb-4">
          <FileNestLogo className="w-10 h-10" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
          <span>FileNest Admin Portal</span>
          <ShieldCheck className="w-6 h-6 text-[#2563EB]" />
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Sign in or register an administrator account to manage curriculum subjects, files, and academic resources.
        </p>
      </div>

      {/* Admin Status & Multi-Account Badge */}
      <div className="mb-6 p-4 rounded-2xl border transition-all duration-200 shadow-xs bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  Administrator Access
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  {registeredAccounts.length} Registered
                </span>
              </div>
              <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                Log in with your existing admin email and password, or use the <strong>Register Another Admin</strong> tab to add a new admin email.
              </p>
            </div>
          </div>

          {isRegistered && (
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="text-[11px] font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Reset all admin accounts and start fresh"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Credentials</span>
            </button>
          )}
        </div>

        {/* Existing Accounts Quick Fill */}
        {registeredAccounts.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Registered Accounts:
            </span>
            {registeredAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setLoginIdentifier(acc.email);
                  setActiveTab('login');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2563EB] hover:text-[#2563EB] transition-colors cursor-pointer"
                title={`Click to fill ${acc.email}`}
              >
                <Mail className="w-3 h-3 text-slate-400" />
                <span>{acc.email}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab Switcher - Both Tabs Always Active */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`py-3.5 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'login'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Admin Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`py-3.5 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'register'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Another Admin</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="m-6 mb-0 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 sm:p-8">
          {activeTab === 'login' ? (
            /* ADMIN LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Email or Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="Enter your admin email or username"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter your admin password"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !loginIdentifier.trim() || !loginPassword}
                  className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <span>Sign In to Admin Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Want to log in with another email?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMsg(null);
                    }}
                    className="text-[#2563EB] dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    Register New Admin Email
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* REGISTER ANOTHER ADMIN FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#2563EB] dark:text-blue-400" />
                <div className="space-y-0.5">
                  <p className="font-bold">Register Admin Credentials</p>
                  <p>
                    Enter your email and chosen password below. You will immediately have full administrator access to manage subjects, notes, and academic files.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name / Display Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="e.g. Lead Administrator"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Admin Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. admin or yourname"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Admin Email *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Password (Min 6 chars) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !regEmail || !regPassword || !regUsername}
                  className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Registering Admin Account...</span>
                  ) : (
                    <>
                      <span>Register &amp; Sign In as Admin</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMsg(null);
                    }}
                    className="text-[#2563EB] dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                  >
                    Go to Admin Sign In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Reset Admin Accounts?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              This will clear currently stored administrator accounts so you can register fresh credentials with your new email and password.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset Credentials'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
