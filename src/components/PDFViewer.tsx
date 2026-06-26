import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  Star,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { getStudyMaterialsByMaterial } from '../utils/studyMaterials';
import {
  saveStudyProgress,
  getStudyProgress,
  addRecentMaterial,
  toggleFavoriteMaterial,
  isMaterialFavorite
} from '../utils/indexedDB';

export const PDFViewer: React.FC = () => {
  const {
    activePdfMaterial,
    activePdfChapterId,
    navigate,
    addRecentActivity
  } = useApp();

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [rendering, setRendering] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTaskRef = useRef<any>(null);

  // Find the metadata of the active PDF material
  const activeMaterialList = activePdfMaterial ? getStudyMaterialsByMaterial(activePdfMaterial) : [];
  const currentMaterial = activeMaterialList.find(m => m.id === activePdfChapterId);

  const chapterUniqueId = currentMaterial ? `${currentMaterial.material}_${currentMaterial.id}` : '';
  const pdfUrl = currentMaterial
    ? `/study_materials/${currentMaterial.material}/${currentMaterial.pdfFileName}`
    : '';

  // Initial load: setup PDF.js document, check progress and favorites, and register recent open
  useEffect(() => {
    if (!currentMaterial || !pdfUrl) {
      setError('Invalid study material selected.');
      setLoading(false);
      return;
    }

    const initPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check if PDF.js is available
        const pdfjs = (window as any).pdfjsLib;
        if (!pdfjs) {
          throw new Error('PDF library is not loaded. Please try again.');
        }

        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        // Fetch initial favorite state
        const favStatus = await isMaterialFavorite(chapterUniqueId);
        setIsFavorited(favStatus);

        // Load PDF Document
        const loadingTask = pdfjs.getDocument(pdfUrl);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
        setNumPages(doc.numPages);

        // Fetch saved reading progress
        const savedProgress = await getStudyProgress(chapterUniqueId);
        let startPage = 1;
        if (savedProgress && savedProgress.lastPageRead <= doc.numPages) {
          startPage = savedProgress.lastPageRead;
        }
        setPageNumber(startPage);

        // Add to recently read IndexedDB list
        await addRecentMaterial({
          chapterUniqueId,
          material: currentMaterial.material,
          chapterId: currentMaterial.id,
          chapterNum: currentMaterial.num,
          chapterTitle: currentMaterial.title
        });

        // Add to Recent Activity timeline logs
        addRecentActivity(
          'library',
          currentMaterial.material,
          `Opened: ${currentMaterial.material.toUpperCase()} Ch ${currentMaterial.num}`,
          `Started reading ${currentMaterial.title}`,
          currentMaterial.id
        );

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading PDF:', err);
        setError(err.message || 'Failed to load PDF document.');
        setLoading(false);
      }
    };

    initPDF();

    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [pdfUrl, chapterUniqueId]);

  // Page renderer execution on pageNumber or scale change
  useEffect(() => {
    if (!pdfDoc || loading) return;
    renderPage(pageNumber, scale);
  }, [pdfDoc, pageNumber, scale, loading]);

  async function renderPage(pageNum: number, currentScale: number) {
    try {
      setRendering(true);
      const page = await pdfDoc.getPage(pageNum);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext('2d');
      if (!context) return;

      const viewport = page.getViewport({ scale: currentScale });
      const outputScale = window.devicePixelRatio || 1;

      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = Math.floor(viewport.width) + 'px';
      canvas.style.height = Math.floor(viewport.height) + 'px';

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }

      const renderContext = {
        canvasContext: context,
        transform: transform ? transform : undefined,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
      setRendering(false);

      // Auto save reading progress to IndexedDB
      if (currentMaterial) {
        await saveStudyProgress({
          chapterUniqueId,
          material: currentMaterial.material,
          chapterId: currentMaterial.id,
          chapterNum: currentMaterial.num,
          chapterTitle: currentMaterial.title,
          lastPageRead: pageNum,
          totalPages: pdfDoc.numPages,
          percentage: Math.round((pageNum / pdfDoc.numPages) * 100),
          timestamp: Date.now()
        });
      }
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('Error rendering page:', err);
        setRendering(false);
      }
    }
  }

  // Adjust initial scale to fit mobile screen width
  const handleFitToWidth = async () => {
    if (!pdfDoc) return;
    try {
      const page = await pdfDoc.getPage(pageNumber);
      const containerWidth = containerRef.current?.clientWidth || window.innerWidth;
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      // Calculate scale to fit page inside viewport with padding
      const initialScale = (containerWidth - 32) / unscaledViewport.width;
      setScale(parseFloat(initialScale.toFixed(2)));
    } catch (err) {
      console.error('Error adjusting fit scale:', err);
    }
  };

  // Run auto-fit scale after PDF document loads
  useEffect(() => {
    if (pdfDoc && !loading) {
      handleFitToWidth();
    }
  }, [pdfDoc, loading]);

  const handlePrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pageNumber < numPages) {
      setPageNumber(prev => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => parseFloat((prev + 0.15).toFixed(2)));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, parseFloat((prev - 0.15).toFixed(2))));
  };

  const handleDownload = () => {
    if (!pdfUrl || !currentMaterial) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = currentMaterial.pdfFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (!pdfUrl || !currentMaterial) return;
    const shareUrl = window.location.origin + pdfUrl;
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentMaterial.title,
          text: `Read SAIL revision chapter: ${currentMaterial.title}`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Web share aborted or failed:', err);
      }
    } else {
      // Fallback: Copy to Clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Material link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy share link:', err);
      }
    }
  };

  const handleToggleFavorite = async () => {
    if (!currentMaterial) return;
    const added = await toggleFavoriteMaterial({
      chapterUniqueId,
      material: currentMaterial.material,
      chapterId: currentMaterial.id,
      chapterNum: currentMaterial.num,
      chapterTitle: currentMaterial.title
    });
    setIsFavorited(added);
  };

  const handleClose = () => {
    navigate('dashboard');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <Loader2 className="animate-spin text-cyan-600 h-10 w-10 mb-3" />
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-350">Preparing Document Reader...</h3>
        <p className="text-xs text-slate-400 mt-1">Caching PDF chapter bytes for offline viewing.</p>
      </div>
    );
  }

  if (error || !currentMaterial) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-950 space-y-4">
        <X className="text-rose-500 h-12 w-12" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Failed to Open Study Chapter</h3>
        <p className="text-xs text-slate-450 dark:text-slate-500 max-w-xs">{error || 'Invalid PDF configuration.'}</p>
        <button
          onClick={handleClose}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-750 dark:text-slate-250 text-xs font-bold uppercase rounded-xl"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const completionPercent = Math.round((pageNumber / numPages) * 100);

  return (
    <div
      className={`flex-1 flex flex-col justify-between overflow-hidden bg-slate-900 text-slate-100 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-slate-950' : 'relative'
      }`}
    >
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center p-4 bg-slate-950 border-b border-slate-800 shrink-0 select-none">
        <div className="min-w-0 flex-1 pr-4">
          <span className="text-[9px] text-cyan-400 font-extrabold uppercase tracking-widest">
            {currentMaterial.material.toUpperCase()} Chapter {currentMaterial.num}
          </span>
          <h2 className="text-xs font-bold text-slate-200 truncate leading-snug">
            {currentMaterial.title}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-black text-slate-500 uppercase tracking-wider">
            <span>Page {pageNumber} of {numPages}</span>
            <span>•</span>
            <span className="text-cyan-400">{completionPercent}% Read</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`w-11 h-11 flex items-center justify-center rounded-xl border border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors ${
              isFavorited ? 'text-amber-500 bg-slate-850' : 'text-slate-400'
            }`}
            title="Favorite Material"
          >
            <Star size={16} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleClose}
            className="w-11 h-11 flex items-center justify-center text-slate-400 border border-slate-800 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
            title="Exit Reader"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Main Canvas Scroll Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-900 select-none relative"
      >
        {rendering && (
          <div className="absolute top-4 right-4 z-10 p-2 bg-slate-950/70 backdrop-blur-sm border border-slate-800 text-cyan-400 rounded-xl flex items-center gap-1.5 text-[9px] font-black uppercase">
            <RefreshCw size={10} className="animate-spin" /> Rendering...
          </div>
        )}
        
        <div className="bg-white rounded-xl shadow-2xl p-1 shrink-0 overflow-hidden">
          <canvas ref={canvasRef} className="block max-w-full" />
        </div>
      </div>

      {/* Bottom Control Actions Panel */}
      <footer className="bg-slate-950 border-t border-slate-800 p-4 shrink-0 space-y-3">
        {/* Page progress navigation bar */}
        <div className="flex justify-between items-center gap-3">
          <button
            onClick={handlePrevPage}
            disabled={pageNumber <= 1 || rendering}
            className="w-11 h-11 flex items-center justify-center bg-slate-850 border border-slate-800 rounded-xl text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-transform"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold">
            <input
              type="number"
              value={pageNumber}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 1 && val <= numPages) {
                  setPageNumber(val);
                }
              }}
              min={1}
              max={numPages}
              disabled={rendering}
              className="w-12 h-9 bg-slate-900 border border-slate-800 text-center rounded-lg font-bold text-slate-200"
            />
            <span className="text-slate-400">of</span>
            <span className="font-bold text-slate-350">{numPages}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={pageNumber >= numPages || rendering}
            className="w-11 h-11 flex items-center justify-center bg-slate-850 border border-slate-800 rounded-xl text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-90 transition-transform"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Action icons bar */}
        <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-900">
          <div className="flex gap-2">
            <button
              onClick={handleZoomOut}
              className="w-11 h-11 flex items-center justify-center bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer active:scale-95 transition-transform"
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <span className="flex items-center text-[10px] font-black text-slate-500 w-12 justify-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="w-11 h-11 flex items-center justify-center bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer active:scale-95 transition-transform"
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleFitToWidth}
              className="px-3 h-11 flex items-center justify-center bg-slate-900 border border-slate-850 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-slate-200 cursor-pointer active:scale-95"
              title="Auto Fit"
            >
              Fit
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="w-11 h-11 flex items-center justify-center bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer active:scale-95 transition-transform"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={handleDownload}
              className="w-11 h-11 flex items-center justify-center bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer active:scale-95 transition-transform"
              title="Download PDF"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handleShare}
              className="w-11 h-11 flex items-center justify-center bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 cursor-pointer active:scale-95 transition-transform"
              title="Share Link"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
