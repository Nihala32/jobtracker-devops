import { Injectable, effect, signal } from '@angular/core';

type Theme = 'light' | 'dark';
const KEY = 'jobtracker-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>(this.initial());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.dataset['theme'] = t;
      try { localStorage.setItem(KEY, t); } catch { /* storage can be blocked; theme still works for this visit */ }
    });
  }

  toggle() {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  private initial(): Theme {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* ignore */ }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}
