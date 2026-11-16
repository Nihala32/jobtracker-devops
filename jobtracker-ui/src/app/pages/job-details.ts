import { ChangeDetectorRef, Component, ElementRef, OnInit, computed, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { JobService } from '../job.service';
import { AiService } from '../ai.service';
import { ProfileService } from '../profile.service';
import { ToastService } from '../toast.service';
import { JobForm } from '../components/job-form';
import { Icon } from '../components/icon';
import { Avatar } from '../components/avatar';
import { copyText } from '../copy';
import {
  ChatMessage, CvTailoring, InterviewPrep, JobApplication, JobFormModel, MatchResult, STATUSES, errorMessage, jobToForm
} from '../models';
import { scoreClass, todayIso } from '../ui';

type Tab = 'match' | 'tailor' | 'chat' | 'letter' | 'interview' | 'email' | 'edit';

const TABS: { id: Tab; label: string; ai: boolean }[] = [
  { id: 'match', label: 'CV match', ai: true },
  { id: 'tailor', label: 'Tailor CV', ai: true },
  { id: 'chat', label: 'Ask AI', ai: true },
  { id: 'letter', label: 'Cover letter', ai: true },
  { id: 'interview', label: 'Interview prep', ai: true },
  { id: 'email', label: 'Follow-up', ai: true },
  { id: 'edit', label: 'Edit', ai: false }
];

const CHAT_STARTERS = [
  'Summarise this job in 3 bullet points',
  'What salary should I ask for in the UAE?',
  'What are possible red flags in this advert?',
  'What questions should I ask the interviewer?',
  'How should I explain why I want this job?'
];

@Component({
  selector: 'app-job-details',
  imports: [FormsModule, RouterLink, DatePipe, JobForm, Icon, Avatar],
  template: `
    <a routerLink="/applications" class="btn sm ghost" style="margin-bottom:0.75rem"><app-icon name="arrowLeft" [size]="15" /> Applications</a>

    @if (job(); as j) {
      <div class="detail-hero">
        <app-avatar [name]="j.company" [size]="56" />
        <div style="min-width:0">
          <h1>{{ j.role }}</h1>
          <div class="detail-meta">
            <span><app-icon name="briefcase" [size]="14" /> {{ j.company }}</span>
            @if (j.location) { <span><app-icon name="target" [size]="14" /> {{ j.location }}</span> }
            @if (j.salary) { <span>💰 {{ j.salary }}</span> }
            <span><app-icon name="calendar" [size]="14" /> {{ j.dateApplied | date: 'd MMM y' }}</span>
          </div>
        </div>
      </div>

      @if (!profiles.hasCv()) {
        <div class="notice">
          <app-icon name="sparkles" [size]="20" />
          <div>Add your CV to unlock match scores, CV tailoring and cover letters for this job.</div>
          <a routerLink="/profile" class="btn sm primary">Add CV</a>
        </div>
      }

      <div class="detail-layout">
        <!-- Main column: AI tools -->
        <section class="card">
          <nav class="tabbar">
            @for (t of tabs; track t.id) {
              <button [class.active]="tab() === t.id" (click)="tab.set(t.id)">
                @if (t.ai) { <app-icon name="sparkles" [size]="14" /> } {{ t.label }}
              </button>
            }
          </nav>

          @switch (tab()) {
            @case ('match') {
              <div class="ai-intro">
                <span class="kpi-icon ai"><app-icon name="target" [size]="20" /></span>
                <div style="flex:1"><b>How well does your CV fit this job?</b><p>The AI scores your fit from 0–100 and shows what's missing.</p></div>
                <button class="btn ai" (click)="runMatch()" [disabled]="busy()">{{ match() ? 'Run again' : 'Compare my CV' }}</button>
              </div>
              @if (busy()) { <div class="thinking mt"><span class="spinner"></span> Comparing your CV with the job description…</div> }
              @else if (match(); as m) {
                <div class="quote mt">{{ m.summary }}</div>
                <div class="grid grid-2 mt">
                  <div>
                    <div class="section-title">✅ Matched skills</div>
                    <div class="chips">@for (s of m.matchedSkills; track s) { <span class="chip good">{{ s }}</span> }</div>
                  </div>
                  <div>
                    <div class="section-title">⚠️ Missing skills</div>
                    <div class="chips">@for (s of m.missingSkills; track s) { <span class="chip bad">{{ s }}</span> } @empty { <span class="muted small">None. Great fit!</span> }</div>
                  </div>
                </div>
                <div class="section-title">How to improve your CV for this job</div>
                <ul class="list">@for (s of m.suggestions; track s) { <li>{{ s }}</li> }</ul>
                <button class="btn mt" (click)="tab.set('tailor')"><app-icon name="sparkles" [size]="15" /> Let AI tailor my CV</button>
              } @else if (j.matchSummary) {
                <div class="quote mt">{{ j.matchSummary }}</div>
                <p class="hint">Run the comparison again to see matched and missing skills.</p>
              }
            }

            @case ('tailor') {
              <div class="ai-intro">
                <span class="kpi-icon ai"><app-icon name="file" [size]="20" /></span>
                <div style="flex:1"><b>Tailor your CV for {{ j.company }}</b><p>Rewritten summary and bullet points using only your real experience, aimed at this job's requirements.</p></div>
                <button class="btn ai" (click)="runTailor()" [disabled]="busy()">{{ tailor() ? 'Regenerate' : 'Tailor my CV' }}</button>
              </div>
              @if (busy()) { <div class="thinking mt"><span class="spinner"></span> Rewriting your CV for this role…</div> }
              @else if (tailor(); as t) {
                @if (t.summary) {
                  <div class="section-title">Professional summary</div>
                  <div class="bullet-card"><p>{{ t.summary }}</p><button class="btn sm ghost" (click)="copy(t.summary)"><app-icon name="copy" [size]="14" /></button></div>
                }
                <div class="section-title">Experience bullet points</div>
                @for (b of t.bullets; track $index) {
                  <div class="bullet-card">
                    <p>{{ b.suggested }}@if (b.reason) { <small>🎯 {{ b.reason }}</small> }</p>
                    <button class="btn sm ghost" (click)="copy(b.suggested)" title="Copy"><app-icon name="copy" [size]="14" /></button>
                  </div>
                }
                <div class="grid grid-2">
                  <div>
                    <div class="section-title">Keywords to add</div>
                    <div class="chips">@for (k of t.keywordsToAdd; track k) { <span class="chip accent">+ {{ k }}</span> } @empty { <span class="muted small">None</span> }</div>
                  </div>
                  <div>
                    <div class="section-title">Consider removing</div>
                    <div class="chips">@for (k of t.thingsToRemove; track k) { <span class="chip">− {{ k }}</span> } @empty { <span class="muted small">Nothing</span> }</div>
                  </div>
                </div>
                <div class="actions mt-lg">
                  <button class="btn" (click)="copyTailored(t)"><app-icon name="copy" [size]="15" /> Copy all</button>
                  <span class="hint">Always check AI suggestions are true before using them.</span>
                </div>
              }
            }

            @case ('chat') {
              <div class="chat">
                <div class="chat-log" #log>
                  @for (m of chat(); track $index) {
                    <div [class]="'msg ' + m.role">{{ m.content }}</div>
                  } @empty {
                    <div class="chat-empty">
                      <div class="empty-icon"><app-icon name="chat" [size]="24" /></div>
                      <h3 style="font-size:1rem; margin-bottom:0.3rem">Ask anything about this job</h3>
                      <p class="muted small" style="margin:0">The AI knows the job description and your CV.</p>
                      <div class="chips">
                        @for (s of starters; track s) { <button class="chip" (click)="send(s)">{{ s }}</button> }
                      </div>
                    </div>
                  }
                  @if (chatBusy()) { <div class="msg assistant typing"><i></i><i></i><i></i></div> }
                </div>
                <div class="chat-input">
                  <textarea rows="1" [(ngModel)]="draft" name="draft" placeholder="Ask about salary, the company, how to prepare…"
                            (keydown.enter)="onEnter($event)"></textarea>
                  <button class="btn primary icon" (click)="send()" [disabled]="chatBusy() || !draft.trim()" aria-label="Send"><app-icon name="send" /></button>
                  @if (chat().length) { <button class="btn ghost icon" (click)="clearChat()" title="Clear chat"><app-icon name="trash" /></button> }
                </div>
              </div>
            }

            @case ('letter') {
              <div class="ai-intro">
                <span class="kpi-icon ai"><app-icon name="edit" [size]="20" /></span>
                <div style="flex:1"><b>Cover letter</b><p>A tailored letter from your CV. You can edit it before copying.</p></div>
                <select [(ngModel)]="tone" name="tone" style="width:auto">
                  <option value="professional and warm">Professional</option>
                  <option value="confident and concise">Confident</option>
                  <option value="enthusiastic and friendly">Enthusiastic</option>
                </select>
                <button class="btn ai" (click)="runLetter()" [disabled]="busy()">{{ letter() ? 'Rewrite' : 'Generate' }}</button>
              </div>
              @if (busy()) { <div class="thinking mt"><span class="spinner"></span> Writing your cover letter…</div> }
              @else if (letter()) {
                <textarea class="mt" rows="16" [ngModel]="letter()" (ngModelChange)="letter.set($event)" name="letter"></textarea>
                <div class="actions mt"><button class="btn" (click)="copy(letter())"><app-icon name="copy" [size]="15" /> Copy</button>
                  <span class="hint">Read and personalise it before sending.</span></div>
              }
            }

            @case ('interview') {
              <div class="ai-intro">
                <span class="kpi-icon ai"><app-icon name="mic" [size]="20" /></span>
                <div style="flex:1"><b>Interview preparation</b><p>Likely questions for this role, with hints on what a strong answer covers. Click a question to reveal the hint.</p></div>
                <button class="btn ai" (click)="runInterview()" [disabled]="busy()">{{ interview() ? 'New questions' : 'Generate questions' }}</button>
              </div>
              @if (busy()) { <div class="thinking mt"><span class="spinner"></span> Preparing interview questions…</div> }
              @else if (interview(); as p) {
                <div class="mt">
                  @for (q of p.questions; track $index) {
                    <details class="question">
                      <summary><span class="chip accent">{{ q.category || 'General' }}</span> {{ q.question }}</summary>
                      <p>💡 {{ q.hint }}</p>
                    </details>
                  }
                </div>
                @if (p.tips.length) {
                  <div class="section-title">Tips</div>
                  <ul class="list">@for (t of p.tips; track t) { <li>{{ t }}</li> }</ul>
                }
              }
            }

            @case ('email') {
              <div class="ai-intro">
                <span class="kpi-icon ai"><app-icon name="mail" [size]="20" /></span>
                <div style="flex:1"><b>Follow-up email</b><p>A short, polite email that fits your current stage ({{ j.status }}).</p></div>
                <button class="btn ai" (click)="runEmail()" [disabled]="busy()">{{ email() ? 'Rewrite' : 'Draft email' }}</button>
              </div>
              @if (busy()) { <div class="thinking mt"><span class="spinner"></span> Drafting your email…</div> }
              @else if (email()) {
                <textarea class="mt" rows="10" [ngModel]="email()" (ngModelChange)="email.set($event)" name="email"></textarea>
                <div class="actions mt">
                  <button class="btn" (click)="copy(email())"><app-icon name="copy" [size]="15" /> Copy</button>
                  @if (j.recruiterEmail) {
                    <a class="btn primary" [href]="mailtoLink()"><app-icon name="mail" [size]="15" /> Open in my email app</a>
                  } @else {
                    <span class="hint">Add the recruiter's email in <a class="link" (click)="tab.set('edit')" style="cursor:pointer; color:var(--accent-text)">Edit details</a> to send it in one click.</span>
                  }
                </div>
              }
            }

            @case ('edit') {
              @if (form) {
                <app-job-form [model]="form" [busy]="saving()" submitLabel="Save changes" (submitted)="save()">
                  <button type="button" class="btn danger" (click)="remove()"><app-icon name="trash" [size]="15" /> Delete</button>
                </app-job-form>
              }
            }
          }
        </section>

        <!-- Side panel -->
        <aside class="side-panel">
          <section class="card" style="display:flex; align-items:center; gap:1rem">
            <div class="ring sm" [style.--p]="j.matchScore ?? 0" [style.--c]="ringColor()">
              <div class="ring-inner"><b>{{ j.matchScore ?? '—' }}</b><span>match</span></div>
            </div>
            <div>
              <b>CV match</b>
              <p class="muted small" style="margin:0.15rem 0 0.5rem">{{ matchLabel() }}</p>
              @if (j.matchScore == null) { <button class="btn sm" (click)="tab.set('match'); runMatch()" [disabled]="busy()">Score it</button> }
            </div>
          </section>

          <section class="card">
            <h2 class="card-title" style="margin-bottom:0.85rem"><app-icon name="briefcase" /> Details</h2>
            <dl class="kv">
              <dt>Status</dt>
              <dd>
                <select [class]="'status-select ' + j.status.toLowerCase()" [ngModel]="j.status" (ngModelChange)="changeStatus($event)" name="sideStatus">
                  @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
                </select>
              </dd>
              <dt>Follow up</dt>
              <dd [class.overdue]="followUpOverdue()">{{ j.followUpDate ? (j.followUpDate | date: 'd MMM y') : '—' }}</dd>
              <dt>Source</dt><dd>{{ j.source || '—' }}</dd>
              <dt>Salary</dt><dd>{{ j.salary || '—' }}</dd>
              <dt>Advert</dt>
              <dd>@if (j.jobUrl) { <a [href]="j.jobUrl" target="_blank" rel="noopener" style="color:var(--accent-text); font-weight:600">Open <app-icon name="external" [size]="12" /></a> } @else { — }</dd>
            </dl>
            @if (j.notes) { <div class="section-title">Notes</div><p class="muted small" style="margin:0; white-space:pre-wrap">{{ j.notes }}</p> }
          </section>

          <section class="card">
            <h2 class="card-title" style="margin-bottom:0.85rem"><app-icon name="user" /> Recruiter</h2>
            @if (j.recruiterName || j.recruiterEmail || j.recruiterPhone || j.recruiterLinkedIn) {
              <div style="display:flex; align-items:center; gap:0.7rem; margin-bottom:0.6rem">
                <app-avatar [name]="j.recruiterName || j.recruiterEmail" [size]="40" />
                <div><b>{{ j.recruiterName || 'Recruiter' }}</b><div class="faint small">{{ j.company }}</div></div>
              </div>
              @if (j.recruiterEmail) { <a class="contact-row" [href]="'mailto:' + j.recruiterEmail"><app-icon name="mail" [size]="16" /><span>{{ j.recruiterEmail }}</span></a> }
              @if (j.recruiterPhone) { <a class="contact-row" [href]="'tel:' + j.recruiterPhone"><app-icon name="phone" [size]="16" /><span>{{ j.recruiterPhone }}</span></a> }
              @if (j.recruiterLinkedIn) { <a class="contact-row" [href]="linkedInUrl()" target="_blank" rel="noopener"><app-icon name="linkedin" [size]="16" /><span>LinkedIn profile</span></a> }
              <button class="btn sm mt" style="width:100%" (click)="tab.set('email')"><app-icon name="sparkles" [size]="14" /> Draft a follow-up email</button>
            } @else {
              <p class="muted small" style="margin:0 0 0.75rem">Save who you're talking to, so you can follow up in one click.</p>
              <button class="btn sm" (click)="tab.set('edit')"><app-icon name="plus" [size]="14" /> Add contact</button>
            }
          </section>
        </aside>
      </div>
    } @else if (notFound()) {
      <div class="card empty">
        <div class="empty-icon"><app-icon name="search" [size]="24" /></div>
        <h3>Application not found</h3><p>It may have been deleted.</p>
        <a routerLink="/applications" class="btn primary">Back to applications</a>
      </div>
    } @else {
      <div class="detail-hero"><div class="skeleton" style="width:56px;height:56px;border-radius:10px"></div>
        <div style="flex:1"><div class="skeleton sk-line" style="width:40%;height:20px"></div><div class="skeleton sk-line" style="width:25%"></div></div></div>
      <div class="detail-layout"><div class="card"><div class="skeleton sk-block"></div><div class="skeleton sk-block mt"></div></div><div class="card"><div class="skeleton sk-block"></div></div></div>
    }
  `
})
export class JobDetails implements OnInit {
  /** Route parameter :id, and optional ?tab= query parameter. */
  id = input.required<string>();
  tabParam = input<string | undefined>(undefined, { alias: 'tab' });

  private jobs = inject(JobService);
  private ai = inject(AiService);
  private toast = inject(ToastService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  profiles = inject(ProfileService);
  private log = viewChild<ElementRef<HTMLElement>>('log');

  tabs = TABS;
  starters = CHAT_STARTERS;
  statuses = STATUSES;

  job = signal<JobApplication | null>(null);
  notFound = signal(false);
  tab = linkedSignal<Tab>(() => (TABS.some(t => t.id === this.tabParam()) ? this.tabParam() as Tab : 'match'));
  busy = signal(false);
  saving = signal(false);

  match = signal<MatchResult | null>(null);
  tailor = signal<CvTailoring | null>(null);
  letter = signal('');
  interview = signal<InterviewPrep | null>(null);
  email = signal('');
  chat = signal<ChatMessage[]>([]);
  chatBusy = signal(false);
  draft = '';
  tone = 'professional and warm';
  form: JobFormModel | null = null;

  private jobId = computed(() => Number(this.id()));

  ringColor = computed(() => {
    const s = this.job()?.matchScore;
    const c = scoreClass(s);
    return c === 'high' ? 'var(--good)' : c === 'mid' ? 'var(--warn)' : c === 'low' ? 'var(--bad)' : 'var(--text-3)';
  });
  matchLabel = computed(() => {
    const s = this.job()?.matchScore;
    if (s == null) return 'Not scored yet';
    return s >= 70 ? 'Strong fit. Apply with confidence.' : s >= 50 ? 'Decent fit. Tailor your CV first.' : 'Weak fit. Check the missing skills.';
  });
  followUpOverdue = computed(() => {
    const j = this.job();
    return !!j?.followUpDate && j.status !== 'Rejected' && j.status !== 'Offer' && j.followUpDate.slice(0, 10) < todayIso();
  });
  linkedInUrl = computed(() => {
    const u = this.job()?.recruiterLinkedIn ?? '';
    return /^https?:\/\//i.test(u) ? u : `https://${u}`;
  });
  mailtoLink = computed(() => {
    const j = this.job();
    const text = this.email();
    const lines = text.split('\n');
    const hasSubject = /^subject:/i.test(lines[0] ?? '');
    const subject = hasSubject ? lines[0].replace(/^subject:\s*/i, '') : `${j?.role} application`;
    const body = (hasSubject ? lines.slice(1) : lines).join('\n').trim();
    return `mailto:${j?.recruiterEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  });

  ngOnInit() {
    this.profiles.load();
    this.chat.set(this.loadChat());
    this.reload();
  }

  private reload() {
    this.jobs.get(this.jobId()).subscribe({
      next: j => { this.job.set(j); this.form = jobToForm(j); this.cdr.markForCheck(); },
      error: () => this.notFound.set(true)
    });
  }

  runMatch() {
    this.call(this.ai.match(this.jobId()), m => {
      this.match.set(m);
      this.job.update(j => (j ? { ...j, matchScore: m.score, matchSummary: m.summary } : j));
      this.jobs.load();
    });
  }
  runTailor() { this.call(this.ai.tailorCv(this.jobId()), t => this.tailor.set(t)); }
  runLetter() { this.call(this.ai.coverLetter(this.jobId(), this.tone), r => this.letter.set(r.text)); }
  runInterview() { this.call(this.ai.interviewPrep(this.jobId()), p => this.interview.set(p)); }
  runEmail() { this.call(this.ai.followUpEmail(this.jobId()), r => this.email.set(r.text)); }

  // ---- Chat ----
  onEnter(e: Event) {
    const ke = e as KeyboardEvent;
    if (!ke.shiftKey) { ke.preventDefault(); this.send(); }
  }

  send(text?: string) {
    const content = (text ?? this.draft).trim();
    if (!content || this.chatBusy()) return;
    this.draft = '';
    const history: ChatMessage[] = [...this.chat(), { role: 'user', content }];
    this.chat.set(history);
    this.chatBusy.set(true);
    this.scrollChat();
    this.ai.chat(this.jobId(), history).subscribe({
      next: r => {
        this.chat.update(c => [...c, { role: 'assistant', content: r.text }]);
        this.chatBusy.set(false);
        this.saveChat();
        this.scrollChat();
      },
      error: err => {
        this.chatBusy.set(false);
        this.chat.update(c => c.slice(0, -1)); // remove the unanswered question
        this.draft = content;
        this.cdr.markForCheck();
        this.toast.error(errorMessage(err, 'The AI could not answer.'));
      }
    });
  }

  clearChat() {
    this.chat.set([]);
    this.saveChat();
  }

  private scrollChat() {
    setTimeout(() => { const el = this.log()?.nativeElement; if (el) el.scrollTop = el.scrollHeight; });
  }

  // Chats are kept in this browser only, per job.
  private chatKey() { return `jobtracker-chat-${this.id()}`; }
  private loadChat(): ChatMessage[] {
    try { return JSON.parse(localStorage.getItem(this.chatKey()) ?? '[]'); } catch { return []; }
  }
  private saveChat() {
    try { localStorage.setItem(this.chatKey(), JSON.stringify(this.chat().slice(-30))); } catch { /* storage unavailable */ }
  }

  // ---- Edit / status ----
  changeStatus(status: string) {
    const j = this.job();
    if (!j) return;
    this.jobs.updateStatus(j, status);
    this.job.set({ ...j, status });
    if (this.form) this.form = { ...this.form, status };
  }

  save() {
    if (!this.form) return;
    if (!this.form.company.trim() || !this.form.role.trim()) {
      this.toast.error('Company and role are required.');
      return;
    }
    this.saving.set(true);
    this.jobs.update(this.jobId(), this.form).subscribe({
      next: () => { this.saving.set(false); this.reload(); },
      error: err => { this.saving.set(false); this.toast.error(errorMessage(err, 'Could not save.')); }
    });
  }

  remove() {
    if (confirm('Delete this application?')) {
      this.jobs.remove(this.jobId(), () => this.router.navigate(['/applications']));
    }
  }

  copy(text: string) { copyText(text, this.toast); }

  copyTailored(t: CvTailoring) {
    const parts = [
      t.summary ? `SUMMARY\n${t.summary}` : '',
      `EXPERIENCE\n${t.bullets.map(b => '• ' + b.suggested).join('\n')}`,
      t.keywordsToAdd.length ? `KEYWORDS\n${t.keywordsToAdd.join(', ')}` : ''
    ];
    this.copy(parts.filter(Boolean).join('\n\n'));
  }

  private call<T>(request: Observable<T>, onResult: (value: T) => void) {
    this.busy.set(true);
    request.subscribe({
      next: value => { onResult(value); this.busy.set(false); },
      error: err => { this.busy.set(false); this.toast.error(errorMessage(err, 'The AI request failed.')); }
    });
  }
}
