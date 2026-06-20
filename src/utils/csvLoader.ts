import Papa from 'papaparse';
import type { Question } from '../types';

// ─── Question Bank Loader ────────────────────────────────────────────────────
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
                uniqueId,
              };
            })
            .filter((q) => q.question_id && q.question && q.correct_answer);

          resolve(questions);
        },
        error: (error: any) => {
          reject(error);
        },
      });
    });
  } catch (error) {
    console.error(`Error loading questions from ${url}:`, error);
    return [];
  }
};

// ─── FlashCard Type ──────────────────────────────────────────────────────────
export interface FlashCard {
  id: string;
  title: string;        // Short context label / topic heading
  point: string;        // Main fact / statement — shown on front face
  explanation: string;  // Detailed content — shown on back face
  category: string;     // e.g. "Fact", "Exam Point", "Definition", "Safety"
  importance: 'High' | 'Medium' | 'Low';
  example: string;      // Optional worked example (new schema only)
  notes: string;        // Optional memory hook / notes (new schema only)
  chapterId: string;
  material: 'ica' | 'gpoe';
  uniqueId: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const priorityToImportance = (priority: string | number): FlashCard['importance'] => {
  const p = Number(priority);
  if (p >= 5) return 'High';
  if (p >= 3) return 'Medium';
  return 'Low';
};

const textToImportance = (text: string): FlashCard['importance'] => {
  const t = (text || '').trim().toLowerCase();
  if (t === 'high') return 'High';
  if (t === 'medium') return 'Medium';
  return 'Low';
};

// ─── FlashCard Loader ─────────────────────────────────────────────────────────
// Supports two CSV schemas automatically:
//
//  Current schema  →  point_id | category | priority | title | point
//  New schema      →  card_id  | title    | content  | category | importance | example | notes
//
export const loadChapterFlashCards = async (
  material: 'ica' | 'gpoe',
  fileName: string,
  chapterId: string
): Promise<FlashCard[]> => {
  const url = `/flash_cards/${material}/${fileName}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`No flashcard CSV found at ${url}.`);
      return [];
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const rows = results.data as any[];

          // Detect schema from first non-empty row's keys
          const firstRow = rows[0] || {};
          const hasNewSchema = 'content' in firstRow || 'card_id' in firstRow;

          const cards: FlashCard[] = rows
            .map((row: any, idx: number) => {
              let id: string, title: string, point: string, explanation: string;
              let category: string, importance: FlashCard['importance'];
              let example: string, notes: string;

              if (hasNewSchema) {
                // ── New schema ──────────────────────────────────────────
                id          = String(row.card_id || idx + 1).trim();
                title       = (row.title || '').trim();
                point       = (row.content || '').trim();
                explanation = (row.content || '').trim();
                category    = (row.category || '').trim();
                importance  = textToImportance(row.importance || '');
                example     = (row.example || '').trim();
                notes       = (row.notes || '').trim();
              } else {
                // ── Current schema ──────────────────────────────────────
                // point_id | category | priority | title | point
                id          = String(row.point_id || row.id || idx + 1).trim();
                title       = (row.title || '').trim();
                point       = (row.point || row.important_point || '').trim();
                explanation = point;
                category    = (row.category || '').trim();
                importance  = priorityToImportance(row.priority || 3);
                example     = '';
                notes       = '';
              }

              return {
                id,
                title,
                point,
                explanation,
                category,
                importance,
                example,
                notes,
                chapterId,
                material,
                uniqueId: `fc_${material}_${chapterId}_${id}`,
              };
            })
            .filter((c) => c.point);

          resolve(cards);
        },
        error: (error: any) => reject(error),
      });
    });
  } catch (error) {
    console.error(`Error loading flashcards from ${url}:`, error);
    return [];
  }
};
