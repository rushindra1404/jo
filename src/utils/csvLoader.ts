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
