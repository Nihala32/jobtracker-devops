import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastService } from './toast.service';

export interface JobApplication {
  id: number;
  company: string;
  role: string;
  status: string;
  dateApplied: string;
  notes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class JobService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private apiUrl = 'http://localhost:8080/api/JobApplications';

  jobs = signal<JobApplication[]>([]);
  loading = signal(false);

  load() {
    this.loading.set(true);
    this.http.get<JobApplication[]>(this.apiUrl).subscribe({
      next: data => { this.jobs.set(data); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.toast.error('Could not load applications. Is the API running?');
      }
    });
  }

  add(job: { company: string; role: string; status: string; notes: string }, onDone?: () => void) {
    this.http.post<JobApplication>(this.apiUrl, job).subscribe({
      next: () => {
        this.toast.success('Application added');
        this.load();
        onDone?.();
      },
      error: () => this.toast.error('Could not save the application.')
    });
  }

  updateStatus(job: JobApplication, status: string) {
    this.http.put(`${this.apiUrl}/${job.id}`, { ...job, status }).subscribe({
      next: () => { this.toast.success('Status updated to ' + status); this.load(); },
      error: () => this.toast.error('Could not update the status.')
    });
  }

  remove(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => { this.toast.success('Application deleted'); this.load(); },
      error: () => this.toast.error('Could not delete the application.')
    });
  }
}