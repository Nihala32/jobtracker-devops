import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_BASE } from './api.config';
import { UserProfile } from './models';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);
  private url = `${API_BASE}/profile`;

  profile = signal<UserProfile | null>(null);

  load() {
    this.http.get<UserProfile>(this.url).subscribe({
      next: p => this.profile.set(p),
      error: () => this.profile.set(null)
    });
  }

  save(p: UserProfile): Observable<UserProfile> {
    return this.http.put<UserProfile>(this.url, p).pipe(tap(saved => this.profile.set(saved)));
  }

  hasCv(): boolean {
    return !!this.profile()?.cvText?.trim();
  }
}
