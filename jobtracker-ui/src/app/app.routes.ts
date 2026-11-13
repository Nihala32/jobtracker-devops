import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard';
import { Applications } from './pages/applications';
import { AddJob } from './pages/add-job';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: Dashboard },
  { path: 'applications', component: Applications },
  { path: 'add', component: AddJob },
  { path: '**', redirectTo: 'dashboard' }
];