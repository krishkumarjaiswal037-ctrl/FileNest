import React from 'react';
import {
  Search,
  LayoutGrid,
  List as ListIcon,
  RotateCcw,
  Star
} from 'lucide-react';
import { SEMESTER_LIST, FILE_CATEGORIES } from '../data/subjects';

/**
 * Search & Filter Bar Component (src/components/FilterBar.jsx)
 * Provides live search input, Semester filter, Subject filter, Category filter,
 * File Type filter (PDF/Image), Sort order (Newest, Oldest, A-Z), Favorites filter,
 * and Grid/List view toggle.
 */
export default function FilterBar({
  searchQuery,
  onSearchChange,
  selectedSemester,
  onSemesterChange,
  selectedSubject,
  onSubjectChange,
  availableSubjects = [],
  selectedCategory,
  onCategoryChange,
  selectedFileType,
  onFileTypeChange,
  sortBy,
  onSortByChange,
  onlyFavorites,
  onToggleOnlyFavorites,
  viewMode,
  onViewModeChange,
  onResetFilters,
  totalMatching
}) {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    selectedSemester !== 'all' ||
    selectedSubject !== 'all' ||
    selectedCategory !== 'all' ||
    selectedFileType !== 'all' ||
    onlyFavorites;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Top Row: Search Input, Favorites Toggle & View Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, subject, category, or tags (e.g. trees, dbms, pyq)..."
            aria-label="Search library files"
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:border-[#2563EB] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 shrink-0">
          {/* Interactive Filter Button: Starred Favorites */}
          <button
            type="button"
            onClick={onToggleOnlyFavorites}
            aria-pressed={onlyFavorites}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-colors whitespace-nowrap shrink-0 ${
              onlyFavorites
                ? 'bg-[#2563EB] text-white border-[#2563EB]'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#2563EB]'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-white' : ''}`} />
            <span>Favorites Only</span>
          </button>

          {/* Segmented File Type Controls */}
          <div
            role="group"
            aria-label="Filter by file type"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            {[
              { id: 'all', label: 'All Types' },
              { id: 'pdf', label: 'PDFs' },
              { id: 'image', label: 'Photos' }
            ].map((typeOpt) => (
              <button
                key={typeOpt.id}
                type="button"
                onClick={() => onFileTypeChange(typeOpt.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  selectedFileType === typeOpt.id
                    ? 'bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {typeOpt.label}
              </button>
            ))}
          </div>

          {/* Segmented Grid / List View Switcher */}
          <div
            role="group"
            aria-label="Toggle layout view"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-[#2563EB] dark:text-blue-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div>
          <label
            htmlFor="filter-semester"
            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
          >
            Semester
          </label>
          <select
            id="filter-semester"
            value={selectedSemester}
            onChange={(e) => onSemesterChange(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Semesters (1–8)</option>
            {SEMESTER_LIST.map((sem) => (
              <option key={sem} value={String(sem)}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-subject"
            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
          >
            Subject
          </label>
          <select
            id="filter-subject"
            value={selectedSubject}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Subjects</option>
            {availableSubjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-category"
            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
          >
            Document Category
          </label>
          <select
            id="filter-category"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#2563EB]"
          >
            <option value="all">All Categories</option>
            {FILE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-sort"
            className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
          >
            Sort Order
          </label>
          <select
            id="filter-sort"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-[#2563EB]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="az">Title (A to Z)</option>
          </select>
        </div>
      </div>

      {/* Active Filter Summary & Reset */}
      <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="tabular-nums">
          Showing <strong className="text-slate-800 dark:text-slate-200">{totalMatching}</strong>{' '}
          {totalMatching === 1 ? 'study resource' : 'study resources'}
        </span>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] dark:text-blue-400 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset all filters</span>
          </button>
        )}
      </div>
    </div>
  );
}
