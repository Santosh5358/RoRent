import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Bill, MeterReading, Room, Tenant } from '../core/models';
import { InrPipe } from '../core/inr.pipe';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Reports</h1>
      <p class="text-sm text-slate-500">Collection, tenant and electricity analytics</p>
    </div>

    <div class="mb-4 flex flex-wrap items-end gap-3">
      <div>
        <label class="label">Billing month</label>
        <input class="input" type="month" [(ngModel)]="month" />
      </div>
      <div>
        <label class="label">Status</label>
        <select class="input" [(ngModel)]="status">
          <option value="">All</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="UNPAID">Unpaid</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>
      <button class="btn-ghost" (click)="exportCsv()">⬇ Export CSV</button>
    </div>

    <!-- Monthly collection summary -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
      <div class="card"><div class="text-xs text-slate-500">Total Rent</div><div class="mt-1 text-lg font-bold">{{ totals().rent | inr }}</div></div>
      <div class="card"><div class="text-xs text-slate-500">Total Electricity</div><div class="mt-1 text-lg font-bold">{{ totals().electricity | inr }}</div></div>
      <div class="card"><div class="text-xs text-slate-500">Other Charges</div><div class="mt-1 text-lg font-bold">{{ totals().other | inr }}</div></div>
      <div class="card"><div class="text-xs text-slate-500">Total Billed</div><div class="mt-1 text-lg font-bold">{{ totals().billed | inr }}</div></div>
      <div class="card"><div class="text-xs text-slate-500">Collected</div><div class="mt-1 text-lg font-bold text-green-600">{{ totals().collected | inr }}</div></div>
      <div class="card"><div class="text-xs text-slate-500">Pending</div><div class="mt-1 text-lg font-bold text-red-600">{{ totals().pending | inr }}</div></div>
    </div>

    <!-- Electricity report -->
    <div class="mt-6 grid gap-3 md:grid-cols-3">
      <div class="card"><div class="text-xs text-slate-500">Total Units Consumed</div><div class="mt-1 text-lg font-bold">{{ elec().totalUnits }}</div></div>
      <div class="card"><div class="text-xs text-slate-500">Average Consumption</div><div class="mt-1 text-lg font-bold">{{ elec().avgUnits | number: '1.0-1' }} units</div></div>
      <div class="card"><div class="text-xs text-slate-500">Electricity Charges</div><div class="mt-1 text-lg font-bold">{{ elec().totalAmount | inr }}</div></div>
    </div>

    <!-- Filtered bills table -->
    <div class="mt-6 overflow-x-auto card p-0">
      <table class="min-w-full divide-y divide-slate-100">
        <thead class="bg-slate-50"><tr><th class="th">Bill</th><th class="th">Tenant</th><th class="th">Room</th><th class="th">Rent</th><th class="th">Electricity</th><th class="th">Total</th><th class="th">Paid</th><th class="th">Status</th></tr></thead>
        <tbody class="divide-y divide-slate-100">
          @for (b of filtered(); track b.id) {
            <tr>
              <td class="td">#{{ b.id }}</td>
              <td class="td">{{ tenantName(b.tenantId) }}</td>
              <td class="td">{{ roomLabel(b.roomId) }}</td>
              <td class="td">{{ b.rentAmount | inr }}</td>
              <td class="td">{{ b.electricityAmount | inr }}</td>
              <td class="td font-semibold">{{ b.totalAmount | inr }}</td>
              <td class="td">{{ b.amountPaid | inr }}</td>
              <td class="td">{{ b.status.replace('_', ' ') }}</td>
            </tr>
          }
          @if (!filtered().length) { <tr><td class="td text-slate-400" colspan="8">No bills match the filter.</td></tr> }
        </tbody>
      </table>
    </div>
  `,
})
export class ReportsComponent implements OnInit {
  private api = inject(ApiService);

  bills = signal<Bill[]>([]);
  readings = signal<MeterReading[]>([]);
  rooms = signal<Room[]>([]);
  tenants = signal<Tenant[]>([]);

  month = '';
  status = '';

  filtered = computed(() => {
    return this.bills().filter((b) => {
      const monthMatch = !this.month || b.billingMonth.startsWith(this.month);
      const statusMatch = !this.status || b.status === this.status;
      return monthMatch && statusMatch;
    });
  });

  totals = computed(() => {
    const list = this.filtered();
    const rent = sum(list.map((b) => b.rentAmount));
    const electricity = sum(list.map((b) => b.electricityAmount));
    const other = sum(list.map((b) => b.otherCharges));
    const billed = sum(list.map((b) => b.totalAmount));
    const collected = sum(list.map((b) => b.amountPaid));
    return { rent, electricity, other, billed, collected, pending: billed - collected };
  });

  elec = computed(() => {
    const list = this.readings().filter((r) => !this.month || r.readingDate.startsWith(this.month));
    const totalUnits = sum(list.map((r) => r.unitsConsumed));
    const totalAmount = sum(list.map((r) => r.electricityAmount));
    return { totalUnits, totalAmount, avgUnits: list.length ? totalUnits / list.length : 0 };
  });

  ngOnInit(): void {
    this.api.bills().subscribe((b) => this.bills.set(b));
    this.api.readings().subscribe((r) => this.readings.set(r));
    this.api.rooms().subscribe((r) => this.rooms.set(r));
    this.api.tenants().subscribe((t) => this.tenants.set(t));
  }

  roomLabel(id: number): string {
    return this.rooms().find((r) => r.id === id)?.roomNumber ?? `#${id}`;
  }
  tenantName(id?: number): string {
    if (!id) return '-';
    return this.tenants().find((t) => t.id === id)?.name ?? `#${id}`;
  }

  exportCsv(): void {
    const rows = [
      ['Bill', 'Month', 'Tenant', 'Room', 'Rent', 'Electricity', 'Other', 'Discount', 'Total', 'Paid', 'Status'],
      ...this.filtered().map((b) => [
        b.id,
        b.billingMonth,
        this.tenantName(b.tenantId),
        this.roomLabel(b.roomId),
        b.rentAmount,
        b.electricityAmount,
        b.otherCharges,
        b.discount,
        b.totalAmount,
        b.amountPaid,
        b.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${this.month || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

function sum(values: number[]): number {
  return values.reduce((a, b) => a + (b || 0), 0);
}
