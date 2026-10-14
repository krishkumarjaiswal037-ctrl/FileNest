import React from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  BookOpen,
  Star,
  ArrowRight
} from 'lucide-react';
import { formatFileSize } from '../lib/supabaseService';

/**
 * Hero Section Component (src/components/Hero.jsx)
 * Features blue gradient surface, structured B.Tech CSE preview cards,
 * two CTAs ("Upload Files" and "Browse Library"), and a live database stats bar.
 */
export default function Hero({ files = [], subjectsBySemester = {}, onOpenPreview }) {
  const totalPdfs = files.filter((f) => f.file_type === 'pdf').length;
  const totalPhotos = files.filter((f) => f.file_type === 'image').length;
  const favoritesCount = files.filter((f) => f.is_favorite).length;

  // Compute unique subjects across uploaded files + curriculum
  const uniqueUploadedSubjects = new Set(files.map((f) => f.subject));
  const totalCurriculumSubjects = Object.values(subjectsBySemester).reduce(
    (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
    0
  );

  const totalBytes = files.reduce((sum, f) => sum + (Number(f.file_size) || 0), 0);
  const featuredFiles = files.slice(0, 3);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#2563EB] text-white">
      {/* Subtle architectural grid lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-14 lg:pt-16 lg:pb-18">
        {/* 2-Column Split with items-stretch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          {/* Left Column: Primary Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <p className="text-xs font-mono tracking-wider text-blue-200 mb-3">
              B.Tech Computer Science & Engineering · Semesters 1 to 8
            </p>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-white leading-[1.15] max-w-2xl">
              Your Semester Notes, Organized &amp; Always With You
            </h1>

            <p className="mt-4 text-base sm:text-lg text-blue-100 leading-relaxed max-w-xl">
              Upload, organize, preview, and download lecture PDFs, previous year question
              papers, lab manuals, and handwritten whiteboard diagrams across all eight B.Tech
              CSE semesters.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/upload"
                className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-[#1E3A8A] bg-white hover:bg-[#EFF6FF] rounded-xl shadow-sm transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                <UploadCloud className="w-4 h-4 text-[#2563EB]" aria-hidden="true" />
                <span>Upload Files</span>
              </Link>

              <Link
                to="/library"
                className="inline-flex items-center gap-2.5 px-6 py-3 text-sm font-semibold text-white bg-[#1E3A8A]/70 hover:bg-[#1E3A8A] border border-blue-300/30 rounded-xl transition-colors duration-150 whitespace-nowrap shrink-0"
              >
                <FolderOpen className="w-4 h-4 text-blue-200" aria-hidden="true" />
                <span>Browse Library</span>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-white/15 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-blue-100">
              <span>PDF &amp; Image Zoom Preview</span>
              <span aria-hidden="true">·</span>
              <span>8-Semester Folder Hierarchy</span>
              <span aria-hidden="true">·</span>
              <span>CGPA, Attendance &amp; Placement Suite</span>
            </div>
          </div>

          {/* Right Column: Interactive Floating Repository Preview Card */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/15">
                <div>
                  <h2 className="text-sm font-semibold text-white">
                    Recent Vault Additions
                  </h2>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Click any file below for instant preview
                  </p>
                </div>
                <Link
                  to="/library"
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-100 hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Open Vault</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="mt-4 divide-y divide-white/10">
                {featuredFiles.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => onOpenPreview && onOpenPreview(file)}
                    className="w-full py-3.5 first:pt-1 last:pb-1 text-left flex items-start gap-3.5 group hover:bg-white/5 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                      {file.file_type === 'pdf' ? (
                        <FileText className="w-4 h-4 text-white" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-blue-200" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate group-hover:underline">
                        {file.title}
                      </p>
                      <p className="text-xs text-blue-200 mt-0.5 truncate tabular-nums">
                        Sem {file.semester} · {file.subject} · {formatFileSize(file.file_size)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/15 flex items-center justify-between text-xs text-blue-100 tabular-nums">
              <span>Storage Used: {formatFileSize(totalBytes)}</span>
              <span>Max Upload: 20 MB / file</span>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Live Stats Strip */}
        <div className="mt-10 pt-8 border-t border-white/15 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-blue-200 text-xs font-medium">
              <span>Total PDF Documents</span>
              <FileText className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
              {totalPdfs}
            </p>
            <p className="mt-1 text-xs text-blue-200">
              Lecture notes, PYQs &amp; manuals
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-blue-200 text-xs font-medium">
              <span>Total Photos &amp; Diagrams</span>
              <ImageIcon className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
              {totalPhotos}
            </p>
            <p className="mt-1 text-xs text-blue-200">
              Handwritten sheets &amp; whiteboards
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-blue-200 text-xs font-medium">
              <span>Total CSE Subjects</span>
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
              {uniqueUploadedSubjects.size} / {totalCurriculumSubjects}
            </p>
            <p className="mt-1 text-xs text-blue-200">
              Active subjects across 8 semesters
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between text-blue-200 text-xs font-medium">
              <span>Starred Favorites</span>
              <Star className="w-4 h-4" aria-hidden="true" />
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
              {favoritesCount}
            </p>
            <p className="mt-1 text-xs text-blue-200">
              Pinned for quick exam revision
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
