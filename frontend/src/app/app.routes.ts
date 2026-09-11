import { Routes } from '@angular/router';
import { authGuard, ownerGuard, tenantGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/change-password.component').then((m) => m.ChangePasswordComponent),
  },
  {
    path: 'portal',
    canActivate: [tenantGuard],
    loadComponent: () => import('./pages/tenant-portal.component').then((m) => m.TenantPortalComponent),
  },
  {
    path: '',
    loadComponent: () => import('./layout/shell.component').then((m) => m.ShellComponent),
    canActivate: [ownerGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'properties',
        loadComponent: () => import('./pages/properties.component').then((m) => m.PropertiesComponent),
      },
      {
        path: 'rooms',
        loadComponent: () => import('./pages/rooms.component').then((m) => m.RoomsComponent),
      },
      {
        path: 'tenants',
        loadComponent: () => import('./pages/tenants.component').then((m) => m.TenantsComponent),
      },
      {
        path: 'meter-readings',
        loadComponent: () => import('./pages/meter-readings.component').then((m) => m.MeterReadingsComponent),
      },
      {
        path: 'bills',
        loadComponent: () => import('./pages/bills.component').then((m) => m.BillsComponent),
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments.component').then((m) => m.PaymentsComponent),
      },
      {
        path: 'approvals',
        loadComponent: () => import('./pages/approvals.component').then((m) => m.ApprovalsComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./pages/reports.component').then((m) => m.ReportsComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./pages/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
