import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { JobService } from '../job.service';
import { Icon } from '../components/icon';
import { Avatar } from '../components/avatar';
import { JobApplication, STATUSES } from '../models';
import { scoreClass } from '../ui';

@Component({
  selector: 'app-board',
  imports: [RouterLink, DatePipe, Icon, Avatar],
  template: `
    <div class="page-head">
      <div>
        <h1 class="page-title">Board</h1>
        <p class="page-sub">Drag cards between columns to update their status.</p>
      </div>
      <a routerLink="/add" class="btn primary"><app-icon name="plus" [size]="16" /> Add job</a>
    </div>

    <div class="board">
      @for (col of columns(); track col.status) {
        <section [class]="'column ' + col.status.toLowerCase()" [class.over]="overColumn() === col.status"
                 (dragover)="onDragOver($event, col.status)" (dragleave)="overColumn.set(null)" (drop)="onDrop($event, col.status)">
          <div class="column-head"><span class="dot"></span>{{ col.status }}<span class="count">{{ col.jobs.length }}</span></div>
          @for (job of col.jobs; track job.id) {
            <a class="job-card" draggable="true" [routerLink]="['/jobs', job.id]"
               (dragstart)="dragging.set(job)" (dragend)="dragging.set(null)" [class.dragging]="dragging()?.id === job.id">
              <div class="job-card-top">
                <app-avatar [name]="job.company" [size]="30" />
                <div style="min-width:0">
                  <div class="job-card-title">{{ job.role }}</div>
                  <div class="job-card-company">{{ job.company }}</div>
                </div>
              </div>
              <div class="job-card-foot">
                <app-icon name="calendar" [size]="13" /> {{ job.dateApplied | date: 'd MMM' }}
                @if (job.recruiterName) { <app-icon name="user" [size]="13" /> }
                @if (job.matchScore != null) { <span [class]="'score ' + scoreClass(job.matchScore)">{{ job.matchScore }}%</span> }
              </div>
            </a>
          } @empty {
            <div class="drop-hint">Drop a card here</div>
          }
        </section>
      }
    </div>
  `
})
export class Board implements OnInit {
  private jobService = inject(JobService);
  scoreClass = scoreClass;
  dragging = signal<JobApplication | null>(null);
  overColumn = signal<string | null>(null);

  columns = computed(() => STATUSES.map(status => ({ status, jobs: this.jobService.jobs().filter(j => j.status === status) })));

  ngOnInit() {
    this.jobService.load();
  }

  onDragOver(event: DragEvent, status: string) {
    event.preventDefault();
    this.overColumn.set(status);
  }

  onDrop(event: DragEvent, status: string) {
    event.preventDefault();
    this.overColumn.set(null);
    const job = this.dragging();
    if (job) this.jobService.updateStatus(job, status);
    this.dragging.set(null);
  }
}
