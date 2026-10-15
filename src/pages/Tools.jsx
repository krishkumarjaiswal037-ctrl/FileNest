import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Calculator,
  Clock,
  CheckSquare,
  Timer,
  UserCheck,
  Briefcase,
  Star,
  History,
  ExternalLink,
  BookOpen,
  Plus,
  Trash2,
  RotateCcw
} from 'lucide-react';
import CgpaCalculator from '../tools/CgpaCalculator';
import ExamCountdown from '../tools/ExamCountdown';
import Planner from '../tools/Planner';
import Pomodoro from '../tools/Pomodoro';
import Attendance from '../tools/Attendance';
import PlacementChecklist from '../tools/PlacementChecklist';
import FileCard from '../components/FileCard';
import {
  SEMESTER_LIST,
  IMPORTANT_CSE_LINKS,
  saveSubjectsForSemester,
  resetSubjectsToDefault
} from '../data/subjects';
import {
  getRecentlyViewedIds,
  addSubjectToSupabase,
  deleteSubjectFromSupabase
} from '../lib/supabaseService';
import { Shield, Lock } from 'lucide-react';

const TOOL_TABS = [
  { id: 'cgpa', label: 'CGPA Calculator', icon: Calculator },
  { id: 'attendance', label: 'Attendance (75%)', icon: UserCheck },
  { id: 'exam', label: 'Exam Countdown', icon: Clock },
  { id: 'planner', label: 'Study Planner', icon: CheckSquare },
  { id: 'pomodoro', label: 'Pomodoro Timer', icon: Timer },
  { id: 'placement', label: 'Placement Prep', icon: Briefcase },
  { id: 'favorites', label: 'Starred Files', icon: Star },
  { id: 'recent', label: 'Recently Viewed', icon: History },
  { id: 'links', label: 'CSE Links Hub', icon: ExternalLink },
  { id: 'curriculum', label: 'Edit CSE Subjects', icon: BookOpen }
];

/**
 * Smart CSE Tools Page (src/pages/Tools.jsx)
 * Hosts all 10 working tools for B.Tech Computer Science students.
 */
export default function Tools({
  files,
  subjectsBySemester,
  isAdmin = false,
  onSubjectsUpdated,
  onPreview,
  onDownload,
  onToggleFavorite,
  onRenameSave,
  onDeleteConfirm,
  notify
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'cgpa');

  // Curriculum editor state
  const [editingSemester, setEditingSemester] = useState(3);
  const [newSubjectInput, setNewSubjectInput] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && TOOL_TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  // Favorites & Recently Viewed files
  const favoriteFiles = files.filter((f) => f.is_favorite);
  const recentIds = getRecentlyViewedIds();
  const recentlyViewedFiles = recentIds
    .map((entry) => files.find((f) => f.id === entry.id))
    .filter(Boolean);

  // Curriculum editor handlers
  const currentSemSubjects = subjectsBySemester[editingSemester] || [];

  const handleAddCurriculumSubject = async (e) => {
    e.preventDefault();
    if (!isAdmin) {
      if (notify) notify('Permission Denied: Only users with an Admin role can add subjects.', 'error');
      return;
    }
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;

    try {
      const updated = await addSubjectToSupabase(editingSemester, trimmed, true);
      onSubjectsUpdated(updated);
      setNewSubjectInput('');
      if (notify) notify(`Added "${trimmed}" to Semester ${editingSemester}.`, 'success');
    } catch (err) {
      if (notify) notify(err?.message || 'Could not add subject', 'error');
    }
  };

  const handleRemoveCurriculumSubject = async (subjToRemove) => {
    if (!isAdmin) {
      if (notify) notify('Permission Denied: Only users with an Admin role can delete subjects.', 'error');
      return;
    }

    try {
      const updated = await deleteSubjectFromSupabase(editingSemester, subjToRemove, true);
      onSubjectsUpdated(updated);
      if (notify) notify(`Removed "${subjToRemove}" from Semester ${editingSemester}.`, 'info');
    } catch (err) {
      if (notify) notify(err?.message || 'Could not remove subject', 'error');
    }
  };

  const handleResetCurriculum = () => {
    if (!isAdmin) {
      if (notify) notify('Permission Denied: Only users with an Admin role can reset subjects.', 'error');
      return;
    }
    const defaults = resetSubjectsToDefault();
    onSubjectsUpdated(defaults);
    if (notify) notify('Reset all 8 semesters to default B.Tech CSE curriculum.', 'info');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
          B.Tech CSE Engineering Suite
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Smart Academic &amp; Placement Tools
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
          Everything a Computer Science student needs alongside their notes: 10-point CGPA
          calculator, 75% attendance calculator, exam countdowns, Pomodoro timer, placement
          checklist, and editable semester subjects.
        </p>
      </div>

      {/* Tool Navigation Tabs */}
      <div
        role="tablist"
        aria-label="Smart CSE Tools"
        className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-2xs"
      >
        {TOOL_TABS.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelectTab(tab.id)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-[#EFF6FF] dark:hover:bg-slate-800 hover:text-[#1E3A8A] dark:hover:text-white'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tool Viewport */}
      <div>
        {activeTab === 'cgpa' && <CgpaCalculator notify={notify} />}
        {activeTab === 'attendance' && <Attendance />}
        {activeTab === 'exam' && <ExamCountdown notify={notify} />}
        {activeTab === 'planner' && <Planner notify={notify} />}
        {activeTab === 'pomodoro' && <Pomodoro notify={notify} />}
        {activeTab === 'placement' && <PlacementChecklist />}

        {/* Favorites / Bookmarked Files */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Starred &amp; Bookmarked Study Files
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                  {favoriteFiles.length}starred documents for quick exam revision
                </p>
              </div>
            </div>

            {favoriteFiles.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                <Star className="w-10 h-10 text-[#2563EB] mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No Starred Files Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Click the star icon on any PDF or diagram card in the Library to pin it here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favoriteFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    viewMode="grid"
                    subjectsBySemester={subjectsBySemester}
                    onPreview={onPreview}
                    onDownload={onDownload}
                    onToggleFavorite={onToggleFavorite}
                    onRenameSave={onRenameSave}
                    onDeleteConfirm={onDeleteConfirm}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Recently Viewed Files */}
        {activeTab === 'recent' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Recently Viewed Study Files
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically tracks the PDFs and handwritten notes you previewed most recently
              </p>
            </div>

            {recentlyViewedFiles.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
                <History className="w-10 h-10 text-[#2563EB] mx-auto mb-3" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  No Recently Viewed Files Yet
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Open any PDF or diagram preview modal to record your reading history.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentlyViewedFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    viewMode="grid"
                    subjectsBySemester={subjectsBySemester}
                    onPreview={onPreview}
                    onDownload={onDownload}
                    onToggleFavorite={onToggleFavorite}
                    onRenameSave={onRenameSave}
                    onDeleteConfirm={onDeleteConfirm}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Important CSE Links Hub */}
        {activeTab === 'links' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Important B.Tech CSE Platforms &amp; Learning Hub
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Direct access to coding platforms, university lectures, and developer roadmaps
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {IMPORTANT_CSE_LINKS.map((link) => (
                <a
                  key={link.name}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#2563EB] dark:text-blue-400 font-medium">
                      <span>{link.category}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="mt-2 text-base font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-blue-400">
                      {link.name}
                    </h4>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {link.description}
                    </p>
                  </div>
                  <span className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-700 text-xs font-mono text-slate-500 truncate">
                    {link.url.replace('https://', '')}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Pre-filled CSE Subject Suggestions Editor (Semesters 1 to 8) */}
        {activeTab === 'curriculum' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Customize B.Tech CSE Subjects per Semester (Sem 1 to 8)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pre-filled with standard B.Tech CSE subjects. Add your university electives or
                  remove subjects — changes sync immediately with Upload and Library!
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleResetCurriculum}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Default CSE Curriculum</span>
                </button>
              )}
            </div>

            {/* Semester Selector Buttons */}
            <div className="flex flex-wrap gap-2">
              {SEMESTER_LIST.map((sem) => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => setEditingSemester(sem)}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                    editingSemester === sem
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#2563EB]'
                  }`}
                >
                  Semester {sem} ({(subjectsBySemester[sem] || []).length})
                </button>
              ))}
            </div>

            {/* Add Subject to Current Semester - STRICT ADMIN ONLY */}
            {isAdmin ? (
              <form onSubmit={handleAddCurriculumSubject} className="flex gap-3">
                <input
                  type="text"
                  value={newSubjectInput}
                  onChange={(e) => setNewSubjectInput(e.target.value)}
                  placeholder={`Add new subject to Semester ${editingSemester} (e.g. Cloud Native Engineering)...`}
                  className="flex-1 px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Subject</span>
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-slate-700 dark:text-slate-300">
                <Lock className="w-5 h-5 text-[#2563EB] dark:text-blue-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">Admin-Restricted Permissions:</span> Only users with an Admin role can add or delete subjects within a semester. Log in to the Admin Portal to manage curriculum subjects.
                </div>
              </div>
            )}

            {/* Subject List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentSemSubjects.map((subj) => (
                <div
                  key={subj}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                >
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                    {subj}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCurriculumSubject(subj)}
                      aria-label={`Remove ${subj}`}
                      title="Delete subject (Admin Only)"
                      className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
