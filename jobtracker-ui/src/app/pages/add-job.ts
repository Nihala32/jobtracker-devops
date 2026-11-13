import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobService } from '../job.service';
import { ToastService } from '../toast.service';

@Component({
  selector: 'app-add-job',
  imports: [FormsModule, RouterLink],
  template: `
    <h1 class="page-title">Add application</h1>
    <p class="page-sub">Record a new job you applied for.</p>

    <section class="card">
      <form class="form" (ngSubmit)="submit()">
        <label>Company
          <input name="company" [(ngModel)]="form.company" placeholder="e.g. Emirates NBD" />
        </label>
        <label>Role
          <input name="role" [(ngModel)]="form.role" placeholder="e.g. Full Stack Developer" />
        </label>
        <label>Status
          <select name="status" [(ngModel)]="form.status">
            @for (s of statuses; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>
        </label>
        <label class="wide">Notes
          <input name="notes" [(ngModel)]="form.notes" placeholder="Optional" />
        </label>
        <div class="actions">
          <button class="primary" type="submit">Save application</button>
          <a routerLink="/applications" class="btn">Cancel</a>
        </div>
      </form>
    </section>
  `
})
export class AddJob {
  private jobService = inject(JobService);
  private toast = inject(ToastService);
  private router = inject(Router);

  statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
  form = { company: '', role: '', status: 'Applied', notes: '' };

  submit() {
    if (!this.form.company.trim() || !this.form.role.trim()) {
      this.toast.error('Company and role are required.');
      return;
    }
    this.jobService.add(this.form, () => this.router.navigate(['/applications']));
  }
}