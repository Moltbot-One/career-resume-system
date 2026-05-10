import { create } from 'zustand';
import type { AssessmentType, AssessmentAnswer } from '@/shared/types';
import { api } from '@/utils/api';

interface Question {
  id: number;
  dimension: string;
  text: string;
  options: { key: string; text: string }[];
}

interface AssessmentData {
  id: number;
  type: string;
  status: string;
  questions: Question[];
}

interface AssessmentReportData {
  assessment: { id: number; type: string; status: string; started_at: string; completed_at: string };
  report: { id: number; resultCode: string; analysis: Record<string, unknown>; recommendations: unknown[]; skillScores: Record<string, number> };
}

interface AssessmentState {
  assessments: { id: number; type: string; status: string; resultCode: string | null; startedAt: string; completedAt: string | null }[];
  currentAssessment: AssessmentData | null;
  currentQuestionIndex: number;
  answers: AssessmentAnswer[];
  report: AssessmentReportData | null;
  isLoading: boolean;
  error: string | null;
  fetchHistory: () => Promise<void>;
  startAssessment: (type: AssessmentType) => Promise<void>;
  submitAnswer: (questionId: number, optionKey: string) => Promise<void>;
  goToQuestion: (index: number) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  completeAssessment: () => Promise<void>;
  resetAssessment: () => void;
  fetchReport: (id: string) => Promise<void>;
}

export const useAssessmentStore = create<AssessmentState>((set, get) => ({
  assessments: [],
  currentAssessment: null,
  currentQuestionIndex: 0,
  answers: [],
  report: null,
  isLoading: false,
  error: null,

  fetchHistory: async () => {
    set({ isLoading: true });
    try {
      const data = await api.get<{ id: number; type: string; status: string; resultCode: string | null; startedAt: string; completedAt: string | null }[]>('/assessments/history');
      set({ assessments: data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取测评历史失败';
      set({ error: message, isLoading: false });
    }
  },

  startAssessment: async (type: AssessmentType) => {
    set({ isLoading: true, answers: [], currentQuestionIndex: 0, report: null });
    try {
      const data = await api.post<AssessmentData>('/assessments/start', { type });
      set({ currentAssessment: data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '开始测评失败';
      set({ error: message, isLoading: false });
    }
  },

  submitAnswer: async (questionId: number, optionKey: string) => {
    const { currentAssessment } = get();
    if (!currentAssessment) return;
    set((state) => {
      const existing = state.answers.findIndex((a) => a.questionId === String(questionId));
      if (existing >= 0) {
        const updated = [...state.answers];
        updated[existing] = { questionId: String(questionId), value: optionKey };
        return { answers: updated };
      }
      return { answers: [...state.answers, { questionId: String(questionId), value: optionKey }] };
    });
    try {
      await api.post(`/assessments/${currentAssessment.id}/answer`, { questionId, optionKey });
    } catch {}
  },

  goToQuestion: (index: number) => set({ currentQuestionIndex: index }),

  nextQuestion: () => {
    const { currentAssessment, currentQuestionIndex } = get();
    if (currentAssessment && currentQuestionIndex < currentAssessment.questions.length - 1) {
      set({ currentQuestionIndex: currentQuestionIndex + 1 });
    }
  },

  prevQuestion: () => {
    const { currentQuestionIndex } = get();
    if (currentQuestionIndex > 0) {
      set({ currentQuestionIndex: currentQuestionIndex - 1 });
    }
  },

  completeAssessment: async () => {
    const { currentAssessment } = get();
    if (!currentAssessment) return;
    set({ isLoading: true });
    try {
      const data = await api.post<AssessmentReportData>(`/assessments/${currentAssessment.id}/complete`);
      set({ report: data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '提交测评失败';
      set({ error: message, isLoading: false });
    }
  },

  resetAssessment: () => {
    set({ currentAssessment: null, currentQuestionIndex: 0, answers: [], report: null });
  },

  fetchReport: async (id: string) => {
    set({ isLoading: true });
    try {
      const data = await api.get<AssessmentReportData>(`/assessments/${id}/report`);
      set({ report: data, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取报告失败';
      set({ error: message, isLoading: false });
    }
  },
}));
