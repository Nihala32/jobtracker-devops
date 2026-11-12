import { Component, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';

interface JobApplication {
  id: number;
  company: string;
  role: string;
  status: string;
  dateApplied: string;
  notes?: string | null;
}

@Component({
  selector: 'app-root',
  imports: [FormsModule, DatePipe],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private apiUrl = 'http://localhost:8080/api/JobApplications';

  jobs = signal<JobApplication[]>([]);
  error = signal('');
  statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
  form = { company: '', role: '', status: 'Applied', notes: '' };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.http.get<JobApplication[]>(this.apiUrl).subscribe({
      next: data => { this.jobs.set(data); this.error.set(''); },
      error: () => this.error.set('Could not load applications. Is the API running?')
    });
  }

  add() {
    if (!this.form.company.trim() || !this.form.role.trim()) return;
    this.http.post<JobApplication>(this.apiUrl, this.form).subscribe({
      next: () => {
        this.form = { company: '', role: '', status: 'Applied', notes: '' };
        this.load();
      },
      error: () => this.error.set('Could not save the application.')
    });
  }

  changeStatus(job: JobApplication, status: string) {
    this.http.put(`${this.apiUrl}/${job.id}`, { ...job, status }).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Could not update the status.')
    });
  }

  remove(id: number) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => this.load(),
      error: () => this.error.set('Could not delete the application.')
    });
  }
}