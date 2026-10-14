import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Download,
  AlertCircle,
  FileText,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { getFileDataUrlFromIDB, downloadFile, formatFileSize } from '../lib/supabaseService';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

/**
 * High-performance, canvas-based PDF Viewer component.
 * Renders PDF documents natively inside the React viewport without iframe sandbox limitations.
 * Supports multi-page navigation, zooming, rotation, and direct downloading.
 */
export default function PdfViewer({ file, onDownload }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.15);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError] = useState(null);
  const [resolvedUrl, setResolvedUrl] = useState(null);

  // Helper to extract bytes from file_url (data URL, blob, or remote)
  const extractPdfBytes = async (targetFile) => {
    let url = targetFile.file_url;
    if (!url || url === 'idb://stored') {
      url = await getFileDataUrlFromIDB(targetFile.id);
    }
    if (!url) {
      throw new Error('PDF content data was not found in vault storage.');
    }
    setResolvedUrl(url);

    if (url.startsWith('data:')) {
      const commaIndex = url.indexOf(',');
      if (commaIndex === -1) throw new Error('Invalid data URI format.');
      const header = url.slice(0, commaIndex);
      const dataPart = url.slice(commaIndex + 1);
      const isBase64 = header.includes('base64');

      if (isBase64) {
        const binaryString = atob(dataPart);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      } else {
        const decoded = decodeURIComponent(dataPart);
        return new TextEncoder().encode(decoded);
      }
    } else if (url.startsWith('blob:')) {
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      return new Uint8Array(buffer);
    } else {
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
      return new Uint8Array(buffer);
    }
  };

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      if (!file) return;
      setLoading(true);
      setError(null);
      setPdfDoc(null);

      try {
        const bytes = await extractPdfBytes(file);
        const loadingTask = pdfjsLib.getDocument({
          data: bytes,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setScale(1.15);
        setRotation(0);
        setLoading(false);
      } catch (err) {
        if (isCancelled) return;
        console.error('PDF.js document load error:', err);
        setError(err?.message || 'Failed to parse and render this PDF document.');
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [file]);

  // Render Current Page on Canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let renderTask = null;
    let isCancelled = false;

    async function renderPage() {
      setRendering(true);
      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale, rotation });

        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (err) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Page render warning:', err);
        }
      } finally {
        if (!isCancelled) {
          setRendering(false);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore cancel error
        }
      }
    };
  }, [pdfDoc, currentPage, scale, rotation]);

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(numPages, p + 1));
  };

  const handleZoomIn = () => {
    setScale((s) => Math.min(2.5, Number((s + 0.2).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(0.5, Number((s - 0.2).toFixed(2))));
  };

  const handleRotate = () => {
    setRotation((r) => (r + 90) % 360);
  };

  const handleResetZoom = () => {
    setScale(1.15);
    setRotation(0);
  };

  const handleDirectDownload = async () => {
    if (onDownload) {
      onDownload(file);
    } else {
      await downloadFile(file);
    }
  };

  const handleOpenRaw = () => {
    if (resolvedUrl) {
      const win = window.open();
      if (win) {
        win.location.href = resolvedUrl;
      }
    }
  };

  // Loading View
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[360px]">
        <Loader2 className="w-10 h-10 text-[#2563EB] animate-spin mb-3" />
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Loading PDF Document...
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
          Rendering high-resolution vector pages for "{file.title}"
        </p>
      </div>
    );
  }

  // Error Fallback View
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full max-w-md mx-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {file.title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Semester {file.semester} · {file.subject} · {formatFileSize(file.file_size)}
        </p>

        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-left text-xs text-slate-600 dark:text-slate-300 w-full space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
            Document is ready for download
          </p>
          <p className="text-slate-500 dark:text-slate-400">
            You can download the full original file directly or open it in a new window.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleDirectDownload}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1E3A8A] rounded-xl shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>

          {resolvedUrl && (
            <button
              type="button"
              onClick={handleOpenRaw}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in New Tab</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-200/70 dark:bg-slate-950 overflow-hidden">
      {/* Top Floating Control Bar for PDF */}
      <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Page Switcher */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1}
            aria-label="Previous Page"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums px-1">
            Page <strong className="font-semibold">{currentPage}</strong> of{' '}
            <span>{numPages || 1}</span>
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= numPages}
            aria-label="Next Page"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleZoomOut}
            aria-label="Zoom Out"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono tabular-nums text-slate-700 dark:text-slate-300 px-1.5 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            aria-label="Zoom In"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRotate}
            aria-label="Rotate 90 degrees"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleResetZoom}
            aria-label="Reset zoom and rotation"
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Reset Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main PDF Canvas Scroll Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center relative"
      >
        <div className="relative inline-block max-w-full shadow-2xl rounded-lg overflow-hidden bg-white">
          <canvas
            ref={canvasRef}
            className="block max-w-none transition-transform"
            style={{ display: 'block' }}
          />

          {rendering && (
            <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xs flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
