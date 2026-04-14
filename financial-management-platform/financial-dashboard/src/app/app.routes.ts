import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'budget', pathMatch: 'full' },
  { path: 'budget', loadComponent: () => import('./pages/budget/budget').then(m => m.Budget) },
  { path: 'transactions', loadComponent: () => import('./pages/transactions/transactions').then(m => m.Transactions) },
  { path: 'categories', loadComponent: () => import('./pages/categories/categories').then(m => m.Categories) },
];
