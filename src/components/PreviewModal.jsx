import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Star
} from 'lucide-react';
import { formatFileSize, getFileDataUrlFromIDB } from '../lib/supabaseService';
import PdfViewer from './PdfViewer';

/**
 * Preview Modal Component (src/components/PreviewModal.jsx)
 * Supports embedded high-performance Canvas PDF viewing via PDF.js and
 * high-resolution Image viewing with interactive Zoom In / Zoom Out / Reset / Rotate controls.
 */
export default function PreviewModal({
  file,
  onClose,
  onDownload,
  onToggleFavorite
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageSrc, setImageSrc] = useState(null);

  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [file]);

  // Ensure image source is resolved (handles idb://stored)
  useEffect(() => {
    let cancelled = false;
    async function resolveSource() {
      if (!file) return;
      if (file.file_type !== 'pdf') {
        if (!file.file_url || file.file_url === 'idb://stored') {
          const stored = await getFileDataUrlFromIDB(file.id);
          if (!cancelled && stored) {
            setImageSrc(stored);
            return;
          }
        }
        if (!cancelled) {
          setImageSrc(file.file_url);
        }
      }
    }
    resolveSource();
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!file) return null;

  const isPdf = file.file_type === 'pdf';
  const isVideo = file.file_type === 'video';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-5"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Top Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              <span className="font-semibold text-[#2563EB] dark:text-blue-400">
                Semester {file.semester}
              </span>
              <span aria-hidden="true">·</span>
              <span className="truncate">{file.subject}</span>
              <span aria-hidden="true">·</span>
              <span>{file.category}</span>
              <span aria-hidden="true">·</span>
              <span>{formatFileSize(file.file_size)}</span>
            </div>
            <h2
              id="preview-modal-title"
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate mt-0.5"
            >
              {file.title}
            </h2>
          </div>

          {/* Interactive Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {!isPdf && !isVideo && (
              <div className="hidden sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mr-1">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
                  aria-label="Zoom out"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="px-2 text-xs font-mono tabular-nums text-slate-700 dark:text-slate-200">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
                  aria-label="Zoom in"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  aria-label="Rotate 90 degrees"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                  }}
                  aria-label="Reset zoom"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => onToggleFavorite(file)}
              aria-label={file.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              className={`p-2 rounded-xl border transition-colors ${
                file.is_favorite
                  ? 'bg-[#EFF6FF] dark:bg-blue-950/70 border-[#2563EB] text-[#2563EB] dark:text-blue-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-[#2563EB]'
              }`}
            >
              <Star className={`w-4 h-4 ${file.is_favorite ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => onDownload(file)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview modal"
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Viewport */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 overflow-hidden flex flex-col relative">
          {isPdf ? (
            <PdfViewer file={file} onDownload={onDownload} />
          ) : isVideo ? (
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-950">
              {imageSrc ? (
                <video
                  src={imageSrc}
                  controls
                  autoPlay
                  className="max-h-[75vh] max-w-full rounded-xl shadow-2xl bg-black"
                >
                  Your browser does not support HTML5 video playback.
                </video>
              ) : (
                <div className="text-center p-8 text-slate-400">Loading video player...</div>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
              <div className="overflow-auto max-w-full max-h-full flex items-center justify-center">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={file.title}
                    referrerPolicy="no-referrer"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transition: 'transform 150ms cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    className="max-h-[75vh] w-auto object-contain rounded-lg shadow-md"
                  />
                ) : (
                  <div className="text-center p-8 text-slate-400">Loading image preview...</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
