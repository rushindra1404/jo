import { create } from 'zustand';
import type { Question } from '../types';
import {
  saveActiveExam,
  getActiveExam,
  clearActiveExam,
  saveExamHistory,
  getExamHistory,
} from '../utils/indexedDB';
import { shuffleQuestion } from '../utils/shuffler';
import type { ShuffledQuestionDetails } from '../utils/shuffler';

export interface ExamHistoryItem {
  id: string;
  date: number;
  material: 'ica' | 'gpoe' | 'all';
  chapterId: string;
  chapterTitle: string;
  chapterNum: number;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unanswered: number;
  score: number;
  accuracy: number;
  timeTaken: number; // in seconds
  timeLeft: number | null;
  timerOption: number | null; // in minutes
  answers: Record<string, string>;
  questions: Question[];
  shuffledQuestions?: Record<string, ShuffledQuestionDetails>;
}

interface ExamState {
  // Setup States
  selectedMaterial: 'ica' | 'gpoe' | 'all' | null;
  selectedChapterId: string | null;
  selectedChapterTitle: string;
  selectedChapterNum: number;
  
  // Running States
  questions: Question[];
  shuffledQuestions: Record<string, ShuffledQuestionDetails>;
  currentIndex: number;
  answers: Record<string, string>;
  markedForReview: string[];
  visited: string[];
  timeLeft: number | null; // in seconds
  timerOption: number | null; // in minutes
  questionOrder: 'original' | 'randomized';
  answerMode: 'after_submission' | 'instant';
  examMode: 'setup' | 'running' | 'result' | 'review';
  timeTaken: number; // in seconds
  
  // History & Load States
  examHistory: ExamHistoryItem[];
  historyLoading: boolean;
  activeExamSaved: any | null; // Holds cached active exam to resume
  
  // Basic Setup Actions
  setMaterial: (material: 'ica' | 'gpoe' | 'all' | null) => void;
  setChapter: (chapterId: string | null, num: number, title: string) => void;
  setExamMode: (mode: 'setup' | 'running' | 'result' | 'review') => void;
  setCurrentIndex: (index: number) => void;
  
  // CBT Control Actions
  startExam: (
    pool: Question[],
    timerOption: number | null,
    questionOrder: 'original' | 'randomized',
    answerMode: 'after_submission' | 'instant'
  ) => void;
  selectOption: (uniqueId: string, option: string) => void;
  clearResponse: (uniqueId: string) => void;
  toggleMarkForReview: (uniqueId: string) => void;
  markVisited: (uniqueId: string) => void;
  tickTimer: () => void;
  submitExam: (
    recordAttemptCallback: (uniqueId: string, isCorrect: boolean) => void,
    addActivityCallback: (
      type: 'exam',
      material: 'ica' | 'gpoe' | 'all',
      label: string,
      detail: string,
      chapterId: string,
      questionsCount: number,
      accuracy: number
    ) => void
  ) => Promise<ExamHistoryItem>;
  retakeExam: () => void;
  exitExam: () => void;

  
  // Storage & Persistent recovery Actions
  loadHistory: () => Promise<void>;
  checkActiveExam: () => Promise<boolean>;
  resumeActiveExam: () => Promise<void>;
  discardActiveExam: () => Promise<void>;
}

export const useExamStore = create<ExamState>((set, get) => {
  // Helper to persist current active exam state
  const persistActiveState = (updatedFields: Partial<ExamState>) => {
    const state = { ...get(), ...updatedFields };
    if (state.examMode === 'running') {
      saveActiveExam({
        selectedMaterial: state.selectedMaterial,
        selectedChapterId: state.selectedChapterId,
        selectedChapterTitle: state.selectedChapterTitle,
        selectedChapterNum: state.selectedChapterNum,
        questions: state.questions,
        shuffledQuestions: state.shuffledQuestions,
        currentIndex: state.currentIndex,
        answers: state.answers,
        markedForReview: state.markedForReview,
        visited: state.visited,
        timeLeft: state.timeLeft,
        timerOption: state.timerOption,
        questionOrder: state.questionOrder,
        answerMode: state.answerMode,
        examMode: state.examMode,
        timeTaken: state.timeTaken,
      });
    }
  };

  return {
    selectedMaterial: null,
    selectedChapterId: null,
    selectedChapterTitle: '',
    selectedChapterNum: 0,
    
    questions: [],
    shuffledQuestions: {},
    currentIndex: 0,
    answers: {},
    markedForReview: [],
    visited: [],
    timeLeft: null,
    timerOption: null,
    questionOrder: 'original',
    answerMode: 'after_submission',
    examMode: 'setup',
    timeTaken: 0,
    
    examHistory: [],
    historyLoading: false,
    activeExamSaved: null,

    setMaterial: (material) => {
      set({ selectedMaterial: material, selectedChapterId: null });
    },

    setChapter: (chapterId, num, title) => {
      set({ selectedChapterId: chapterId, selectedChapterNum: num, selectedChapterTitle: title });
    },

    setExamMode: (mode) => {
      set({ examMode: mode });
      persistActiveState({ examMode: mode });
    },

    setCurrentIndex: (index) => {
      const q = get().questions[index];
      const visited = [...get().visited];
      if (q && !visited.includes(q.uniqueId)) {
        visited.push(q.uniqueId);
      }
      set({ currentIndex: index, visited });
      persistActiveState({ currentIndex: index, visited });
    },

    startExam: (pool, timerOption, questionOrder, answerMode) => {
      let finalQuestions = [...pool];
      if (questionOrder === 'randomized') {
        finalQuestions.sort(() => Math.random() - 0.5);
      }
      
      const examShuffledMap: Record<string, ShuffledQuestionDetails> = {};
      finalQuestions.forEach(q => {
        examShuffledMap[q.uniqueId] = shuffleQuestion(q);
      });

      const firstQ = finalQuestions[0];
      const visited = firstQ ? [firstQ.uniqueId] : [];
      const totalSeconds = timerOption ? timerOption * 60 : null;

      const newState = {
        questions: finalQuestions,
        shuffledQuestions: examShuffledMap,
        currentIndex: 0,
        answers: {},
        markedForReview: [],
        visited,
        timeLeft: totalSeconds,
        timerOption,
        questionOrder,
        answerMode,
        examMode: 'running' as const,
        timeTaken: 0,
      };

      set(newState);
      persistActiveState(newState);
    },

    selectOption: (uniqueId, option) => {
      const answers = { ...get().answers, [uniqueId]: option };
      set({ answers });
      persistActiveState({ answers });
    },

    clearResponse: (uniqueId) => {
      const answers = { ...get().answers };
      delete answers[uniqueId];
      set({ answers });
      persistActiveState({ answers });
    },

    toggleMarkForReview: (uniqueId) => {
      const marked = get().markedForReview.includes(uniqueId)
        ? get().markedForReview.filter((id) => id !== uniqueId)
        : [...get().markedForReview, uniqueId];
      set({ markedForReview: marked });
      persistActiveState({ markedForReview: marked });
    },

    markVisited: (uniqueId) => {
      if (!get().visited.includes(uniqueId)) {
        const visited = [...get().visited, uniqueId];
        set({ visited });
        persistActiveState({ visited });
      }
    },

    tickTimer: () => {
      if (get().examMode !== 'running') return;

      const current = get().timeLeft;
      const taken = get().timeTaken + 1;

      if (current !== null) {
        if (current <= 1) {
          // Timer ended - auto submit will trigger in view layer or handled manually
          set({ timeLeft: 0, timeTaken: taken });
        } else {
          set({ timeLeft: current - 1, timeTaken: taken });
          persistActiveState({ timeLeft: current - 1, timeTaken: taken });
        }
      } else {
        set({ timeTaken: taken });
        persistActiveState({ timeTaken: taken });
      }
    },

    submitExam: async (recordAttemptCallback, addActivityCallback) => {
      const {
        questions,
        shuffledQuestions,
        answers,
        timeTaken,
        timeLeft,
        timerOption,
        selectedMaterial,
        selectedChapterId,
        selectedChapterTitle,
        selectedChapterNum,
      } = get();

      let correct = 0;
      let wrong = 0;
      let unanswered = 0;

      questions.forEach((q) => {
        const ans = answers[q.uniqueId];
        const correctAnswer = shuffledQuestions[q.uniqueId]?.correctAnswer || q.correct_answer;
        if (!ans) {
          unanswered++;
        } else if (ans === correctAnswer) {
          correct++;
          recordAttemptCallback(q.uniqueId, true);
        } else {
          wrong++;
          recordAttemptCallback(q.uniqueId, false);
        }
      });

      const total = questions.length;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      const score = correct;

      const historyItem: ExamHistoryItem = {
        id: Math.random().toString(36).substring(2, 11),
        date: Date.now(),
        material: selectedMaterial || 'ica',
        chapterId: selectedChapterId || 'general',
        chapterTitle: selectedChapterTitle || 'Practice Test',
        chapterNum: selectedChapterNum || 1,
        totalQuestions: total,
        correct,
        wrong,
        unanswered,
        score,
        accuracy,
        timeTaken,
        timeLeft,
        timerOption,
        answers,
        questions,
        shuffledQuestions,
      };

      // 1. Save to IndexedDB history
      await saveExamHistory(historyItem);

      // 2. Add to global activities in AppContext
      addActivityCallback(
        'exam',
        selectedMaterial || 'ica',
        selectedMaterial === 'all' ? 'Exam: All Chapters Mix' : `Exam: Ch ${selectedChapterNum}`,
        `Score: ${correct}/${total} (${accuracy}% Accuracy in ${Math.floor(timeTaken / 60)}m)`,
        selectedChapterId || 'general',
        total,
        accuracy
      );

      // 3. Clear active exam state in IndexedDB
      await clearActiveExam();

      // 4. Update local state
      set({ examMode: 'result', activeExamSaved: null });
      await get().loadHistory();

      return historyItem;
    },

    retakeExam: () => {
      const { questions, timerOption, questionOrder, answerMode } = get();
      get().startExam(questions, timerOption, questionOrder, answerMode);
    },

    exitExam: () => {
      clearActiveExam();
      set({
        questions: [],
        currentIndex: 0,
        answers: {},
        markedForReview: [],
        visited: [],
        timeLeft: null,
        timerOption: null,
        examMode: 'setup',
        timeTaken: 0,
        activeExamSaved: null,
      });
    },

    loadHistory: async () => {
      set({ historyLoading: true });
      const history = await getExamHistory();
      // Sort by date descending
      history.sort((a, b) => b.date - a.date);
      set({ examHistory: history, historyLoading: false });
    },

    checkActiveExam: async () => {
      set({ activeExamLoading: true } as any);
      const saved = await getActiveExam();
      if (saved && saved.examMode === 'running') {
        set({ activeExamSaved: saved, activeExamLoading: false } as any);
        return true;
      }
      set({ activeExamSaved: null, activeExamLoading: false } as any);
      return false;
    },

    resumeActiveExam: async () => {
      const saved = get().activeExamSaved;
      if (saved) {
        set({
          selectedMaterial: saved.selectedMaterial,
          selectedChapterId: saved.selectedChapterId,
          selectedChapterTitle: saved.selectedChapterTitle,
          selectedChapterNum: saved.selectedChapterNum,
          questions: saved.questions,
          shuffledQuestions: saved.shuffledQuestions || {},
          currentIndex: saved.currentIndex,
          answers: saved.answers,
          markedForReview: saved.markedForReview,
          visited: saved.visited,
          timeLeft: saved.timeLeft,
          timerOption: saved.timerOption,
          questionOrder: saved.questionOrder,
          answerMode: saved.answerMode,
          examMode: saved.examMode,
          timeTaken: saved.timeTaken,
          activeExamSaved: null,
        });
      }
    },

    discardActiveExam: async () => {
      await clearActiveExam();
      set({ activeExamSaved: null });
    },
  };
});
