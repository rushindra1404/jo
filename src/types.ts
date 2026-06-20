export interface Question {
  question_id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation: string;
  chapterId: string;
  material: 'ica' | 'gpoe';
  uniqueId: string; // material_chapterId_questionId
}

export interface Chapter {
  id: string; // e.g. "chapter01"
  num: number; // 1
  title: string;
  fileName: string;
  material: 'ica' | 'gpoe';
}

export interface RecentActivity {
  id: string;
  timestamp: number;
  type: 'study' | 'exam' | 'mistake' | 'bookmark';
  material: 'ica' | 'gpoe';
  chapterId?: string;
  label: string;
  detail?: string;
  questionsCount?: number;
  accuracy?: number;
}

export interface SessionStats {
  sessionsCount: number;
  streakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  averageDuration: number; // minutes
  longestStreak: number;
  totalSessionTime: number; // minutes
  totalQuestionsReviewed: number;
  completedChaptersCount: number;
  questionsPerDay: Record<string, number>; // date (YYYY-MM-DD) -> count
}

export interface DailyActivityLog {
  date: string; // YYYY-MM-DD
  questionsAttempted: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  studyTimeMinutes: number;
  material: string; // "ICA", "GPOE", or "Mixed"
  chapter: string; // "Chapter X" or "Mixed"
}

export interface UserProgress {
  attempts: Record<string, { correct: boolean; timestamp: number }>; // uniqueId -> attempt status
  mistakes: string[]; // uniqueId list
  bookmarks: string[]; // uniqueId list
  resolvedMistakesCount: number; // count of mistakes corrected
  continueLearning: {
    material: 'ica' | 'gpoe';
    chapterId: string;
    questionIndex: number;
    mode: 'study' | 'flashcard';
  } | null;
  recentActivity: RecentActivity[];
  sessionStats: SessionStats;
  dailyLogs: Record<string, DailyActivityLog>; // date (YYYY-MM-DD) -> activity logs
}

export type FontSizeOption = 'small' | 'medium' | 'large' | 'xlarge';

export interface AccessibilitySettings {
  fontSize: FontSizeOption;
  highContrast: boolean;
  darkMode: boolean;
}
