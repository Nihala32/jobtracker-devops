import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE } from './api.config';

export interface AppInfo {
  demo: boolean;
  resetHours: number;
  repoUrl: string;
}

/** Knows whether this is the public demo, so the UI can show a banner and lock the demo profile. */
@Injectable({ providedIn: 'root' })
export class AppInfoService {
  private http = inject(HttpClient);
  info = signal<AppInfo | null>(null);

  load() {
    this.http.get<AppInfo>(`${API_BASE}/app/info`).subscribe({
      next: i => this.info.set(i),
      error: () => this.info.set(null)
    });
  }

  isDemo() {
    return !!this.info()?.demo;
  }
}
