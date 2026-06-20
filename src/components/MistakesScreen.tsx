import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial } from '../utils/chapters';
import {
  ArrowLeft,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Play,
  Award,
  Trash2,
  CheckCircle2,
  XCircle,
  Bookmark,
  FileText,
  Filter,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
import type { Question } from '../types';

// ─── Filter types ────────────────────────────────────────────────────────────
type MistakeFilter = 'all' | 'ica' | 'gpoe' | 'bookmarked';

export const MistakesScreen: React.FC = () => {
  const {
    questions,
    progress,
    recordAttempt,
    removeMistake,
    toggleBookmark,
    saveQuestionNote,
  } = useApp();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<MistakeFilter>('all');

  // ── Revision session state ──────────────────────────────────────────────────
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasRevealed, setHasRevealed] = useState(false);

  // ── Notes modal state ───────────────────────────────────────────────────────
  const [showNotes, setShowNotes] = useState(false);
  const [noteInput, setNoteInput] = useState('');

  // ── Derived: all mistake questions ─────────────────────────────────────────
  const allMistakeQuestions = useMemo(
    () => questions.filter(q => progress.mistakes.includes(q.uniqueId)),
    [questions, progress.mistakes]
  );

  const totalMistakes = allMistakeQuestions.length;
  const resolvedCount = progress.resolvedMistakesCount || 0;
  const [sessionAttempts, setSessionAttempts] = useState(0);
  const [sessionCorrect, setSessionCorrect] = useState(0);

  // ── Filtered list for the list view ────────────────────────────────────────
  const filteredMistakes = useMemo(() => {
    switch (activeFilter) {
      case 'ica':
        return allMistakeQuestions.filter(q => q.material === 'ica');
      case 'gpoe':
        return allMistakeQuestions.filter(q => q.material === 'gpoe');
      case 'bookmarked':
        return allMistakeQuestions.filter(q => progress.bookmarks.includes(q.uniqueId));
      default:
        return allMistakeQuestions;
    }
  }, [allMistakeQuestions, activeFilter, progress.bookmarks]);

  // ── Reset per-question state when index changes ─────────────────────────────
  useEffect(() => {
    setSelectedOption(null);
    setHasRevealed(false);
    setShowNotes(false);
  }, [currentIndex]);

  // ── Start practice session ──────────────────────────────────────────────────
  const handleStartPractice = (questions: Question[]) => {
    if (questions.length === 0) return;
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    setPracticeQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setHasRevealed(false);
    setSessionAttempts(0);
    setSessionCorrect(0);
    setIsPracticing(true);
  };

  // ── Answer reveal ───────────────────────────────────────────────────────────
  const handleRevealAnswer = () => {
    if (!selectedOption) return;
    const q = practiceQuestions[currentIndex];
    const isCorrect = selectedOption === q.correct_answer;
    recordAttempt(q.uniqueId, isCorrect);
    setHasRevealed(true);
    setSessionAttempts(prev => prev + 1);
    if (isCorrect) {
      setSessionCorrect(prev => prev + 1);
    }
  };

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentIndex < practiceQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Session complete — stay on last card, show finish
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleExitPractice = () => {
    if (!hasRevealed && sessionAttempts === 0) {
      setIsPracticing(false);
      return;
    }
    if (window.confirm('Exit revision session? Your progress so far has been saved.')) {
      setIsPracticing(false);
    }
  };

  const handleFinish = () => {
    setIsPracticing(false);
  };

  // ── Option styling ──────────────────────────────────────────────────────────
  const getOptionStyle = (key: string, correctAnswer: string) => {
    if (hasRevealed) {
      if (key === correctAnswer) {
        return 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
      }
      if (key === selectedOption && selectedOption !== correctAnswer) {
        return 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
      }
      return 'border-slate-200 dark:border-slate-800 opacity-40 text-slate-500 dark:text-slate-500';
    }
    if (selectedOption === key) {
      return 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300';
    }
    return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
  };

  // ════════════════════════════════════════════════════════════════════════════
  // REVISION SESSION VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (isPracticing && practiceQuestions.length > 0) {
    const currentQ = practiceQuestions[currentIndex];
    const isCorrect = selectedOption === currentQ.correct_answer;
    const chapterInfo = getChaptersByMaterial(currentQ.material)
      .find(c => c.id === currentQ.chapterId);
    const isBookmarked = progress.bookmarks.includes(currentQ.uniqueId);
    const isLastCard = currentIndex === practiceQuestions.length - 1;
    const progressPct = ((currentIndex + 1) / practiceQuestions.length) * 100;

    const options = [
      { key: 'A', text: currentQ.option_a },
      { key: 'B', text: currentQ.option_b },
      { key: 'C', text: currentQ.option_c },
      { key: 'D', text: currentQ.option_d },
    ];

    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="px-4 pt-3 pb-2 flex items-center justify-between">
            <button
              onClick={handleExitPractice}
              className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer active:scale-95 transition-all"
            >
              <ArrowLeft size={16} /> Exit
            </button>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-rose-500">
                Mistakes Revision
              </p>
              <p className="text-xs font-black text-slate-700 dark:text-slate-200">
                Question {currentIndex + 1} of {practiceQuestions.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Notes button */}
              <button
                onClick={() => {
                  setNoteInput(progress.notes?.[currentQ.uniqueId] || '');
                  setShowNotes(true);
                }}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-pointer active:scale-95 transition-all"
                title="Add note"
              >
                <FileText size={15} />
              </button>
              {/* Bookmark button */}
              <button
                onClick={() => toggleBookmark(currentQ.uniqueId)}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 cursor-pointer active:scale-95 transition-all"
                title="Bookmark"
              >
                <Bookmark
                  size={15}
                  className={isBookmarked ? 'fill-amber-500 text-amber-500' : ''}
                />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5">
            <div
              className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Session stats row */}
          <div className="px-4 py-1.5 flex items-center justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
            <span>{currentQ.material.toUpperCase()} • Ch {chapterInfo?.num}</span>
            <div className="flex items-center gap-3">
              <span className="text-emerald-500">✓ {sessionCorrect} resolved</span>
              <span>{Math.round(progressPct)}% done</span>
            </div>
          </div>
        </div>

        {/* ── Question Card ───────────────────────────────────────────────── */}
        <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-4">
          
          {/* Question box */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900">
                ❌ Mistake Review
              </span>
              {chapterInfo && (
                <span className="text-[9px] font-bold text-slate-400">
                  {chapterInfo.title}
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {options.map(opt => (
              <button
                key={opt.key}
                onClick={() => { if (!hasRevealed) setSelectedOption(opt.key); }}
                disabled={hasRevealed}
                className={`w-full px-4 py-3.5 rounded-2xl border text-left text-sm font-semibold transition-all flex items-start gap-3 cursor-pointer leading-normal active:scale-[0.99] ${getOptionStyle(opt.key, currentQ.correct_answer)}`}
                style={{ minHeight: '52px' }}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs shrink-0 font-extrabold transition-all ${
                  hasRevealed
                    ? opt.key === currentQ.correct_answer
                      ? 'bg-emerald-500 text-white'
                      : opt.key === selectedOption
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    : selectedOption === opt.key
                      ? 'bg-cyan-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {hasRevealed && opt.key === currentQ.correct_answer
                    ? <Check size={12} />
                    : hasRevealed && opt.key === selectedOption && selectedOption !== currentQ.correct_answer
                      ? <X size={12} />
                      : opt.key
                  }
                </span>
                <span className="flex-1">{opt.text}</span>
              </button>
            ))}
          </div>

          {/* Result panel — shown after reveal */}
          {hasRevealed && (
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
            }`}>
              <div className={`flex items-center gap-2 text-sm font-black ${
                isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {isCorrect
                  ? <><CheckCircle2 size={18} /> ✅ Correct! Removed from mistakes.</>
                  : <><XCircle size={18} /> ❌ Incorrect. Still in your mistakes list.</>
                }
              </div>
              <div className={`flex items-center gap-3 text-xs font-bold ${
                isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                <span>Your answer: <strong>{selectedOption}</strong></span>
                <span>•</span>
                <span>Correct: <strong className="text-emerald-600 dark:text-emerald-400">{currentQ.correct_answer}</strong></span>
              </div>
              {currentQ.explanation && (
                <div className="pt-2 border-t border-current/20">
                  <p className="text-[10px] font-black uppercase tracking-wider opacity-60 mb-1">Explanation</p>
                  <p className={`text-xs leading-relaxed font-medium ${
                    isCorrect ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                  }`}>
                    {currentQ.explanation}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer Controls ─────────────────────────────────────────────── */}
        <div className="px-4 pb-6 pt-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 safe-padding-bottom">
          {!hasRevealed ? (
            /* Before reveal: Prev | Reveal Answer */
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[52px] transition-all ${
                  currentIndex === 0
                    ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95'
                }`}
              >
                <ChevronLeft size={18} /> Prev
              </button>
              <button
                onClick={handleRevealAnswer}
                disabled={!selectedOption}
                className={`py-4 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[52px] transition-all ${
                  selectedOption
                    ? 'bg-gradient-to-b from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30 cursor-pointer active:scale-95'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                }`}
              >
                Reveal Answer ↑
              </button>
            </div>
          ) : isLastCard ? (
            /* Last card after reveal: Prev | Finish */
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrev}
                className="py-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[52px] cursor-pointer active:scale-95 transition-all"
              >
                <ChevronLeft size={18} /> Prev
              </button>
              <button
                onClick={handleFinish}
                className="py-4 rounded-2xl bg-gradient-to-b from-emerald-500 to-emerald-600 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[52px] shadow-lg shadow-emerald-500/30 cursor-pointer active:scale-95 transition-all"
              >
                <Award size={16} /> Finish Session
              </button>
            </div>
          ) : (
            /* After reveal (not last): Prev | Next Question */
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={`py-4 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[52px] transition-all ${
                  currentIndex === 0
                    ? 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 opacity-50 cursor-not-allowed'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer active:scale-95'
                }`}
              >
                <ChevronLeft size={18} /> Prev
              </button>
              <button
                onClick={handleNext}
                className="py-4 rounded-2xl bg-gradient-to-b from-cyan-600 to-cyan-700 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[52px] shadow-lg shadow-cyan-600/30 cursor-pointer active:scale-95 transition-all"
              >
                Next <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* ── Notes Modal ─────────────────────────────────────────────────── */}
        {showNotes && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <FileText size={16} className="text-cyan-600" /> Study Notes
                </h4>
                <button onClick={() => setShowNotes(false)} className="p-1.5 rounded-lg text-slate-400 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
              <textarea
                rows={4}
                placeholder="Write key takeaways or mnemonic tips..."
                value={noteInput}
                onChange={e => setNoteInput(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-semibold focus:outline-none text-slate-800 dark:text-slate-200"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    saveQuestionNote(currentQ.uniqueId, noteInput);
                    setShowNotes(false);
                  }}
                  className="flex-1 py-3 bg-cyan-600 text-white font-black text-xs uppercase rounded-xl cursor-pointer active:scale-95 transition-all"
                >
                  Save Note
                </button>
                {noteInput && (
                  <button
                    onClick={() => {
                      saveQuestionNote(currentQ.uniqueId, '');
                      setNoteInput('');
                    }}
                    className="px-3 py-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 font-black text-xs uppercase rounded-xl cursor-pointer active:scale-95 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SESSION COMPLETE — Summary Screen
  // ════════════════════════════════════════════════════════════════════════════
  // (Not used — we close inline)

  // ════════════════════════════════════════════════════════════════════════════
  // MISTAKES LIST VIEW (default)
  // ════════════════════════════════════════════════════════════════════════════
  const icaCount = allMistakeQuestions.filter(q => q.material === 'ica').length;
  const gpoeCount = allMistakeQuestions.filter(q => q.material === 'gpoe').length;
  const bookmarkedCount = allMistakeQuestions.filter(q => progress.bookmarks.includes(q.uniqueId)).length;

  return (
    <div className="flex-1 overflow-y-auto pb-24 bg-slate-50 dark:bg-slate-950">

      {/* ── Stats Header ──────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-rose-600 via-rose-500 to-pink-600 px-4 pt-5 pb-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 translate-x-4 -translate-y-2">
          <AlertTriangle size={120} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-rose-200 mb-1">Revision Queue</p>
        <h1 className="text-2xl font-black font-sans mb-4">My Mistakes</h1>

        {/* 4 stat tiles */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-xl font-black">{totalMistakes}</p>
            <p className="text-[10px] font-bold text-rose-100 uppercase tracking-wide mt-0.5">Pending</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-xl font-black text-emerald-300">{resolvedCount}</p>
            <p className="text-[10px] font-bold text-rose-100 uppercase tracking-wide mt-0.5">Resolved</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-xl font-black">{icaCount}</p>
            <p className="text-[10px] font-bold text-rose-100 uppercase tracking-wide mt-0.5">ICA</p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 text-center">
            <p className="text-xl font-black">{gpoeCount}</p>
            <p className="text-[10px] font-bold text-rose-100 uppercase tracking-wide mt-0.5">GPOE</p>
          </div>
        </div>
      </div>

      {/* ── Practice CTA ──────────────────────────────────────────────────── */}
      <div className="px-4 -mt-3 space-y-2.5">
        {totalMistakes > 0 ? (
          <>
            <button
              onClick={() => handleStartPractice(allMistakeQuestions)}
              className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-rose-500/25 cursor-pointer active:scale-[0.98] transition-all"
              style={{ minHeight: '56px' }}
            >
              <Play size={16} fill="currentColor" />
              Practice All {totalMistakes} Mistakes
            </button>
            {filteredMistakes.length > 0 && activeFilter !== 'all' && (
              <button
                onClick={() => handleStartPractice(filteredMistakes)}
                className="w-full py-3.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all"
              >
                <RotateCcw size={14} />
                Practice Filtered ({filteredMistakes.length} Questions)
              </button>
            )}
          </>
        ) : (
          <div className="mt-1 p-5 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-3xl text-center space-y-2 shadow-sm">
            <Award size={32} className="mx-auto text-emerald-500" />
            <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Clean Slate! 🎉</h3>
            <p className="text-xs text-slate-400 font-semibold">
              All your mistakes have been resolved. Keep practising to stay sharp!
            </p>
          </div>
        )}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      {totalMistakes > 0 && (
        <div className="px-4 mt-5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {([
              { id: 'all', label: `All (${totalMistakes})` },
              { id: 'ica', label: `ICA (${icaCount})` },
              { id: 'gpoe', label: `GPOE (${gpoeCount})` },
              { id: 'bookmarked', label: `⭐ Saved (${bookmarkedCount})` },
            ] as { id: MistakeFilter; label: string }[]).map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                  activeFilter === f.id
                    ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Mistake Questions List ─────────────────────────────────────────── */}
      {totalMistakes > 0 && (
        <div className="px-4 mt-4 space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {activeFilter === 'all' ? 'All Mistakes' : activeFilter === 'ica' ? 'ICA Mistakes' : activeFilter === 'gpoe' ? 'GPOE Mistakes' : 'Bookmarked Mistakes'} ({filteredMistakes.length})
            </h2>
            <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
              <TrendingUp size={10} /> {resolvedCount} resolved total
            </span>
          </div>

          {filteredMistakes.length === 0 ? (
            <div className="p-6 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center space-y-2">
              <Filter size={24} className="mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-xs font-bold text-slate-500">No mistakes match this filter.</p>
            </div>
          ) : (
            filteredMistakes.map(q => {
              const ch = getChaptersByMaterial(q.material).find(c => c.id === q.chapterId);
              const isBookmarked = progress.bookmarks.includes(q.uniqueId);
              const hasNote = !!progress.notes?.[q.uniqueId];
              return (
                <div
                  key={q.uniqueId}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  {/* Top row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900">
                        {q.material.toUpperCase()}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400">
                        Ch {ch?.num} • {ch?.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {isBookmarked && (
                        <Bookmark size={12} className="fill-amber-400 text-amber-400" />
                      )}
                      {hasNote && (
                        <FileText size={12} className="text-cyan-500" />
                      )}
                      <button
                        onClick={() => removeMistake(q.uniqueId)}
                        className="p-1.5 rounded-lg text-slate-300 dark:text-slate-700 hover:text-rose-500 active:scale-90 transition-all cursor-pointer"
                        title="Remove from mistakes"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Question text */}
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-relaxed">
                    {q.question}
                  </p>

                  {/* Correct answer */}
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-800 text-xs font-bold">
                    <span className="text-slate-400">Correct Answer:</span>
                    <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg">
                      {q.correct_answer}) {(q as any)[`option_${q.correct_answer.toLowerCase()}`]}
                    </span>
                  </div>

                  {/* Practice this one button */}
                  <button
                    onClick={() => handleStartPractice([q])}
                    className="w-full py-2.5 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-wider rounded-xl border border-rose-100 dark:border-rose-900 cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Play size={10} fill="currentColor" /> Practice This Question
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};