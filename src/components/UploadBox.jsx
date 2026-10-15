import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  SEMESTER_LIST,
  FILE_CATEGORIES,
  addCustomSubjectToSemester
} from '../data/subjects';
import { uploadStudyFile, formatFileSize, addSubjectToSupabase } from '../lib/supabaseService';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
const ACCEPTED_MIME_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov']
};

/**
 * Reusable Multi-File UploadBox Component (src/components/UploadBox.jsx)
 * Supports drag-and-drop, file validation (PDF, JPG, JPEG, PNG, WEBP, MP4, WEBM up to 50 MB),
 * individual file progress bars, dynamic semester-wise subject selector, and admin-only custom subject creation.
 */
export default function UploadBox({
  subjectsBySemester,
  isAdmin = false,
  onSubjectsUpdated,
  onUploadSuccess,
  notify
}) {
  const [semester, setSemester] = useState(3);
  const [subject, setSubject] = useState('');
  const [isAddingCustomSubject, setIsAddingCustomSubject] = useState(false);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [category, setCategory] = useState(FILE_CATEGORIES[0]);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');

  // Queued files: { id, file, progress, status: 'queued' | 'uploading' | 'done' | 'error', errorMsg }
  const [queuedFiles, setQueuedFiles] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSemesterSubjects = subjectsBySemester[semester] || [];

  // Keep subject synced when semester changes or subjects update
  useEffect(() => {
    const list = subjectsBySemester[semester] || [];
    if (list.length > 0) {
      if (!subject || !list.includes(subject)) {
        setSubject(list[0]);
      }
    } else {
      setSubject('');
    }
  }, [semester, subjectsBySemester, subject]);

  // Listen for subjects updates dispatched from Admin or Tools
  useEffect(() => {
    const handleSubjectsSync = (e) => {
      if (e.detail && onSubjectsUpdated) {
        onSubjectsUpdated(e.detail);
      }
    };
    window.addEventListener('filenest_subjects_updated', handleSubjectsSync);
    return () => window.removeEventListener('filenest_subjects_updated', handleSubjectsSync);
  }, [onSubjectsUpdated]);

  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      const errors = [];

      fileRejections.forEach((rejection) => {
        const { file, errors: dropErrors } = rejection;
        dropErrors.forEach((err) => {
          if (err.code === 'file-too-large') {
            errors.push(`"${file.name}" exceeds the 50 MB maximum size limit (${formatFileSize(file.size)}).`);
          } else if (err.code === 'file-invalid-type') {
            errors.push(`"${file.name}" has an unsupported format. Allowed: PDF, JPG, JPEG, PNG, WEBP, MP4, WEBM, MOV.`);
          } else {
            errors.push(`"${file.name}": ${err.message}`);
          }
        });
      });

      setValidationErrors(errors);
      if (errors.length > 0 && notify) {
        notify(errors[0], 'error');
      }

      if (acceptedFiles.length > 0) {
        const newItems = acceptedFiles.map((file) => ({
          id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          file,
          customTitle: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '),
          progress: 0,
          status: 'queued',
          errorMsg: null
        }));
        setQueuedFiles((prev) => [...prev, ...newItems]);
      }
    },
    [notify]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME_TYPES,
    maxSize: MAX_FILE_SIZE_BYTES,
    noClick: true
  });

  const handleAddCustomSubject = async () => {
    const trimmed = customSubjectInput.trim();
    if (!trimmed) {
      if (notify) notify('Please enter a subject name.', 'error');
      return;
    }
    try {
      const updatedMap = await addSubjectToSupabase(semester, trimmed, true);
      if (onSubjectsUpdated) onSubjectsUpdated(updatedMap);
      setSubject(trimmed);
      setCustomSubjectInput('');
      setIsAddingCustomSubject(false);
      if (notify) notify(`Added "${trimmed}" to Semester ${semester}.`, 'success');
    } catch (err) {
      const updatedMap = addCustomSubjectToSemester(semester, trimmed);
      if (onSubjectsUpdated) onSubjectsUpdated(updatedMap);
      setSubject(trimmed);
      setCustomSubjectInput('');
      setIsAddingCustomSubject(false);
      if (notify) notify(`Added "${trimmed}" to Semester ${semester}.`, 'success');
    }
  };

  const handleRemoveQueuedFile = (id) => {
    setQueuedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadAll = async (e) => {
    e.preventDefault();
    if (queuedFiles.length === 0) {
      if (notify) notify('Please select or drop at least one PDF or image file to upload.', 'error');
      return;
    }
    if (!subject) {
      if (notify) notify('Please select a subject for this upload.', 'error');
      return;
    }

    setIsSubmitting(true);
    setValidationErrors([]);
    const uploadedResults = [];

    for (const item of queuedFiles) {
      if (item.status === 'done') continue;

      setQueuedFiles((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', progress: 5 } : q))
      );

      try {
        const effectiveTitle =
          queuedFiles.length === 1 && title.trim()
            ? title.trim()
            : title.trim()
            ? `${title.trim()} (${item.customTitle})`
            : item.customTitle;

        const savedRecord = await uploadStudyFile({
          file: item.file,
          title: effectiveTitle,
          semester,
          subject,
          category,
          tags,
          onProgress: (pct) => {
            setQueuedFiles((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, progress: pct } : q))
            );
          }
        });

        uploadedResults.push(savedRecord);
        setQueuedFiles((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: 'done', progress: 100 } : q))
        );
      } catch (err) {
        const message = err?.message || 'Upload failed';
        setQueuedFiles((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: 'error', errorMsg: message } : q
          )
        );
        if (notify) notify(`Failed to upload "${item.file.name}": ${message}`, 'error');
      }
    }

    setIsSubmitting(false);

    if (uploadedResults.length > 0) {
      if (onUploadSuccess) onUploadSuccess(uploadedResults);
      if (notify) {
        const syncedToSupabaseCount = uploadedResults.filter((r) => r._syncedToSupabase).length;
        if (syncedToSupabaseCount === uploadedResults.length) {
          notify(
            `Uploaded ${uploadedResults.length} ${
              uploadedResults.length === 1 ? 'file' : 'files'
            } to Supabase Table Editor & Storage! (Semester ${semester} · ${subject})`,
            'success'
          );
        } else if (syncedToSupabaseCount > 0) {
          notify(
            `Uploaded ${syncedToSupabaseCount} file(s) to Supabase, and remaining to local vault.`,
            'success'
          );
        } else {
          const firstErr = uploadedResults.find((r) => r._supabaseError)?._supabaseError;
          notify(
            `Saved to local vault. ${firstErr ? `(Supabase: ${firstErr})` : 'Use Sync to push to Supabase.'}`,
            'info'
          );
        }
      }
      setTitle('');
      setTags('');
      setTimeout(() => {
        setQueuedFiles((prev) => prev.filter((q) => q.status !== 'done'));
      }, 1200);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs">
      <form onSubmit={handleUploadAll} className="space-y-6">
        {/* Form Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Semester Selector */}
          <div>
            <label
              htmlFor="upload-semester"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
            >
              Semester (1 to 8) *
            </label>
            <select
              id="upload-semester"
              value={semester}
              onChange={(e) => {
                setSemester(Number(e.target.value));
                setIsAddingCustomSubject(false);
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#2563EB] transition-colors"
            >
              {SEMESTER_LIST.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Dynamic Subject Selector + Custom Subject Option */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="upload-subject"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Subject (Sem {semester}) *
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCustomSubject((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#2563EB] dark:text-blue-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingCustomSubject ? 'Select existing' : '+ Add subject'}</span>
              </button>
            </div>

            {isAddingCustomSubject ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customSubjectInput}
                  onChange={(e) => setCustomSubjectInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSubject();
                    }
                  }}
                  placeholder="e.g. Operating Systems"
                  aria-label="New subject name"
                  className="flex-1 min-w-0 px-3.5 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-[#2563EB] rounded-xl focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSubject}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0"
                >
                  Save
                </button>
              </div>
            ) : (
              <select
                id="upload-subject"
                value={subject}
                onChange={(e) => {
                  if (e.target.value === '__ADD_CUSTOM__') {
                    setIsAddingCustomSubject(true);
                  } else {
                    setSubject(e.target.value);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#2563EB] transition-colors"
              >
                {currentSemesterSubjects.length === 0 ? (
                  <option value="">No subjects yet for Sem {semester} (Click + Add)</option>
                ) : (
                  currentSemesterSubjects.map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))
                )}
                <option value="__ADD_CUSTOM__">+ Add new subject for Sem {semester}...</option>
              </select>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <label
              htmlFor="upload-category"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
            >
              Document Category *
            </label>
            <select
              id="upload-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#2563EB] transition-colors"
            >
              {FILE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Title & Tags Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label
              htmlFor="upload-title"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
            >
              Document Title (optional — defaults to filename)
            </label>
            <input
              id="upload-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 Complete Graph Algorithms Notes"
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="upload-tags"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
            >
              Searchable Tags (comma-separated, optional)
            </label>
            <input
              id="upload-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. midsem, important, dijkstra, unit-3"
              className="w-full px-3.5 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
            isDragActive
              ? 'border-[#2563EB] bg-[#EFF6FF] dark:bg-blue-950/40'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-[#2563EB]'
          }`}
        >
          <input {...getInputProps()} aria-label="File upload dropzone input" />
          <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/80 text-[#2563EB] dark:text-blue-400 flex items-center justify-center mx-auto">
            <UploadCloud className="w-6 h-6" aria-hidden="true" />
          </div>

          <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
            {isDragActive
              ? 'Drop your PDFs or handwritten note photos here...'
              : 'Drag & drop study files here, or browse from your device'}
          </h3>

          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Accepted formats: PDF, JPG, PNG, WEBP, MP4, WEBM · Maximum size: 50 MB per file
          </p>

          <div className="mt-5">
            <button
              type="button"
              onClick={open}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#2563EB] dark:text-blue-300 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 hover:border-[#2563EB] hover:bg-[#EFF6FF]/50 rounded-xl shadow-2xs transition-colors whitespace-nowrap shrink-0"
            >
              <span>Browse Files</span>
            </button>
          </div>
        </div>

        {/* Validation Error Alert */}
        {validationErrors.length > 0 && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs space-y-1"
          >
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>File Validation Error</span>
            </div>
            <ul className="list-disc list-inside pl-1 space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Queued Files List with Individual Progress Bars */}
        {queuedFiles.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
              <span>Selected Files ({queuedFiles.length})</span>
              <button
                type="button"
                onClick={() => setQueuedFiles([])}
                disabled={isSubmitting}
                className="text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                Clear queue
              </button>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              {queuedFiles.map((item) => {
                const isPdf =
                  item.file.type === 'application/pdf' ||
                  item.file.name.toLowerCase().endsWith('.pdf');

                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all duration-300 flex flex-col gap-2 ${
                      item.status === 'done'
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-xs animate-in fade-in zoom-in-98 duration-300'
                        : item.status === 'uploading'
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 animate-pulse'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
                          item.status === 'done'
                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 scale-105'
                            : 'bg-[#EFF6FF] dark:bg-slate-800 text-[#2563EB] dark:text-blue-400'
                        }`}>
                          {item.status === 'done' ? (
                            <CheckCircle2 className="w-4 h-4 animate-bounce" />
                          ) : isPdf ? (
                            <FileText className="w-4 h-4" />
                          ) : (
                            <ImageIcon className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {item.file.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                            {formatFileSize(item.file.size)} · Sem {semester} · {subject}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'uploading' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2563EB] dark:text-blue-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span className="tabular-nums font-mono">{item.progress}%</span>
                          </span>
                        )}
                        {item.status === 'done' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 shadow-2xs animate-in zoom-in-95 duration-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-bounce" />
                            <span>Uploaded!</span>
                          </span>
                        )}
                        {item.status === 'error' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                            <AlertCircle className="w-4 h-4" />
                            <span>Failed</span>
                          </span>
                        )}
                        {item.status !== 'uploading' && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQueuedFile(item.id)}
                            aria-label={`Remove ${item.file.name}`}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-150 ${
                          item.status === 'error'
                            ? 'bg-red-600'
                            : item.status === 'done'
                            ? 'bg-emerald-600'
                            : 'bg-[#2563EB]'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting || queuedFiles.length === 0}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading to FileNest...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                <span>
                  Upload {queuedFiles.length > 0 ? `${queuedFiles.length} File(s)` : 'Files'}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
