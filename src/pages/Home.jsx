import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Folder,
  ArrowRight,
  Calculator,
  Clock,
  CheckSquare,
  Timer,
  UserCheck,
  Briefcase,
  UploadCloud,
  ExternalLink
} from 'lucide-react';
import Hero from '../components/Hero';
import FileCard from '../components/FileCard';
import { SEMESTER_LIST, IMPORTANT_CSE_LINKS } from '../data/subjects';

/**
 * Home Page (src/pages/Home.jsx)
 * Combines the Hero section, 8-Semester Folder Grid, Recent Study Materials,
 * and Quick Engineering Tools access.
 */
export default function Home({
  files,
  isLoading,
  subjectsBySemester,
  isAdmin = false,
  onPreview,
  onDownload,
  onToggleFavorite,
  onRenameSave,
  onDeleteConfirm
}) {
  const navigate = useNavigate();
  const [selectedSemester, setSelectedSemester] = useState(4); // Default to Semester 4 (the 4th semester)
  const recentFiles = files.slice(0, 6);

  const quickTools = [
    {
      id: 'cgpa',
      title: 'CGPA & SGPA Calculator',
      desc: '10-point credit-weighted semester grade calculator.',
      icon: Calculator
    },
    {
      id: 'attendance',
      title: '75% Attendance Tracker',
      desc: 'Calculate safe skips or lectures needed per subject.',
      icon: UserCheck
    },
    {
      id: 'exam',
      title: 'Exam Countdown',
      desc: 'Track remaining days for Mid-Sem, End-Sem & Lab Vivas.',
      icon: Clock
    },
    {
      id: 'pomodoro',
      title: '25/5 Pomodoro Timer',
      desc: 'Distraction-free focus blocks for coding and theory.',
      icon: Timer
    },
    {
      id: 'planner',
      title: 'Study Task Planner',
      desc: 'Persistent to-do queue for assignments and PYQs.',
      icon: CheckSquare
    },
    {
      id: 'placement',
      title: 'Placement Prep Checklist',
      desc: 'Track readiness in DSA, OS, DBMS, CN, OOPs & Aptitude.',
      icon: Briefcase
    }
  ];

  const selectedSemFiles = files.filter((f) => Number(f.semester) === selectedSemester);

  return (
    <div className="space-y-16 pb-16">
      {/* 1. Hero Section with Live Database Stats */}
      <Hero
        files={files}
        subjectsBySemester={subjectsBySemester}
        onOpenPreview={onPreview}
      />

      {/* 2. Semester-Wise Quick Folders (Semesters 1 to 8) & 4-File Editor */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
              01. Academic Hierarchy
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Browse Notes by Semester
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Select any semester (e.g. 4th semester) below to browse, preview, and edit notes directly.
            </p>
          </div>
          <Link
            to="/library"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
          >
            <span>Open Full Library</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SEMESTER_LIST.map((sem) => {
            const semFiles = files.filter((f) => Number(f.semester) === sem);
            const semSubjects = subjectsBySemester[sem] || [];
            const isSelected = selectedSemester === sem;

            return (
              <div
                key={sem}
                onClick={() => setSelectedSemester(sem)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedSemester(sem);
                  }
                }}
                className={`group text-left bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs transition-all duration-200 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#2563EB] ring-2 ring-blue-500/20 shadow-md scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-800 hover:border-[#2563EB] dark:hover:border-blue-500 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#EFF6FF] dark:bg-slate-800 text-[#2563EB] dark:text-blue-400 group-hover:bg-[#2563EB] group-hover:text-white'
                      }`}
                    >
                      <Folder className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {sem === 4 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-[#2563EB] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          4th Sem
                        </span>
                      )}
                      <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                        {semFiles.length} {semFiles.length === 1 ? 'file' : 'files'}
                      </span>
                    </div>
                  </div>

                  <h3
                    className={`mt-4 text-lg font-bold transition-colors ${
                      isSelected
                        ? 'text-[#2563EB] dark:text-blue-400'
                        : 'text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-blue-400'
                    }`}
                  >
                    Semester {sem}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {semSubjects.slice(0, 3).join(' · ')}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-medium text-[#2563EB] dark:text-blue-400">
                  <span className="tabular-nums">
                    {isSelected ? 'Viewing & Edit Files' : `${semSubjects.length} CSE Subjects`}
                  </span>
                  <ArrowRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isSelected ? 'translate-x-1' : 'group-hover:translate-x-0.5'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Semester Notes Viewer & Inline Editor (Showing up to 4 files grid with Edit action) */}
        <div className="mt-6 p-6 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950 text-[#2563EB] dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                S{selectedSemester}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Semester {selectedSemester} Notes &amp; Files</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 dark:bg-blue-950/80 text-[#2563EB] dark:text-blue-300">
                    {selectedSemFiles.length} {selectedSemFiles.length === 1 ? 'file' : 'files'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click the Pencil icon on any note card below to edit title, subject, category, or tags.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                to="/upload"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors shrink-0"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload to Sem {selectedSemester}</span>
              </Link>
              <Link
                to={`/library?semester=${selectedSemester}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] rounded-xl transition-colors shrink-0"
              >
                <span>Full Sem {selectedSemester} Library</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Files Grid for Selected Semester */}
          <div className="mt-5">
            {selectedSemFiles.length === 0 ? (
              <div className="text-center py-10 px-4 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                <Folder className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  No notes uploaded for Semester {selectedSemester} yet
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Upload lecture notes, question papers, or diagrams for Semester {selectedSemester} to browse and edit them here.
                </p>
                <Link
                  to="/upload"
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-colors"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Upload Note for Semester {selectedSemester}</span>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {selectedSemFiles.slice(0, 4).map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    viewMode="grid"
                    subjectsBySemester={subjectsBySemester}
                    isAdmin={isAdmin}
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
        </div>
      </section>

      {/* 3. Recent Study Materials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
              02. Latest Uploads
            </p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Recently Added PDFs &amp; Diagrams
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/upload"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload New File</span>
            </Link>
            <Link
              to="/library"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap shrink-0"
            >
              <span>View All ({files.length})</span>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between"
              >
                <div className="h-36 rounded-xl bg-slate-200/70 dark:bg-slate-700/50" />
                <div className="space-y-2">
                  <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : recentFiles.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
            <UploadCloud className="w-10 h-10 text-[#2563EB] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Your FileNest is Ready
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Upload your first semester PDF lecture note, question paper, or handwritten
              diagram photo to get started.
            </p>
            <Link
              to="/upload"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload First File</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                viewMode="grid"
                subjectsBySemester={subjectsBySemester}
                isAdmin={isAdmin}
                onPreview={onPreview}
                onDownload={onDownload}
                onToggleFavorite={onToggleFavorite}
                onRenameSave={onRenameSave}
                onDeleteConfirm={onDeleteConfirm}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. Smart Engineering Tools Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#EFF6FF]/60 dark:bg-slate-900/70 border border-blue-100 dark:border-slate-800 rounded-2xl p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
                03. Productivity Suite
              </p>
              <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Smart B.Tech CSE Tools
              </h2>
            </div>
            <Link
              to="/tools"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              <span>Launch All 10 Student Tools</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickTools.map((tool) => {
              const IconComponent = tool.icon;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => navigate(`/tools?tab=${tool.id}`)}
                  className="text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] rounded-2xl p-5 transition-all hover:shadow-sm flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] dark:bg-slate-800 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {tool.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Important CSE Links Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
              04. Quick Reference Hub
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              Essential CSE Coding &amp; Lecture Platforms
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {IMPORTANT_CSE_LINKS.slice(0, 4).map((link) => (
            <a
              key={link.name}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] rounded-2xl p-5 transition-colors flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>{link.category}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#2563EB]" />
                </div>
                <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white group-hover:text-[#2563EB] dark:group-hover:text-blue-400">
                  {link.name}
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {link.description}
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
