import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from './api.config';
import { AiStatus, ChatMessage, CvTailoring, InterviewPrep, JobAnalysis, MatchResult } from './models';

@Injectable({ providedIn: 'root' })
export class AiService {
  private http = inject(HttpClient);
  private base = `${API_BASE}/ai`;

  status = signal<AiStatus | null>(null);

  loadStatus() {
    this.http.get<AiStatus>(`${this.base}/status`).subscribe({
      next: s => this.status.set(s),
      error: () => this.status.set(null)
    });
  }

  analyzeJob(jobDescription: string): Observable<JobAnalysis> {
    return this.http.post<JobAnalysis>(`${this.base}/analyze-job`, { jobDescription });
  }

  match(jobId: number): Observable<MatchResult> {
    return this.http.post<MatchResult>(`${this.base}/jobs/${jobId}/match`, {});
  }

  coverLetter(jobId: number, tone: string): Observable<{ text: string }> {
    return this.http.post<{ text: string }>(`${this.base}/jobs/${jobId}/cover-letter`, {}, { params: { tone } });
  }

  interviewPrep(jobId: number): Observable<InterviewPrep> {
    return this.http.post<InterviewPrep>(`${this.base}/jobs/${jobId}/interview-prep`, {});
  }

  tailorCv(jobId: number): Observable<CvTailoring> {
    return this.http.post<CvTailoring>(`${this.base}/jobs/${jobId}/tailor-cv`, {});
  }

  chat(jobId: number, messages: ChatMessage[]): Observable<{ text: string }> {
    return this.http.post<{ text: string }>(`${this.base}/jobs/${jobId}/chat`, { messages });
  }

  followUpEmail(jobId: number): Observable<{ text: string }> {
    return this.http.post<{ text: string }>(`${this.base}/jobs/${jobId}/follow-up-email`, {});
  }
}
