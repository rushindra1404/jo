import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial } from '../utils/chapters';
import { Bookmark, HelpCircle, ChevronLeft, ChevronRight, Play, Pause, Square, Clock, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const StudyModeScreen: React.FC = () => {
  const {
    activeMaterial,
    activeChapterId,
    studyQuestionIndex,
    setStudyQuestionIndex,
    progress,
    toggleBookmark,
    toggleReviewLater,
    saveQuestionNote,
    recordAttempt,
    updateContinueLearning,
    addRecentActivity,
    speakQuestion,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    speakingState,
    questions,
    getShuffledQuestion,
    resetShuffledQuestions,
  } = useApp();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAttempted, setHasAttempted] = useState<boolean>(false);
  const [justAttempted, setJustAttempted] = useState<boolean>(false);

  // Temporary session state storage
  const [sessionStates, setSessionStates] = useState<Record<string, { selectedOption: string | null; hasAttempted: boolean }>>({});
  
  // Notes states
  const [showNotesModal, setShowNotesModal] = useState<boolean>(false);
  const [noteInput, setNoteInput] = useState<string>('');

  const chapterQuestions = activeMaterial && activeChapterId
    ? questions.filter(q => q.material === activeMaterial && q.chapterId === activeChapterId)
    : [];

  const currentChapter = activeMaterial
    ? getChaptersByMaterial(activeMaterial).find(c => c.id === activeChapterId)
    : undefined;

  const totalQuestions = chapterQuestions.length;
  const currentQuestion = chapterQuestions[studyQuestionIndex];

  // Update continue learning state on change
  useEffect(() => {
    if (activeMaterial && activeChapterId && totalQuestions > 0) {
      updateContinueLearning(activeMaterial, activeChapterId, studyQuestionIndex, 'study');
    }
  }, [studyQuestionIndex, activeMaterial, activeChapterId, totalQuestions]);

  // Log activity on mount and clean up TTS on unmount
  useEffect(() => {
    resetShuffledQuestions();
    if (activeMaterial && currentChapter) {
      addRecentActivity(
        'study',
        activeMaterial,
        `Started studying Chapter ${currentChapter.num}`,
        currentChapter.title,
        currentChapter.id
      );
    }
    return () => {
      stopSpeaking();
    };
  }, []);

  // Load state on question change
  useEffect(() => {
    if (currentQuestion) {
      const qState = sessionStates[currentQuestion.uniqueId] || { selectedOption: null, hasAttempted: false };
      setSelectedOption(qState.selectedOption);
      setHasAttempted(qState.hasAttempted);
      setJustAttempted(false);
    }
    stopSpeaking();
  }, [studyQuestionIndex, currentQuestion?.uniqueId]);

  if (totalQuestions === 0 || !currentQuestion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-600"></div>
        <p className="text-sm text-slate-500 mt-4">Loading chapter questions...</p>
      </div>
    );
  }

  const isBookmarked = progress.bookmarks.includes(currentQuestion.uniqueId);
  const shuffledDetails = getShuffledQuestion(currentQuestion);

  const handleSelectOption = (option: string) => {
    if (!hasAttempted && currentQuestion) {
      setSelectedOption(option);
      setSessionStates(prev => ({
        ...prev,
        [currentQuestion.uniqueId]: {
          selectedOption: option,
          hasAttempted: prev[currentQuestion.uniqueId]?.hasAttempted || false,
        }
      }));
    }
  };

  const handleRevealAnswer = () => {
    if (!selectedOption || !currentQuestion) {
      alert('Please select an option first!');
      return;
    }
    setHasAttempted(true);
    setJustAttempted(true);
    const isCorrect = selectedOption === shuffledDetails.correctAnswer;
    recordAttempt(currentQuestion.uniqueId, isCorrect);

    setSessionStates(prev => ({
      ...prev,
      [currentQuestion.uniqueId]: {
        selectedOption,
        hasAttempted: true,
      }
    }));
  };

  const handleNext = () => {
    if (studyQuestionIndex < totalQuestions - 1) {
      setStudyQuestionIndex(studyQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (studyQuestionIndex > 0) {
      setStudyQuestionIndex(studyQuestionIndex - 1);
    }
  };

  const handleTtsToggle = () => {
    if (speakingState === 'playing') {
      pauseSpeaking();
    } else if (speakingState === 'paused') {
      resumeSpeaking();
    } else {
      speakQuestion(currentQuestion);
    }
  };

  const options = shuffledDetails.options;

  const isCorrectChoice = selectedOption === shuffledDetails.correctAnswer;

  const cardVariants = {
    neutral: {
      scale: 1,
      y: 0,
      boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.08), 0 2px 8px -1px rgba(0, 0, 0, 0.04)',
    },
    correct: {
      scale: [1, 1.04, 0.97, 1.02, 1],
      boxShadow: [
        '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        '0 0 40px 10px rgba(16, 185, 129, 0.8)',
        '0 0 20px 4px rgba(16, 185, 129, 0.4)',
        '0 0 35px 8px rgba(16, 185, 129, 0.7)',
        '0 8px 32px 0 rgba(16, 185, 129, 0.45)'
      ],
      transition: {
        duration: 0.7,
        times: [0, 0.25, 0.5, 0.75, 1],
        ease: 'easeInOut'
      }
    },
    incorrect: {
      scale: [1, 1.04, 0.97, 1.02, 1],
      boxShadow: [
        '0 4px 20px -2px rgba(0, 0, 0, 0.08)',
        '0 0 40px 10px rgba(239, 68, 68, 0.8)',
        '0 0 20px 4px rgba(239, 68, 68, 0.4)',
        '0 0 35px 8px rgba(239, 68, 68, 0.7)',
        '0 8px 32px 0 rgba(239, 68, 68, 0.45)'
      ],
      transition: {
        duration: 0.7,
        times: [0, 0.25, 0.5, 0.75, 1],
        ease: 'easeInOut'
      }
    },
    correctStatic: {
      scale: 1,
      y: 0,
      boxShadow: '0 8px 32px 0 rgba(16, 185, 129, 0.45)',
    },
    incorrectStatic: {
      scale: 1,
      y: 0,
      boxShadow: '0 8px 32px 0 rgba(239, 68, 68, 0.45)',
    }
  } as any;

  // Color classes mapping based on state
  let cardClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-850 dark:text-slate-200";
  let textPrimaryClass = "text-slate-850 dark:text-white";
  let textSecondaryClass = "text-slate-450 dark:text-slate-400";
  
  if (hasAttempted) {
    if (isCorrectChoice) {
      cardClass = "bg-emerald-600 dark:bg-emerald-700 border-emerald-500 text-white";
      textPrimaryClass = "text-white";
      textSecondaryClass = "text-emerald-100 dark:text-emerald-250";
    } else {
      cardClass = "bg-rose-600 dark:bg-rose-700 border-rose-500 text-white";
      textPrimaryClass = "text-white";
      textSecondaryClass = "text-rose-100 dark:text-rose-250";
    }
  }

  const getOptionStyle = (key: string) => {
    if (hasAttempted) {
      const isCorrectKey = key === shuffledDetails.correctAnswer;
      const isSelectedKey = key === selectedOption;

      if (isCorrectKey) {
        // Correct option stands out with a solid white background and dark green text
        return "bg-white text-emerald-900 border-white font-extrabold shadow-md";
      }
      if (isSelectedKey) {
        // Selected wrong option has a translucent white background and white text
        return "bg-white/30 border-white text-white font-extrabold shadow-sm";
      }
      // Unselected option is muted but readable
      return "bg-white/10 border-white/10 text-white/80 opacity-60";
    }

    // Unrevealed state styles
    if (selectedOption === key) {
      return "border-cyan-600 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300 ring-2 ring-cyan-600/20";
    }
    return "border-slate-200 dark:border-slate-800 hover:border-slate-350 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 active:bg-slate-50 dark:active:bg-slate-800/50";
  };

  const getBadgeStyle = (key: string) => {
    if (hasAttempted) {
      if (key === shuffledDetails.correctAnswer) {
        return "bg-emerald-600 text-white";
      }
      if (key === selectedOption) {
        return "bg-rose-600 text-white";
      }
      return "bg-white/20 text-white";
    }
    if (selectedOption === key) {
      return "bg-cyan-600 text-white";
    }
    return "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400";
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Chapter header progress bar */}
      {!hasAttempted && (
        <div className="animate-in fade-in duration-200">
          <div className="px-4 pt-3 flex items-center justify-between gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="truncate max-w-[200px]">
              Ch {currentChapter?.num}: {currentChapter?.title}
            </span>
            <span>
              {studyQuestionIndex + 1} of {totalQuestions}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 mt-1">
            <div
              className="bg-cyan-600 dark:bg-cyan-500 h-full transition-all duration-205"
              style={{ width: `${((studyQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* TTS and Note control bar */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between bg-slate-50 dark:bg-slate-950/80 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setNoteInput(progress.notes?.[currentQuestion.uniqueId] || '');
              setShowNotesModal(true);
            }}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-black flex items-center gap-1 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer min-h-[44px] text-slate-700 dark:text-slate-300 shadow-sm"
          >
            <FileText size={14} className="text-cyan-600" />
            {progress.notes?.[currentQuestion.uniqueId] ? 'Edit Note' : 'Add Note'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTtsToggle}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer min-h-[44px] text-slate-700 dark:text-slate-300 shadow-sm"
          >
            {speakingState === 'playing' ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
            {speakingState === 'playing' ? 'Pause' : speakingState === 'paused' ? 'Resume' : 'Read Aloud'}
          </button>
          {speakingState !== 'stopped' && (
            <button
              onClick={stopSpeaking}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-rose-500 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer flex items-center justify-center min-w-[44px] min-h-[44px]"
              aria-label="Stop TTS"
            >
              <Square size={14} fill="currentColor" />
            </button>
          )}
        </div>
      </div>

      {/* Main interactive revision card container */}
      <div className="flex-1 px-4 py-4 overflow-y-auto flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={studyQuestionIndex}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md"
          >
            <motion.div
              variants={cardVariants}
              animate={hasAttempted ? (isCorrectChoice ? (justAttempted ? 'correct' : 'correctStatic') : (justAttempted ? 'incorrect' : 'incorrectStatic')) : 'neutral'}
              className={`w-full rounded-3xl border p-5 flex flex-col justify-between overflow-y-auto ${cardClass} shadow-premium transition-all duration-500`}
              style={{ minHeight: '380px', maxHeight: '68svh' }}
            >
              {!hasAttempted ? (
                /* Unrevealed Question State */
                <div className="flex flex-col justify-between h-full space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                      <span className="flex items-center gap-1">
                        <HelpCircle size={14} /> Question
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleReviewLater(currentQuestion.uniqueId)}
                          className={`p-1 rounded-lg hover:text-rose-500 active:scale-95 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border border-slate-100 dark:border-slate-800 ${
                            (progress.reviewLater || []).includes(currentQuestion.uniqueId)
                              ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20'
                              : 'text-slate-405 dark:text-slate-500'
                          }`}
                          aria-label="Flag for review later"
                        >
                          <Clock size={16} />
                        </button>
                        <button
                          onClick={() => toggleBookmark(currentQuestion.uniqueId)}
                          className="p-1 rounded-lg text-slate-405 dark:text-slate-500 hover:text-amber-500 active:scale-95 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center border border-slate-100 dark:border-slate-800"
                          aria-label="Bookmark this question"
                        >
                          {isBookmarked ? (
                            <Bookmark size={18} className="text-amber-500 fill-amber-500" />
                          ) : (
                            <Bookmark size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                    <h3 className="text-base font-bold mt-3 leading-relaxed text-slate-800 dark:text-slate-100">
                      {currentQuestion.question}
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {options.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => handleSelectOption(opt.key)}
                        className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all flex items-start gap-2.5 cursor-pointer leading-normal ${getOptionStyle(
                          opt.key
                        )}`}
                        style={{ minHeight: '52px' }}
                      >
                        <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs shrink-0 font-extrabold transition-all ${getBadgeStyle(opt.key)}`}>
                          {opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleRevealAnswer}
                    disabled={!selectedOption}
                    className={`w-full py-4 font-bold rounded-2xl text-center shadow-md active:scale-[0.98] transition-all cursor-pointer text-sm tracking-wider uppercase ${
                      selectedOption
                        ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-655 cursor-not-allowed'
                    }`}
                    style={{ minHeight: '52px' }}
                  >
                    Reveal Answer
                  </button>
                </div>
              ) : (
                /* Revealed Answer Transformed State */
                <div className="flex flex-col justify-between h-full space-y-4 animate-in fade-in duration-300">
                  <div>
                    {/* Status header with buttons */}
                    <div className="flex justify-between items-center border-b border-white/20 dark:border-black/20 pb-3">
                      <span className="flex items-center gap-2 text-lg font-black tracking-wide">
                        {isCorrectChoice ? 'Correct' : 'Incorrect'}
                      </span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => toggleReviewLater(currentQuestion.uniqueId)}
                          className={`w-9 h-9 rounded-xl hover:text-rose-500 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-white/20 dark:border-black/20 ${
                            (progress.reviewLater || []).includes(currentQuestion.uniqueId)
                              ? 'text-rose-500 bg-white/25 dark:bg-black/25'
                              : 'text-current opacity-70'
                          }`}
                          aria-label="Flag for review later"
                        >
                          <Clock size={16} />
                        </button>
                        <button
                          onClick={() => toggleBookmark(currentQuestion.uniqueId)}
                          className="w-9 h-9 rounded-xl text-current opacity-70 hover:text-amber-500 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-white/20 dark:border-black/20"
                          aria-label="Bookmark this question"
                        >
                          {isBookmarked ? (
                            <Bookmark size={18} className="fill-amber-500 text-amber-500" />
                          ) : (
                            <Bookmark size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Progress details inside the card */}
                    <div className="space-y-1 py-3 border-b border-white/10 dark:border-black/10">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-wider opacity-80">
                        <span>Question {studyQuestionIndex + 1} of {totalQuestions}</span>
                        <span>Progress</span>
                      </div>
                      <div className="w-full bg-white/25 dark:bg-black/25 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-305 bg-white"
                          style={{ width: `${((studyQuestionIndex + 1) / totalQuestions) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Question text */}
                    <h3 className={`text-base font-bold mt-4 leading-relaxed ${textPrimaryClass}`}>
                      {currentQuestion.question}
                    </h3>
                  </div>

                  {/* Comparative choices banner */}
                  <div className="bg-white/15 dark:bg-black/15 rounded-2xl p-3 flex justify-around text-xs font-bold border border-white/10 dark:border-black/10 shrink-0">
                    <div className="text-center">
                      <p className="opacity-80 text-[10px] uppercase font-black tracking-wider">Your Answer</p>
                      <p className="text-base font-black mt-0.5">
                        Option {selectedOption}
                      </p>
                    </div>
                    <div className="w-px bg-white/20 dark:bg-black/20" />
                    <div className="text-center">
                      <p className="opacity-80 text-[10px] uppercase font-black tracking-wider">Correct Answer</p>
                      <p className="text-base font-black mt-0.5">
                        Option {shuffledDetails.correctAnswer}
                      </p>
                    </div>
                  </div>

                  {/* Options items */}
                  <div className="space-y-2.5">
                    {options.map((opt) => (
                      <div
                        key={opt.key}
                        className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all flex items-start gap-2.5 leading-normal ${getOptionStyle(
                          opt.key
                        )}`}
                        style={{ minHeight: '52px' }}
                      >
                        <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs shrink-0 font-extrabold transition-all ${getBadgeStyle(opt.key)}`}>
                          {opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Explanation text */}
                  <div className="space-y-1.5 pt-1">
                    <h4 className="text-[10px] uppercase tracking-wider font-extrabold opacity-80">Explanation</h4>
                    <p className={`text-xs leading-relaxed font-semibold ${textSecondaryClass}`}>
                      {currentQuestion.explanation || 'No explanation provided for this question.'}
                    </p>
                  </div>

                  {/* Inline actions footer */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/20 dark:border-black/20 mt-4 shrink-0">
                    <button
                      onClick={() => {
                        setNoteInput(progress.notes?.[currentQuestion.uniqueId] || '');
                        setShowNotesModal(true);
                      }}
                      className="py-3 px-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/30 border border-white/20 dark:border-black/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-current font-extrabold uppercase tracking-wider"
                    >
                      <FileText size={14} /> {progress.notes?.[currentQuestion.uniqueId] ? 'Edit Note' : 'Add Note'}
                    </button>
                    <button
                      onClick={() => {
                        setHasAttempted(false);
                      }}
                      className="py-3 px-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 dark:bg-black/20 dark:hover:bg-black/30 border border-white/20 dark:border-black/20 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all text-current font-extrabold uppercase tracking-wider"
                    >
                      Hide Answer
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Prev / Next controls */}
      <footer className="px-4 grid grid-cols-2 gap-4 shrink-0">
        <button
          onClick={handlePrev}
          disabled={studyQuestionIndex === 0}
          className={`py-3.5 rounded-2xl border text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] ${
            studyQuestionIndex === 0
              ? 'border-slate-200 dark:border-slate-800 text-slate-350 dark:text-slate-700 cursor-not-allowed opacity-50'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer'
          }`}
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <button
          onClick={handleNext}
          disabled={studyQuestionIndex === totalQuestions - 1}
          className={`py-3.5 rounded-2xl border text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] ${
            studyQuestionIndex === totalQuestions - 1
              ? 'border-slate-200 dark:border-slate-800 text-slate-355 dark:text-slate-700 cursor-not-allowed opacity-50'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer'
          }`}
        >
          Next <ChevronRight size={16} />
        </button>
      </footer>

      {/* Notes Modal Overlay */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowNotesModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              title="Close notes"
            >
              <X size={18} />
            </button>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 font-sans">
              <FileText size={18} className="text-cyan-600 animate-pulse" /> Study Notes
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-normal">
              Write key takeaways, notes, or mnemonic clues for this question. Your notes will be saved and can be reviewed later.
            </p>
            <textarea
              rows={4}
              placeholder="Type your notes here..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 rounded-2xl text-xs font-semibold focus:outline-none focus:border-cyan-500 text-slate-800 dark:text-slate-200"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  saveQuestionNote(currentQuestion.uniqueId, noteInput);
                  setShowNotesModal(false);
                }}
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs uppercase rounded-xl tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                Save Note
              </button>
              {noteInput && (
                <button
                  onClick={() => {
                    saveQuestionNote(currentQuestion.uniqueId, '');
                    setNoteInput('');
                    setShowNotesModal(false);
                  }}
                  className="px-3.5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-xs uppercase rounded-xl tracking-wider cursor-pointer active:scale-95 transition-all"
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
};