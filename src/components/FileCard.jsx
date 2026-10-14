import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Video,
  Eye,
  Download,
  Star,
  Pencil,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { formatFileSize, getClientUploaderId } from '../lib/supabaseService';
import { SEMESTER_LIST, FILE_CATEGORIES } from '../data/subjects';

/**
 * Reusable FileCard Component (src/components/FileCard.jsx)
 * Renders in either Grid or List layout.
 * Zero-Pill Metadata Discipline: All static metadata (semester, subject, category,
 * date, file size, tags) is rendered as clean unboxed text with typographic separators (·).
 */
export default function FileCard({
  file,
  viewMode = 'grid',
  subjectsBySemester = {},
  isAdmin = false,
  onPreview,
  onDownload,
  onToggleFavorite,
  onRenameSave,
  onDeleteConfirm
}) {
  const [imgError, setImgError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const currentUploader = getClientUploaderId();
  const isOwner = Boolean(
    file && file.uploader_id && file.uploader_id === currentUploader
  );
  const canDelete = isAdmin || isOwner;
  const canEdit = Boolean(onRenameSave);

  const isRecentlyUploaded = Boolean(
    file &&
    file.created_at &&
    Date.now() - new Date(file.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
  );

  // Edit form state
  const [editTitle, setEditTitle] = useState(file.title);
  const [editSemester, setEditSemester] = useState(file.semester);
  const [editSubject, setEditSubject] = useState(file.subject);
  const [editCategory, setEditCategory] = useState(file.category);
  const [editTags, setEditTags] = useState(
    Array.isArray(file.tags) ? file.tags.join(', ') : ''
  );

  const formattedDate = new Date(file.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;
    onRenameSave(file.id, {
      title: editTitle.trim(),
      semester: Number(editSemester),
      subject: editSubject,
      category: editCategory,
      tags: editTags
    });
    setIsEditing(false);
  };

  // Inline Edit Modal / Form
  if (isEditing) {
    const semSubjects = subjectsBySemester[editSemester] || [file.subject];
    return (
      <form
        onSubmit={handleSaveEdit}
        className="bg-white dark:bg-slate-900 border-2 border-[#2563EB] rounded-2xl p-5 shadow-md space-y-3"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] dark:text-blue-400">
            Edit File Details
          </h4>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            aria-label="Cancel editing"
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            required
            className="w-full px-3 py-1.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#2563EB]"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Semester
            </label>
            <select
              value={editSemester}
              onChange={(e) => {
                const nextSem = Number(e.target.value);
                setEditSemester(nextSem);
                const nextSubjs = subjectsBySemester[nextSem] || [];
                if (nextSubjs.length > 0) setEditSubject(nextSubjs[0]);
              }}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {SEMESTER_LIST.map((s) => (
                <option key={s} value={s}>
                  Semester {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              {FILE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Subject
          </label>
          <select
            value={editSubject}
            onChange={(e) => setEditSubject(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          >
            {semSubjects.map((subj) => (
              <option key={subj} value={subj}>
                {subj}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-lg"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>
      </form>
    );
  }

  // List View Presentation
  if (viewMode === 'list') {
    return (
      <div className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] dark:hover:border-blue-500 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onPreview(file)}
            className="w-12 h-12 rounded-xl bg-[#EFF6FF] dark:bg-slate-800 text-[#2563EB] dark:text-blue-400 flex items-center justify-center shrink-0 overflow-hidden border border-blue-100 dark:border-slate-700 group-hover:scale-105 transition-transform"
            title="Preview file"
          >
            {file.file_type === 'image' && file.file_url && !imgError ? (
              <img
                src={file.file_url}
                alt={file.title}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : file.file_type === 'pdf' ? (
              <FileText className="w-5 h-5" />
            ) : file.file_type === 'video' ? (
              <Video className="w-5 h-5" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>

          <div className="min-w-0 flex-1">
            {/* Quiet Kicker Metadata */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span className="font-medium text-[#2563EB] dark:text-blue-400">
                Semester {file.semester}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{file.subject}</span>
              <span aria-hidden="true">·</span>
              <span>{file.category}</span>
              {isRecentlyUploaded && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 animate-pulse shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Uploaded Note
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => onPreview(file)}
              className="mt-0.5 text-left text-base font-semibold text-slate-900 dark:text-white hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors line-clamp-1"
            >
              {file.title}
            </button>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span>{file.file_type.toUpperCase()}</span>
              <span aria-hidden="true">·</span>
              <span>{formatFileSize(file.file_size)}</span>
              <span aria-hidden="true">·</span>
              <span>Uploaded {formattedDate}</span>
              {Array.isArray(file.tags) && file.tags.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-400 dark:text-slate-500">
                    #{file.tags.join(' #')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/50 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900">
              <span className="text-xs font-medium text-red-700 dark:text-red-300">
                Delete?
              </span>
              <button
                type="button"
                onClick={() => onDeleteConfirm(file)}
                className="px-2 py-0.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded"
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded"
              >
                No
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onPreview(file)}
                aria-label={`Preview ${file.title}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#2563EB] dark:text-blue-400 bg-[#EFF6FF] dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View</span>
              </button>

              <button
                type="button"
                onClick={() => onDownload(file)}
                aria-label={`Download ${file.title}`}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-[#2563EB] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onToggleFavorite(file)}
                aria-label={file.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                className={`p-2 rounded-lg transition-colors ${
                  file.is_favorite
                    ? 'text-[#2563EB] dark:text-blue-400 bg-[#EFF6FF] dark:bg-blue-950/60'
                    : 'text-slate-400 hover:text-[#2563EB] hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Favorite"
              >
                <Star className={`w-4 h-4 ${file.is_favorite ? 'fill-current' : ''}`} />
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  aria-label={`Edit details for ${file.title}`}
                  className="p-2 text-slate-500 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Rename / Edit details"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  aria-label={`Delete ${file.title}`}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  title={isAdmin ? 'Delete file (Admin)' : 'Delete your uploaded file'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Default Grid View Presentation
  return (
    <article className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-[#2563EB] dark:hover:border-blue-500 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Thumbnail / Preview Header */}
        <div
          onClick={() => onPreview(file)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onPreview(file);
            }
          }}
          className="relative h-40 w-full bg-[#EFF6FF]/70 dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center cursor-pointer group overflow-hidden"
        >
          {file.file_type === 'image' && file.file_url && !imgError ? (
            <img
              src={file.file_url}
              alt={file.title}
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-700 flex items-center justify-center text-[#2563EB] dark:text-blue-400 shadow-2xs group-hover:scale-105 transition-transform">
                {file.file_type === 'pdf' ? (
                  <FileText className="w-6 h-6" />
                ) : file.file_type === 'video' ? (
                  <Video className="w-6 h-6" />
                ) : (
                  <ImageIcon className="w-6 h-6" />
                )}
              </div>
              <span className="mt-2 text-[11px] font-mono uppercase tracking-wider text-[#1E3A8A] dark:text-blue-300">
                {file.file_type === 'pdf' ? 'PDF Document' : file.file_type === 'video' ? 'Video Lecture' : 'Study Image'}
              </span>
            </div>
          )}

          {/* Animated upload tag for recently uploaded notes */}
          {isRecentlyUploaded && (
            <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-600/95 text-white shadow-xs backdrop-blur-md animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              Uploaded
            </span>
          )}

          {/* Favorite button in top-right corner */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(file);
            }}
            aria-label={file.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
            className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-colors ${
              file.is_favorite
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-white/85 dark:bg-slate-900/85 text-slate-500 hover:text-[#2563EB]'
            }`}
          >
            <Star className={`w-4 h-4 ${file.is_favorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Card Content Body */}
        <div className="p-5">
          {/* 1-Line Quiet Text Kicker (Zero-Pill Discipline) */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate tabular-nums">
            <span className="font-semibold text-[#2563EB] dark:text-blue-400">
              Sem {file.semester}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{file.subject}</span>
          </div>

          {/* Primary Title */}
          <h3 className="mt-1.5 text-base font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">
            <button
              type="button"
              onClick={() => onPreview(file)}
              className="text-left hover:text-[#2563EB] dark:hover:text-blue-400 transition-colors"
            >
              {file.title}
            </button>
          </h3>

          {/* Unboxed Metadata Line */}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            <span>{file.category}</span>
            <span aria-hidden="true">·</span>
            <span>{formatFileSize(file.file_size)}</span>
            <span aria-hidden="true">·</span>
            <span>{formattedDate}</span>
          </div>

          {/* Tags as quiet inline text */}
          {Array.isArray(file.tags) && file.tags.length > 0 && (
            <p className="mt-2 text-xs text-slate-400 dark:text-slate-500 truncate">
              {file.tags.map((t) => `#${t}`).join('  ')}
            </p>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="px-5 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {isConfirmingDelete ? (
          <div className="w-full flex items-center justify-between text-xs">
            <span className="font-semibold text-red-600 dark:text-red-400">
              Confirm delete?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDeleteConfirm(file)}
                className="px-2.5 py-1 font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-2.5 py-1 font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPreview(file)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <button
                type="button"
                onClick={() => onDownload(file)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#2563EB] rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </button>
            </div>

            {(canEdit || canDelete) && (
              <div className="flex items-center gap-1">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    aria-label="Edit details"
                    title="Rename / Edit file details"
                    className="p-1.5 text-slate-500 hover:text-[#2563EB] dark:hover:text-blue-400 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    aria-label="Delete file"
                    title={isAdmin ? 'Delete file (Admin)' : 'Delete your uploaded file'}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </article>
  );
}
