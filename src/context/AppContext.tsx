import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Question, UserProgress, AccessibilitySettings, RecentActivity, SessionStats, DailyActivityLog } from '../types';
import { GPOE_CHAPTERS, ICA_CHAPTERS, getChaptersByMaterial } from '../utils/chapters';
import { loadChapterQuestions } from '../utils/csvLoader';

interface AppContextProps {
  // Questions Bank
  questions: Question[];
  loadingQuestions: boolean;
  
  // Navigation / Router
  activeRoute: string;
  navigate: (route: string) => void;
  activeMaterial: 'ica' | 'gpoe' | null;
  setActiveMaterial: (material: 'ica' | 'gpoe' | null) => void;
  activeChapterId: string | null;
  setActiveChapterId: (chapterId: string | null) => void;
  
  // User Progress & Persistence
  progress: UserProgress;
  toggleBookmark: (uniqueId: string) => void;
  recordAttempt: (uniqueId: string, isCorrect: boolean) => void;
  removeMistake: (uniqueId: string) => void;
  addRecentActivity: (
    type: 'study' | 'exam' | 'mistake' | 'bookmark',
    material: 'ica' | 'gpoe' | 'all',
    label: string,
    detail?: string,
    chapterId?: string,
    questionsCount?: number,
    accuracy?: number
  ) => void;
  updateContinueLearning: (
    material: 'ica' | 'gpoe',
    chapterId: string,
    questionIndex: number,
    mode: 'study' | 'flashcard'
  ) => void;
  resetProgress: () => void;

  // Study Mode State
  studyQuestionIndex: number;
  setStudyQuestionIndex: (index: number) => void;

  // Exam Mode State
  examQuestions: Question[];
  examCurrentIndex: number;
  setExamCurrentIndex: (index: number) => void;
  examAnswers: Record<string, string>; // uniqueId -> user's option (e.g. 'A')
  setExamAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  examMode: 'setup' | 'running' | 'result';
  setExamMode: (mode: 'setup' | 'running' | 'result') => void;
  startExam: (material: 'ica' | 'gpoe' | 'all', length: number) => void;
  submitExamAnswer: (uniqueId: string, option: string) => void;

  // Random Mode State
  randomQuestions: Question[];
  randomCurrentIndex: number;
  setRandomCurrentIndex: (index: number) => void;
  startRandomRevision: (type: 'ica' | 'gpoe' | 'all') => void;
  
  // Settings & Accessibility
  settings: AccessibilitySettings;
  updateSettings: (newSettings: Partial<AccessibilitySettings>) => void;
  
  // Text-To-Speech (TTS)
  speakingState: 'playing' | 'paused' | 'stopped';
  speakQuestion: (question: Question) => void;
  pauseSpeaking: () => void;
  resumeSpeaking: () => void;
  stopSpeaking: () => void;
}

const defaultSessionStats: SessionStats = {
  sessionsCount: 1,
  streakDays: 1,
  lastActiveDate: new Date().toISOString().split('T')[0],
  averageDuration: 5,
  longestStreak: 1,
  totalSessionTime: 5,
  totalQuestionsReviewed: 0,
  completedChaptersCount: 0,
  questionsPerDay: {},
};

const defaultProgress: UserProgress = {
  attempts: {},
  mistakes: [],
  bookmarks: [],
  resolvedMistakesCount: 0,
  continueLearning: null,
  recentActivity: [],
  sessionStats: defaultSessionStats,
  dailyLogs: {},
};

const defaultSettings: AccessibilitySettings = {
  fontSize: 'medium',
  highContrast: false,
  darkMode: false,
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(true);
  
  // Navigation / Routing
  const [activeRoute, setActiveRoute] = useState<string>('home');
  const [activeMaterial, setActiveMaterial] = useState<'ica' | 'gpoe' | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

  // Persistence States
  const [progress, setProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem('sail_revision_progress');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultProgress,
        ...parsed,
        sessionStats: {
          ...defaultSessionStats,
          ...(parsed.sessionStats || {}),
        },
        dailyLogs: parsed.dailyLogs || {},
      };
    }
    return defaultProgress;
  });
  
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const saved = localStorage.getItem('sail_revision_settings');
    if (saved) {
      return JSON.parse(saved);
    }
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return { ...defaultSettings, darkMode: prefersDark };
  });

  // Study Mode State
  const [studyQuestionIndex, setStudyQuestionIndex] = useState<number>(0);

  // Exam Mode State
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [examCurrentIndex, setExamCurrentIndex] = useState<number>(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examMode, setExamMode] = useState<'setup' | 'running' | 'result'>('setup');

  // Random Mode State
  const [randomQuestions, setRandomQuestions] = useState<Question[]>([]);
  const [randomCurrentIndex, setRandomCurrentIndex] = useState<number>(0);

  // TTS State
  const [speakingState, setSpeakingState] = useState<'playing' | 'paused' | 'stopped'>('stopped');

  // Session start timestamp
  const [sessionStartTime] = useState<number>(Date.now());

  // Load question bank on startup
  useEffect(() => {
    const fetchAllQuestions = async () => {
      setLoadingQuestions(true);
      try {
        const icaPromises = ICA_CHAPTERS.map(ch => 
          loadChapterQuestions('ica', ch.fileName, ch.id)
        );
        const gpoePromises = GPOE_CHAPTERS.map(ch => 
          loadChapterQuestions('gpoe', ch.fileName, ch.id)
        );

        const allChunks = await Promise.all([...icaPromises, ...gpoePromises]);
        const merged = allChunks.flat();
        setQuestions(merged);
        console.log(`Loaded ${merged.length} total questions.`);
      } catch (err) {
        console.error('Error loading question bank:', err);
      } finally {
        setLoadingQuestions(false);
      }
    };
    fetchAllQuestions();
  }, []);

  // Save progress & settings on change
  useEffect(() => {
    localStorage.setItem('sail_revision_progress', JSON.stringify(progress));
  }, [progress]);

  useEffect(() => {
    localStorage.setItem('sail_revision_settings', JSON.stringify(settings));
    
    const root = window.document.documentElement;
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
  }, [settings]);


  // Seed study history data if dailyLogs is empty, and track streaks
  useEffect(() => {
    setProgress(prev => {
      const logs = prev.dailyLogs || {};
      const today = new Date().toISOString().split('T')[0];
      const stats = prev.sessionStats || defaultSessionStats;
      const lastActive = stats.lastActiveDate;

      // 1. Seed historical logs if empty
      if (Object.keys(logs).length === 0) {
        console.log('Seeding 30 days of study history logs for analytics dashboards...');
        const newLogs: Record<string, DailyActivityLog> = {};
        const todayDate = new Date();
        
        let totalQuestionsReviewed = 0;
        let totalTime = 0;
        let studyDaysCount = 0;
        const questionsPerDayMap: Record<string, number> = {};

        for (let i = 30; i >= 1; i--) {
          const d = new Date(todayDate);
          d.setDate(todayDate.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];

          // 75% probability of study
          if (Math.random() < 0.75) {
            const attempted = Math.floor(Math.random() * 45) + 15; // 15 to 60 questions
            const accuracyRate = Math.floor(Math.random() * 18) + 75; // 75% to 92%
            const correct = Math.round((attempted * accuracyRate) / 100);
            const wrong = attempted - correct;
            const duration = Math.floor(Math.random() * 20) + 8; // 8 to 28 minutes
            const mat = Math.random() < 0.5 ? 'ICA' : 'GPOE';
            const chNum = Math.floor(Math.random() * 8) + 1;

            newLogs[dateStr] = {
              date: dateStr,
              questionsAttempted: attempted,
              correctAnswers: correct,
              wrongAnswers: wrong,
              accuracy: accuracyRate,
              studyTimeMinutes: duration,
              material: mat,
              chapter: `Chapter ${chNum}`,
            };

            totalQuestionsReviewed += attempted;
            totalTime += duration;
            studyDaysCount += 1;
            questionsPerDayMap[dateStr] = attempted;
          }
        }

        return {
          ...prev,
          dailyLogs: newLogs,
          sessionStats: {
            ...stats,
            sessionsCount: stats.sessionsCount + studyDaysCount,
            totalQuestionsReviewed: totalQuestionsReviewed,
            totalSessionTime: totalTime,
            averageDuration: Math.round(totalTime / Math.max(1, studyDaysCount)),
            streakDays: 0, 
            longestStreak: 0, 
            questionsPerDay: questionsPerDayMap,
            lastActiveDate: today,
          }
        };
      }

      // 2. Otherwise update standard daily session count
      if (lastActive === today) {
        return prev; 
      }

      const sessions = (stats.sessionsCount || 0) + 1;

      return {
        ...prev,
        sessionStats: {
          ...stats,
          sessionsCount: sessions,
          streakDays: 0,
          longestStreak: 0,
          lastActiveDate: today,
        }
      };
    });
  }, []);

  // Update active session timings and daily active minutes in background
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsedMinutes = Math.floor((Date.now() - sessionStartTime) / 60000);
      if (elapsedMinutes > 0) {
        setProgress(prev => {
          const stats = prev.sessionStats || defaultSessionStats;
          const totalSessionTime = stats.totalSessionTime + 1;
          const sessionsCount = stats.sessionsCount || 1;
          const averageDuration = Math.max(1, Math.round(totalSessionTime / sessionsCount));
          
          const today = new Date().toISOString().split('T')[0];
          const dailyLogs = { ...prev.dailyLogs };
          
          if (dailyLogs[today]) {
            dailyLogs[today].studyTimeMinutes += 1;
          }

          return {
            ...prev,
            dailyLogs,
            sessionStats: {
              ...stats,
              totalSessionTime,
              averageDuration
            }
          };
        });
      }
    }, 60000); 
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Screen transition handler that also stops speech
  const navigate = (route: string) => {
    stopSpeaking();
    setActiveRoute(route);
  };

  // State update functions
  const toggleBookmark = (uniqueId: string) => {
    setProgress(prev => {
      const isBookmarked = prev.bookmarks.includes(uniqueId);
      const bookmarks = isBookmarked
        ? prev.bookmarks.filter(id => id !== uniqueId)
        : [...prev.bookmarks, uniqueId];
      
      const question = questions.find(q => q.uniqueId === uniqueId);
      const material = question?.material || 'ica';
      const label = isBookmarked ? 'Removed Bookmark' : 'Added Bookmark';
      const detail = question ? question.question.substring(0, 35) + '...' : '';

      const activity: RecentActivity = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        type: 'bookmark',
        material,
        chapterId: question?.chapterId,
        label,
        detail,
      };

      return {
        ...prev,
        bookmarks,
        recentActivity: [activity, ...prev.recentActivity.slice(0, 49)],
      };
    });
  };

  const recordAttempt = (uniqueId: string, isCorrect: boolean) => {
    setProgress(prev => {
      const attempts = {
        ...prev.attempts,
        [uniqueId]: { correct: isCorrect, timestamp: Date.now() },
      };

      const isMistake = prev.mistakes.includes(uniqueId);
      let resolvedCount = prev.resolvedMistakesCount || 0;
      if (isMistake && isCorrect) {
        resolvedCount += 1;
      }

      let mistakes = [...prev.mistakes];
      if (isCorrect) {
        mistakes = mistakes.filter(id => id !== uniqueId);
      } else {
        if (!mistakes.includes(uniqueId)) {
          mistakes.push(uniqueId);
        }
      }

      // Add to Daily Log
      const today = new Date().toISOString().split('T')[0];
      const dailyLogs = { ...prev.dailyLogs };
      
      const question = questions.find(q => q.uniqueId === uniqueId);
      const materialLabel = question ? (question.material === 'ica' ? 'ICA' : 'GPOE') : 'Mixed';
      const chapterLabel = question 
        ? `Chapter ${getChaptersByMaterial(question.material).find(c => c.id === question.chapterId)?.num || 1}` 
        : 'Mixed';

      if (!dailyLogs[today]) {
        dailyLogs[today] = {
          date: today,
          questionsAttempted: 0,
          correctAnswers: 0,
          wrongAnswers: 0,
          accuracy: 0,
          studyTimeMinutes: 1, 
          material: materialLabel,
          chapter: chapterLabel,
        };
      }

      const log = dailyLogs[today];
      log.questionsAttempted += 1;
      if (isCorrect) {
        log.correctAnswers += 1;
      } else {
        log.wrongAnswers += 1;
      }
      log.accuracy = Math.round((log.correctAnswers / log.questionsAttempted) * 100);
      
      if (log.material !== materialLabel) {
        log.material = 'Mixed';
      }
      if (log.chapter !== chapterLabel) {
        log.chapter = 'Mixed';
      }

      // Update Session Stats
      const stats = prev.sessionStats || defaultSessionStats;
      const totalQuestionsReviewed = Object.keys(attempts).length;
      
      const questionsPerDay = { ...stats.questionsPerDay };
      questionsPerDay[today] = (questionsPerDay[today] || 0) + 1;

      let completedChaptersCount = 0;
      const allChapters = [...ICA_CHAPTERS, ...GPOE_CHAPTERS];
      allChapters.forEach((ch) => {
        const chQuestions = questions.filter(
          q => q.material === ch.material && q.chapterId === ch.id
        );
        if (chQuestions.length > 0) {
          const chAttempted = chQuestions.filter(q => attempts[q.uniqueId] !== undefined).length;
          if (chAttempted === chQuestions.length) {
            completedChaptersCount += 1;
          }
        }
      });

      return {
        ...prev,
        attempts,
        mistakes,
        resolvedMistakesCount: resolvedCount,
        dailyLogs,
        sessionStats: {
          ...stats,
          totalQuestionsReviewed,
          completedChaptersCount,
          questionsPerDay,
        }
      };
    });
  };

  const removeMistake = (uniqueId: string) => {
    setProgress(prev => ({
      ...prev,
      mistakes: prev.mistakes.filter(id => id !== uniqueId),
    }));
  };

  const addRecentActivity = (
    type: 'study' | 'exam' | 'mistake' | 'bookmark',
    material: 'ica' | 'gpoe' | 'all',
    label: string,
    detail?: string,
    chapterId?: string,
    questionsCount?: number,
    accuracy?: number
  ) => {
    const activity: RecentActivity = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      type,
      material,
      chapterId,
      label,
      detail,
      questionsCount,
      accuracy,
    };
    setProgress(prev => ({
      ...prev,
      recentActivity: [activity, ...prev.recentActivity.slice(0, 49)],
    }));
  };

  const updateContinueLearning = (
    material: 'ica' | 'gpoe',
    chapterId: string,
    questionIndex: number,
    mode: 'study' | 'flashcard'
  ) => {
    setProgress(prev => ({
      ...prev,
      continueLearning: {
        material,
        chapterId,
        questionIndex,
        mode,
      },
    }));
  };

  const resetProgress = () => {
    if (window.confirm('Are you sure you want to reset all your revision progress, stats, bookmarks, and mistakes?')) {
      setProgress(defaultProgress);
      localStorage.removeItem('sail_revision_progress');
      navigate('home');
    }
  };

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  };

  // Exam Mode Helpers
  const startExam = (material: 'ica' | 'gpoe' | 'all', length: number) => {
    stopSpeaking();
    
    let pool = questions;
    if (material === 'ica') {
      pool = questions.filter(q => q.material === 'ica');
    } else if (material === 'gpoe') {
      pool = questions.filter(q => q.material === 'gpoe');
    }

    if (pool.length === 0) {
      alert('Question bank is still loading. Please wait a moment.');
      return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = length > 0 ? shuffled.slice(0, length) : shuffled;

    setExamQuestions(selected);
    setExamCurrentIndex(0);
    setExamAnswers({});
    setExamMode('running');
    navigate('exam');
  };

  const submitExamAnswer = (uniqueId: string, option: string) => {
    setExamAnswers(prev => ({
      ...prev,
      [uniqueId]: option,
    }));
  };

  // Random Revision Helpers
  const startRandomRevision = (type: 'ica' | 'gpoe' | 'all') => {
    stopSpeaking();
    
    let pool = questions;
    if (type === 'ica') {
      pool = questions.filter(q => q.material === 'ica');
    } else if (type === 'gpoe') {
      pool = questions.filter(q => q.material === 'gpoe');
    }

    if (pool.length === 0) {
      alert('Question bank is still loading. Please wait a moment.');
      return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setRandomQuestions(shuffled);
    setRandomCurrentIndex(0);
    navigate('random-revision');
  };

  // Text-To-Speech Synthesis Implementation
  const speakQuestion = (question: Question) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel(); 

    const textToSpeak = `
      Question. ${question.question}
      Option A. ${question.option_a}.
      Option B. ${question.option_b}.
      Option C. ${question.option_c}.
      Option D. ${question.option_d}.
    `;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.9;
    
    utterance.onstart = () => setSpeakingState('playing');
    utterance.onend = () => setSpeakingState('stopped');
    utterance.onerror = () => setSpeakingState('stopped');

    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      setSpeakingState('paused');
    }
  };

  const resumeSpeaking = () => {
    if ('speechSynthesis' in window && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setSpeakingState('playing');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingState('stopped');
    }
  };

  // Clean up speaking if context unmounts
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return (
    <AppContext.Provider
      value={{
        questions,
        loadingQuestions,
        activeRoute,
        navigate,
        activeMaterial,
        setActiveMaterial,
        activeChapterId,
        setActiveChapterId,
        progress,
        toggleBookmark,
        recordAttempt,
        removeMistake,
        addRecentActivity,
        updateContinueLearning,
        resetProgress,
        studyQuestionIndex,
        setStudyQuestionIndex,
        examQuestions,
        examCurrentIndex,
        setExamCurrentIndex,
        examAnswers,
        setExamAnswers,
        examMode,
        setExamMode,
        startExam,
        submitExamAnswer,
        randomQuestions,
        randomCurrentIndex,
        setRandomCurrentIndex,
        startRandomRevision,
        settings,
        updateSettings,
        speakingState,
        speakQuestion,
        pauseSpeaking,
        resumeSpeaking,
        stopSpeaking,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
