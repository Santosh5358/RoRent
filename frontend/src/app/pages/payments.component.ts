import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { Bill, Payment, Tenant } from '../core/models';
import { ToastService } from '../core/toast.service';
import { InrPipe } from '../core/inr.pipe';
import { InDatePipe } from '../core/indate.pipe';

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe, InDatePipe],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Payments</h1>
        <p class="text-sm text-slate-500">Record and track rent & electricity payments</p>
      </div>
      <button class="btn-primary" (click)="openRecord()">💰 Record Payment</button>
    </div>

    <div class="overflow-x-auto card p-0">
      <table class="min-w-full divide-y divide-slate-100">
        <thead class="bg-slate-50">
          <tr><th class="th">Date</th><th class="th">Tenant</th><th class="th">Bill</th><th class="th">Amount</th><th class="th">Method</th><th class="th">Reference</th></tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          @for (p of payments(); track p.id) {
            <tr>
              <td class="td">{{ p.paymentDate | indate }}</td>
              <td class="td">{{ tenantName(p.tenantId) }}</td>
              <td class="td">#{{ p.billId }}</td>
              <td class="td font-semibold text-green-600">{{ p.amount | inr }}</td>
              <td class="td">{{ p.paymentMethod }}</td>
              <td class="td">{{ p.transactionReference || '-' }}</td>
            </tr>
          }
          @if (!payments().length) { <tr><td class="td text-slate-400" colspan="6">No payments yet.</td></tr> }
        </tbody>
      </table>
    </div>

    @if (showForm()) {
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4" (click)="showForm.set(false)">
        <div class="w-full max-w-md card" (click)="$event.stopPropagation()">
          <h2 class="mb-4 text-lg font-semibold">Record Payment</h2>
          <div class="space-y-3">
            <div>
              <label class="label">Bill</label>
              <select class="input" [(ngModel)]="form.billId" (ngModelChange)="onBillChange()">
                @for (b of unpaidBills(); track b.id) {
                  <option [ngValue]="b.id">#{{ b.id }} · {{ tenantName(b.tenantId) }} · bal {{ (b.totalAmount - b.amountPaid) | inr }}</option>
                }
              </select>
            </div>
            @if (selectedBill(); as b) {
              <div class="rounded-lg bg-slate-50 p-3 text-sm">
                <div class="flex justify-between"><span class="text-slate-500">Total</span><span>{{ b.totalAmount | inr }}</span></div>
                <div class="flex justify-between"><span class="text-slate-500">Already paid</span><span>{{ b.amountPaid | inr }}</span></div>
                <div class="flex justify-between font-semibold"><span>Balance</span><span>{{ (b.totalAmount - b.amountPaid) | inr }}</span></div>
              </div>
            }
            <div><label class="label">Amount (₹)</label><input class="input" type="number" [(ngModel)]="form.amount" /></div>
            <div><label class="label">Payment date</label><input class="input" type="date" [(ngModel)]="form.paymentDate" /></div>
            <div>
              <label class="label">Method</label>
              <select class="input" [(ngModel)]="form.paymentMethod">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div><label class="label">Transaction / reference no.</label><input class="input" [(ngModel)]="form.transactionReference" /></div>
            <div><label class="label">Notes</label><input class="input" [(ngModel)]="form.notes" /></div>
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
export class PaymentsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  payments = signal<Payment[]>([]);
  bills = signal<Bill[]>([]);
  tenants = signal<Tenant[]>([]);

  showForm = signal(false);
  form: {
    billId?: number;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionReference?: string;
    notes?: string;
  } = { amount: 0, paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'CASH' };

  ngOnInit(): void {
    this.load();
    this.api.bills().subscribe((b) => this.bills.set(b));
    this.api.tenants().subscribe((t) => this.tenants.set(t));
  }

  load(): void {
    this.api.payments().subscribe((p) => this.payments.set(p));
  }

  unpaidBills(): Bill[] {
    return this.bills().filter((b) => b.status !== 'PAID');
  }

  selectedBill(): Bill | undefined {
    return this.bills().find((b) => b.id === this.form.billId);
  }

  tenantName(id?: number): string {
    if (!id) return '-';
    return this.tenants().find((t) => t.id === id)?.name ?? `#${id}`;
  }

  openRecord(): void {
    const first = this.unpaidBills()[0];
    this.form = {
      billId: first?.id,
      amount: first ? first.totalAmount - first.amountPaid : 0,
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMethod: 'CASH',
    };
    this.showForm.set(true);
  }

  onBillChange(): void {
    const b = this.selectedBill();
    if (b) this.form.amount = b.totalAmount - b.amountPaid;
  }

  save(): void {
    if (!this.form.billId || !this.form.amount) {
      this.toast.error('Select a bill and enter an amount');
      return;
    }
    this.api.recordPayment({
      billId: this.form.billId,
      amount: this.form.amount,
      paymentDate: this.form.paymentDate,
      paymentMethod: this.form.paymentMethod,
      transactionReference: this.form.transactionReference,
      notes: this.form.notes,
    }).subscribe({
      next: () => {
        this.toast.success('Payment recorded');
        this.showForm.set(false);
        this.load();
        this.api.bills().subscribe((b) => this.bills.set(b));
      },
      error: (e) => this.toast.error(e?.error?.message ?? 'Failed to record payment'),
    });
  }
}
