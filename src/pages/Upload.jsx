import React from 'react';
import { Link } from 'react-router-dom';
import { FolderOpen } from 'lucide-react';
import UploadBox from '../components/UploadBox';
import FileCard from '../components/FileCard';

/**
 * Upload Page (src/pages/Upload.jsx)
 * Dedicated workspace for uploading single or multiple PDFs and photos
 * organized by Semester (1-8), Subject, Category, Title, and Tags.
 */
export default function Upload({
  files,
  subjectsBySemester,
  isAdmin = false,
  onSubjectsUpdated,
  onUploadSuccess,
  onPreview,
  onDownload,
  onToggleFavorite,
  onRenameSave,
  onDeleteConfirm,
  onSyncToSupabase,
  isSyncing = false,
  supabaseStatus,
  notify
}) {
  const recentUploads = files.slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
            Document Ingestion
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Upload Semester Notes &amp; Study Material
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Add lecture PDFs, previous year question papers, lab manuals, or handwritten
            whiteboard photos. Uploaded files are backed up to your Supabase project in real time.
          </p>
        </div>

        <Link
          to="/library"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#2563EB] dark:text-blue-400 bg-[#EFF6FF] dark:bg-slate-800 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap shrink-0"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Browse Library ({files.length})</span>
        </Link>
      </div>



      {/* Main Upload Form */}
      <div className="max-w-4xl mx-auto">
        <UploadBox
          subjectsBySemester={subjectsBySemester}
          isAdmin={isAdmin}
          onSubjectsUpdated={onSubjectsUpdated}
          onUploadSuccess={onUploadSuccess}
          notify={notify}
        />
      </div>

      {/* Recently Uploaded Files */}
      {recentUploads.length > 0 && (
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span>Latest Files in Your Vault</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {recentUploads.map((file) => (
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
        </div>
      )}
    </div>
  );
}
