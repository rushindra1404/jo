import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ChevronLeft,
  Search,
  Star,
  FileText,
  CheckCircle2,
  X
} from 'lucide-react';
import { getStudyMaterialsByMaterial } from '../utils/studyMaterials';
import type { StudyMaterial } from '../utils/studyMaterials';
import {
  getAllStudyProgress,
  getFavoriteMaterials,
  toggleFavoriteMaterial,
} from '../utils/indexedDB';
import type { StudyProgress } from '../utils/indexedDB';

export const StudyLibraryScreen: React.FC = () => {
  const {
    activePdfMaterial,
    setActivePdfMaterial,
    setActivePdfChapterId,
    navigate
  } = useApp();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [progressMap, setProgressMap] = useState<Record<string, StudyProgress>>({});
  const [favoritesSet, setFavoritesSet] = useState<Set<string>>(new Set());

  const material = activePdfMaterial || 'ica';
  const materialsList = getStudyMaterialsByMaterial(material);

  // Load IndexedDB reading progress and favorites list
  const loadIndexedDBData = async () => {
    try {
      const progresses = await getAllStudyProgress();
      const pRecord: Record<string, StudyProgress> = {};
      progresses.forEach(p => {
        pRecord[p.chapterUniqueId] = p;
      });
      setProgressMap(pRecord);

      const favs = await getFavoriteMaterials();
      const fSet = new Set<string>(favs.map(f => f.chapterUniqueId));
      setFavoritesSet(fSet);
    } catch (error) {
      console.error('Error loading library data from IndexedDB:', error);
    }
  };

  useEffect(() => {
    loadIndexedDBData();
  }, [material]);

  // Handle favorite star toggle click
  const handleFavoriteToggle = async (ch: StudyMaterial, e: React.MouseEvent) => {
    e.stopPropagation();
    const chUniqueId = `${ch.material}_${ch.id}`;
    const added = await toggleFavoriteMaterial({
      chapterUniqueId: chUniqueId,
      material: ch.material,
      chapterId: ch.id,
      chapterNum: ch.num,
      chapterTitle: ch.title
    });

    setFavoritesSet(prev => {
      const next = new Set(prev);
      if (added) {
        next.add(chUniqueId);
      } else {
        next.delete(chUniqueId);
      }
      return next;
    });
  };

  const handleOpenPdf = (chapterId: string) => {
    setActivePdfMaterial(material);
    setActivePdfChapterId(chapterId);
    navigate('pdf-viewer');
  };

  const handleBack = () => {
    navigate('dashboard');
  };

  // Filter study materials by search query
  const filteredMaterials = materialsList.filter(ch => {
    const q = searchQuery.toLowerCase();
    return (
      ch.title.toLowerCase().includes(q) ||
      `chapter ${ch.num}`.includes(q) ||
      ch.pdfFileName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6">
      {/* Header Area */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={handleBack}
          className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-350 hover:bg-slate-105 dark:hover:bg-slate-800 cursor-pointer animate-in fade-in"
          aria-label="Back to dashboard"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-extrabold uppercase">
            Study Materials Library
          </span>
          <h2 className="text-base font-extrabold text-slate-850 dark:text-slate-100 font-sans mt-0.5 capitalize">
            {material === 'ica' ? 'ICA General' : 'GPOE Technical'} PDFs
          </h2>
        </div>
      </div>

      {/* Search Input Box */}
      <div className="relative">
        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Search by chapter name or file name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold outline-none focus:border-cyan-600 text-slate-800 dark:text-slate-100 shadow-premium focus:ring-1 focus:ring-cyan-600"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <X size={14} className="lucide-lucide-icon" />
          </button>
        )}
      </div>

      {/* Chapters list */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
          <span>CHAPTERS LIST ({filteredMaterials.length})</span>
          <span>Offline ready</span>
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="p-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-center text-xs text-slate-400">
            No study materials match your search query.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMaterials.map((ch) => {
              const chUniqueId = `${ch.material}_${ch.id}`;
              const progress = progressMap[chUniqueId];
              const isFav = favoritesSet.has(chUniqueId);

              const percent = progress ? progress.percentage : 0;
              const hasRead = percent > 0;
              const isCompleted = percent === 100;

              return (
                <div
                  key={ch.id}
                  onClick={() => handleOpenPdf(ch.id)}
                  className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-premium hover:shadow-premium-hover active:scale-[0.99] transition-all flex items-start gap-3 cursor-pointer ${
                    isCompleted
                      ? 'border-emerald-200 dark:border-emerald-950/60'
                      : progress
                      ? 'border-cyan-200 dark:border-cyan-950/60'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* PDF Icon Graphic */}
                  <div className={`p-3 rounded-xl shrink-0 ${
                    isCompleted
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450'
                      : progress
                      ? 'bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-400'
                  }`}>
                    <FileText size={24} />
                  </div>

                  {/* Title and stats detail */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 justify-between">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Chapter {ch.num} • {ch.sizeLabel}
                      </span>
                      {/* Favorite star */}
                      <button
                        onClick={(e) => handleFavoriteToggle(ch, e)}
                        className={`p-1 -mr-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                          isFav ? 'text-amber-500' : 'text-slate-350 dark:text-slate-600'
                        }`}
                        aria-label="Toggle Favorite"
                      >
                        <Star size={16} fill={isFav ? 'currentColor' : 'none'} />
                      </button>
                    </div>

                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                      {ch.title}
                    </h3>

                    {/* Progress tracking details */}
                    {hasRead && (
                      <div className="pt-2 space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase text-slate-400">
                          {isCompleted ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <CheckCircle2 size={10} /> Completed
                            </span>
                          ) : (
                            <span>Page {progress.lastPageRead} of {progress.totalPages}</span>
                          )}
                          <span>{percent}% Done</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-350 ${
                              isCompleted ? 'bg-emerald-500' : 'bg-cyan-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
