import { Component, OnInit, computed, inject, input, linkedSignal, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { JobService } from '../job.service';
import { Icon } from '../components/icon';
import { Avatar } from '../components/avatar';
import { JobApplication, STATUSES } from '../models';
import { scoreClass, todayIso } from '../ui';

type SortKey = 'date' | 'company' | 'match' | 'followup';

@Component({
  selector: 'app-applications',
  imports: [FormsModule, RouterLink, DatePipe, Icon, Avatar],
  template: `
    <div class="page-head">
      <div>
        <h1 class="page-title">Applications</h1>
        <p class="page-sub">{{ jobService.jobs().length }} jobs tracked · click a row to open it</p>
      </div>
      <div class="actions">
        <a [href]="jobService.exportUrl" class="btn"><app-icon name="download" [size]="16" /> Export CSV</a>
        <a routerLink="/add" class="btn primary"><app-icon name="plus" [size]="16" /> Add job</a>
      </div>
    </div>

    <section class="card table-card">
      <div class="toolbar">
        <div class="tabs-seg">
          <button [class.active]="filter() === 'All'" (click)="filter.set('All')">All <span class="n">{{ jobService.jobs().length }}</span></button>
          @for (s of statuses; track s) {
            <button [class.active]="filter() === s" (click)="filter.set(s)">{{ s }} <span class="n">{{ count(s) }}</span></button>
          }
        </div>
        <div class="actions">
          <div class="input-icon" style="width:240px">
            <app-icon name="search" [size]="16" />
            <input placeholder="Search company, role, location" [ngModel]="search()" (ngModelChange)="search.set($event)" />
          </div>
          <select [ngModel]="sort()" (ngModelChange)="sort.set($event)" style="width:auto">
            <option value="date">Newest first</option>
            <option value="match">Best match first</option>
            <option value="followup">Follow-up date</option>
            <option value="company">Company A–Z</option>
          </select>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr><th>Company &amp; role</th><th>Status</th><th>CV match</th><th class="hide-sm">Applied</th><th class="hide-sm">Follow up</th><th class="hide-sm">Contact</th><th></th></tr>
          </thead>
          <tbody>
            @if (jobService.loading() && !jobService.jobs().length) {
              @for (i of [1,2,3,4]; track i) {
                <tr><td colspan="7"><div class="skeleton sk-line" style="width:40%"></div><div class="skeleton sk-line" style="width:25%"></div></td></tr>
              }
            } @else {
              @for (job of filtered(); track job.id) {
                <tr (click)="open(job)">
                  <td>
                    <div class="cell-company">
                      <app-avatar [name]="job.company" [size]="34" />
                      <div><b>{{ job.company }}</b><span>{{ job.role }}{{ job.location ? ' · ' + job.location : '' }}</span></div>
                    </div>
                  </td>
                  <td (click)="$event.stopPropagation()">
                    <select [class]="'status-select ' + job.status.toLowerCase()" [ngModel]="job.status"
                            (ngModelChange)="jobService.updateStatus(job, $event)">
                      @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
                    </select>
                  </td>
                  <td>
                    @if (job.matchScore != null) {
                      <div style="display:flex; align-items:center; gap:0.5rem">
                        <div [class]="'meter ' + scoreClass(job.matchScore)"><span [style.width.%]="job.matchScore"></span></div>
                        <b class="small">{{ job.matchScore }}%</b>
                      </div>
                    } @else { <span class="faint small">Not scored</span> }
                  </td>
                  <td class="hide-sm muted">{{ job.dateApplied | date: 'd MMM y' }}</td>
                  <td class="hide-sm" [class.overdue]="isOverdue(job)">
                    {{ job.followUpDate ? (job.followUpDate | date: 'd MMM') : '—' }}
                  </td>
                  <td class="hide-sm">
                    @if (job.recruiterName || job.recruiterEmail) {
                      <span class="chip"><app-icon name="user" [size]="13" /> {{ job.recruiterName || job.recruiterEmail }}</span>
                    } @else { <span class="faint">—</span> }
                  </td>
                  <td (click)="$event.stopPropagation()">
                    <div class="row-actions actions end">
                      <button class="btn sm ghost danger" (click)="remove(job)" title="Delete"><app-icon name="trash" [size]="15" /></button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr style="cursor:default"><td colspan="7">
                  <div class="empty">
                    <div class="empty-icon"><app-icon name="search" [size]="24" /></div>
                    @if (jobService.jobs().length) {
                      <h3>No matches</h3><p>Try a different search or status.</p>
                      <button class="btn" (click)="search.set(''); filter.set('All')">Clear filters</button>
                    } @else {
                      <h3>No applications yet</h3><p>Add your first job and the AI will fill in the details for you.</p>
                      <a routerLink="/add" class="btn primary">Add a job</a>
                    }
                  </div>
                </td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </section>
  `
})
export class Applications implements OnInit {
  /** Optional ?status= query parameter (from the dashboard). */
  status = input<string>();

  jobService = inject(JobService);
  private router = inject(Router);
  statuses = STATUSES;
  scoreClass = scoreClass;
  search = signal('');
  filter = linkedSignal(() => this.status() ?? 'All');
  sort = signal<SortKey>('date');

  filtered = computed(() => {
    const term = this.search().toLowerCase().trim();
    const status = this.filter();
    const list = this.jobService.jobs().filter(j =>
      (status === 'All' || j.status === status) &&
      (!term || [j.company, j.role, j.location ?? '', j.recruiterName ?? ''].some(v => v.toLowerCase().includes(term)))
    );
    switch (this.sort()) {
      case 'company': return [...list].sort((a, b) => a.company.localeCompare(b.company));
      case 'match': return [...list].sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1));
      case 'followup': return [...list].sort((a, b) => (a.followUpDate ?? '9999').localeCompare(b.followUpDate ?? '9999'));
      default: return list;
    }
  });

  ngOnInit() {
    this.jobService.load();
  }

  count(status: string) {
    return this.jobService.jobs().filter(j => j.status === status).length;
  }

  isOverdue(job: JobApplication) {
    return !!job.followUpDate && job.status !== 'Rejected' && job.status !== 'Offer' && job.followUpDate.slice(0, 10) < todayIso();
  }

  open(job: JobApplication) {
    this.router.navigate(['/jobs', job.id]);
  }

  remove(job: JobApplication) {
    if (confirm(`Delete ${job.role} at ${job.company}?`)) this.jobService.remove(job.id);
  }
}
