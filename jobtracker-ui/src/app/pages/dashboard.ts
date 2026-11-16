import { Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { JobService } from '../job.service';
import { ProfileService } from '../profile.service';
import { Icon } from '../components/icon';
import { Avatar } from '../components/avatar';
import { STATUSES } from '../models';
import { daysBetween, scoreClass, todayIso } from '../ui';

interface Todo { icon: string; tone: string; title: string; sub: string; link: (string | number)[]; tab?: string; }

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, DecimalPipe, Icon, Avatar],
  template: `
    <div class="page-head">
      <div>
        <div class="eyebrow">{{ now | date: 'EEEE, d MMMM' }}</div>
        <h1 class="page-title">{{ greeting() }}{{ firstName() ? ', ' + firstName() : '' }} 👋</h1>
        <p class="page-sub">{{ summaryLine() }}</p>
      </div>
      <div class="actions">
        <a routerLink="/board" class="btn"><app-icon name="board" [size]="16" /> Open board</a>
        <a routerLink="/add" class="btn ai"><app-icon name="sparkles" [size]="16" /> Add job with AI</a>
      </div>
    </div>

    @if (profiles.profile() && !profiles.hasCv()) {
      <div class="notice">
        <app-icon name="sparkles" [size]="20" />
        <div><b>Unlock the AI features.</b> Paste your CV once to get match scores, tailored CVs and cover letters.</div>
        <a routerLink="/profile" class="btn sm primary">Add my CV</a>
      </div>
    }

    @if (jobService.loading() && !jobService.jobs().length) {
      <div class="grid grid-4">
        @for (i of [1,2,3,4]; track i) { <div class="card"><div class="skeleton sk-line" style="width:50%"></div><div class="skeleton sk-block mt"></div></div> }
      </div>
    } @else {
      <!-- KPIs -->
      <div class="grid grid-4">
        <div class="card kpi">
          <div class="kpi-top">Applications sent <span class="kpi-icon"><app-icon name="send" [size]="16" /></span></div>
          <div class="kpi-value">{{ funnel().sent }}</div>
          <div class="kpi-foot">{{ count('Saved') }} saved for later</div>
        </div>
        <div class="card kpi">
          <div class="kpi-top">Response rate <span class="kpi-icon good"><app-icon name="inbox" [size]="16" /></span></div>
          <div class="kpi-value">{{ pct(funnel().responded, funnel().sent) }}%</div>
          <div class="kpi-foot">{{ funnel().responded }} companies replied</div>
        </div>
        <div class="card kpi">
          <div class="kpi-top">Interview rate <span class="kpi-icon warn"><app-icon name="mic" [size]="16" /></span></div>
          <div class="kpi-value">{{ pct(funnel().interviews, funnel().sent) }}%</div>
          <div class="kpi-foot">{{ funnel().interviews }} reached interview</div>
        </div>
        <div class="card kpi">
          <div class="kpi-top">Avg. CV match <span class="kpi-icon ai"><app-icon name="sparkles" [size]="16" /></span></div>
          <div class="kpi-value">{{ avgMatch() != null ? (avgMatch() | number: '1.0-0') + '%' : '—' }}</div>
          <div class="kpi-foot">{{ matchedCount() }} jobs scored by AI</div>
        </div>
      </div>

      <!-- Status strip -->
      <div class="status-strip mt">
        @for (s of statuses; track s) {
          <a [class]="'status-cell ' + s.toLowerCase()" routerLink="/applications" [queryParams]="{ status: s }">
            <b>{{ count(s) }}</b><span>{{ s }}</span>
          </a>
        }
      </div>

      <!-- Today + goal -->
      <div class="grid grid-3 mt">
        <section class="card span-2">
          <div class="card-head">
            <h2 class="card-title"><app-icon name="check" /> Today</h2>
            <span class="faint small">{{ todos().length }} thing{{ todos().length === 1 ? '' : 's' }} to do</span>
          </div>
          @for (t of todos(); track $index) {
            <a class="todo" [routerLink]="t.link" [queryParams]="t.tab ? { tab: t.tab } : {}">
              <span [class]="'todo-icon ' + t.tone"><app-icon [name]="t.icon" [size]="17" /></span>
              <div class="todo-text"><b>{{ t.title }}</b><span>{{ t.sub }}</span></div>
              <app-icon name="arrowRight" [size]="16" />
            </a>
          } @empty {
            <div class="empty">
              <div class="empty-icon"><app-icon name="check" [size]="24" /></div>
              <h3>You're all caught up</h3>
              <p>No follow-ups or interviews need attention. A good time to find new jobs to apply for.</p>
              <a routerLink="/add" class="btn primary">Add a job</a>
            </div>
          }
        </section>

        <section class="card">
          <div class="card-head">
            <h2 class="card-title"><app-icon name="target" /> Weekly goal</h2>
            <a routerLink="/profile" class="btn sm ghost">Edit</a>
          </div>
          <div style="display:flex; flex-direction:column; align-items:center; gap:0.9rem; padding:0.4rem 0 0.2rem">
            <div class="ring" [style.--p]="goalPct()" [style.--c]="goalPct() >= 100 ? 'var(--good)' : 'var(--accent)'">
              <div class="ring-inner"><b>{{ thisWeek() }}/{{ goal() }}</b><span>this week</span></div>
            </div>
            <p class="muted small" style="margin:0; text-align:center">
              @if (thisWeek() >= goal()) { 🎉 Goal reached! Great consistency. }
              @else { {{ goal() - thisWeek() }} more application{{ goal() - thisWeek() === 1 ? '' : 's' }} to hit your goal. }
            </p>
          </div>
        </section>
      </div>

      <!-- Funnel + weekly chart -->
      <div class="grid grid-2 mt">
        <section class="card">
          <div class="card-head"><h2 class="card-title"><app-icon name="filter" /> Application funnel</h2></div>
          <div class="funnel">
            @for (step of funnelSteps(); track step.label) {
              <div class="funnel-row">
                <span class="funnel-label">{{ step.label }}</span>
                <div class="funnel-track"><div class="funnel-bar" [style.width.%]="step.width">{{ step.value }}</div></div>
                <span class="funnel-pct">{{ step.rate }}</span>
              </div>
            }
          </div>
          <p class="faint small" style="margin:0.9rem 0 0">Percentages show how many moved on from the step above.</p>
        </section>

        <section class="card">
          <div class="card-head"><h2 class="card-title"><app-icon name="trending" /> Applications per week</h2></div>
          @if (jobService.stats(); as st) {
            <div class="bars">
              @for (w of st.weekly; track w.weekStart; let last = $last) {
                <div class="bar-col" [class.current]="last" [title]="w.count + ' in week of ' + (w.weekStart | date: 'd MMM')">
                  <span class="bar-value">{{ w.count || '' }}</span>
                  <div class="bar" [style.height.%]="barHeight(w.count)"></div>
                  <span class="bar-label">{{ last ? 'This wk' : (w.weekStart | date: 'd MMM') }}</span>
                </div>
              }
            </div>
          } @else {
            <div class="skeleton" style="height:170px"></div>
          }
        </section>
      </div>

      <!-- Recent + sources -->
      <div class="grid grid-3 mt">
        <section class="card span-2">
          <div class="card-head">
            <h2 class="card-title"><app-icon name="clock" /> Recent applications</h2>
            <a routerLink="/applications" class="btn sm ghost">View all <app-icon name="arrowRight" [size]="14" /></a>
          </div>
          @for (job of recent(); track job.id) {
            <a class="row-item" [routerLink]="['/jobs', job.id]">
              <app-avatar [name]="job.company" />
              <div class="row-main"><b>{{ job.role }}</b><span>{{ job.company }} · {{ job.dateApplied | date: 'd MMM' }}</span></div>
              @if (job.matchScore != null) { <span [class]="'score ' + scoreClass(job.matchScore)">{{ job.matchScore }}%</span> }
              <span [class]="'status-pill ' + job.status.toLowerCase()">{{ job.status }}</span>
            </a>
          } @empty {
            <div class="empty">
              <div class="empty-icon"><app-icon name="briefcase" [size]="24" /></div>
              <h3>No applications yet</h3>
              <p>Paste your first job advert and let AI fill in the details.</p>
              <a routerLink="/add" class="btn primary">Add your first job</a>
            </div>
          }
        </section>

        <section class="card">
          <div class="card-head"><h2 class="card-title"><app-icon name="link" /> Where you apply</h2></div>
          @for (s of jobService.stats()?.topSources ?? []; track s.source) {
            <div style="margin-bottom:0.8rem">
              <div style="display:flex; justify-content:space-between; font-size:0.85rem; font-weight:600; margin-bottom:0.3rem">
                <span>{{ s.source }}</span><span class="faint">{{ s.count }}</span>
              </div>
              <div class="meter" style="width:100%"><span [style.width.%]="sourceWidth(s.count)" style="background:var(--accent)"></span></div>
            </div>
          } @empty {
            <p class="muted small">Set a <b>Source</b> on your applications (LinkedIn, Bayt…) to see which sites work best for you.</p>
          }
        </section>
      </div>
    }
  `
})
export class Dashboard implements OnInit {
  jobService = inject(JobService);
  profiles = inject(ProfileService);
  statuses = STATUSES;
  now = new Date();
  scoreClass = scoreClass;

  firstName = computed(() => (this.profiles.profile()?.fullName ?? '').trim().split(/\s+/)[0] ?? '');
  greeting = computed(() => {
    const h = this.now.getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  });

  recent = computed(() => this.jobService.jobs().slice(0, 6));
  goal = computed(() => this.profiles.profile()?.weeklyGoal || 10);

  thisWeek = computed(() => {
    const start = new Date(this.now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // Monday
    return this.jobService.jobs().filter(j => j.status !== 'Saved' && new Date(j.dateApplied) >= start).length;
  });
  goalPct = computed(() => Math.min(100, Math.round((this.thisWeek() / this.goal()) * 100)));

  funnel = computed(() => {
    const c = (s: string) => this.count(s);
    const sent = this.jobService.jobs().length - c('Saved');
    return {
      sent,
      responded: c('Interview') + c('Offer') + c('Rejected'),
      interviews: c('Interview') + c('Offer'),
      offers: c('Offer')
    };
  });

  funnelSteps = computed(() => {
    const f = this.funnel();
    const base = Math.max(f.sent, 1);
    const steps = [
      { label: 'Applied', value: f.sent, prev: f.sent },
      { label: 'Got a reply', value: f.responded, prev: f.sent },
      { label: 'Interview', value: f.interviews, prev: f.responded },
      { label: 'Offer', value: f.offers, prev: f.interviews }
    ];
    return steps.map((s, i) => ({
      label: s.label,
      value: s.value,
      width: Math.max(4, (s.value / base) * 100),
      rate: i === 0 ? '100%' : `${this.pct(s.value, s.prev)}%`
    }));
  });

  avgMatch = computed(() => {
    const scores = this.jobService.jobs().map(j => j.matchScore).filter((s): s is number => s != null);
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  });
  matchedCount = computed(() => this.jobService.jobs().filter(j => j.matchScore != null).length);

  summaryLine = computed(() => {
    const n = this.todos().length;
    if (!this.jobService.jobs().length) return "Let's get your job search organised.";
    return n ? `You have ${n} thing${n === 1 ? '' : 's'} to do today.` : 'Nothing urgent today. Keep the momentum going.';
  });

  /** A short, prioritised to-do list built from your applications. */
  todos = computed<Todo[]>(() => {
    const today = todayIso();
    const items: (Todo & { rank: number })[] = [];
    for (const j of this.jobService.jobs()) {
      const open = j.status !== 'Rejected' && j.status !== 'Offer';
      if (open && j.followUpDate) {
        const d = daysBetween(today, j.followUpDate);
        if (d < 0) items.push({ rank: 0, icon: 'alert', tone: 'bad', title: `Follow up with ${j.company}`, sub: `${-d} day${d === -1 ? '' : 's'} overdue · ${j.role}`, link: ['/jobs', j.id], tab: 'email' });
        else if (d === 0) items.push({ rank: 1, icon: 'mail', tone: 'warn', title: `Follow up with ${j.company} today`, sub: j.role, link: ['/jobs', j.id], tab: 'email' });
      }
      if (j.status === 'Interview') {
        items.push({ rank: 2, icon: 'mic', tone: 'ai', title: `Prepare for your ${j.company} interview`, sub: `AI practice questions for ${j.role}`, link: ['/jobs', j.id], tab: 'interview' });
      }
      if (j.status === 'Saved' && daysBetween(j.dateApplied, today) >= 2) {
        items.push({ rank: 3, icon: 'send', tone: 'accent', title: `Apply to ${j.company}`, sub: `Saved ${daysBetween(j.dateApplied, today)} days ago · ${j.role}`, link: ['/jobs', j.id], tab: 'tailor' });
      }
      if (j.status === 'Saved' && j.matchScore == null && j.jobDescription && this.profiles.hasCv()) {
        items.push({ rank: 4, icon: 'sparkles', tone: 'ai', title: `Check your CV match for ${j.company}`, sub: 'See your fit before applying', link: ['/jobs', j.id], tab: 'match' });
      }
    }
    return items.sort((a, b) => a.rank - b.rank).slice(0, 6);
  });

  private maxWeek = computed(() => Math.max(1, ...(this.jobService.stats()?.weekly.map(w => w.count) ?? [1])));
  private maxSource = computed(() => Math.max(1, ...(this.jobService.stats()?.topSources.map(s => s.count) ?? [1])));

  ngOnInit() {
    this.jobService.load();
    this.jobService.loadStats();
    this.profiles.load();
  }

  count(status: string) {
    return this.jobService.jobs().filter(j => j.status === status).length;
  }

  pct(part: number, whole: number) {
    return whole ? Math.round((part / whole) * 100) : 0;
  }

  barHeight(count: number) {
    return Math.max(3, (count / this.maxWeek()) * 100);
  }

  sourceWidth(count: number) {
    return (count / this.maxSource()) * 100;
  }
}
