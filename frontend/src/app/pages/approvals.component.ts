import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { PaymentSubmission, Tenant } from '../core/models';
import { ToastService } from '../core/toast.service';
import { InrPipe } from '../core/inr.pipe';
import { InDatePipe } from '../core/indate.pipe';

@Component({
  selector: 'app-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe, InDatePipe],
  template: `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">Payment Approvals</h1>
        <p class="text-sm text-slate-500">Review payment slips submitted by tenants</p>
      </div>
      <div class="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
        @for (f of filters; track f.value) {
          <button
            class="rounded-md px-3 py-1.5 font-medium"
            [class.bg-white]="status() === f.value"
            [class.shadow]="status() === f.value"
            (click)="setStatus(f.value)"
          >{{ f.label }}</button>
        }
      </div>
    </div>

    @if (!items().length) {
      <div class="card text-center text-slate-400">No submissions in this view.</div>
    }

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      @for (s of items(); track s.id) {
        <div class="card">
          <div class="flex items-start justify-between">
            <div>
              <div class="font-semibold text-slate-800">{{ tenantName(s.tenantId) }}</div>
              <div class="text-xs text-slate-500">Bill #{{ s.billId }} · {{ s.submittedAt | indate }}</div>
            </div>
            <span class="badge" [ngClass]="badgeClass(s.status)">{{ s.status }}</span>
          </div>

          <a [href]="fileUrl(s.slipImageUrl)" target="_blank" rel="noopener">
            <img [src]="fileUrl(s.slipImageUrl)" alt="Payment slip"
              class="mt-3 h-40 w-full rounded-lg border border-slate-200 object-contain bg-slate-50" />
          </a>

          <div class="mt-3 space-y-1 text-sm">
            <div class="flex justify-between"><span class="text-slate-500">Amount</span><span class="font-semibold text-green-600">{{ s.amount | inr }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">For</span><span>{{ label(s.category) }}</span></div>
            <div class="flex justify-between"><span class="text-slate-500">Method</span><span>{{ s.paymentMethod }}</span></div>
            @if (s.transactionReference) {
              <div class="flex justify-between"><span class="text-slate-500">Reference</span><span>{{ s.transactionReference }}</span></div>
            }
            @if (s.note) { <div class="rounded-md bg-slate-50 p-2 text-slate-600">"{{ s.note }}"</div> }
            @if (s.reviewNote) { <div class="text-xs text-slate-400">Owner note: {{ s.reviewNote }}</div> }
          </div>

          @if (s.status === 'PENDING') {
            <div class="mt-4 flex gap-2">
              <button class="btn-primary flex-1" [disabled]="busy()" (click)="approve(s)">Approve</button>
              <button class="btn-danger flex-1" [disabled]="busy()" (click)="reject(s)">Reject</button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ApprovalsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<PaymentSubmission[]>([]);
  tenants = signal<Tenant[]>([]);
  status = signal<string>('PENDING');
  busy = signal(false);

  filters = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'All', value: '' },
  ];

  ngOnInit(): void {
    this.api.tenants().subscribe((t) => this.tenants.set(t));
    this.load();
  }

  setStatus(value: string): void {
    this.status.set(value);
    this.load();
  }

  load(): void {
    this.api.submissions(this.status() || undefined).subscribe((s) => this.items.set(s));
  }

  tenantName(id: number): string {
    return this.tenants().find((t) => t.id === id)?.name ?? 'Tenant #' + id;
  }

  fileUrl(url: string): string {
    return url;
  }

  label(category: string): string {
    switch (category) {
      case 'RENT': return 'Rent';
      case 'ELECTRICITY': return 'Electricity';
      case 'BOTH': return 'Rent + Electricity';
      default: return 'Other';
    }
  }

  badgeClass(status: string): string {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700';
    if (status === 'REJECTED') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  }

  approve(s: PaymentSubmission): void {
    this.busy.set(true);
    this.api.approveSubmission(s.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success(`Payment of ${this.inr(s.amount)} approved`);
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(err?.error?.message ?? 'Could not approve');
      },
    });
  }

  reject(s: PaymentSubmission): void {
    const reason = window.prompt('Reason for rejecting this payment slip?') ?? undefined;
    this.busy.set(true);
    this.api.rejectSubmission(s.id, reason).subscribe({
      next: () => {
        this.busy.set(false);
        this.toast.success('Submission rejected');
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.toast.error(err?.error?.message ?? 'Could not reject');
      },
    });
  }

  private inr(v: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  }
}
