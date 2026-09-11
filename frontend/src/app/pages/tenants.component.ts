import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Room, Tenant } from '../core/models';
import { ToastService } from '../core/toast.service';
import { InrPipe } from '../core/inr.pipe';

@Component({
  selector: 'app-tenants',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Tenants</h1>
        <p class="text-sm text-slate-500">People renting your rooms</p>
      </div>
      <button class="btn-primary" (click)="openNew()">+ Add Tenant</button>
    </div>

    <div class="overflow-x-auto card p-0">
      <table class="min-w-full divide-y divide-slate-100">
        <thead class="bg-slate-50">
          <tr><th class="th">Name</th><th class="th">Phone</th><th class="th">Room</th><th class="th">Rent</th><th class="th">Deposit</th><th class="th">Status</th><th class="th"></th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          @for (t of tenants(); track t.id) {
            <tr>
              <td class="td font-medium">{{ t.name }}</td>
              <td class="td">{{ t.phone || '-' }}</td>
              <td class="td">{{ roomLabel(t.roomId) }}</td>
              <td class="td">{{ (t.monthlyRent || 0) | inr }}</td>
              <td class="td">{{ (t.securityDeposit || 0) | inr }}</td>
              <td class="td"><span class="badge" [ngClass]="t.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'">{{ t.status }}</span></td>
              <td class="td text-right whitespace-nowrap">
                <button class="btn-ghost" (click)="openAssign(t)">Assign</button>
                <button class="btn-ghost ml-1" (click)="openEdit(t)">Edit</button>
                @if (t.email) { <button class="btn-ghost ml-1" (click)="resetPassword(t)">Reset password</button> }
                @if (t.roomId) { <button class="btn-ghost ml-1" (click)="unassign(t)">Move out</button> }
              </td>
            </tr>
          }
          @if (!tenants().length) { <tr><td class="td text-slate-400" colspan="7">No tenants yet.</td></tr> }
        </tbody>
      </table>
    </div>

    <!-- Tenant form -->
    @if (showForm()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="showForm.set(false)">
        <div class="w-full max-w-lg card" (click)="$event.stopPropagation()">
          <h2 class="mb-4 text-lg font-semibold">{{ editing()?.id ? 'Edit' : 'Add' }} Tenant</h2>
          <div class="grid grid-cols-2 gap-3">
            <div class="col-span-2"><label class="label">Full name</label><input class="input" [(ngModel)]="form.name" /></div>
            <div><label class="label">Phone</label><input class="input" [(ngModel)]="form.phone" /></div>
            <div><label class="label">Email</label><input class="input" [(ngModel)]="form.email" /></div>
            <div class="col-span-2"><label class="label">Address</label><input class="input" [(ngModel)]="form.address" /></div>
            <div><label class="label">ID / document no.</label><input class="input" [(ngModel)]="form.idDocumentNumber" /></div>
            <div><label class="label">Security deposit (₹)</label><input class="input" type="number" [(ngModel)]="form.securityDeposit" /></div>
            <div><label class="label">Move-in date</label><input class="input" type="date" [(ngModel)]="form.moveInDate" /></div>
            <div><label class="label">Move-out date</label><input class="input" type="date" [(ngModel)]="form.moveOutDate" /></div>
          </div>
          @if (!editing()?.id) {
            <div class="mt-4 rounded-lg bg-brand-50 p-3 text-xs text-slate-600">
              <span class="font-semibold text-slate-700">Login is created automatically.</span>
              When you add an email, the tenant can sign in with that email and a temporary password
              (<span class="font-mono font-semibold">Welcome&#64;123</span>). They will be asked to set a new password on first sign-in.
            </div>
          }
          <div class="mt-5 flex justify-end gap-2">
            <button class="btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button class="btn-primary" (click)="save()">Save</button>
          </div>
        </div>
      </div>
    }

    <!-- Assign modal -->
    @if (showAssign()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="showAssign.set(false)">
        <div class="w-full max-w-md card" (click)="$event.stopPropagation()">
          <h2 class="mb-1 text-lg font-semibold">Assign room</h2>
          <p class="mb-4 text-sm text-slate-500">{{ assignTarget()?.name }}</p>
          <div class="space-y-3">
            <div>
              <label class="label">Room</label>
              <select class="input" [(ngModel)]="assignForm.roomId">
                @for (r of rooms(); track r.id) {
                  <option [ngValue]="r.id">{{ r.roomNumber }} ({{ r.status }})</option>
                }
              </select>
            </div>
            <div><label class="label">Start date</label><input class="input" type="date" [(ngModel)]="assignForm.startDate" /></div>
            <div><label class="label">Monthly rent (₹)</label><input class="input" type="number" [(ngModel)]="assignForm.monthlyRent" /></div>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button class="btn-ghost" (click)="showAssign.set(false)">Cancel</button>
            <button class="btn-primary" (click)="doAssign()">Assign</button>
          </div>
        </div>
      </div>
    }

    <!-- Reset password result -->
    @if (resetResult(); as rr) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="resetResult.set(null)">
        <div class="w-full max-w-md card text-center" (click)="$event.stopPropagation()">
          <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-2xl">&#10003;</div>
          <h2 class="mb-1 text-lg font-semibold">Password reset</h2>
          <p class="mb-4 text-sm text-slate-500">Share these sign-in details with {{ rr.name }}. They will be asked to set a new password on their next sign-in.</p>
          <div class="space-y-2 rounded-lg bg-slate-50 p-4 text-left text-sm">
            <div><span class="text-slate-400">Username</span><div class="font-mono font-semibold text-slate-700">{{ rr.email }}</div></div>
            <div><span class="text-slate-400">Temporary password</span><div class="font-mono font-semibold text-slate-700">{{ rr.password }}</div></div>
          </div>
          <button class="btn-primary mt-5 w-full" (click)="resetResult.set(null)">Done</button>
        </div>
      </div>
    }
  `,
})
export class TenantsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  tenants = signal<Tenant[]>([]);
  rooms = signal<Room[]>([]);

  showForm = signal(false);
  editing = signal<Tenant | null>(null);
  form: Partial<Tenant> = {};

  showAssign = signal(false);
  assignTarget = signal<Tenant | null>(null);
  assignForm: { roomId?: number; startDate: string; monthlyRent?: number } = { startDate: this.today() };

  resetResult = signal<{ name: string; email: string; password: string } | null>(null);

  ngOnInit(): void {
    this.load();
    this.api.rooms().subscribe((r) => this.rooms.set(r));
  }

  load(): void {
    this.api.tenants().subscribe((t) => this.tenants.set(t));
  }

  roomLabel(id?: number): string {
    if (!id) return '-';
    return this.rooms().find((r) => r.id === id)?.roomNumber ?? `#${id}`;
  }

  today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  openNew(): void {
    this.editing.set(null);
    this.form = { name: '', securityDeposit: 0, moveInDate: this.today() };
    this.showForm.set(true);
  }

  openEdit(t: Tenant): void {
    this.editing.set(t);
    this.form = { ...t };
    this.showForm.set(true);
  }

  save(): void {
    const editing = this.editing();
    const req = editing?.id ? this.api.updateTenant(editing.id, this.form) : this.api.createTenant(this.form);
    req.subscribe({
      next: () => {
        this.toast.success('Tenant saved');
        this.showForm.set(false);
        this.load();
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed to save'),
    });
  }

  openAssign(t: Tenant): void {
    this.assignTarget.set(t);
    this.assignForm = { roomId: this.rooms()[0]?.id, startDate: this.today(), monthlyRent: t.monthlyRent };
    this.showAssign.set(true);
  }

  doAssign(): void {
    const t = this.assignTarget();
    if (!t || !this.assignForm.roomId) return;
    this.api.assignTenant(t.id, {
      roomId: this.assignForm.roomId,
      startDate: this.assignForm.startDate,
      monthlyRent: this.assignForm.monthlyRent,
    }).subscribe({
      next: () => {
        this.toast.success('Room assigned');
        this.showAssign.set(false);
        this.load();
        this.api.rooms().subscribe((r) => this.rooms.set(r));
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed to assign'),
    });
  }

  unassign(t: Tenant): void {
    if (!confirm(`Mark ${t.name} as moved out?`)) return;
    this.api.unassignTenant(t.id).subscribe({
      next: () => {
        this.toast.success('Tenant moved out');
        this.load();
        this.api.rooms().subscribe((r) => this.rooms.set(r));
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed'),
    });
  }

  resetPassword(t: Tenant): void {
    if (!confirm(`Reset the login password for ${t.name}?`)) return;
    this.api.resetTenantPassword(t.id).subscribe({
      next: (res) => {
        this.resetResult.set({ name: t.name, email: (t.email || '').toLowerCase(), password: res.password });
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed to reset password'),
    });
  }
}
