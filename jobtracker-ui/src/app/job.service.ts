import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ToastService } from './toast.service';
import { API_BASE } from './api.config';
import { JobApplication, JobFormModel, JobStats, errorMessage, formToRequest } from './models';

export type { JobApplication } from './models';

@Injectable({ providedIn: 'root' })
export class JobService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private apiUrl = `${API_BASE}/JobApplications`;

  jobs = signal<JobApplication[]>([]);
  stats = signal<JobStats | null>(null);
  loading = signal(false);

  readonly exportUrl = `${this.apiUrl}/export`;

  load() {
    this.loading.set(true);
    this.http.get<JobApplication[]>(this.apiUrl).subscribe({
      next: data => { this.jobs.set(data); this.loading.set(false); },
      error: err => {
        this.loading.set(false);
        this.toast.error(errorMessage(err, 'Could not load applications.'));
      }
    });
  }

  loadStats() {
    this.http.get<JobStats>(`${this.apiUrl}/stats`).subscribe({
      next: s => this.stats.set(s),
      error: () => this.stats.set(null)
    });
  }

  get(id: number): Observable<JobApplication> {
    return this.http.get<JobApplication>(`${this.apiUrl}/${id}`);
  }

  create(form: JobFormModel): Observable<JobApplication> {
    return this.http.post<JobApplication>(this.apiUrl, formToRequest(form)).pipe(
      tap(() => { this.toast.success('Application added'); this.load(); })
    );
  }

  update(id: number, form: JobFormModel): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, formToRequest(form)).pipe(
      tap(() => { this.toast.success('Changes saved'); this.load(); })
    );
  }

  updateStatus(job: JobApplication, status: string) {
    if (job.status === status) return;
    const previous = job.status;
    // Update the screen straight away, then undo if the API call fails.
    this.jobs.update(list => list.map(j => (j.id === job.id ? { ...j, status } : j)));
    this.http.patch(`${this.apiUrl}/${job.id}/status`, { status }).subscribe({
      next: () => { this.toast.success(`${job.company} moved to ${status}`); this.loadStats(); },
      error: err => {
        this.jobs.update(list => list.map(j => (j.id === job.id ? { ...j, status: previous } : j)));
        this.toast.error(errorMessage(err, 'Could not update the status.'));
      }
    });
  }

  remove(id: number, onDone?: () => void) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => { this.toast.success('Application deleted'); this.load(); onDone?.(); },
      error: err => this.toast.error(errorMessage(err, 'Could not delete the application.'))
    });
  }
}
