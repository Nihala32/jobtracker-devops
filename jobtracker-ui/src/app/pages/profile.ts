import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ProfileService } from '../profile.service';
import { AiService } from '../ai.service';
import { ToastService } from '../toast.service';
import { ThemeService } from '../theme.service';
import { Icon } from '../components/icon';
import { Avatar } from '../components/avatar';
import { API_BASE } from '../api.config';
import { UserProfile, errorMessage } from '../models';

@Component({
  selector: 'app-profile',
  imports: [FormsModule, Icon, Avatar],
  template: `
    <div class="page-head">
      <div>
        <h1 class="page-title">Profile &amp; CV</h1>
        <p class="page-sub">The AI compares every job with this CV. It's stored only in your own database.</p>
      </div>
    </div>

    <div class="detail-layout">
      <section class="card">
        <form class="form-grid" (ngSubmit)="save()">
          <div class="form-section">About you</div>
          <label class="field w2">Full name
            <input name="fullName" [(ngModel)]="model.fullName" placeholder="Used to sign cover letters" />
          </label>
          <label class="field w2">Headline
            <input name="headline" [(ngModel)]="model.headline" placeholder="Full Stack Developer · Angular & .NET" />
          </label>
          <label class="field full">Key skills
            <input name="skills" [(ngModel)]="model.skills" placeholder="Angular, TypeScript, C#, .NET Core, SQL Server, Docker" />
          </label>

          <div class="form-section">Your CV</div>
          <label class="field full">CV text
            <textarea name="cvText" rows="20" [(ngModel)]="model.cvText"
                      placeholder="Paste your full CV as plain text: summary, experience, projects, skills, education."></textarea>
            <span class="hint">{{ (model.cvText || '').length }} characters · {{ wordCount() }} words</span>
          </label>

          <div class="form-section">Goals</div>
          <label class="field">Weekly application goal
            <input type="number" min="1" max="100" name="weeklyGoal" [(ngModel)]="model.weeklyGoal" />
          </label>

          <div class="form-actions">
            <button class="btn primary" type="submit" [disabled]="saving()">
              @if (saving()) { <span class="spinner"></span> Saving… } @else { Save profile }
            </button>
          </div>
        </form>
      </section>

      <aside class="side-panel">
        <section class="card" style="text-align:center">
          <app-avatar [name]="model.fullName || 'You'" [size]="64" />
          <h2 style="font-size:1.05rem; margin-top:0.7rem">{{ model.fullName || 'Your name' }}</h2>
          <p class="muted small" style="margin:0.2rem 0 0">{{ model.headline || 'Add a headline' }}</p>
        </section>

        <section class="card">
          <h2 class="card-title" style="margin-bottom:0.8rem"><app-icon name="sparkles" /> AI connection</h2>
          @if (ai.status(); as s) {
            <dl class="kv">
              <dt>Status</dt><dd>@if (s.configured) { <span class="status-pill offer">Connected</span> } @else { <span class="status-pill rejected">Not set up</span> }</dd>
              <dt>Provider</dt><dd>{{ s.provider }}</dd>
              <dt>Model</dt><dd>{{ s.model }}</dd>
            </dl>
            <p class="hint" style="margin:0.8rem 0 0">Change it in the <code>.env</code> file (AI_PROVIDER, AI_MODEL, AI_API_KEY).</p>
          } @else {
            <div class="skeleton sk-line"></div><div class="skeleton sk-line" style="width:60%"></div>
          }
        </section>

        <section class="card">
          <h2 class="card-title" style="margin-bottom:0.8rem"><app-icon name="moon" /> Appearance</h2>
          <div class="tabs-seg">
            <button [class.active]="theme.theme() === 'light'" (click)="theme.theme.set('light')"><app-icon name="sun" [size]="14" /> Light</button>
            <button [class.active]="theme.theme() === 'dark'" (click)="theme.theme.set('dark')"><app-icon name="moon" [size]="14" /> Dark</button>
          </div>
        </section>
      </aside>
    </div>
  `
})
export class Profile implements OnInit {
  private profiles = inject(ProfileService);
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  ai = inject(AiService);
  theme = inject(ThemeService);

  model: UserProfile = { fullName: '', headline: '', skills: '', cvText: '', weeklyGoal: 10 };
  saving = signal(false);

  ngOnInit() {
    this.ai.loadStatus();
    this.http.get<UserProfile>(`${API_BASE}/profile`).subscribe({
      next: p => { this.model = { ...this.model, ...p, weeklyGoal: p.weeklyGoal || 10 }; this.cdr.markForCheck(); },
      error: err => this.toast.error(errorMessage(err, 'Could not load your profile.'))
    });
  }

  wordCount() {
    return (this.model.cvText || '').trim().split(/\s+/).filter(Boolean).length;
  }

  save() {
    this.saving.set(true);
    this.profiles.save(this.model).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Profile saved'); },
      error: err => { this.saving.set(false); this.toast.error(errorMessage(err, 'Could not save your profile.')); }
    });
  }
}
