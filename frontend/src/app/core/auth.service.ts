import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse } from './models';

const STORAGE_KEY = 'roomrent.auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly user = signal<AuthResponse | null>(this.load());

  constructor(private http: HttpClient) {}

  private load(): AuthResponse | null {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthResponse) : null;
  }

  get token(): string | null {
    return this.user()?.token ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.user();
  }

  get role(): string | null {
    return this.user()?.role ?? null;
  }

  isOwner(): boolean {
    return this.user()?.role === 'OWNER';
  }

  isTenant(): boolean {
    return this.user()?.role === 'TENANT';
  }

  mustChangePassword(): boolean {
    return !!this.user()?.mustChangePassword;
  }

  homePath(): string {
    if (this.mustChangePassword()) return '/change-password';
    return this.isTenant() ? '/portal' : '/dashboard';
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/login', { email, password })
      .pipe(tap((res) => this.store(res)));
  }

  register(name: string, email: string, phone: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/register', { name, email, phone, password })
      .pipe(tap((res) => this.store(res)));
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>('/api/auth/change-password', { currentPassword, newPassword })
      .pipe(tap((res) => this.store(res)));
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.user.set(null);
  }

  private store(res: AuthResponse): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(res));
    this.user.set(res);
  }
}
