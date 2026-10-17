import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Image as ImageIcon,
  Video,
  BookOpen,
  HelpCircle,
  Eye,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  Database,
  Shield,
  LogOut,
  RefreshCw,
  HardDrive,
  Plus,
  UploadCloud,
  GraduationCap,
  Pencil,
  Check,
  X,
  Lock,
  KeyRound,
  User,
  Mail,
  ShieldCheck
} from 'lucide-react';
import { AdminSession, updateAdminCredentials } from '../lib/adminAuth';
import {
  formatFileSize,
  syncLocalFilesToSupabase,
  addSubjectToSupabase,
  deleteSubjectFromSupabase,
  renameSubjectInSupabase
} from '../lib/supabaseService';
import { SEMESTER_LIST, saveSubjectsForSemester } from '../data/subjects';

interface AdminDashboardProps {
  session: AdminSession;
  files: any[];
  isLoading: boolean;
  subjectsBySemester: { [sem: number]: string[] };
  onSubjectsUpdated: (newMap: { [sem: number]: string[] }) => void;
  onRefresh: () => void;
  onPreview: (file: any) => void;
  onDownload: (file: any) => void;
  onDeleteConfirm: (file: any) => void;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onLogout: () => void;
}

export default function AdminDashboard({
  session,
  files,
  isLoading,
  subjectsBySemester = {},
  onSubjectsUpdated,
  onRefresh,
  onPreview,
  onDownload,
  onDeleteConfirm,
  notify,
  onLogout
}: AdminDashboardProps) {
  // Navigation between Vault Files, Subject Management, and Admin Security
  const [activeAdminTab, setActiveAdminTab] = useState<'files' | 'curriculum' | 'security'>('files');
  const [editingSemester, setEditingSemester] = useState<number>(1);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');
  const [editingSubject, setEditingSubject] = useState<{ sem: number; oldName: string; currentVal: string } | null>(null);
  const [isSavingSubjectEdit, setIsSavingSubjectEdit] = useState(false);

  // Single Admin Security state
  const [secCurrentPassword, setSecCurrentPassword] = useState('');
  const [secNewEmail, setSecNewEmail] = useState(session.email || '');
  const [secNewUsername, setSecNewUsername] = useState(session.username || '');
  const [secNewFullName, setSecNewFullName] = useState(session.fullName || '');
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secConfirmPassword, setSecConfirmPassword] = useState('');
  const [isUpdatingSec, setIsUpdatingSec] = useState(false);
  const [secMsg, setSecMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateAdminSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecMsg(null);

    if (!secCurrentPassword) {
      setSecMsg({ text: 'Current administrator password is required to save changes.', type: 'error' });
      return;
    }
    if (secNewPassword && secNewPassword !== secConfirmPassword) {
      setSecMsg({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (secNewPassword && secNewPassword.length < 6) {
      setSecMsg({ text: 'New password must be at least 6 characters long.', type: 'error' });
      return;
    }

    setIsUpdatingSec(true);
    try {
      await updateAdminCredentials({
        currentPassword: secCurrentPassword,
        newEmail: secNewEmail.trim() !== session.email ? secNewEmail.trim() : undefined,
        newUsername: secNewUsername.trim() !== session.username ? secNewUsername.trim() : undefined,
        newFullName: secNewFullName.trim() !== session.fullName ? secNewFullName.trim() : undefined,
        newPassword: secNewPassword || undefined
      });
      setSecMsg({ text: 'Administrator credentials updated successfully!', type: 'success' });
      notify('Administrator profile and credentials updated.', 'success');
      setSecCurrentPassword('');
      setSecNewPassword('');
      setSecConfirmPassword('');
    } catch (err: any) {
      setSecMsg({ text: err?.message || 'Failed to update credentials.', type: 'error' });
      notify(err?.message || 'Update failed', 'error');
    } finally {
      setIsUpdatingSec(false);
    }
  };

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSemester, setSelectedSemester] = useState<number | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'pdf' | 'image' | 'video'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'size-desc' | 'title'>('newest');

  // Delete modal state
  const [fileToDelete, setFileToDelete] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newSubjectInput.trim();
    if (!trimmed) {
      notify('Please enter a subject name.', 'error');
      return;
    }
    const currentList = subjectsBySemester[editingSemester] || [];
    if (currentList.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      notify(`"${trimmed}" is already in Semester ${editingSemester}.`, 'info');
      return;
    }

    setIsAddingSubject(true);
    try {
      const updated = await addSubjectToSupabase(editingSemester, trimmed, true, subjectsBySemester);
      if (onSubjectsUpdated) {
        onSubjectsUpdated(updated);
      }
      setNewSubjectInput('');
      notify(
        `Added "${trimmed}" to Semester ${editingSemester}. Saved to Supabase cloud and visible across all devices!`,
        'success'
      );
    } catch (err: any) {
      notify(err?.message || 'Failed to add subject', 'error');
    } finally {
      setIsAddingSubject(false);
    }
  };

  const handleDeleteSubject = async (subjName: string) => {
    try {
      const updated = await deleteSubjectFromSupabase(editingSemester, subjName, true, subjectsBySemester);
      if (onSubjectsUpdated) {
        onSubjectsUpdated(updated);
      }
      notify(`Permanently removed "${subjName}" from Semester ${editingSemester}.`, 'info');
    } catch (err: any) {
      notify(err?.message || 'Failed to remove subject', 'error');
    }
  };

  const handleStartEditSubject = (subj: string) => {
    setEditingSubject({ sem: editingSemester, oldName: subj, currentVal: subj });
  };

  const handleCancelEditSubject = () => {
    setEditingSubject(null);
  };

  const handleSaveEditSubject = async () => {
    if (!editingSubject) return;
    const cleanNew = editingSubject.currentVal.trim();
    if (!cleanNew) {
      notify('Subject name cannot be empty.', 'error');
      return;
    }
    if (cleanNew.toLowerCase() === editingSubject.oldName.toLowerCase()) {
      setEditingSubject(null);
      return;
    }

    const currentList = subjectsBySemester[editingSemester] || [];
    if (
      currentList.some(
        (s) =>
          s.toLowerCase() === cleanNew.toLowerCase() &&
          s.toLowerCase() !== editingSubject.oldName.toLowerCase()
      )
    ) {
      notify(`A subject named "${cleanNew}" already exists in Semester ${editingSemester}.`, 'error');
      return;
    }

    setIsSavingSubjectEdit(true);
    try {
      const updated = await renameSubjectInSupabase(
        editingSemester,
        editingSubject.oldName,
        cleanNew,
        true,
        subjectsBySemester
      );
      if (onSubjectsUpdated) {
        onSubjectsUpdated(updated);
      }
      notify(
        `Subject renamed to "${cleanNew}" successfully across all documents and views.`,
        'success'
      );
      onRefresh();
    } catch (err: any) {
      notify(err?.message || 'Failed to rename subject', 'error');
    } finally {
      setIsSavingSubjectEdit(false);
      setEditingSubject(null);
    }
  };

  const handleSyncToSupabase = async () => {
    setIsSyncing(true);
    try {
      const res = await syncLocalFilesToSupabase();
      if (res.synced > 0) {
        notify(`Synced ${res.synced} files into your Supabase table editor!`, 'success');
        onRefresh();
      } else if (res.error) {
        notify(`Supabase sync note: ${res.error}`, 'error');
      } else {
        notify('All local files are already synchronized with your Supabase table editor.', 'info');
      }
    } catch (err: any) {
      notify(err?.message || 'Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Statistics calculation
  const stats = useMemo(() => {
    const totalCount = files.length;
    let pdfCount = 0;
    let imageCount = 0;
    let videoCount = 0;
    let notesCount = 0;
    let pyqCount = 0;
    let syllabusCount = 0;
    let totalBytes = 0;

    files.forEach((f) => {
      if (f.file_type === 'pdf') pdfCount++;
      else if (f.file_type === 'video') videoCount++;
      else imageCount++;

      if (f.category?.toLowerCase().includes('note')) notesCount++;
      if (f.category?.toLowerCase().includes('question') || f.category?.toLowerCase().includes('pyq')) pyqCount++;
      if (f.category?.toLowerCase().includes('syllabus')) syllabusCount++;
      totalBytes += Number(f.file_size || 0);
    });

    return {
      totalCount,
      pdfCount,
      imageCount,
      videoCount,
      notesCount,
      pyqCount,
      syllabusCount,
      totalBytes,
      formattedTotalSize: formatFileSize(totalBytes)
    };
  }, [files]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [files]);

  // Filtered & Sorted files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        // Query match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = file.title?.toLowerCase().includes(q);
          const matchSubject = file.subject?.toLowerCase().includes(q);
          const matchTags = Array.isArray(file.tags) && file.tags.some((t: string) => t.toLowerCase().includes(q));
          const matchCategory = file.category?.toLowerCase().includes(q);
          const matchFilename = file.file_name?.toLowerCase().includes(q);
          if (!matchTitle && !matchSubject && !matchTags && !matchCategory && !matchFilename) {
            return false;
          }
        }

        // Semester filter
        if (selectedSemester !== 'all' && Number(file.semester) !== Number(selectedSemester)) {
          return false;
        }

        // Type filter
        if (selectedType !== 'all' && file.file_type !== selectedType) {
          return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && file.category !== selectedCategory) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'size-desc') {
          return Number(b.file_size || 0) - Number(a.file_size || 0);
        }
        if (sortBy === 'title') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
      });
  }, [files, searchQuery, selectedSemester, selectedType, selectedCategory, sortBy]);

  const handleConfirmDelete = () => {
    if (fileToDelete) {
      onDeleteConfirm(fileToDelete);
      setFileToDelete(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Admin Top Navigation & Status Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1E3A8A] via-[#2563EB] to-blue-400 flex items-center justify-center text-white font-bold text-xl shadow-md shadow-blue-500/20">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                FileNest Admin Control Room
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-blue-100 dark:bg-blue-950/80 text-[#2563EB] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Master Slot
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Logged in as <strong className="text-slate-800 dark:text-slate-200">{session.fullName || session.username}</strong> ({session.email})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleSyncToSupabase}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl shadow-xs transition-colors disabled:opacity-50"
            title="Push any local or offline files into your Supabase table editor"
          >
            <Database className={`w-3.5 h-3.5 ${isSyncing ? 'animate-pulse' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync to Supabase'}</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            title="Reload repository records"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Reload Records</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {/* Total Documents */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Files</span>
            <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {stats.totalCount}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Across 8 semesters</p>
        </div>

        {/* PDFs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">PDFs</span>
            <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {stats.pdfCount}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Documents &amp; PYQs</p>
        </div>

        {/* Images & Diagrams */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Images / Notes</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <ImageIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {stats.imageCount}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Whiteboards &amp; scans</p>
        </div>

        {/* Notes Category */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Notes Items</span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {stats.notesCount}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Subject chapters</p>
        </div>

        {/* Solved PYQs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">PYQs / Papers</span>
            <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <HelpCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white tabular-nums">
            {stats.pyqCount}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Exam question banks</p>
        </div>

        {/* Vault Footprint */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vault Footprint</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
            {stats.formattedTotalSize}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">Storage capacity</p>
        </div>
      </div>

      {/* Admin Tab Switcher: Vault Files vs Semester Curriculum & Subjects */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveAdminTab('files')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeAdminTab === 'files'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Vault Documents ({files.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('curriculum')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeAdminTab === 'curriculum'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Curriculum &amp; Subjects (8 Semesters)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveAdminTab('security')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeAdminTab === 'security'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin Security &amp; Profile</span>
          </button>
        </div>

        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#2563EB] dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors border border-blue-200/60 dark:border-blue-900/40"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Upload Notes &rarr;</span>
        </Link>
      </div>

      {activeAdminTab === 'curriculum' && (
        /* Curriculum & Subjects Management View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400">
                    <BookOpen className="w-5 h-5" />
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    Semester Curriculum &amp; Subjects Manager
                  </h2>
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-2xl">
                  Add or delete academic subjects per semester. Any subjects added here will immediately appear in the <strong>Upload</strong> section when choosing subjects.
                </p>
              </div>

              <Link
                to="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-xs"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Go to Upload Page</span>
              </Link>
            </div>

            {/* Semester Selector Tabs (Semesters 1 to 8) */}
            <div className="mt-6 flex flex-wrap gap-2">
              {SEMESTER_LIST.map((sem) => {
                const count = (subjectsBySemester[sem] || []).length;
                const isSelected = editingSemester === sem;
                return (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setEditingSemester(sem)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Semester {sem}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono ${
                        isSelected
                          ? 'bg-blue-700/60 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Subject to Selected Semester Form */}
          <div className="p-6 bg-slate-50/60 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#2563EB] dark:text-blue-400 mb-2">
              Add New Subject to Semester {editingSemester}
            </h3>
            <form onSubmit={handleAddSubject} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newSubjectInput}
                onChange={(e) => setNewSubjectInput(e.target.value)}
                placeholder={`Enter new subject for Semester ${editingSemester} (e.g. Cloud Native Engineering, AI Ethics)...`}
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
              />
              <button
                type="submit"
                disabled={isAddingSubject || !newSubjectInput.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors disabled:opacity-50 whitespace-nowrap shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isAddingSubject ? 'Adding...' : `Add to Semester ${editingSemester}`}</span>
              </button>
            </form>
          </div>

          {/* Current Semester's Subject List */}
          <div className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Active Subjects in Semester {editingSemester} ({(subjectsBySemester[editingSemester] || []).length})
              </h3>
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder="Filter subjects in this semester..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>
            </div>

            {(() => {
              const semList = subjectsBySemester[editingSemester] || [];
              const filteredList = semList.filter((s) =>
                s.toLowerCase().includes(subjectSearch.toLowerCase().trim())
              );

              if (filteredList.length === 0) {
                return (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {subjectSearch ? 'No subjects matching filter.' : `No subjects found in Semester ${editingSemester}. Add one above!`}
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredList.map((subj) => {
                    const isEditingThis =
                      editingSubject &&
                      editingSubject.sem === editingSemester &&
                      editingSubject.oldName === subj;

                    if (isEditingThis) {
                      return (
                        <div
                          key={subj}
                          className="flex items-center gap-2 p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border-2 border-[#2563EB] rounded-xl shadow-xs"
                        >
                          <input
                            type="text"
                            value={editingSubject.currentVal}
                            onChange={(e) =>
                              setEditingSubject({
                                ...editingSubject,
                                currentVal: e.target.value
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEditSubject();
                              } else if (e.key === 'Escape') {
                                handleCancelEditSubject();
                              }
                            }}
                            autoFocus
                            placeholder="Enter new subject name..."
                            className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                          />
                          <button
                            type="button"
                            onClick={handleSaveEditSubject}
                            disabled={isSavingSubjectEdit || !editingSubject.currentVal.trim()}
                            className="p-1.5 text-white bg-[#2563EB] hover:bg-blue-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Save subject name"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditSubject}
                            disabled={isSavingSubjectEdit}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Cancel editing"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={subj}
                        className="group flex items-center justify-between p-3.5 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-[#2563EB] transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <GraduationCap className="w-4 h-4 text-[#2563EB] dark:text-blue-400 shrink-0" />
                          <span
                            className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate"
                            title={subj}
                          >
                            {subj}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditSubject(subj)}
                            className="p-1 text-slate-400 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title={`Change name / Rename "${subj}"`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(subj)}
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                            title={`Delete "${subj}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Admin Security & Account Profile View */}
      {activeAdminTab === 'security' && (
        <div className="space-y-6">
          {/* Status & Single Admin Policy Banner */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-2xl text-[#2563EB] dark:text-blue-400 shrink-0">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                      Single-Administrator Security Policy
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                      Active &amp; Locked
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                    This website is strictly locked to <strong>one administrator</strong>. Public registration is permanently closed and unauthorized access is prohibited. Multi-admin accounts are disabled.
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-200/80 dark:border-slate-800">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Admin Name
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
                  {session.fullName || session.username}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Admin Email
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
                  {session.email}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60">
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Username
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white truncate">
                  {session.username}
                </div>
              </div>
            </div>
          </div>

          {/* Update Credentials Form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] dark:text-blue-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Update Administrator Credentials
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Safely update your administrator email, username, or master password. Your current password is required.
              </p>
            </div>

            <form onSubmit={handleUpdateAdminSecurity} className="p-6 space-y-4 max-w-xl">
              {secMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-center gap-2.5 ${
                    secMsg.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300'
                  }`}
                >
                  {secMsg.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <X className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span>{secMsg.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Current Administrator Password (Required) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={secCurrentPassword}
                    onChange={(e) => setSecCurrentPassword(e.target.value)}
                    placeholder="Enter current password to authorize changes"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Admin Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={secNewFullName}
                      onChange={(e) => setSecNewFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Admin Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={secNewUsername}
                      onChange={(e) => setSecNewUsername(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={secNewEmail}
                    onChange={(e) => setSecNewEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    New Password (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={secNewPassword}
                      onChange={(e) => setSecNewPassword(e.target.value)}
                      placeholder="Leave blank to keep current"
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={secConfirmPassword}
                      onChange={(e) => setSecConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isUpdatingSec}
                  className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isUpdatingSec ? 'Saving Changes...' : 'Save Updated Credentials'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Table / Files Management Container */}
      {activeAdminTab === 'files' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
          {/* Table Controls / Filter Toolbar */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                All Repository Files ({filteredFiles.length} of {files.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Inspect, download, preview, or remove any file uploaded or seeded in FileNest.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, subject, tags..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#2563EB]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            {/* Semester Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Semester:</span>
              <select
                value={selectedSemester}
                onChange={(e) =>
                  setSelectedSemester(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="all">All Semesters (1–8)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Select */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF Documents</option>
                <option value="image">Images / Notes</option>
                <option value="video">Videos / Lectures</option>
              </select>
            </div>

            {/* Category Select */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sort Order */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="size-desc">Largest Size</option>
                <option value="title">Alphabetical (A–Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Files Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Title &amp; File Details</th>
                <th className="py-3 px-4">Subject &amp; Sem</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Date Added</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <Database className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No documents matched your criteria</p>
                    <p className="text-xs mt-1">Try resetting filters or checking the search query.</p>
                  </td>
                </tr>
              ) : (
                filteredFiles.map((file) => {
                  const isPdf = file.file_type === 'pdf';
                  const isVideo = file.file_type === 'video';
                  const formattedDate = new Date(file.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <tr
                      key={file.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold ${
                            isPdf
                              ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40'
                              : isVideo
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-400 border border-blue-200 dark:border-blue-900/40'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                          }`}
                        >
                          {isPdf ? (
                            <FileText className="w-3.5 h-3.5" />
                          ) : isVideo ? (
                            <Video className="w-3.5 h-3.5" />
                          ) : (
                            <ImageIcon className="w-3.5 h-3.5" />
                          )}
                          <span>{isPdf ? 'PDF' : isVideo ? 'VID' : 'IMG'}</span>
                        </div>
                      </td>

                      {/* Title & File Name */}
                      <td className="py-3.5 px-4 min-w-[240px]">
                        <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {file.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-mono mt-0.5">
                          {file.file_name}
                        </div>
                        {Array.isArray(file.tags) && file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {file.tags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                              >
                                #{tag}
                              </span>
                            ))}
                            {file.tags.length > 3 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{file.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Subject & Semester */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {file.subject}
                        </div>
                        <div className="text-[11px] text-[#2563EB] dark:text-blue-400 font-semibold">
                          Semester {file.semester}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {file.category}
                        </span>
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-4 whitespace-nowrap tabular-nums text-slate-600 dark:text-slate-400">
                        {formatFileSize(file.file_size)}
                      </td>

                      {/* Created At */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-xs">
                        {formattedDate}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onPreview(file)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                            title="Preview file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDownload(file)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setFileToDelete(file)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="Delete file permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Delete Confirmation Modal */}
      {fileToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/50">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Confirm Admin Deletion
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 dark:text-white">
                &quot;{fileToDelete.title}&quot;
              </strong>{' '}
              ({fileToDelete.file_name})? This action will remove the record and file payload from
              FileNest repository.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
