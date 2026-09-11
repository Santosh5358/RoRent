import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Property, Room, Tenant } from '../core/models';
import { ToastService } from '../core/toast.service';
import { InrPipe } from '../core/inr.pipe';

@Component({
  selector: 'app-rooms',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Rooms</h1>
        <p class="text-sm text-slate-500">Manage rooms across your properties</p>
      </div>
      <button class="btn-primary" (click)="openNew()" [disabled]="!properties().length">+ Add Room</button>
    </div>

    <div class="mb-4">
      <select class="input max-w-xs" [(ngModel)]="filterProperty" (ngModelChange)="load()">
        <option [ngValue]="0">All properties</option>
        @for (p of properties(); track p.id) { <option [ngValue]="p.id">{{ p.name }}</option> }
      </select>
    </div>

    <div class="overflow-x-auto card p-0">
      <table class="min-w-full divide-y divide-slate-100">
        <thead class="bg-slate-50">
          <tr><th class="th">Room</th><th class="th">Floor</th><th class="th">Rent</th><th class="th">Elec. Rate</th><th class="th">Tenant</th><th class="th">Status</th><th class="th"></th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          @for (r of rooms(); track r.id) {
            <tr>
              <td class="td font-medium">{{ r.roomNumber }}</td>
              <td class="td">{{ r.floor || '-' }}</td>
              <td class="td">{{ r.monthlyRent | inr }}</td>
              <td class="td">{{ r.electricityRate ? (r.electricityRate | inr) + '/unit' : 'default' }}</td>
              <td class="td">{{ tenantName(r.currentTenantId) }}</td>
              <td class="td"><span class="badge" [ngClass]="statusClass(r.status)">{{ r.status }}</span></td>
              <td class="td text-right">
                <button class="btn-ghost" (click)="openEdit(r)">Edit</button>
                <button class="btn-danger ml-1" (click)="remove(r)">Delete</button>
              </td>
            </tr>
          }
          @if (!rooms().length) { <tr><td class="td text-slate-400" colspan="7">No rooms yet.</td></tr> }
        </tbody>
      </table>
    </div>

    @if (showForm()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="showForm.set(false)">
        <div class="w-full max-w-md card" (click)="$event.stopPropagation()">
          <h2 class="mb-4 text-lg font-semibold">{{ editing()?.id ? 'Edit' : 'Add' }} Room</h2>
          <div class="space-y-3">
            <div>
              <label class="label">Property</label>
              <select class="input" [(ngModel)]="form.propertyId">
                @for (p of properties(); track p.id) { <option [ngValue]="p.id">{{ p.name }}</option> }
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="label">Room number</label><input class="input" [(ngModel)]="form.roomNumber" /></div>
              <div><label class="label">Floor</label><input class="input" [(ngModel)]="form.floor" /></div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="label">Monthly rent (₹)</label><input class="input" type="number" [(ngModel)]="form.monthlyRent" /></div>
              <div><label class="label">Elec. rate (₹/unit)</label><input class="input" type="number" [(ngModel)]="form.electricityRate" placeholder="default" /></div>
            </div>
            <div>
              <label class="label">Status</label>
              <select class="input" [(ngModel)]="form.status">
                <option value="VACANT">Vacant</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button class="btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button class="btn-primary" (click)="save()">Save</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class RoomsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  properties = signal<Property[]>([]);
  rooms = signal<Room[]>([]);
  tenants = signal<Tenant[]>([]);
  filterProperty = 0;

  showForm = signal(false);
  editing = signal<Room | null>(null);
  form: Partial<Room> = {};

  ngOnInit(): void {
    this.api.properties().subscribe((p) => {
      this.properties.set(p);
      this.load();
    });
    this.api.tenants().subscribe((t) => this.tenants.set(t));
  }

  load(): void {
    this.api.rooms(this.filterProperty || undefined).subscribe((r) => this.rooms.set(r));
  }

  tenantName(id?: number): string {
    if (!id) return '-';
    return this.tenants().find((t) => t.id === id)?.name ?? '-';
  }

  openNew(): void {
    this.editing.set(null);
    this.form = { propertyId: this.properties()[0]?.id, roomNumber: '', monthlyRent: 8000, status: 'VACANT' };
    this.showForm.set(true);
  }

  openEdit(r: Room): void {
    this.editing.set(r);
    this.form = { ...r };
    this.showForm.set(true);
  }

  save(): void {
    const editing = this.editing();
    const req = editing?.id ? this.api.updateRoom(editing.id, this.form) : this.api.createRoom(this.form);
    req.subscribe({
      next: () => {
        this.toast.success('Room saved');
        this.showForm.set(false);
        this.load();
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed to save'),
    });
  }

  remove(r: Room): void {
    if (!confirm(`Delete room ${r.roomNumber}?`)) return;
    this.api.deleteRoom(r.id).subscribe({
      next: () => {
        this.toast.success('Room deleted');
        this.load();
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed to delete'),
    });
  }

  statusClass(status: string): string {
    switch (status) {
      case 'OCCUPIED': return 'bg-green-100 text-green-700';
      case 'VACANT': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-200 text-slate-600';
    }
  }
}
