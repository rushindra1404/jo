import Papa from 'papaparse';
import type { Question } from '../types';

export const loadChapterQuestions = async (
  material: 'ica' | 'gpoe',
  fileName: string,
  chapterId: string
): Promise<Question[]> => {
  const url = `/question_bank/${material}/${fileName}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load ${url}: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const questions: Question[] = results.data
            .map((row: any) => {
              const qId = row.question_id || row.questionId || row.id || '';
              const qText = row.question || '';
              const optA = row.option_a || row.optionA || row.option1 || '';
              const optB = row.option_b || row.optionB || row.option2 || '';
              const optC = row.option_c || row.optionC || row.option3 || '';
              const optD = row.option_d || row.optionD || row.option4 || '';
              const correct = row.correct_answer || row.correctAnswer || row.correct || '';
              const exp = row.explanation || '';
              
              const uniqueId = `${material}_${chapterId}_${qId}`;
              
              return {
                question_id: String(qId).trim(),
                question: qText.trim(),
                option_a: optA.trim(),
                option_b: optB.trim(),
                option_c: optC.trim(),
                option_d: optD.trim(),
                correct_answer: correct.trim(),
                explanation: exp.trim(),
                chapterId,
                material,
                uniqueId
              };
            })
            // Filter out empty rows or row headers
            .filter((q) => q.question_id && q.question && q.correct_answer);
            
          resolve(questions);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error loading questions from ${url}:`, error);
    return [];
  }
};

export interface FlashCard {
  id: string;
  point: string;
  explanation: string;
  chapterId: string;
  material: 'ica' | 'gpoe';
  uniqueId: string;
}

export const loadChapterFlashCards = async (
  material: 'ica' | 'gpoe',
  fileName: string,
  chapterId: string,
  chapterQuestionsFallback: Question[] = []
): Promise<FlashCard[]> => {
  const url = `/flash_cards/${material}/${fileName}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (chapterQuestionsFallback.length > 0) {
        return chapterQuestionsFallback.map((q, idx) => ({
          id: q.question_id,
          point: q.question,
          explanation: `Correct Answer: ${q.correct_answer}\n\n${q.explanation || q[`option_${q.correct_answer.toLowerCase()}` as keyof Question] || ''}`,
          chapterId,
          material,
          uniqueId: `fc_${material}_${chapterId}_${q.question_id || idx}`
        }));
      }
      return [];
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const cards: FlashCard[] = results.data
            .map((row: any, idx: number) => {
              const cardId = row.id || row.card_id || String(idx + 1);
              const point = row.point || row.important_point || row.front || '';
              const explanation = row.explanation || row.back || row.details || '';
              
              const uniqueId = `fc_${material}_${chapterId}_${cardId}`;
              
              return {
                id: String(cardId).trim(),
                point: point.trim(),
                explanation: explanation.trim(),
                chapterId,
                material,
                uniqueId
              };
            })
            .filter((c) => c.point);
            
          resolve(cards);
        },
        error: (error: any) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error(`Error loading flashcards from ${url}:`, error);
    if (chapterQuestionsFallback.length > 0) {
      return chapterQuestionsFallback.map((q, idx) => ({
        id: q.question_id,
        point: q.question,
        explanation: `Correct Answer: ${q.correct_answer}\n\n${q.explanation || q[`option_${q.correct_answer.toLowerCase()}` as keyof Question] || ''}`,
        chapterId,
        material,
        uniqueId: `fc_${material}_${chapterId}_${q.question_id || idx}`
      }));
    }
    return [];
  }
};
