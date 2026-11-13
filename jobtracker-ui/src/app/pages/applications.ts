import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { JobService } from '../job.service';

@Component({
  selector: 'app-applications',
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="toolbar">
      <div>
        <h1 class="page-title">Applications</h1>
        <p class="page-sub">Search, filter and update your applications.</p>
      </div>
      <a routerLink="/add" class="btn primary">+ Add job</a>
    </div>

    <section class="card">
      <div class="toolbar">
        <input class="search" placeholder="Search company or role"
               [ngModel]="search()" (ngModelChange)="search.set($event)" />
        <select [ngModel]="filter()" (ngModelChange)="filter.set($event)">
          <option value="All">All statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ s }}</option>
          }
        </select>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Company</th><th>Role</th><th>Status</th><th>Applied</th><th>Notes</th><th></th></tr>
          </thead>
          <tbody>
            @for (job of filtered(); track job.id) {
              <tr>
                <td class="company">{{ job.company }}</td>
                <td>{{ job.role }}</td>
                <td>
                  <select [class]="'status ' + job.status.toLowerCase()"
                          (change)="jobService.updateStatus(job, $any($event.target).value)">
                    @for (s of statuses; track s) {
                      <option [value]="s" [selected]="s === job.status">{{ s }}</option>
                    }
                  </select>
                </td>
                <td>{{ job.dateApplied | date: 'mediumDate' }}</td>
                <td class="notes">{{ job.notes }}</td>
                <td><button class="delete" (click)="remove(job.id)">Delete</button></td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="empty">No applications found.</td></tr>
            }
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class Applications implements OnInit {
  jobService = inject(JobService);
  statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
  search = signal('');
  filter = signal('All');

  filtered = computed(() => {
    const term = this.search().toLowerCase().trim();
    const status = this.filter();
    return this.jobService.jobs().filter(j =>
      (status === 'All' || j.status === status) &&
      (!term || j.company.toLowerCase().includes(term) || j.role.toLowerCase().includes(term))
    );
  });

  ngOnInit() {
    this.jobService.load();
  }

  remove(id: number) {
    if (confirm('Delete this application?')) {
      this.jobService.remove(id);
    }
  }
}