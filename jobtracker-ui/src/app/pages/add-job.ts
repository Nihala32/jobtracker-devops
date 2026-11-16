import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { JobService } from '../job.service';
import { AiService } from '../ai.service';
import { ToastService } from '../toast.service';
import { JobForm } from '../components/job-form';
import { Icon } from '../components/icon';
import { JobAnalysis, JobFormModel, emptyJobForm, errorMessage } from '../models';

@Component({
  selector: 'app-add-job',
  imports: [FormsModule, RouterLink, JobForm, Icon],
  template: `
    <div class="page-head">
      <div>
        <h1 class="page-title">Add a job</h1>
        <p class="page-sub">Paste the advert and let AI do the typing, or fill in the form yourself.</p>
      </div>
    </div>

    <section class="card ai">
      <div class="card-head">
        <h2 class="card-title"><app-icon name="sparkles" /> Step 1 · Paste the job advert</h2>
        @if (ai.status(); as s) { <span class="chip ai">{{ s.provider }} · {{ s.model }}</span> }
      </div>
      <textarea rows="7" [(ngModel)]="advert" name="advert"
                placeholder="Copy the whole job description from LinkedIn, Bayt, Indeed or the company website and paste it here…"></textarea>
      <div class="actions mt">
        <button class="btn ai" (click)="analyse()" [disabled]="analysing()">
          @if (analysing()) { <span class="spinner"></span> Reading the advert… } @else { <app-icon name="sparkles" [size]="16" /> Analyse with AI }
        </button>
        <span class="hint">{{ advert.length ? advert.length + ' characters' : 'Tip: include requirements and salary if listed' }}</span>
      </div>

      @if (analysis(); as a) {
        <div class="mt-lg" style="border-top:1px dashed var(--border); padding-top:1rem">
          <div class="section-title" style="margin-top:0">What the AI found</div>
          @if (a.summary) { <p style="margin:0 0 0.75rem">{{ a.summary }}</p> }
          <div class="chips">
            @if (a.seniority) { <span class="chip accent">{{ a.seniority }}</span> }
            @for (skill of a.keySkills; track skill) { <span class="chip">{{ skill }}</span> }
          </div>
          <p class="hint" style="margin:0.75rem 0 0"><app-icon name="check" [size]="13" /> Form filled in below. Check it, then save.</p>
        </div>
      }
    </section>

    <section class="card mt">
      <div class="card-head"><h2 class="card-title"><app-icon name="edit" /> Step 2 · Check the details</h2></div>
      <app-job-form [model]="form" [busy]="saving()" submitLabel="Save application" (submitted)="submit()">
        <a routerLink="/applications" class="btn ghost">Cancel</a>
      </app-job-form>
    </section>
  `
})
export class AddJob implements OnInit {
  private jobService = inject(JobService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  ai = inject(AiService);

  form: JobFormModel = emptyJobForm();
  advert = '';
  analysing = signal(false);
  saving = signal(false);
  analysis = signal<JobAnalysis | null>(null);

  ngOnInit() {
    this.ai.loadStatus();
  }

  analyse() {
    if (this.advert.trim().length < 30) {
      this.toast.error('Paste the full job description first.');
      return;
    }
    this.analysing.set(true);
    this.ai.analyzeJob(this.advert).subscribe({
      next: a => {
        this.analysis.set(a);
        // Fill only what the AI found, and never overwrite something the user already typed.
        const keep = (current: string, found: string | null) => current.trim() || found?.trim() || '';
        this.form = {
          ...this.form,
          company: keep(this.form.company, a.company),
          role: keep(this.form.role, a.role),
          location: keep(this.form.location, a.location),
          salary: keep(this.form.salary, a.salary),
          jobDescription: this.advert
        };
        this.analysing.set(false);
        this.cdr.markForCheck();
        this.toast.success('Job analysed. Form filled in.');
      },
      error: err => {
        this.analysing.set(false);
        this.toast.error(errorMessage(err, 'AI analysis failed.'));
      }
    });
  }

  submit() {
    if (!this.form.company.trim() || !this.form.role.trim()) {
      this.toast.error('Company and role are required.');
      return;
    }
    this.saving.set(true);
    this.jobService.create(this.form).subscribe({
      next: job => this.router.navigate(['/jobs', job.id]),
      error: err => {
        this.saving.set(false);
        this.toast.error(errorMessage(err, 'Could not save the application.'));
      }
    });
  }
}
