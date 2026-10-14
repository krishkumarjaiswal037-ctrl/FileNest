import React, { useState } from 'react';
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
  Info
} from 'lucide-react';
import FileNestLogo from './FileNestLogo';
import {
  isAdminRegistered,
  getRegisteredAdminInfo,
  registerAdminAccount,
  loginAdmin,
  AdminSession
} from '../lib/adminAuth';

interface AdminAuthProps {
  onLoginSuccess: (session: AdminSession) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function AdminAuth({ onLoginSuccess, notify }: AdminAuthProps) {
  const isRegistered = isAdminRegistered();
  const registeredInfo = isRegistered ? getRegisteredAdminInfo() : null;

  // If already registered, default to login tab; otherwise default to claim slot
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    isRegistered ? 'login' : 'register'
  );

  // Form states for Claim Admin Slot (Register)
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Form states for Admin Login
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      notify('Administrator account claimed successfully! Welcome to FileNest Admin.', 'success');
      onLoginSuccess(session);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to initialize administrator account.');
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
          Central management console for inspecting, cataloging, and managing all academic
          documents, PDFs, notes, and photos across semesters.
        </p>
      </div>

      {/* Single Slot Banner / Badge */}
      <div className="mb-6 p-4 rounded-xl border transition-all duration-200 shadow-xs bg-slate-50 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800">
        <div className="flex items-start gap-3">
          {isRegistered ? (
            <>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    Admin Slot: Occupied
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                    Active
                  </span>
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  The single authorized administrator slot for FileNest has been claimed by{' '}
                  <strong className="text-slate-900 dark:text-slate-200">
                    {registeredInfo?.username || 'admin'}
                  </strong>
                  . Further registrations are locked.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm">
                    1 Single Admin Slot Available
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                    Unclaimed
                  </span>
                </div>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  You can claim this master administrator slot right now. Once created, nobody
                  else will be able to register an admin account on this website.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tab Switcher if registration is still open */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`py-3.5 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'login'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400 bg-white dark:bg-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Admin Sign In</span>
          </button>

          <button
            type="button"
            disabled={isRegistered}
            onClick={() => {
              if (!isRegistered) {
                setActiveTab('register');
                setErrorMsg(null);
              }
            }}
            className={`py-3.5 text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 border-b-2 ${
              activeTab === 'register'
                ? 'border-[#2563EB] text-[#2563EB] dark:text-blue-400 bg-white dark:bg-slate-900'
                : isRegistered
                ? 'border-transparent text-slate-400 dark:text-slate-600 cursor-not-allowed line-through'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              Claim Single Slot {isRegistered && '(Locked)'}
            </span>
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
                  Admin Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. admin or techcodes83@gmail.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
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
                    placeholder="Enter your admin secret key / password"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <span>Enter Admin Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {!isRegistered && (
                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Haven&apos;t created your admin slot yet?{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-[#2563EB] dark:text-blue-400 font-semibold hover:underline"
                    >
                      Claim the Single Slot
                    </button>
                  </p>
                </div>
              )}
            </form>
          ) : (
            /* CLAIM SINGLE ADMIN SLOT FORM */
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <span>
                  <strong>One-Time Exclusive Provision:</strong> This will register the master
                  administrator identity. Once submitted, registration closes permanently and
                  cannot be claimed by anyone else.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name / Display Name
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
                    placeholder="e.g. Master Administrator"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Admin Username
                  </label>
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="e.g. admin"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Email
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
                      placeholder="e.g. techcodes83@gmail.com"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Master Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span>Securing Admin Account...</span>
                  ) : (
                    <>
                      <span>Claim Master Admin Slot &amp; Lock Further Registrations</span>
                      <ShieldCheck className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
