import type { Question } from '../types';

export interface ShuffledOption {
  key: 'A' | 'B' | 'C' | 'D';
  originalKey: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ShuffledQuestionDetails {
  uniqueId: string;
  options: ShuffledOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function shuffleQuestion(question: Question): ShuffledQuestionDetails {
  const originalOptions = [
    { originalKey: 'A' as const, text: question.option_a },
    { originalKey: 'B' as const, text: question.option_b },
    { originalKey: 'C' as const, text: question.option_c },
    { originalKey: 'D' as const, text: question.option_d },
  ];

  const shuffledOptions = shuffleArray(originalOptions);

  const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  const finalOptions: ShuffledOption[] = shuffledOptions.map((opt, index) => ({
    key: keys[index],
    originalKey: opt.originalKey,
    text: opt.text,
  }));

  const normalizedCorrectAnswer = question.correct_answer.trim().toUpperCase();
  const correctOpt = finalOptions.find(opt => opt.originalKey === normalizedCorrectAnswer);
  const correctAnswer = correctOpt ? correctOpt.key : 'A';

  return {
    uniqueId: question.uniqueId,
    options: finalOptions,
    correctAnswer,
  };
}
