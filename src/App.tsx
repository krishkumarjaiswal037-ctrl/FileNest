import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Copy, Check, X, Database } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PreviewModal from './components/PreviewModal';
import ToastContainer from './components/Toast';
import Home from './pages/Home';
import Upload from './pages/Upload';
import Library from './pages/Library';
import Tools from './pages/Tools';
import About from './pages/About';
import Admin from './pages/Admin';
import { getSubjectsBySemester } from './data/subjects';
import { getAdminSession } from './lib/adminAuth';
import {
  fetchAllFiles,
  toggleFavoriteFile,
  updateFileDetails,
  deleteStudyFile,
  recordRecentlyViewed,
  downloadFile,
  getFileDataUrlFromIDB,
  SUPABASE_SETUP_SQL,
  isSupabaseConfigured,
  checkSupabaseStatus,
  SUPABASE_PROJECT_ID,
  syncLocalFilesToSupabase
} from './lib/supabaseService';

export type ThemeMode = 'white' | 'darkblue' | 'skyblue' | 'orange';

export default function App() {
  // Admin Session state (guards Delete & Edit controls)
  const [adminSession, setAdminSession] = useState(() => getAdminSession());
  const isAdmin = Boolean(adminSession);

  // 4-Color Theme state: White, Dark Blue, Sky Blue, Orange
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('filenest_theme') || localStorage.getItem('studyvault_theme');
      if (saved === 'white' || saved === 'darkblue' || saved === 'skyblue' || saved === 'orange') {
        return saved as ThemeMode;
      }
      return localStorage.getItem('studyvault_dark_mode') === 'true' ? 'darkblue' : 'white';
    } catch {
      return 'white';
    }
  });

  // Files & Subjects state
  const [files, setFiles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [subjectsBySemester, setSubjectsBySemester] = useState(() =>
    getSubjectsBySemester()
  );

  // Supabase Backend Status state
  const [supabaseStatus, setSupabaseStatus] = useState<{
    connected: boolean;
    tableReady: boolean;
    count: number;
    message?: string;
  } | null>(null);

  // Active Preview Modal File
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  // Supabase SQL Setup Modal
  const [sqlModalOpen, setSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<
    Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
  >([]);

  const notify = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4500);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Manual Trigger to sync all files directly into Supabase Table Editor & Storage Bucket
  const handleManualSyncToSupabase = useCallback(async () => {
    setIsSyncing(true);
    notify('Syncing all files with Supabase Table Editor & Storage bucket...', 'info');
    try {
      const syncRes = await syncLocalFilesToSupabase();
      const status = await checkSupabaseStatus();
      setSupabaseStatus(status);
      const data = await fetchAllFiles();
      setFiles(data);

      if (syncRes.synced > 0) {
        notify(
          `Successfully pushed ${syncRes.synced} document(s) directly into your Supabase "files" table & "study-files" bucket!`,
          'success'
        );
      } else if (syncRes.total === 0) {
        notify(
          `All documents are already live in your Supabase project table (${status.count} rows).`,
          'success'
        );
      } else {
        notify(
          syncRes.error || 'All local documents are synchronized with Supabase.',
          'info'
        );
      }
    } catch (err: any) {
      notify(err?.message || 'Failed to sync with Supabase', 'error');
    } finally {
      setIsSyncing(false);
    }
  }, [notify]);

  // Apply 4-Color Theme (White, Dark Blue, Sky Blue, Orange) on <html>
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'darkblue') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('filenest_theme', theme);
      localStorage.setItem('studyvault_theme', theme);
      localStorage.setItem('studyvault_dark_mode', String(theme === 'darkblue'));
    } catch {
      // ignore
    }
  }, [theme]);

  // Initial load of files from Supabase / Persistent Vault + Auto-Sync to Supabase
  useEffect(() => {
    let mounted = true;
    async function load() {
      setIsLoading(true);
      try {
        const [data, status] = await Promise.all([
          fetchAllFiles(),
          checkSupabaseStatus()
        ]);

        if (mounted) {
          setFiles(data);
          setSupabaseStatus(status);
        }

        // Automatically sync any offline/locally uploaded documents to Supabase Table Editor
        syncLocalFilesToSupabase().then(async (syncRes) => {
          if (mounted && syncRes.synced > 0) {
            notify(`Synced ${syncRes.synced} uploaded document(s) directly into your Supabase table editor!`, 'success');
            const fresh = await fetchAllFiles();
            const freshStatus = await checkSupabaseStatus();
            if (mounted) {
              setFiles(fresh);
              setSupabaseStatus(freshStatus);
            }
          }
        }).catch(() => {});
      } catch (err: any) {
        if (mounted) notify(err?.message || 'Failed to load files', 'error');
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [notify]);

  // Handlers for File Operations
  const handleUploadSuccess = (newlyUploaded: any[]) => {
    setFiles((prev) => [...newlyUploaded, ...prev]);
  };

  const handleOpenPreview = async (file: any) => {
    recordRecentlyViewed(file.id);
    let target = file;
    if (!file.file_url || file.file_url === 'idb://stored') {
      const stored = await getFileDataUrlFromIDB(file.id);
      if (stored) {
        target = { ...file, file_url: stored };
      }
    }
    setPreviewFile(target);
  };

  const handleDownload = async (file: any) => {
    try {
      notify(`Downloading "${file.title}"...`, 'info');
      await downloadFile(file);
      notify(`Download ready: "${file.title}"`, 'success');
    } catch (err: any) {
      console.error('Download error:', err);
      notify(err?.message || 'Could not download this file.', 'error');
    }
  };

  const handleToggleFavorite = async (file: any) => {
    try {
      const updated = await toggleFavoriteFile(file.id, file.is_favorite);
      if (updated) {
        setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, is_favorite: updated.is_favorite } : f)));
        if (previewFile && previewFile.id === file.id) {
          setPreviewFile((prev: any) =>
            prev ? { ...prev, is_favorite: updated.is_favorite } : null
          );
        }
        notify(
          updated.is_favorite
            ? `Starred "${file.title}" in Favorites.`
            : `Removed "${file.title}" from Favorites.`,
          'success'
        );
      }
    } catch (err: any) {
      notify(err?.message || 'Failed to update favorite status', 'error');
    }
  };

  // Synchronize admin session when logged in or out
  useEffect(() => {
    const handleSessionChange = () => {
      setAdminSession(getAdminSession());
    };
    window.addEventListener('filenest_admin_session_change', handleSessionChange);
    window.addEventListener('storage', handleSessionChange);
    return () => {
      window.removeEventListener('filenest_admin_session_change', handleSessionChange);
      window.removeEventListener('storage', handleSessionChange);
    };
  }, []);

  const handleRenameSave = async (fileId: string, updates: any) => {
    if (!getAdminSession()) {
      notify('Access Denied: Only the administrator has permission to edit files.', 'error');
      return;
    }
    try {
      const updated = await updateFileDetails(fileId, updates);
      if (updated) {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, ...updated } : f))
        );
        notify(`Updated metadata for "${updated.title}".`, 'success');
      }
    } catch (err: any) {
      notify(err?.message || 'Failed to update file details', 'error');
    }
  };

  const handleDeleteConfirm = async (file: any) => {
    if (!getAdminSession()) {
      notify('Access Denied: Only the administrator has permission to delete files or videos.', 'error');
      return;
    }
    try {
      await deleteStudyFile(file);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      if (previewFile && previewFile.id === file.id) {
        setPreviewFile(null);
      }
      notify(`Deleted "${file.title}" from FileNest.`, 'info');
    } catch (err: any) {
      notify(err?.message || 'Failed to delete file', 'error');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopiedSql(true);
    notify('Copied Supabase SQL setup script to clipboard!', 'success');
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <Router>
      <div className={`min-h-screen flex flex-col transition-colors ${
        theme === 'darkblue'
          ? 'bg-[#0F172A] text-slate-100'
          : theme === 'skyblue'
          ? 'bg-[#F0F9FF] text-[#0C4A6E]'
          : theme === 'orange'
          ? 'bg-[#FFF7ED] text-[#431407]'
          : 'bg-white text-slate-800'
      }`}>
        {/* Sticky Glassmorphism Navbar with 4-Theme Picker */}
        <Navbar
          theme={theme}
          onThemeChange={(newTheme: ThemeMode) => setTheme(newTheme)}
          darkMode={theme === 'darkblue'}
          onToggleDarkMode={() => setTheme((t) => (t === 'darkblue' ? 'white' : 'darkblue'))}
        />



        {/* Main Route Viewport */}
        <main className="flex-1">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  files={files}
                  isLoading={isLoading}
                  subjectsBySemester={subjectsBySemester}
                  isAdmin={isAdmin}
                  onPreview={handleOpenPreview}
                  onDownload={handleDownload}
                  onToggleFavorite={handleToggleFavorite}
                  onRenameSave={handleRenameSave}
                  onDeleteConfirm={handleDeleteConfirm}
                />
              }
            />
            <Route
              path="/upload"
              element={
                <Upload
                  files={files}
                  subjectsBySemester={subjectsBySemester}
                  isAdmin={isAdmin}
                  onSubjectsUpdated={setSubjectsBySemester}
                  onUploadSuccess={handleUploadSuccess}
                  onPreview={handleOpenPreview}
                  onDownload={handleDownload}
                  onToggleFavorite={handleToggleFavorite}
                  onRenameSave={handleRenameSave}
                  onDeleteConfirm={handleDeleteConfirm}
                  onSyncToSupabase={handleManualSyncToSupabase}
                  isSyncing={isSyncing}
                  supabaseStatus={supabaseStatus}
                  notify={notify}
                />
              }
            />
            <Route
              path="/library"
              element={
                <Library
                  files={files}
                  isLoading={isLoading}
                  subjectsBySemester={subjectsBySemester}
                  isAdmin={isAdmin}
                  onPreview={handleOpenPreview}
                  onDownload={handleDownload}
                  onToggleFavorite={handleToggleFavorite}
                  onRenameSave={handleRenameSave}
                  onDeleteConfirm={handleDeleteConfirm}
                  onSyncToSupabase={handleManualSyncToSupabase}
                  isSyncing={isSyncing}
                  supabaseStatus={supabaseStatus}
                />
              }
            />
            <Route
              path="/tools"
              element={
                <Tools
                  files={files}
                  subjectsBySemester={subjectsBySemester}
                  onSubjectsUpdated={setSubjectsBySemester}
                  onPreview={handleOpenPreview}
                  onDownload={handleDownload}
                  onToggleFavorite={handleToggleFavorite}
                  onRenameSave={handleRenameSave}
                  onDeleteConfirm={handleDeleteConfirm}
                  notify={notify}
                />
              }
            />
            <Route path="/about" element={<About />} />
            <Route
              path="/admin"
              element={
                <Admin
                  files={files}
                  isLoading={isLoading}
                  onRefresh={async () => {
                    setIsLoading(true);
                    try {
                      const data = await fetchAllFiles();
                      setFiles(data);
                      notify('Refreshed file vault records.', 'success');
                    } catch (err: any) {
                      notify(err?.message || 'Failed to refresh records', 'error');
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  onPreview={handleOpenPreview}
                  onDownload={handleDownload}
                  onDeleteConfirm={handleDeleteConfirm}
                  notify={notify}
                />
              }
            />
          </Routes>
        </main>

        {/* Footer */}
        <Footer onOpenSqlModal={() => setSqlModalOpen(true)} />

        {/* PDF & Image Zoom Preview Modal */}
        <PreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
          onToggleFavorite={handleToggleFavorite}
        />

        {/* Supabase SQL Schema & Storage Policy Modal */}
        {sqlModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sql-modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-[#2563EB]" />
                  <div>
                    <h2
                      id="sql-modal-title"
                      className="text-base font-bold text-slate-900 dark:text-white"
                    >
                      Supabase Table &amp; Storage Bucket SQL Setup
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isSupabaseConfigured
                        ? 'Connected to live Supabase credentials from .env'
                        : 'Paste this SQL into your Supabase SQL Editor & add keys to .env'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-lg transition-colors"
                  >
                    {copiedSql ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied SQL</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy SQL</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSqlModalOpen(false)}
                    aria-label="Close modal"
                    className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl">
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-200 text-xs">
                      Target Project: <code className="font-mono font-bold">{SUPABASE_PROJECT_ID}</code>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">
                      Open your Supabase SQL Editor, paste this script into a New Query, and click <strong>Run</strong>.
                    </p>
                  </div>
                  <a
                    href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-lg transition-colors shrink-0 whitespace-nowrap self-start sm:self-auto"
                  >
                    <span>Open Supabase SQL Editor ↗</span>
                  </a>
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Run the SQL script below in your Supabase project&apos;s{' '}
                  <strong>SQL Editor</strong> to create the <code className="font-mono">files</code>{' '}
                  table, create the public <code className="font-mono">study-files</code> storage
                  bucket, and configure Row-Level Security (RLS) policies:
                </p>
                <pre className="p-4 rounded-xl bg-slate-950 text-blue-100 font-mono text-xs overflow-x-auto leading-relaxed">
                  {SUPABASE_SETUP_SQL}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification Container */}
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </div>
    </Router>
  );
}

