export const STATUSES = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected'] as const;
export type JobStatus = (typeof STATUSES)[number];

export interface JobApplication {
  id: number;
  company: string;
  role: string;
  status: string;
  dateApplied: string;
  notes?: string | null;
  location?: string | null;
  jobUrl?: string | null;
  salary?: string | null;
  source?: string | null;
  jobDescription?: string | null;
  followUpDate?: string | null;
  matchScore?: number | null;
  matchSummary?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  recruiterPhone?: string | null;
  recruiterLinkedIn?: string | null;
  updatedAt?: string;
}

/** The fields a user can type in. Dates are yyyy-MM-dd strings from <input type="date">. */
export interface JobFormModel {
  company: string;
  role: string;
  status: string;
  dateApplied: string;
  notes: string;
  location: string;
  jobUrl: string;
  salary: string;
  source: string;
  jobDescription: string;
  followUpDate: string;
  recruiterName: string;
  recruiterEmail: string;
  recruiterPhone: string;
  recruiterLinkedIn: string;
}

export interface JobStats {
  total: number;
  byStatus: Record<string, number>;
  responseRate: number;
  interviewRate: number;
  offerRate: number;
  averageMatchScore: number | null;
  weekly: { weekStart: string; count: number }[];
  topSources: { source: string; count: number }[];
  followUps: { id: number; company: string; role: string; followUpDate: string; overdue: boolean }[];
}

export interface UserProfile {
  fullName: string;
  headline?: string | null;
  skills?: string | null;
  cvText?: string | null;
  weeklyGoal?: number;
  updatedAt?: string;
}

export interface JobAnalysis {
  company: string | null;
  role: string | null;
  location: string | null;
  salary: string | null;
  seniority: string | null;
  keySkills: string[];
  summary: string | null;
}

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
  summary: string | null;
}

export interface InterviewPrep {
  questions: { question: string; category?: string | null; hint?: string | null }[];
  tips: string[];
}

export interface CvTailoring {
  summary: string | null;
  bullets: { suggested: string; reason?: string | null }[];
  keywordsToAdd: string[];
  thingsToRemove: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiStatus {
  configured: boolean;
  provider: string;
  model: string;
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function toDateInput(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

export function emptyJobForm(): JobFormModel {
  return {
    company: '', role: '', status: 'Applied', dateApplied: today(), notes: '',
    location: '', jobUrl: '', salary: '', source: '', jobDescription: '', followUpDate: '',
    recruiterName: '', recruiterEmail: '', recruiterPhone: '', recruiterLinkedIn: ''
  };
}

export function jobToForm(job: JobApplication): JobFormModel {
  return {
    company: job.company,
    role: job.role,
    status: job.status,
    dateApplied: toDateInput(job.dateApplied),
    notes: job.notes ?? '',
    location: job.location ?? '',
    jobUrl: job.jobUrl ?? '',
    salary: job.salary ?? '',
    source: job.source ?? '',
    jobDescription: job.jobDescription ?? '',
    followUpDate: toDateInput(job.followUpDate),
    recruiterName: job.recruiterName ?? '',
    recruiterEmail: job.recruiterEmail ?? '',
    recruiterPhone: job.recruiterPhone ?? '',
    recruiterLinkedIn: job.recruiterLinkedIn ?? ''
  };
}

/** Turns the form into the API request: blank strings become null. */
export function formToRequest(f: JobFormModel) {
  const blank = (s: string) => (s && s.trim() ? s.trim() : null);
  return {
    company: f.company.trim(),
    role: f.role.trim(),
    status: f.status,
    dateApplied: blank(f.dateApplied),
    notes: blank(f.notes),
    location: blank(f.location),
    jobUrl: blank(f.jobUrl),
    salary: blank(f.salary),
    source: blank(f.source),
    jobDescription: blank(f.jobDescription),
    followUpDate: blank(f.followUpDate),
    recruiterName: blank(f.recruiterName),
    recruiterEmail: blank(f.recruiterEmail),
    recruiterPhone: blank(f.recruiterPhone),
    recruiterLinkedIn: blank(f.recruiterLinkedIn)
  };
}

/** Pulls the friendly message out of an API error response. */
export function errorMessage(err: any, fallback: string): string {
  if (err?.status === 0) return 'Cannot reach the API. Is it running?';
  if (err?.status === 429) return 'Too many AI requests. Wait a minute and try again.';
  const errors = err?.error?.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors).flat()[0];
    if (typeof first === 'string') return first;
  }
  return err?.error?.error ?? err?.error?.title ?? fallback;
}
