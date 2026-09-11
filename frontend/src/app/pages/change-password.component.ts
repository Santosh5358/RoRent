import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl font-bold text-white">R</div>
          <h1 class="text-2xl font-bold text-slate-800">Set a new password</h1>
          <p class="text-sm text-slate-500">
            @if (forced()) {
              For your security, please change your temporary password before continuing.
            } @else {
              Update the password you use to sign in.
            }
          </p>
        </div>

        <div class="card">
          <form (ngSubmit)="submit()" class="space-y-3">
            <div>
              <label class="label">Current password</label>
              <input class="input" type="password" [(ngModel)]="currentPassword" name="currentPassword" required autocomplete="current-password" />
            </div>
            <div>
              <label class="label">New password</label>
              <input class="input" type="password" [(ngModel)]="newPassword" name="newPassword" required minlength="6" autocomplete="new-password" />
              <p class="mt-1 text-xs text-slate-400">At least 6 characters.</p>
            </div>
            <div>
              <label class="label">Confirm new password</label>
              <input class="input" type="password" [(ngModel)]="confirmPassword" name="confirmPassword" required autocomplete="new-password" />
            </div>
            <button class="btn-primary w-full" [disabled]="loading()">
              {{ loading() ? 'Please wait…' : 'Update password' }}
            </button>
          </form>

          <button class="btn-ghost mt-3 w-full text-sm" (click)="logout()">Sign out</button>
        </div>
      </div>
    </div>
  `,
})
export class ChangePasswordComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  loading = signal(false);
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  forced(): boolean {
    return this.auth.mustChangePassword();
  }

  submit(): void {
    if (this.newPassword.length < 6) {
      this.toast.error('New password must be at least 6 characters');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toast.error('New password and confirmation do not match');
      return;
    }
    this.loading.set(true);
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.toast.success('Password updated');
        this.router.navigateByUrl(this.auth.homePath());
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error(err?.error?.message ?? 'Could not update password');
      },
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
