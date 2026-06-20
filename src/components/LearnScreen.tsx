import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { GPOE_CHAPTERS, ICA_CHAPTERS, getChaptersByMaterial } from '../utils/chapters';
import {
  Search,
  BookOpen,
  FileText,
  Sliders,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

export const LearnScreen: React.FC = () => {
  const { navigate, setActiveMaterial, setActiveChapterId, setStudyQuestionIndex, questions } = useApp();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'flashcards' | 'revision'>('revision');
  const [materialFilter, setMaterialFilter] = useState<'ica' | 'gpoe'>('ica');

  const startFlashcards = (mat: 'ica' | 'gpoe', chId: string) => {
    setActiveMaterial(mat);
    setActiveChapterId(chId);
    navigate('flashcards-viewer');
  };

  const openFlashCardsHub = () => {
    navigate('flashcards-landing');
  };

  const startRevision = (mat: 'ica' | 'gpoe', chId: string) => {
    setActiveMaterial(mat);
    setActiveChapterId(chId);
    setStudyQuestionIndex(0);
    navigate('study');
  };

  // Filtered chapters or questions search list
  const chaptersPool = [...ICA_CHAPTERS, ...GPOE_CHAPTERS];
  const filteredChapters = searchQuery
    ? chaptersPool.filter(
        ch =>
          ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ch.id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredQuestions = searchQuery
    ? questions.filter(
        q =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.explanation.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10) // Limit to top 10 question results to avoid screen overflow
    : [];

  return (
    <div className="flex-1 overflow-y-auto px-4 pb-20 pt-4 space-y-6 bg-transparent">
      {/* Tab Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xs font-black uppercase text-cyan-600 dark:text-cyan-400 tracking-wider">JO Sphere Learning Hub</h2>
          <p className="text-2xl font-black text-cyan-600 dark:text-cyan-400 font-sans mt-0.5">Learn • Revise • Succeed</p>
        </div>
        <button
          onClick={() => navigate('study-library')}
          className="flex items-center gap-1 text-[10px] uppercase font-black tracking-wider bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400 px-3 py-1.5 rounded-xl border border-cyan-100 dark:border-cyan-900 active:scale-95 transition-all cursor-pointer"
        >
          <FileText size={12} /> Open Library <ArrowRight size={10} />
        </button>
      </div>

      {/* Global Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-premium flex items-center gap-2">
        <Search size={16} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search chapters, concepts, or questions..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none placeholder-slate-400"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-[10px] text-slate-400 font-bold hover:text-slate-600 cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Search results overlay mapping if searching */}
      {searchQuery && (
        <div className="space-y-4 animate-fade-in">
          {filteredChapters.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Chapters Found ({filteredChapters.length})</h3>
              <div className="space-y-2">
                {filteredChapters.map(ch => (
                  <div
                    key={`${ch.material}_${ch.id}`}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs font-semibold"
                  >
                    <div>
                      <span className="text-[8px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase font-black">{ch.material}</span>
                      <p className="text-slate-800 dark:text-slate-250 mt-1 font-bold">Ch {ch.num}: {ch.title}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startFlashcards(ch.material, ch.id)}
                        className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-lg border border-rose-100 dark:border-rose-900 active:scale-95"
                      >
                        Cards
                      </button>
                      <button
                        onClick={() => startRevision(ch.material, ch.id)}
                        className="px-2.5 py-1 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 text-[10px] font-black rounded-lg border border-cyan-100 dark:border-cyan-900 active:scale-95"
                      >
                        Practice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredQuestions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Questions Found ({filteredQuestions.length})</h3>
              <div className="space-y-2.5">
                {filteredQuestions.map(q => {
                  const ch = getChaptersByMaterial(q.material).find(c => c.id === q.chapterId);
                  return (
                    <div
                      key={q.uniqueId}
                      onClick={() => startRevision(q.material, q.chapterId)}
                      className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-2 cursor-pointer hover:border-cyan-500 active:scale-[0.99] transition-all"
                    >
                      <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-400">
                        <span>{q.material.toUpperCase()} • Ch {ch?.num}</span>
                        <span className="text-cyan-600">Start Chapter MCQ <ChevronRight size={10} className="inline" /></span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-normal line-clamp-2">{q.question}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredChapters.length === 0 && filteredQuestions.length === 0 && (
            <div className="text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 font-semibold text-xs">
              No matching chapters or questions found.
            </div>
          )}
        </div>
      )}

      {/* Main Options: Learning Mode Selection */}
      {!searchQuery && (
        <div className="space-y-5 animate-fade-in">
          {/* Practice Mode toggles */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-1.5 rounded-2xl flex shadow-sm">
            <button
              onClick={() => setActiveTab('revision')}
              className={`flex-1 py-3 text-center text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
                activeTab === 'revision'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              🔄 MCQ Revision Mode
            </button>
            <button
              onClick={openFlashCardsHub}
              className={`flex-1 py-3 text-center text-xs font-black uppercase rounded-xl transition-all cursor-pointer ${
                activeTab === 'flashcards'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
            >
              📖 Flash Cards
            </button>
          </div>

          {/* Tab Description Context */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 shadow-sm flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${activeTab === 'revision' ? 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30' : 'bg-rose-50 text-rose-500 dark:bg-rose-950/30'}`}>
              {activeTab === 'revision' ? <Sliders size={18} /> : <BookOpen size={18} />}
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase">
                {activeTab === 'revision' ? 'Active MCQ Revision' : 'Memory Reinforcement'}
              </h4>
              <p className="text-[10px] leading-normal font-semibold text-slate-400 dark:text-slate-500 mt-1">
                {activeTab === 'revision'
                  ? 'Answer multiple-choice questions with instant correct/incorrect visual highlighting and detailed text explanations.'
                  : 'Study key facts, concepts, definitions, and company details with interactive 3D flipping card summary blocks.'}
              </p>
            </div>
          </div>

          {/* Materials Section Tabs (ICA vs GPOE) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Chapters Selection</h3>
              <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-850 p-1 rounded-xl">
                <button
                  onClick={() => setMaterialFilter('ica')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all ${
                    materialFilter === 'ica'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm'
                      : 'text-slate-450 dark:text-slate-500'
                  }`}
                >
                  ICA (16 Ch)
                </button>
                <button
                  onClick={() => setMaterialFilter('gpoe')}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer transition-all ${
                    materialFilter === 'gpoe'
                      ? 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-sm'
                      : 'text-slate-450 dark:text-slate-500'
                  }`}
                >
                  GPOE (8 Ch)
                </button>
              </div>
            </div>

            {/* Render selected chapters list */}
            <div className="grid grid-cols-1 gap-2">
              {getChaptersByMaterial(materialFilter).map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() =>
                    activeTab === 'revision'
                      ? startRevision(materialFilter, ch.id)
                      : startFlashcards(materialFilter, ch.id)
                  }
                  className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-600 rounded-2xl flex items-center justify-between text-left shadow-sm active:scale-[0.98] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl font-extrabold text-xs bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-850 dark:text-slate-100 font-sans leading-snug">
                        {ch.title}
                      </h4>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                        {materialFilter.toUpperCase()} • Chapter {ch.num}
                      </p>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
