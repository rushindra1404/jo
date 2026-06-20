import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { getChaptersByMaterial } from '../utils/chapters';
import { Bookmark, HelpCircle, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Play, Pause, Square } from 'lucide-react';

export const RandomRevisionScreen: React.FC = () => {
  const {
    randomQuestions,
    randomCurrentIndex,
    setRandomCurrentIndex,
    progress,
    toggleBookmark,
    recordAttempt,
    speakQuestion,
    pauseSpeaking,
    resumeSpeaking,
    stopSpeaking,
    speakingState,
  } = useApp();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [hasAttempted, setHasAttempted] = useState<boolean>(false);

  const totalQuestions = randomQuestions.length;
  const currentQuestion = randomQuestions[randomCurrentIndex];

  // Reset state on question change
  useEffect(() => {
    setSelectedOption(null);
    setIsFlipped(false);
    setHasAttempted(false);
    stopSpeaking();
  }, [randomCurrentIndex]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  if (totalQuestions === 0 || !currentQuestion) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <p className="text-sm text-slate-500">Preparing random review mix...</p>
      </div>
    );
  }

  const isBookmarked = progress.bookmarks.includes(currentQuestion.uniqueId);
  const currentChapter = getChaptersByMaterial(currentQuestion.material).find(
    c => c.id === currentQuestion.chapterId
  );

  const handleSelectOption = (option: string) => {
    if (!hasAttempted) {
      setSelectedOption(option);
    }
  };

  const handleRevealAnswer = () => {
    if (!selectedOption) {
      alert('Please select an option first!');
      return;
    }
    setHasAttempted(true);
    setIsFlipped(true);
    const isCorrect = selectedOption === currentQuestion.correct_answer;
    recordAttempt(currentQuestion.uniqueId, isCorrect);
  };

  const handleNext = () => {
    if (randomCurrentIndex < totalQuestions - 1) {
      setRandomCurrentIndex(randomCurrentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (randomCurrentIndex > 0) {
      setRandomCurrentIndex(randomCurrentIndex - 1);
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

  const options = [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
    { key: 'D', text: currentQuestion.option_d },
  ];

  const isCorrectChoice = selectedOption === currentQuestion.correct_answer;
  const cardBorderColor = isCorrectChoice ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white';

  const getOptionStyle = (key: string) => {
    if (hasAttempted) {
      if (key === currentQuestion.correct_answer) {
        return 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
      }
      if (key === selectedOption && !isCorrectChoice) {
        return 'border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
      }
      return 'border-slate-200 dark:border-slate-800 opacity-60 text-slate-500 dark:text-slate-400';
    }

    if (selectedOption === key) {
      return 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-800 dark:text-cyan-300';
    }

    return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200';
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-hidden pb-6 safe-padding-bottom">
      {/* Header index info */}
      <div>
        <div className="px-4 pt-3 flex items-center justify-between gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className="truncate max-w-[200px]">
            Mix • {currentQuestion.material.toUpperCase()} Ch {currentChapter?.num}
          </span>
          <span>{randomCurrentIndex + 1} of {totalQuestions}</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 mt-1">
          <div
            className="bg-cyan-600 dark:bg-cyan-500 h-full transition-all duration-200"
            style={{ width: `${((randomCurrentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* TTS control bar */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
        <span className="text-xs text-slate-500 font-medium">Text-To-Speech:</span>
        <div className="flex gap-2">
          <button
            onClick={handleTtsToggle}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer min-h-[38px] text-slate-700 dark:text-slate-300"
          >
            {speakingState === 'playing' ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
            {speakingState === 'playing' ? 'Pause' : speakingState === 'paused' ? 'Resume' : 'Read Aloud'}
          </button>
          {speakingState !== 'stopped' && (
            <button
              onClick={stopSpeaking}
              className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-rose-500 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer flex items-center justify-center min-w-[38px] min-h-[38px]"
              aria-label="Stop TTS"
            >
              <Square size={14} fill="currentColor" />
            </button>
          )}
        </div>
      </div>

      {/* Flashcard container */}
      <div className="flex-1 px-4 py-4 overflow-y-auto flex items-center">
        <div className="w-full perspective-1000 min-h-[320px] h-[75svh] max-h-[460px] relative">
          <div
            className={`w-full h-full duration-500 preserve-3d relative rounded-3xl shadow-premium ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
          >
            {/* Front Face */}
            <div className="absolute inset-0 w-full h-full backface-hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
                  <span className="flex items-center gap-1">
                    <HelpCircle size={14} /> Question
                  </span>
                  <button
                    onClick={() => toggleBookmark(currentQuestion.uniqueId)}
                    className="p-1 rounded-lg text-slate-400 hover:text-amber-500 active:scale-95 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Bookmark this question"
                  >
                    {isBookmarked ? (
                      <Bookmark size={22} className="text-amber-500 fill-amber-500" />
                    ) : (
                      <Bookmark size={22} />
                    )}
                  </button>
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-3 leading-relaxed">
                  {currentQuestion.question}
                </h3>
              </div>

              <div className="mt-4 space-y-2.5">
                {options.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full px-4 py-3 rounded-xl border text-left text-sm font-semibold transition-all flex items-start gap-2.5 cursor-pointer leading-normal ${getOptionStyle(
                      opt.key
                    )}`}
                    style={{ minHeight: '52px' }}
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 shrink-0 font-extrabold text-slate-500 dark:text-slate-400">
                      {opt.key}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                  </button>
                ))}
              </div>

              {!hasAttempted && (
                <button
                  onClick={handleRevealAnswer}
                  disabled={!selectedOption}
                  className={`w-full py-4 mt-4 font-bold rounded-2xl text-center shadow-md active:scale-[0.98] transition-all cursor-pointer text-sm tracking-wider uppercase ${
                    selectedOption
                      ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                  }`}
                  style={{ minHeight: '52px' }}
                >
                  Reveal Answer
                </button>
              )}
            </div>

            {/* Back Face */}
            <div
              className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl border p-5 flex flex-col justify-between overflow-y-auto ${cardBorderColor} border-transparent bg-white dark:bg-slate-900`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs uppercase tracking-widest font-extrabold opacity-80">
                  <span className="flex items-center gap-1">
                    {isCorrectChoice ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    {isCorrectChoice ? 'Correct!' : 'Incorrect'}
                  </span>
                  <button
                    onClick={() => toggleBookmark(currentQuestion.uniqueId)}
                    className="p-1 rounded-lg text-white/80 hover:text-white active:scale-95 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label="Bookmark this question"
                  >
                    {isBookmarked ? (
                      <Bookmark size={22} className="fill-white text-white" />
                    ) : (
                      <Bookmark size={22} />
                    )}
                  </button>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-2.5">
                  <h4 className="text-xs uppercase tracking-wider font-extrabold opacity-95">Answers</h4>
                  <div className="text-sm font-semibold flex flex-col gap-1.5">
                    <p className="flex items-center gap-1.5">
                      <span className="opacity-75">Your Answer:</span>
                      <span className="bg-black/20 px-2 py-0.5 rounded-lg text-xs font-bold">{selectedOption}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <span className="opacity-75">Correct Answer:</span>
                      <span className="bg-white text-slate-800 px-2 py-0.5 rounded-lg text-xs font-black">
                        {currentQuestion.correct_answer}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-slate-700 dark:text-slate-350">
                  <h4 className="text-xs uppercase tracking-wider font-extrabold opacity-80">Explanation</h4>
                  <p className="text-sm leading-relaxed font-medium">
                    {currentQuestion.explanation || 'No explanation provided for this question.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsFlipped(false)}
                className="w-full py-3 mt-4 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl text-xs uppercase tracking-widest text-center cursor-pointer active:scale-95 transition-all"
              >
                Hide Answer & Edit Choice
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next controls */}
      <footer className="px-4 grid grid-cols-2 gap-4">
        <button
          onClick={handlePrev}
          disabled={randomCurrentIndex === 0}
          className={`py-3.5 rounded-2xl border text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] ${
            randomCurrentIndex === 0
              ? 'border-slate-200 dark:border-slate-850 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer'
          }`}
        >
          <ChevronLeft size={16} /> Prev
        </button>
        <button
          onClick={handleNext}
          disabled={randomCurrentIndex === totalQuestions - 1}
          className={`py-3.5 rounded-2xl border text-center font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] ${
            randomCurrentIndex === totalQuestions - 1
              ? 'border-slate-200 dark:border-slate-850 text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer'
          }`}
        >
          Next <ChevronRight size={16} />
        </button>
      </footer>
    </div>
  );
};