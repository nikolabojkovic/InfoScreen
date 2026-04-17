import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'budget', pathMatch: 'full' },
  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'login', loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'budget', canActivate: [authGuard], loadComponent: () => import('./pages/budget/budget').then(m => m.Budget) },
  { path: 'transactions', canActivate: [authGuard], loadComponent: () => import('./pages/transactions/transactions').then(m => m.Transactions) },
  { path: 'categories', canActivate: [authGuard], loadComponent: () => import('./pages/categories/categories').then(m => m.Categories) },
];
