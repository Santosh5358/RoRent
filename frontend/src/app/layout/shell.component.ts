import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ApiService } from '../core/api.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="flex min-h-screen bg-slate-100/70">
      <!-- Sidebar (desktop) -->
      <aside class="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div class="flex items-center gap-3 bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-500 px-5 py-4 text-white">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-lg font-bold ring-1 ring-white/30 backdrop-blur">R</div>
          <div>
            <div class="text-sm font-semibold leading-tight">RoomRent</div>
            <div class="text-xs text-white/70">Electricity Manager</div>
          </div>
        </div>
        <nav class="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="!bg-brand-50 !text-brand-700 ring-1 ring-brand-100"
              class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
            >
              <span class="text-base">{{ item.icon }}</span>
              <span class="flex-1">{{ item.label }}</span>
              @if (item.path === '/approvals' && pending() > 0) {
                <span class="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">{{ pending() }}</span>
              }
            </a>
          }
        </nav>
        <div class="border-t border-slate-100 p-3">
          <div class="mb-2 flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{{ initials() }}</div>
            <div class="min-w-0">
              <div class="truncate text-sm font-medium text-slate-700">{{ auth.user()?.name }}</div>
              <div class="text-xs text-slate-400">Owner</div>
            </div>
          </div>
          <button class="btn-ghost w-full" (click)="auth.logout()" routerLink="/login">Sign out</button>
        </div>
      </aside>

      <!-- Main -->
      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Mobile top bar -->
        <header class="flex items-center justify-between bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-500 px-4 py-3 text-white lg:hidden">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 font-bold ring-1 ring-white/30">R</div>
            <span class="font-semibold">RoomRent</span>
          </div>
          <button class="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm ring-1 ring-white/30 transition hover:bg-white/25" (click)="menuOpen.set(!menuOpen())">
            ☰
            @if (pending() > 0) { <span class="inline-flex h-2 w-2 rounded-full bg-red-400"></span> }
          </button>
        </header>

        @if (menuOpen()) {
          <nav class="grid grid-cols-2 gap-1 border-b border-slate-200 bg-white p-3 lg:hidden">
            @for (item of nav; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="bg-brand-50 text-brand-700"
                class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600"
                (click)="menuOpen.set(false)"
              >
                <span>{{ item.icon }}</span>
                <span class="flex-1">{{ item.label }}</span>
                @if (item.path === '/approvals' && pending() > 0) {
                  <span class="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">{{ pending() }}</span>
                }
              </a>
            }
            <button class="col-span-2 btn-ghost mt-1" (click)="auth.logout()" routerLink="/login">Sign out</button>
          </nav>
        }

        <main class="flex-1 overflow-y-auto p-4 lg:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);
  menuOpen = signal(false);
  pending = signal(0);

  nav: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Properties', path: '/properties', icon: '🏢' },
    { label: 'Rooms', path: '/rooms', icon: '🚪' },
    { label: 'Tenants', path: '/tenants', icon: '👤' },
    { label: 'Meter Readings', path: '/meter-readings', icon: '⚡' },
    { label: 'Bills', path: '/bills', icon: '🧾' },
    { label: 'Payments', path: '/payments', icon: '💰' },
    { label: 'Approvals', path: '/approvals', icon: '✅' },
    { label: 'Reports', path: '/reports', icon: '📈' },
    { label: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  ngOnInit(): void {
    this.api.pendingSubmissionCount().subscribe({
      next: (r) => this.pending.set(r.pending ?? 0),
      error: () => this.pending.set(0),
    });
  }

  initials(): string {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'A';
  }
}
