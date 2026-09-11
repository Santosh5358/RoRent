import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { ElectricityRate, Property, Room } from '../core/models';
import { ToastService } from '../core/toast.service';
import { InrPipe } from '../core/inr.pipe';
import { InDatePipe } from '../core/indate.pipe';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe, InDatePipe],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Settings</h1>
      <p class="text-sm text-slate-500">Configure electricity pricing (property or room level, effective-dated)</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <div class="card">
        <div class="mb-4 font-semibold text-slate-700">Add electricity rate</div>
        <div class="space-y-3">
          <div>
            <label class="label">Scope</label>
            <select class="input" [(ngModel)]="scope">
              <option value="property">Whole property</option>
              <option value="room">Specific room</option>
            </select>
          </div>
          @if (scope === 'property') {
            <div>
              <label class="label">Property</label>
              <select class="input" [(ngModel)]="form.propertyId">
                @for (p of properties(); track p.id) { <option [ngValue]="p.id">{{ p.name }}</option> }
              </select>
            </div>
          } @else {
            <div>
              <label class="label">Room</label>
              <select class="input" [(ngModel)]="form.roomId">
                @for (r of rooms(); track r.id) { <option [ngValue]="r.id">{{ r.roomNumber }}</option> }
              </select>
            </div>
          }
          <div><label class="label">Price per unit (₹)</label><input class="input" type="number" [(ngModel)]="form.pricePerUnit" /></div>
          <div><label class="label">Effective from</label><input class="input" type="date" [(ngModel)]="form.effectiveFrom" /></div>
          <button class="btn-primary w-full" (click)="save()">Add rate</button>
          <p class="text-xs text-slate-400">Historical bills keep their original rate — new rates only affect future bills.</p>
        </div>
      </div>

      <div class="card">
        <div class="mb-3 font-semibold text-slate-700">Rate history</div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100">
            <thead><tr><th class="th">Scope</th><th class="th">Rate</th><th class="th">From</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              @for (r of rates(); track r.id) {
                <tr>
                  <td class="td">{{ r.roomId ? 'Room ' + roomLabel(r.roomId) : 'Property ' + propertyLabel(r.propertyId) }}</td>
                  <td class="td font-semibold">{{ r.pricePerUnit | inr }}/unit</td>
                  <td class="td">{{ r.effectiveFrom | indate }}</td>
                </tr>
              }
              @if (!rates().length) { <tr><td class="td text-slate-400" colspan="3">No custom rates. Property default is used.</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  properties = signal<Property[]>([]);
  rooms = signal<Room[]>([]);
  rates = signal<ElectricityRate[]>([]);

  scope: 'property' | 'room' = 'property';
  form: Partial<ElectricityRate> = { pricePerUnit: 8, effectiveFrom: new Date().toISOString().slice(0, 10) };

  ngOnInit(): void {
    this.api.properties().subscribe((p) => {
      this.properties.set(p);
      if (p[0]) this.form.propertyId = p[0].id;
    });
    this.api.rooms().subscribe((r) => {
      this.rooms.set(r);
      if (r[0]) this.form.roomId = r[0].id;
    });
    this.load();
  }

  load(): void {
    this.api.rates().subscribe((r) => this.rates.set(r));
  }

  roomLabel(id?: number): string {
    if (!id) return '';
    return this.rooms().find((r) => r.id === id)?.roomNumber ?? `#${id}`;
  }
  propertyLabel(id?: number): string {
    if (!id) return '';
    return this.properties().find((p) => p.id === id)?.name ?? `#${id}`;
  }

  save(): void {
    const body: Partial<ElectricityRate> = {
      pricePerUnit: this.form.pricePerUnit,
      effectiveFrom: this.form.effectiveFrom,
      propertyId: this.scope === 'property' ? this.form.propertyId : undefined,
      roomId: this.scope === 'room' ? this.form.roomId : undefined,
    };
    this.api.createRate(body).subscribe({
      next: () => {
        this.toast.success('Rate added');
        this.load();
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed to add rate'),
    });
  }
}
