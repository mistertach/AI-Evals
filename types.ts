
export interface RubricCategory {
  id: string;
  name: string;
  maxScore: number;
}

export interface ModuleRubric {
  moduleId: number;
  unit: number;
  title: string;
  categories: RubricCategory[];
  totalMarks: number;
}

export interface ScoreResult {
  categoryName: string;
  score: number;
  maxScore: number;
}

export interface EvaluationResult {
  studentName: string;
  moduleId: number;
  scores: ScoreResult[];
  totalScore: number;
  maxPossible: number;
  feedback: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PROCESSING_BATCH = 'PROCESSING_BATCH',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR'
}

export type ItemStatus = 'pending' | 'extracting' | 'evaluating' | 'completed' | 'error';

export interface BatchItem {
  id: string;
  fileName: string;
  status: ItemStatus;
  text?: string;
  result?: EvaluationResult;
  suggestedName?: string;
  error?: string;
}
