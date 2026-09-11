import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Bill, Room, Tenant } from '../core/models';
import { ToastService } from '../core/toast.service';
import { InrPipe } from '../core/inr.pipe';
import { InDatePipe } from '../core/indate.pipe';

@Component({
  selector: 'app-bills',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe, InDatePipe],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Bills</h1>
        <p class="text-sm text-slate-500">Monthly rent + electricity bills</p>
      </div>
      <button class="btn-primary" (click)="openGenerate()">🧾 Generate Bill</button>
    </div>

    <div class="overflow-x-auto card p-0">
      <table class="min-w-full divide-y divide-slate-100">
        <thead class="bg-slate-50">
          <tr>
            <th class="th">Bill</th><th class="th">Month</th><th class="th">Room / Tenant</th>
            <th class="th">Rent</th><th class="th">Electricity</th><th class="th">Total</th>
            <th class="th">Paid</th><th class="th">Status</th><th class="th"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          @for (b of bills(); track b.id) {
            <tr>
              <td class="td font-medium">#{{ b.id }}</td>
              <td class="td">{{ b.billingMonth | indate: true }}</td>
              <td class="td">{{ roomLabel(b.roomId) }} · {{ tenantName(b.tenantId) }}</td>
              <td class="td">{{ b.rentAmount | inr }}</td>
              <td class="td">{{ b.electricityAmount | inr }}<span class="ml-1 text-xs text-slate-400">({{ b.unitsConsumed || 0 }}u)</span></td>
              <td class="td font-semibold">{{ b.totalAmount | inr }}</td>
              <td class="td">{{ b.amountPaid | inr }}</td>
              <td class="td"><span class="badge" [ngClass]="statusClass(b.status)">{{ b.status.replace('_', ' ') }}</span></td>
              <td class="td text-right whitespace-nowrap">
                <button class="btn-ghost" (click)="view(b)">View</button>
                <button class="btn-ghost ml-1" (click)="download(b)">PDF</button>
              </td>
            </tr>
          }
          @if (!bills().length) { <tr><td class="td text-slate-400" colspan="9">No bills yet.</td></tr> }
        </tbody>
      </table>
    </div>

    <!-- Generate modal -->
    @if (showGen()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="showGen.set(false)">
        <div class="w-full max-w-md card" (click)="$event.stopPropagation()">
          <h2 class="mb-4 text-lg font-semibold">Generate Bill</h2>
          <div class="space-y-3">
            <div>
              <label class="label">Room (occupied only)</label>
              <select class="input" [(ngModel)]="genForm.roomId">
                @for (r of occupiedRooms(); track r.id) { <option [ngValue]="r.id">{{ r.roomNumber }} · {{ tenantName(r.currentTenantId) }}</option> }
              </select>
            </div>
            <div><label class="label">Billing month</label><input class="input" type="month" [(ngModel)]="genMonth" /></div>
            <div class="grid grid-cols-2 gap-3">
              <div><label class="label">Other charges (₹)</label><input class="input" type="number" [(ngModel)]="genForm.otherCharges" /></div>
              <div><label class="label">Discount (₹)</label><input class="input" type="number" [(ngModel)]="genForm.discount" /></div>
            </div>
            <div><label class="label">Due date</label><input class="input" type="date" [(ngModel)]="genForm.dueDate" /></div>
            <label class="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" [(ngModel)]="genForm.regenerate" /> Overwrite if a bill already exists</label>
            <p class="text-xs text-slate-400">Uses the latest saved meter reading for the room's electricity charge.</p>
          </div>
          <div class="mt-5 flex justify-end gap-2">
            <button class="btn-ghost" (click)="showGen.set(false)">Cancel</button>
            <button class="btn-primary" (click)="generate()">Generate</button>
          </div>
        </div>
      </div>
    }

    <!-- View modal -->
    @if (viewing(); as b) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="viewing.set(null)">
        <div class="w-full max-w-md card" (click)="$event.stopPropagation()">
          <div class="mb-1 text-xs uppercase tracking-wide text-slate-400">Monthly Room Bill</div>
          <h2 class="text-lg font-semibold">{{ tenantName(b.tenantId) }} · Room {{ roomLabel(b.roomId) }}</h2>
          <p class="mb-4 text-sm text-slate-500">{{ b.billingMonth | indate: true }}</p>
          <div class="space-y-1 text-sm">
            <div class="flex justify-between"><span>Room Rent</span><span>{{ b.rentAmount | inr }}</span></div>
            <div class="flex justify-between"><span>Electricity ({{ b.unitsConsumed || 0 }} units × {{ b.pricePerUnit || 0 | inr }})</span><span>{{ b.electricityAmount | inr }}</span></div>
            <div class="flex justify-between"><span>Other Charges</span><span>{{ b.otherCharges | inr }}</span></div>
            <div class="flex justify-between"><span>Discount</span><span>- {{ b.discount | inr }}</span></div>
            <div class="flex justify-between border-t border-slate-200 pt-2 text-base font-bold"><span>Total</span><span>{{ b.totalAmount | inr }}</span></div>
            <div class="flex justify-between text-green-600"><span>Paid</span><span>{{ b.amountPaid | inr }}</span></div>
            <div class="flex justify-between text-red-600"><span>Balance</span><span>{{ (b.totalAmount - b.amountPaid) | inr }}</span></div>
          </div>
          <div class="mt-3 text-sm">Status: <span class="badge" [ngClass]="statusClass(b.status)">{{ b.status.replace('_', ' ') }}</span> · Due {{ b.dueDate | indate }}</div>
          <div class="mt-5 flex justify-end gap-2">
            <button class="btn-ghost" (click)="viewing.set(null)">Close</button>
            <button class="btn-primary" (click)="download(b)">Download PDF</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class BillsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  bills = signal<Bill[]>([]);
  rooms = signal<Room[]>([]);
  tenants = signal<Tenant[]>([]);

  showGen = signal(false);
  genMonth = new Date().toISOString().slice(0, 7);
  genForm: { roomId?: number; otherCharges: number; discount: number; dueDate?: string; regenerate: boolean } = {
    otherCharges: 0,
    discount: 0,
    regenerate: false,
  };
  viewing = signal<Bill | null>(null);

  ngOnInit(): void {
    this.load();
    this.api.rooms().subscribe((r) => this.rooms.set(r));
    this.api.tenants().subscribe((t) => this.tenants.set(t));
  }

  load(): void {
    this.api.bills().subscribe((b) => this.bills.set(b));
  }

  occupiedRooms(): Room[] {
    return this.rooms().filter((r) => r.status === 'OCCUPIED');
  }

  roomLabel(id: number): string {
    return this.rooms().find((r) => r.id === id)?.roomNumber ?? `#${id}`;
  }
  tenantName(id?: number): string {
    if (!id) return '-';
    return this.tenants().find((t) => t.id === id)?.name ?? `#${id}`;
  }

  openGenerate(): void {
    this.genForm = { roomId: this.occupiedRooms()[0]?.id, otherCharges: 0, discount: 0, regenerate: false };
    this.genMonth = new Date().toISOString().slice(0, 7);
    this.showGen.set(true);
  }

  generate(): void {
    if (!this.genForm.roomId) return;
    this.api.generateBill({
      roomId: this.genForm.roomId,
      billingMonth: `${this.genMonth}-01`,
      otherCharges: this.genForm.otherCharges,
      discount: this.genForm.discount,
      dueDate: this.genForm.dueDate,
      regenerate: this.genForm.regenerate,
    }).subscribe({
      next: () => {
        this.toast.success('Bill generated');
        this.showGen.set(false);
        this.load();
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed to generate'),
    });
  }

  view(b: Bill): void {
    this.viewing.set(b);
  }

  download(b: Bill): void {
    this.api.downloadReceipt(b.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bill-${b.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Failed to download PDF'),
    });
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
