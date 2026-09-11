import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Property } from '../core/models';
import { ToastService } from '../core/toast.service';
import { InrPipe } from '../core/inr.pipe';

@Component({
  selector: 'app-properties',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Properties</h1>
        <p class="text-sm text-slate-500">Buildings you rent out</p>
      </div>
      <button class="btn-primary" (click)="openNew()">+ Add Property</button>
    </div>

    @if (properties().length) {
      <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        @for (p of properties(); track p.id) {
          <div class="card">
            <div class="flex items-start justify-between">
              <div>
                <div class="text-lg font-semibold">{{ p.name }}</div>
                <div class="text-sm text-slate-500">{{ p.address || 'No address' }}</div>
              </div>
              <div class="text-2xl">🏢</div>
            </div>
            <div class="mt-3 text-sm text-slate-500">Default rate: <span class="font-medium text-slate-700">{{ (p.defaultElectricityRate || 0) | inr }}/unit</span></div>
            <div class="mt-4 flex gap-2">
              <button class="btn-ghost flex-1" (click)="openEdit(p)">Edit</button>
              <button class="btn-danger" (click)="remove(p)">Delete</button>
            </div>
          </div>
        }
      </div>
    } @else {
      <div class="card text-center text-slate-400">No properties yet. Add your first building.</div>
    }

    @if (showForm()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="showForm.set(false)">
        <div class="w-full max-w-md card" (click)="$event.stopPropagation()">
          <h2 class="mb-4 text-lg font-semibold">{{ editing()?.id ? 'Edit' : 'Add' }} Property</h2>
          <div class="space-y-3">
            <div><label class="label">Name</label><input class="input" [(ngModel)]="form.name" /></div>
            <div><label class="label">Address</label><input class="input" [(ngModel)]="form.address" /></div>
            <div><label class="label">Default electricity rate (₹/unit)</label><input class="input" type="number" [(ngModel)]="form.defaultElectricityRate" /></div>
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
export class PropertiesComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  properties = signal<Property[]>([]);
  showForm = signal(false);
  editing = signal<Property | null>(null);
  form: Partial<Property> = {};

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.properties().subscribe((p) => this.properties.set(p));
  }

  openNew(): void {
    this.editing.set(null);
    this.form = { name: '', address: '', defaultElectricityRate: 8 };
    this.showForm.set(true);
  }

  openEdit(p: Property): void {
    this.editing.set(p);
    this.form = { ...p };
    this.showForm.set(true);
  }

  save(): void {
    const editing = this.editing();
    const req = editing?.id
      ? this.api.updateProperty(editing.id, this.form)
      : this.api.createProperty(this.form);
    req.subscribe({
      next: () => {
        this.toast.success('Property saved');
        this.showForm.set(false);
        this.load();
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed to save'),
    });
  }

  remove(p: Property): void {
    if (!confirm(`Delete property "${p.name}"?`)) return;
    this.api.deleteProperty(p.id).subscribe({
      next: () => {
        this.toast.success('Property deleted');
        this.load();
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed to delete'),
    });
  }
}
