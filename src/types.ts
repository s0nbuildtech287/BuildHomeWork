export type SubjectId =
  | 'english'
  | 'math'
  | 'physics'
  | 'chemistry'
  | 'literature'
  | 'history'
  | 'geography';

export type TargetLevel = 'elementary' | 'secondary' | 'communication';

export type ListeningStyle = 'multiple_choice' | 'note_fill' | 'matching_box' | 'true_false';

export type QuestionType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'word_form'
  | 'sentence_order'
  | 'rewrite'
  | 'find_mistake'
  | 'writing'
  | 'short_answer'
  | 'essay';

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  imageUrl?: string; // Optional illustration attached to this question
  options?: string[]; // Used for multiple_choice and find_mistake
  words?: string[]; // Used for sentence_order
  hint?: string; // Optional base verb, keyword, or word cue
  correctAnswer: string; // Supports multiple valid answers separated by " | "; model essay for writing
  explanation: string; // Vietnamese explanation or writing rubric for students & teacher
}

export interface HomeworkSection {
  id: string;
  title: string;
  instruction: string;
  type: QuestionType;
  imageUrl?: string; // Optional shared illustration for this section
  readingPassage?: string;
  listeningScript?: string;
  audioUrl?: string;
  audioVoice?: string;
  audioRate?: string;
  wordBank?: string[];
  questions: Question[];
}

export interface Homework {
  id: string;
  subject?: SubjectId;
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
  find_mistake: number;
  listening_questions: number;
  writing: number;
  true_false_group: number;
  short_answer: number;
  essay: number;
}

export interface GeneratorConfig {
  subject: SubjectId;
  level: TargetLevel;
  gradeOrClass: string;
  topic: string;
  grammarFocus: string;
  vocabularyFocus: string;
  studentMistakes: string;
  extraInstructions?: string;
  listeningStyle?: ListeningStyle;
  includeStepByStep?: boolean;
  useLatexFormulas?: boolean;
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
  isManualReview?: boolean;
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
