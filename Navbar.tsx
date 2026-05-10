export type TaskType = 'lecture' | 'practice' | 'revision';
export type TaskStatus = 'active' | 'completed' | 'interrupted';
export type RevisionStatus = 'none' | 'pending' | 'revised' | 'requires-revisit';

export interface PracticeQuestion {
  question: string;
  options?: string[];
  correctAnswer?: string;
}

export interface PracticeResult {
  score: number;
  totalQuestions: number;
  strengths: string[];
  weaknesses: string[];
  answers: { question: string, userAnswer: string, isCorrect: boolean, correctAnswer?: string }[];
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  startTime: string;
  endTime?: string;
  durationMins?: number;
  engagementScore?: number;
  feedback?: string;
  isMeaningful?: boolean;
  lectureUrl?: string;
  practiceQuestions?: PracticeQuestion[];
  practiceResult?: PracticeResult;
  pauseCount?: number;
  revisionStatus?: RevisionStatus;
  notes?: string;
}

export interface UserStats {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  meaningfulMinutes: number;
  efficiency: number;
}

export interface FeedbackResponse {
  isMeaningful: boolean;
  score: number;
  message: string;
  recommendations: string[];
}
