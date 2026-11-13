import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { JobService } from '../job.service';

type DashboardJob = {
  id: number;
  company: string;
  role: string;
  dateApplied: string | Date;
  status: string;
};

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe],
  template: `
    <h1 class="page-title">Dashboard</h1>
    <p class="page-sub">Your job search at a glance.</p>

    <section class="stats">
      <div class="stat total"><span class="num">{{ jobService.jobs().length }}</span><span class="label">Total</span></div>
      <div class="stat applied"><span class="num">{{ count('Applied') }}</span><span class="label">Applied</span></div>
      <div class="stat interview"><span class="num">{{ count('Interview') }}</span><span class="label">Interviews</span></div>
      <div class="stat offer"><span class="num">{{ count('Offer') }}</span><span class="label">Offers</span></div>
      <div class="stat rejected"><span class="num">{{ count('Rejected') }}</span><span class="label">Rejected</span></div>
    </section>

    <section class="card">
      <div class="toolbar">
        <h2>Recent applications</h2>
        <a routerLink="/applications" class="link">View all →</a>
      </div>
      @for (job of recent(); track job.id) {
        <div class="recent-row">
          <div>
            <strong>{{ job.company }}</strong>
            <span class="muted"> · {{ job.role }} · {{ job.dateApplied | date: 'mediumDate' }}</span>
          </div>
          <span [class]="'badge ' + job.status.toLowerCase()">{{ job.status }}</span>
        </div>
      } @empty {
        <p class="empty">No applications yet. <a routerLink="/add" class="link">Add your first one</a>.</p>
      }
    </section>
  `
})
export class Dashboard implements OnInit {
  jobService = inject(JobService);
  recent = computed<DashboardJob[]>(() => (this.jobService.jobs() as DashboardJob[]).slice(0, 5));

  ngOnInit() {
    this.jobService.load();
  }

  count(status: string) {
    return (this.jobService.jobs() as DashboardJob[]).filter((j) => j.status === status).length;
  }
}