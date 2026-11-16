import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { Toasts } from './toast-container';
import { Icon } from './components/icon';
import { Avatar } from './components/avatar';
import { CommandPalette } from './components/command-palette';
import { JobService } from './job.service';
import { AiService } from './ai.service';
import { ProfileService } from './profile.service';
import { ThemeService } from './theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toasts, Icon, Avatar, CommandPalette],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  jobs = inject(JobService);
  ai = inject(AiService);
  profiles = inject(ProfileService);
  theme = inject(ThemeService);
  private router = inject(Router);

  sidebarOpen = signal(false);
  paletteOpen = signal(false);

  activeCount = computed(() => this.jobs.jobs().filter(j => j.status !== 'Rejected').length);
  interviewCount = computed(() => this.jobs.jobs().filter(j => j.status === 'Interview').length);
  isMac = /Mac|iPhone|iPad/.test(navigator.platform);

  constructor() {
    // Close the mobile menu after navigating.
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => this.sidebarOpen.set(false));
  }

  ngOnInit() {
    this.jobs.load();
    this.ai.loadStatus();
    this.profiles.load();
  }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.paletteOpen.update(v => !v);
    }
  }
}
