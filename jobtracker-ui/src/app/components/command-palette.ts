import { AfterViewInit, Component, ElementRef, computed, inject, output, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Icon } from './icon';
import { JobService } from '../job.service';
import { ThemeService } from '../theme.service';

interface PaletteItem {
  group: string;
  label: string;
  hint?: string;
  icon: string;
  run: () => void;
}

/** Ctrl+K quick search: jump to any job, page or action from the keyboard. */
@Component({
  selector: 'app-command-palette',
  imports: [Icon],
  template: `
    <div class="palette-backdrop" (click)="closed.emit()">
      <div class="palette" (click)="$event.stopPropagation()" role="dialog" aria-label="Quick search">
        <div class="palette-search">
          <app-icon name="search" />
          <input #box placeholder="Search jobs, pages or actions…" [value]="query()"
                 (input)="query.set($any($event.target).value); active.set(0)" (keydown)="onKey($event)" />
          <kbd>Esc</kbd>
        </div>
        <div class="palette-list">
          @for (item of results(); track $index; let i = $index) {
            @if (i === 0 || results()[i - 1].group !== item.group) {
              <div class="palette-group">{{ item.group }}</div>
            }
            <button class="palette-item" [class.active]="i === active()" (mouseenter)="active.set(i)" (click)="choose(item)">
              <app-icon [name]="item.icon" /> {{ item.label }}
              @if (item.hint) { <small>{{ item.hint }}</small> }
            </button>
          } @empty {
            <div class="empty small">No results for “{{ query() }}”</div>
          }
        </div>
        <div class="palette-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>Esc</kbd> close</span></div>
      </div>
    </div>
  `
})
export class CommandPalette implements AfterViewInit {
  closed = output<void>();
  private router = inject(Router);
  private jobs = inject(JobService);
  private theme = inject(ThemeService);
  private box = viewChild.required<ElementRef<HTMLInputElement>>('box');

  query = signal('');
  active = signal(0);

  private go = (url: string | (string | number)[]) => () => this.router.navigate(Array.isArray(url) ? url : [url]);

  private all = computed<PaletteItem[]>(() => [
    ...this.jobs.jobs().map(j => ({
      group: 'Applications', label: `${j.company} — ${j.role}`, hint: j.status, icon: 'briefcase', run: this.go(['/jobs', j.id])
    })),
    { group: 'Pages', label: 'Dashboard', icon: 'dashboard', run: this.go('/dashboard') },
    { group: 'Pages', label: 'Applications', icon: 'list', run: this.go('/applications') },
    { group: 'Pages', label: 'Board', icon: 'board', run: this.go('/board') },
    { group: 'Pages', label: 'Profile & CV', icon: 'file', run: this.go('/profile') },
    { group: 'Actions', label: 'Add a job with AI', icon: 'sparkles', run: this.go('/add') },
    { group: 'Actions', label: 'Toggle dark mode', icon: 'moon', run: () => this.theme.toggle() },
    { group: 'Actions', label: 'Export applications to CSV', icon: 'download', run: () => window.open(this.jobs.exportUrl, '_blank') }
  ]);

  results = computed(() => {
    const q = this.query().toLowerCase().trim();
    const list = q ? this.all().filter(i => i.label.toLowerCase().includes(q) || i.hint?.toLowerCase().includes(q)) : this.all();
    return list.slice(0, 40);
  });

  ngAfterViewInit() {
    this.box().nativeElement.focus();
  }

  onKey(e: KeyboardEvent) {
    const n = this.results().length;
    if (e.key === 'Escape') { this.closed.emit(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); this.active.set(n ? (this.active() + 1) % n : 0); this.scroll(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.active.set(n ? (this.active() - 1 + n) % n : 0); this.scroll(); }
    else if (e.key === 'Enter') { const item = this.results()[this.active()]; if (item) this.choose(item); }
  }

  choose(item: PaletteItem) {
    this.closed.emit();
    item.run();
  }

  private scroll() {
    queueMicrotask(() => document.querySelector('.palette-item.active')?.scrollIntoView({ block: 'nearest' }));
  }
}
