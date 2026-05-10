import { create } from 'zustand';
import type { Resume, ResumeSection, ResumeTemplate, ResumeSectionType, BasicInfo, EducationInfo, WorkInfo, ProjectInfo, SkillInfo } from '@/shared/types';
import { api } from '@/utils/api';

interface ResumeState {
  resumes: Resume[];
  currentResume: Resume | null;
  templates: ResumeTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchResumes: () => Promise<void>;
  fetchResume: (id: string) => Promise<void>;
  createResume: (title: string, templateId: string) => Promise<Resume>;
  updateResume: (id: string, data: Partial<Resume>) => Promise<void>;
  deleteResume: (id: string) => Promise<void>;
  updateSection: (resumeId: string, sectionId: string, content: Record<string, unknown>) => void;
  addSection: (resumeId: string, type: ResumeSectionType) => void;
  removeSection: (resumeId: string, sectionId: string) => void;
  reorderSections: (resumeId: string, sectionIds: string[]) => void;
  fetchTemplates: () => Promise<void>;
  duplicateResume: (id: string) => Promise<Resume>;
  setCurrentResume: (resume: Resume | null) => void;
}

const defaultSections: Record<ResumeSectionType, () => Record<string, unknown>> = {
  basic: () => ({ name: '', phone: '', email: '', address: '', objective: '' } as unknown as Record<string, unknown>),
  education: () => ({ school: '', major: '', degree: '', startDate: '', endDate: '' } as unknown as Record<string, unknown>),
  work: () => ({ company: '', position: '', startDate: '', endDate: '', description: '' } as unknown as Record<string, unknown>),
  project: () => ({ name: '', role: '', startDate: '', endDate: '', description: '' } as unknown as Record<string, unknown>),
  skill: () => ({ name: '', proficiency: 50 } as unknown as Record<string, unknown>),
  self_eval: () => ({ text: '' }),
};

const sectionTitles: Record<ResumeSectionType, string> = {
  basic: '基本信息',
  education: '教育经历',
  work: '工作经历',
  project: '项目经验',
  skill: '技能特长',
  self_eval: '自我评价',
};

export const useResumeStore = create<ResumeState>((set, get) => ({
  resumes: [],
  currentResume: null,
  templates: [],
  isLoading: false,
  error: null,

  fetchResumes: async () => {
    set({ isLoading: true });
    try {
      const resumes = await api.get<Resume[]>('/resumes');
      set({ resumes, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取简历列表失败';
      set({ error: message, isLoading: false });
    }
  },

  fetchResume: async (id: string) => {
    set({ isLoading: true });
    try {
      const resume = await api.get<Resume>(`/resumes/${id}`);
      set({ currentResume: resume, isLoading: false });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取简历失败';
      set({ error: message, isLoading: false });
    }
  },

  createResume: async (title: string, templateId: string) => {
    set({ isLoading: true });
    try {
      const resume = await api.post<Resume>('/resumes', { title, templateId });
      set((state) => ({ resumes: [resume, ...state.resumes], isLoading: false }));
      return resume;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '创建简历失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  updateResume: async (id: string, data: Partial<Resume>) => {
    try {
      const updated = await api.put<Resume>(`/resumes/${id}`, data);
      set((state) => ({
        resumes: state.resumes.map((r) => (r.id === id ? updated : r)),
        currentResume: state.currentResume?.id === id ? updated : state.currentResume,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '更新简历失败';
      set({ error: message });
    }
  },

  deleteResume: async (id: string) => {
    try {
      await api.delete(`/resumes/${id}`);
      set((state) => ({
        resumes: state.resumes.filter((r) => r.id !== id),
        currentResume: state.currentResume?.id === id ? null : state.currentResume,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '删除简历失败';
      set({ error: message });
    }
  },

  updateSection: (resumeId: string, sectionId: string, content: Record<string, unknown>) => {
    const { currentResume } = get();
    if (!currentResume || currentResume.id !== resumeId) return;
    const updatedSections = currentResume.sections.map((s) =>
      s.id === sectionId ? { ...s, content } : s
    );
    set({ currentResume: { ...currentResume, sections: updatedSections } });
  },

  addSection: (resumeId: string, type: ResumeSectionType) => {
    const { currentResume } = get();
    if (!currentResume || currentResume.id !== resumeId) return;
    const newSection: ResumeSection = {
      id: `${type}-${Date.now()}`,
      type,
      title: sectionTitles[type],
      order: currentResume.sections.length,
      content: defaultSections[type](),
    };
    set({ currentResume: { ...currentResume, sections: [...currentResume.sections, newSection] } });
  },

  removeSection: (resumeId: string, sectionId: string) => {
    const { currentResume } = get();
    if (!currentResume || currentResume.id !== resumeId) return;
    set({
      currentResume: {
        ...currentResume,
        sections: currentResume.sections.filter((s) => s.id !== sectionId),
      },
    });
  },

  reorderSections: (resumeId: string, sectionIds: string[]) => {
    const { currentResume } = get();
    if (!currentResume || currentResume.id !== resumeId) return;
    const reordered = sectionIds
      .map((id, index) => {
        const section = currentResume.sections.find((s) => s.id === id);
        return section ? { ...section, order: index } : null;
      })
      .filter(Boolean) as ResumeSection[];
    set({ currentResume: { ...currentResume, sections: reordered } });
  },

  fetchTemplates: async () => {
    try {
      const templates = await api.get<ResumeTemplate[]>('/resume-templates');
      set({ templates });
    } catch {
      set({ templates: [] });
    }
  },

  duplicateResume: async (id: string) => {
    set({ isLoading: true });
    try {
      const resume = await api.post<Resume>(`/resumes/${id}/duplicate`);
      set((state) => ({ resumes: [resume, ...state.resumes], isLoading: false }));
      return resume;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '复制简历失败';
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  setCurrentResume: (resume: Resume | null) => set({ currentResume: resume }),
}));
