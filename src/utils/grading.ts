import { GradedQuestionResult, Homework, Question } from '../types';

/**
 * Normalize text for fair English homework auto-grading:
 * - trims outer whitespace
 * - collapses multiple spaces
 * - normalizes curly apostrophes/quotes
 * - strips trailing punctuation (. ! ?) for sentence-level comparisons
 */
export function normalizeAnswer(value: string, stripTrailingPunctuation = true): string {
  let normalized = (value || '')
    .trim()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .toLowerCase();

  if (stripTrailingPunctuation) {
    normalized = normalized.replace(/[.!?]+$/g, '').trim();
  }
  return normalized;
}

/**
 * Strip leading option prefix like "A. ", "B) ", etc.
 */
export function stripOptionPrefix(text: string): string {
  return (text || '').replace(/^[A-Da-d][.)]\s*/, '').trim();
}

export function resolveCorrectOptionIndex(question: Question): number {
  const options = question.options || [];
  if (options.length === 0) return -1;

  const rawCorrect = (question.correctAnswer || '').trim();
  // Match letter A/B/C/D
  const letterMatch = rawCorrect.match(/^([A-Da-d])(?:[.)].*)?$/);
  if (letterMatch && rawCorrect.length <= 3) {
    const idx = letterMatch[1].toUpperCase().charCodeAt(0) - 65;
    if (idx >= 0 && idx < options.length) return idx;
  }

  const targetNorm = normalizeAnswer(stripOptionPrefix(rawCorrect), false);
  return options.findIndex(
    (opt) => normalizeAnswer(stripOptionPrefix(opt), false) === targetNorm
  );
}

export function isQuestionAnswerCorrect(question: Question, studentAnswer: string): boolean {
  const studentNorm = normalizeAnswer(studentAnswer);
  if (!studentNorm) return false;

  if (question.type === 'multiple_choice' && question.options?.length) {
    const correctIdx = resolveCorrectOptionIndex(question);
    if (correctIdx >= 0) {
      const correctOptionText = stripOptionPrefix(question.options[correctIdx]);
      const studentClean = normalizeAnswer(stripOptionPrefix(studentAnswer), false);
      const correctLetter = String.fromCharCode(65 + correctIdx).toLowerCase();
      return (
        studentClean === normalizeAnswer(correctOptionText, false) ||
        studentClean === correctLetter
      );
    }
  }

  const acceptedAnswers = (question.correctAnswer || '')
    .split('|')
    .map((ans) => normalizeAnswer(ans))
    .filter(Boolean);

  return acceptedAnswers.some((accepted) => accepted === studentNorm);
}

export function gradeHomework(
  homework: Homework,
  answers: Record<string, string>
): {
  score: number;
  totalQuestions: number;
  results: GradedQuestionResult[];
} {
  const results: GradedQuestionResult[] = [];
  let score = 0;

  for (const section of homework.sections) {
    for (const q of section.questions) {
      const studentAnswer = answers[q.id] || '';
      const isCorrect = isQuestionAnswerCorrect(q, studentAnswer);
      if (isCorrect) score += 1;

      let displayCorrect = q.correctAnswer;
      if (q.type === 'multiple_choice' && q.options?.length) {
        const idx = resolveCorrectOptionIndex(q);
        if (idx >= 0) {
          displayCorrect = `${String.fromCharCode(65 + idx)}. ${stripOptionPrefix(q.options[idx])}`;
        }
      }

      results.push({
        questionId: q.id,
        studentAnswer,
        correctAnswer: displayCorrect,
        isCorrect,
        explanation: q.explanation,
      });
    }
  }

  return {
    score,
    totalQuestions: results.length,
    results,
  };
}

export function countHomeworkQuestions(homework: Homework): number {
  return homework.sections.reduce((acc, s) => acc + s.questions.length, 0);
}

