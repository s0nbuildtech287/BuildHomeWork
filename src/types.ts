export type TargetLevel = 'elementary' | 'secondary' | 'communication';

export type QuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'word_form'
  | 'sentence_order'
  | 'rewrite';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[]; // Used for multiple_choice
  words?: string[]; // Used for sentence_order
  hint?: string; // Optional base verb, keyword, or word cue
  correctAnswer: string; // Supports multiple valid answers separated by " | "
  explanation: string; // Vietnamese explanation for students & teacher
}

export interface HomeworkSection {
  id: string;
  title: string;
  instruction: string;
  type: QuestionType;
  readingPassage?: string;
  wordBank?: string[];
  questions: Question[];
}

export interface Homework {
  id: string;
  title: string;
  subtitle?: string;
  level: TargetLevel;
  gradeOrClass?: string;
  teacherName?: string;
  centerName?: string;
  topicSummary: string;
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
  sections: HomeworkSection[];
}

export interface SectionCountConfig {
  multiple_choice: number;
  fill_blank: number;
  word_form: number;
  sentence_order: number;
  rewrite: number;
  reading_questions: number;
}

export interface GeneratorConfig {
  level: TargetLevel;
  gradeOrClass: string;
  topic: string;
  grammarFocus: string;
  vocabularyFocus: string;
  studentMistakes: string;
  extraInstructions?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  counts: SectionCountConfig;
}

export interface AppSettings {
  geminiApiKey: string;
  geminiModel: string;
  teacherName: string;
  centerName: string;
}

export interface GradedQuestionResult {
  questionId: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation: string;
}

export interface StudentSubmission {
  id: string;
  homeworkId: string;
  studentName: string;
  studentClass: string;
  submittedAt: string;
  score: number;
  totalQuestions: number;
  answers: Record<string, string>;
  results: GradedQuestionResult[];
}

