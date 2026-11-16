import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard';
import { Applications } from './pages/applications';
import { AddJob } from './pages/add-job';
import { Board } from './pages/board';
import { JobDetails } from './pages/job-details';
import { Profile } from './pages/profile';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: Dashboard, title: 'Dashboard · AI Job Tracker' },
  { path: 'applications', component: Applications, title: 'Applications · AI Job Tracker' },
  { path: 'board', component: Board, title: 'Board · AI Job Tracker' },
  { path: 'add', component: AddJob, title: 'Add job · AI Job Tracker' },
  { path: 'jobs/:id', component: JobDetails, title: 'Job · AI Job Tracker' },
  { path: 'profile', component: Profile, title: 'Profile · AI Job Tracker' },
  { path: '**', redirectTo: 'dashboard' }
];
