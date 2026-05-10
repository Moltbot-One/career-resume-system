export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export type AssessmentType = 'mbti' | 'holland' | 'competency';

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: { label: string; value: string }[];
}

export interface Assessment {
  id: string;
  type: AssessmentType;
  title: string;
  description: string;
  icon: string;
  questions: AssessmentQuestion[];
  duration: number;
}

export interface AssessmentAnswer {
  questionId: string;
  value: string;
}

export interface AssessmentReport {
  id: string;
  type: AssessmentType;
  resultCode: string;
  resultTitle: string;
  summary: string;
  dimensions: { name: string; score: number; fullMark: number }[];
  recommendations: CareerRecommendation[];
  completedAt: string;
}

export type ResumeSectionType = 'basic' | 'education' | 'work' | 'project' | 'skill' | 'self_eval';

export interface ResumeSection {
  id: string;
  type: ResumeSectionType;
  title: string;
  order: number;
  content: Record<string, unknown>;
}

export interface BasicInfo {
  name: string;
  phone: string;
  email: string;
  address: string;
  objective: string;
}

export interface EducationInfo {
  school: string;
  major: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface WorkInfo {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectInfo {
  name: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface SkillInfo {
  name: string;
  proficiency: number;
}

export interface ResumeTemplate {
  id: string;
  name: string;
  thumbnail: string;
  style: string;
}

export interface Resume {
  id: string;
  title: string;
  templateId: string;
  sections: ResumeSection[];
  status: 'draft' | 'completed';
  score?: number;
  updatedAt: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CareerRecommendation {
  title: string;
  match: number;
  description: string;
  skills: string[];
}

export interface SkillAnalysis {
  skill: string;
  current: number;
  required: number;
}

export interface ApiError {
  message: string;
  status: number;
}
