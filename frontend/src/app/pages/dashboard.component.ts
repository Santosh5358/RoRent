import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { Dashboard } from '../core/models';
import { InrPipe } from '../core/inr.pipe';
import { InDatePipe } from '../core/indate.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, InrPipe, InDatePipe],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Dashboard</h1>
      <p class="text-sm text-slate-500">Overview of your properties this month</p>
    </div>

    @if (data(); as d) {
      <!-- Quick actions -->
      <div class="mb-6 flex flex-wrap gap-2">
        <a routerLink="/tenants" class="btn-primary">+ Add Tenant</a>
        <a routerLink="/rooms" class="btn-ghost">+ Add Room</a>
        <a routerLink="/meter-readings" class="btn-ghost">⚡ Upload Meter Reading</a>
        <a routerLink="/bills" class="btn-ghost">🧾 Generate Bill</a>
        <a routerLink="/payments" class="btn-ghost">💰 Record Payment</a>
      </div>

      <!-- Highlight cards -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-500 p-5 text-white shadow-md">
          <div class="text-xs font-medium text-white/80">Collected this month</div>
          <div class="mt-1 text-2xl font-bold">{{ d.totalCollected | inr }}</div>
          <div class="mt-1 text-xs text-white/70">💰 Payments received</div>
        </div>
        <div class="rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 p-5 text-white shadow-md">
          <div class="text-xs font-medium text-white/80">Pending</div>
          <div class="mt-1 text-2xl font-bold">{{ d.totalPending | inr }}</div>
          <div class="mt-1 text-xs text-white/70">⏳ Yet to collect</div>
        </div>
        <div class="card flex items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">🏦</div>
          <div class="min-w-0">
            <div class="truncate text-xs font-medium uppercase tracking-wide text-slate-400">Rent This Month</div>
            <div class="text-lg font-bold text-slate-800">{{ d.rentThisMonth | inr }}</div>
          </div>
        </div>
        <div class="card flex items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">⚡</div>
          <div class="min-w-0">
            <div class="truncate text-xs font-medium uppercase tracking-wide text-slate-400">Electricity</div>
            <div class="text-lg font-bold text-slate-800">{{ d.electricityThisMonth | inr }}</div>
          </div>
        </div>
      </div>

      <!-- Occupancy cards -->
      <div class="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div class="card flex items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl">🏢</div>
          <div><div class="text-xs font-medium uppercase tracking-wide text-slate-400">Properties</div><div class="text-xl font-bold">{{ d.totalProperties }}</div></div>
        </div>
        <div class="card flex items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl">🚪</div>
          <div><div class="text-xs font-medium uppercase tracking-wide text-slate-400">Rooms</div><div class="text-xl font-bold">{{ d.totalRooms }}</div></div>
        </div>
        <div class="card flex items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">✅</div>
          <div><div class="text-xs font-medium uppercase tracking-wide text-slate-400">Occupied</div><div class="text-xl font-bold text-emerald-600">{{ d.occupiedRooms }}</div></div>
        </div>
        <div class="card flex items-center gap-3">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">🔑</div>
          <div><div class="text-xs font-medium uppercase tracking-wide text-slate-400">Vacant</div><div class="text-xl font-bold text-amber-600">{{ d.vacantRooms }}</div></div>
        </div>
      </div>

      <!-- Notifications -->
      @if (d.notifications.length) {
        <div class="card mt-6 border-l-4 border-amber-400">
          <div class="mb-2 font-semibold text-slate-700">🔔 Reminders</div>
          <ul class="space-y-1 text-sm text-slate-600">
            @for (n of d.notifications; track n) { <li>• {{ n }}</li> }
          </ul>
        </div>
      }

      <div class="mt-6 grid gap-6 lg:grid-cols-2">
        <!-- Recent bills -->
        <div class="card">
          <div class="mb-3 flex items-center gap-2 font-semibold text-slate-700"><span>🧾</span> Recent Bills</div>
          @if (d.recentBills.length) {
            <div class="divide-y divide-slate-100">
              @for (b of d.recentBills; track b.id) {
                <div class="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div class="font-medium">Bill #{{ b.id }} · {{ b.billingMonth | indate: true }}</div>
                    <div class="text-xs text-slate-400">Room #{{ b.roomId }}</div>
                  </div>
                  <div class="text-right">
                    <div class="font-semibold">{{ b.totalAmount | inr }}</div>
                    <span class="badge" [ngClass]="statusClass(b.status)">{{ b.status.replace('_', ' ') }}</span>
                  </div>
                </div>
              }
            </div>
          } @else { <div class="text-sm text-slate-400">No bills yet.</div> }
        </div>

        <!-- Recent payments -->
        <div class="card">
          <div class="mb-3 flex items-center gap-2 font-semibold text-slate-700"><span>💰</span> Recent Payments</div>
          @if (d.recentPayments.length) {
            <div class="divide-y divide-slate-100">
              @for (p of d.recentPayments; track p.id) {
                <div class="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div class="font-medium text-emerald-600">{{ p.amount | inr }}</div>
                    <div class="text-xs text-slate-400">{{ p.paymentMethod }} · {{ p.paymentDate | indate }}</div>
                  </div>
                  <div class="text-xs text-slate-400">Bill #{{ p.billId }}</div>
                </div>
              }
            </div>
          } @else { <div class="text-sm text-slate-400">No payments yet.</div> }
        </div>

        <!-- Recent readings -->
        <div class="card">
          <div class="mb-3 flex items-center gap-2 font-semibold text-slate-700"><span>⚡</span> Recent Meter Readings</div>
          @if (d.recentReadings.length) {
            <div class="divide-y divide-slate-100">
              @for (r of d.recentReadings; track r.id) {
                <div class="flex items-center justify-between py-2 text-sm">
                  <div>
                    <div class="font-medium">Room #{{ r.roomId }} · {{ r.unitsConsumed }} units</div>
                    <div class="text-xs text-slate-400">{{ r.readingDate | indate }} · {{ r.previousReading }} → {{ r.currentReading }}</div>
                  </div>
                  <div class="font-semibold">{{ r.electricityAmount | inr }}</div>
                </div>
              }
            </div>
          } @else { <div class="text-sm text-slate-400">No readings yet.</div> }
        </div>

        <!-- Overdue -->
        <div class="card">
          <div class="mb-3 flex items-center gap-2 font-semibold text-slate-700"><span>⚠️</span> Overdue Bills</div>
          @if (d.overdueBills.length) {
            <div class="divide-y divide-slate-100">
              @for (b of d.overdueBills; track b.id) {
                <div class="flex items-center justify-between py-2 text-sm">
                  <div>Bill #{{ b.id }} · Room #{{ b.roomId }}</div>
                  <div class="text-right"><div class="font-semibold text-red-600">{{ b.totalAmount | inr }}</div><div class="text-xs text-slate-400">Due {{ b.dueDate | indate }}</div></div>
                </div>
              }
            </div>
          } @else { <div class="text-sm text-slate-400">No overdue bills. 🎉</div> }
        </div>
      </div>
    } @else {
      <div class="text-sm text-slate-400">Loading dashboard…</div>
    }
  `,
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  data = signal<Dashboard | null>(null);

  ngOnInit(): void {
    this.api.dashboard().subscribe((d) => this.data.set(d));
  }

  statusClass(status: string): string {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'PARTIALLY_PAID': return 'bg-amber-100 text-amber-700';
      case 'OVERDUE': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }
}
