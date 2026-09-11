import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';
import { defaultApiBaseUrl, getConfiguredApiBaseUrl, isNativePlatform, setConfiguredApiBaseUrl } from '../core/runtime-config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">R</div>
          <h1 class="text-2xl font-bold text-slate-800">Room Rent & Electricity</h1>
          <p class="text-sm text-slate-500">Manage rooms, tenants, meters & bills</p>
        </div>

        <div class="card">
          <div class="mb-4 flex rounded-lg bg-slate-100 p-1 text-sm">
            <button class="flex-1 rounded-md py-1.5 font-medium" [class.bg-white]="mode() === 'login'" [class.shadow]="mode() === 'login'" (click)="mode.set('login')">Sign in</button>
            <button class="flex-1 rounded-md py-1.5 font-medium" [class.bg-white]="mode() === 'register'" [class.shadow]="mode() === 'register'" (click)="mode.set('register')">Register</button>
          </div>

          <form (ngSubmit)="submit()" class="space-y-3">
            @if (mode() === 'register') {
              <div>
                <label class="label">Full name</label>
                <input class="input" [(ngModel)]="name" name="name" required />
              </div>
              <div>
                <label class="label">Phone</label>
                <input class="input" [(ngModel)]="phone" name="phone" />
              </div>
            }
            <div>
              <label class="label">Email</label>
              <input class="input" type="email" [(ngModel)]="email" name="email" required />
            </div>
            <div>
              <label class="label">Password</label>
              <input class="input" type="password" [(ngModel)]="password" name="password" required />
            </div>
            <button class="btn-primary w-full" [disabled]="loading()">
              {{ loading() ? 'Please wait…' : mode() === 'login' ? 'Sign in' : 'Create account' }}
            </button>
          </form>

          @if (mode() === 'login') {
            <div class="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
              <div class="font-semibold text-slate-600">Demo logins</div>
              <div>Owner: admin&#64;roomrent.local / password123</div>
              <div>Tenant: rahul&#64;example.com / tenant123</div>
            </div>
          }

          <div class="mt-4 border-t border-slate-100 pt-3">
            <button type="button" class="flex w-full items-center justify-between text-xs font-medium text-slate-500 hover:text-slate-700" (click)="showServer.set(!showServer())">
              <span>Server settings</span>
              <span>{{ showServer() ? '▲' : '▼' }}</span>
            </button>
            @if (showServer()) {
              <div class="mt-2 space-y-1">
                <label class="label">Backend URL</label>
                <input class="input" type="url" inputmode="url" autocapitalize="off" autocomplete="off" spellcheck="false"
                       [(ngModel)]="serverUrl" name="serverUrl" placeholder="https://your-backend.example.com" />
                <p class="text-[11px] leading-snug text-slate-400">
                  The address of the Room Rent backend. Leave blank to use the default. Saved on this device.
                </p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  mode = signal<'login' | 'register'>('login');
  loading = signal(false);
  showServer = signal(false);
  name = '';
  phone = '';
  email = 'admin@roomrent.local';
  password = 'password123';
  serverUrl = getConfiguredApiBaseUrl() || (isNativePlatform() ? defaultApiBaseUrl() : '');

  submit(): void {
    // Persist any server URL the user entered before attempting to authenticate.
    setConfiguredApiBaseUrl(this.serverUrl);
    this.loading.set(true);
    const done = {
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl(this.auth.homePath());
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message ?? 'Authentication failed');
      },
    };
    if (this.mode() === 'login') {
      this.auth.login(this.email, this.password).subscribe(done);
    } else {
      this.auth.register(this.name, this.email, this.phone, this.password).subscribe(done);
    }
  }
}
