import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  UploadCloud,
  FileSearch
} from 'lucide-react';
import FilterBar from '../components/FilterBar';
import FileCard from '../components/FileCard';
import { SEMESTER_LIST } from '../data/subjects';

/**
 * Library & Search Page (src/pages/Library.jsx)
 * Features:
 * - Semester-wise Folder Hierarchy (8 semester cards -> subject folders -> files)
 * - Debounced live search across title, subject, tags, and category
 * - Filters for Semester, Subject, Category, File Type (PDF/Image), Favorites, and Sort order
 * - Grid view and List view toggle
 */
export default function Library({
  files,
  isLoading,
  subjectsBySemester,
  isAdmin = false,
  onPreview,
  onDownload,
  onToggleFavorite,
  onRenameSave,
  onDeleteConfirm,
  onSyncToSupabase,
  isSyncing = false,
  supabaseStatus
}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [debouncedQuery, setDebouncedQuery] = useState(searchParams.get('q') || '');
  const [selectedSemester, setSelectedSemester] = useState(
    searchParams.get('semester') || 'all'
  );
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  // Sync URL query parameters when navigated from Navbar quick search or Home semester cards
  useEffect(() => {
    const qParam = searchParams.get('q');
    const semParam = searchParams.get('semester');
    if (qParam !== null) {
      setSearchInput(qParam);
      setDebouncedQuery(qParam);
    }
    if (semParam !== null) {
      setSelectedSemester(semParam);
      setSelectedSubject('all');
    }
  }, [searchParams]);

  // Debounce search input (220ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchInput.trim().toLowerCase());
    }, 220);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Compute available subjects based on selected semester
  const availableSubjects = useMemo(() => {
    if (selectedSemester === 'all') {
      const allSet = new Set();
      Object.values(subjectsBySemester).forEach((arr) => {
        if (Array.isArray(arr)) arr.forEach((s) => allSet.add(s));
      });
      files.forEach((f) => allSet.add(f.subject));
      return Array.from(allSet).sort();
    }
    const semNum = Number(selectedSemester);
    const setForSem = new Set(subjectsBySemester[semNum] || []);
    files
      .filter((f) => Number(f.semester) === semNum)
      .forEach((f) => setForSem.add(f.subject));
    return Array.from(setForSem);
  }, [selectedSemester, subjectsBySemester, files]);

  // Filter and sort files
  const filteredFiles = useMemo(() => {
    return files
      .filter((file) => {
        if (selectedSemester !== 'all' && Number(file.semester) !== Number(selectedSemester)) {
          return false;
        }
        if (selectedSubject !== 'all' && file.subject !== selectedSubject) {
          return false;
        }
        if (selectedCategory !== 'all' && file.category !== selectedCategory) {
          return false;
        }
        if (selectedFileType !== 'all' && file.file_type !== selectedFileType) {
          return false;
        }
        if (onlyFavorites && !file.is_favorite) {
          return false;
        }
        if (debouncedQuery) {
          const titleMatch = file.title?.toLowerCase().includes(debouncedQuery);
          const subjectMatch = file.subject?.toLowerCase().includes(debouncedQuery);
          const categoryMatch = file.category?.toLowerCase().includes(debouncedQuery);
          const tagMatch =
            Array.isArray(file.tags) &&
            file.tags.some((t) => t.toLowerCase().includes(debouncedQuery));
          return titleMatch || subjectMatch || categoryMatch || tagMatch;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        if (sortBy === 'az') {
          return a.title.localeCompare(b.title);
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [
    files,
    selectedSemester,
    selectedSubject,
    selectedCategory,
    selectedFileType,
    onlyFavorites,
    debouncedQuery,
    sortBy
  ]);

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedQuery('');
    setSelectedSemester('all');
    setSelectedSubject('all');
    setSelectedCategory('all');
    setSelectedFileType('all');
    setSortBy('newest');
    setOnlyFavorites(false);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
            Academic Repository
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Semester-Wise Study Library
          </h1>
        </div>

        <div className="flex items-center gap-2.5">


          <Link
            to="/upload"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload New Files</span>
          </Link>
        </div>
      </div>

      {/* Semester-Wise Folder Explorer (8 Semesters -> Subject Drilldown) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <FolderOpen className="w-4 h-4 text-[#2563EB]" />
            <button
              type="button"
              onClick={() => {
                setSelectedSemester('all');
                setSelectedSubject('all');
              }}
              className={`hover:text-[#2563EB] transition-colors ${
                selectedSemester === 'all' ? 'text-[#2563EB] dark:text-blue-400' : ''
              }`}
            >
              All 8 Semesters
            </button>
            {selectedSemester !== 'all' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <button
                  type="button"
                  onClick={() => setSelectedSubject('all')}
                  className="text-[#2563EB] dark:text-blue-400 hover:underline"
                >
                  Semester {selectedSemester}
                </button>
              </>
            )}
            {selectedSubject !== 'all' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-900 dark:text-white truncate max-w-xs">
                  {selectedSubject}
                </span>
              </>
            )}
          </div>

          {selectedSemester !== 'all' && (
            <button
              type="button"
              onClick={() => {
                setSelectedSemester('all');
                setSelectedSubject('all');
              }}
              className="text-xs font-medium text-[#2563EB] dark:text-blue-400 hover:underline"
            >
              Back to all semesters
            </button>
          )}
        </div>

        {/* 8 Semester Folder Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {SEMESTER_LIST.map((sem) => {
            const count = files.filter((f) => Number(f.semester) === sem).length;
            const isSelected = Number(selectedSemester) === sem;

            return (
              <button
                key={sem}
                type="button"
                onClick={() => {
                  if (isSelected) {
                    setSelectedSemester('all');
                    setSelectedSubject('all');
                  } else {
                    setSelectedSemester(String(sem));
                    setSelectedSubject('all');
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                    : 'bg-slate-50/80 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700 hover:border-[#2563EB]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <Folder
                    className={`w-4 h-4 ${
                      isSelected ? 'text-white' : 'text-[#2563EB] dark:text-blue-400'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-mono tabular-nums ${
                      isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold whitespace-nowrap">Semester {sem}</p>
              </button>
            );
          })}
        </div>

        {/* Subject Folders inside Selected Semester */}
        {selectedSemester !== 'all' && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5">
              Semester {selectedSemester} Subjects (Click a subject folder to filter):
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedSubject('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  selectedSubject === 'all'
                    ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#2563EB]'
                }`}
              >
                All Sem {selectedSemester} Subjects
              </button>

              {availableSubjects.map((subj) => {
                const subjCount = files.filter(
                  (f) =>
                    Number(f.semester) === Number(selectedSemester) && f.subject === subj
                ).length;
                const active = selectedSubject === subj;

                return (
                  <button
                    key={subj}
                    type="button"
                    onClick={() => setSelectedSubject(active ? 'all' : subj)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#2563EB] text-white border-[#2563EB]'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#2563EB]'
                    }`}
                  >
                    {subj} ({subjCount})
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <FilterBar
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        selectedSemester={selectedSemester}
        onSemesterChange={(val) => {
          setSelectedSemester(val);
          setSelectedSubject('all');
        }}
        selectedSubject={selectedSubject}
        onSubjectChange={setSelectedSubject}
        availableSubjects={availableSubjects}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        selectedFileType={selectedFileType}
        onFileTypeChange={setSelectedFileType}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onlyFavorites={onlyFavorites}
        onToggleOnlyFavorites={() => setOnlyFavorites((prev) => !prev)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onResetFilters={handleResetFilters}
        totalMatching={filteredFiles.length}
      />

      {/* Files Grid / List Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
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
      ) : filteredFiles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] dark:bg-slate-800 text-[#2563EB] dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
            <FileSearch className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Matching Study Files Found
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            No PDFs or handwritten notes matched your current filter selection. Reset filters
            or upload a new document to this semester folder.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Reset All Filters
            </button>
            <Link
              to="/upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Notes</span>
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFiles.map((file) => (
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
      ) : (
        <div className="space-y-3">
          {filteredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              viewMode="list"
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
  );
}
