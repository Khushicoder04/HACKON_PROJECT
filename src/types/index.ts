export interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "user" | "admin";
  learning_streak: number;
  last_active_date: string | null;
  total_study_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  title: string;
  file_name: string;
  file_type: "pdf" | "docx" | "txt";
  file_size: number;
  storage_path: string;
  page_count: number;
  word_count: number;
  status: "processing" | "ready" | "failed";
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  chunk_index: number;
  page_number: number | null;
  token_count: number;
  metadata: Record<string, unknown>;
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  pageNumber: number | null;
  snippet: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: Citation[];
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  document_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Quiz {
  id: string;
  user_id: string;
  document_id: string | null;
  title: string;
  topic: string | null;
  difficulty: "easy" | "medium" | "hard";
  question_count: number;
  created_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  question_type: "mcq" | "true_false" | "fill_blank" | "short_answer";
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
  topic: string | null;
  order_index: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  correct_count: number;
  wrong_count: number;
  answers: QuizAnswer[];
  weak_topics: string[];
  time_taken_seconds: number | null;
  completed_at: string;
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  goals: string[];
  daily_tasks: DailyTask[];
  weak_topics: string[];
  is_active: boolean;
  start_date: string;
  end_date: string | null;
}

export interface DailyTask {
  day: number;
  tasks: string[];
  topics: string[];
}

export interface Recommendation {
  id: string;
  user_id: string;
  type: "topic" | "quiz" | "document" | "revision";
  title: string;
  description: string | null;
  priority: number;
  metadata: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface ProgressEntry {
  id: string;
  user_id: string;
  date: string;
  documents_uploaded: number;
  quizzes_taken: number;
  quiz_score_avg: number | null;
  study_minutes: number;
  topics_completed: string[];
}

export interface ActivityLogEntry {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DashboardStats {
  totalDocuments: number;
  totalQuizzesTaken: number;
  learningStreak: number;
  averageQuizScore: number;
  totalStudyMinutes: number;
}

export interface SearchResult {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  pageNumber: number | null;
  similarity: number;
}

export interface SummaryRequest {
  documentId: string;
  type: "chapter" | "topic" | "full" | "bullet" | "exam";
  topic?: string;
}

export interface QuizGenerateRequest {
  documentId: string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
  questionCount: number;
  questionTypes: ("mcq" | "true_false" | "fill_blank" | "short_answer")[];
}

export interface MatchEmbeddingResult {
  chunk_id: string;
  document_id: string;
  content: string;
  page_number: number | null;
  similarity: number;
  document_title: string;
}
