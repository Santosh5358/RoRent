import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AuthService } from '../core/auth.service';
import { Bill, MeterReading, PaymentSubmission, TenantProfile } from '../core/models';
import { ToastService } from '../core/toast.service';
import { InrPipe } from '../core/inr.pipe';
import { InDatePipe } from '../core/indate.pipe';

@Component({
  selector: 'app-tenant-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, InrPipe, InDatePipe],
  template: `
    <div class="min-h-screen bg-slate-100/70">
      <!-- Header -->
      <header class="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-500 text-white shadow-lg">
        <div class="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold ring-1 ring-white/30 backdrop-blur">
              {{ initials() }}
            </div>
            <div>
              <div class="text-base font-semibold leading-tight">My Rent Portal</div>
              <div class="text-xs text-white/70">
                <span class="mr-1">🏠</span>{{ profile()?.propertyName || 'Home' }} · Room {{ profile()?.roomNumber || '—' }}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="hidden text-right sm:block">
              <div class="text-sm font-medium leading-tight">{{ auth.user()?.name }}</div>
              <div class="text-xs text-white/70">Tenant</div>
            </div>
            <button
              class="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium ring-1 ring-white/30 transition hover:bg-white/25"
              (click)="auth.logout()" routerLink="/login"
            >Sign out</button>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-5xl space-y-6 px-4 py-6">
        <!-- Greeting -->
        <div>
          <h1 class="text-xl font-bold text-slate-800">{{ greeting() }}, {{ firstName() }} 👋</h1>
          <p class="text-sm text-slate-500">Here's an overview of your rent and electricity.</p>
        </div>

        <!-- Amount due banner -->
        @if ((profile()?.totalOutstanding ?? 0) > 0) {
          <div class="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-500 p-5 text-white shadow-md sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div class="text-sm font-medium text-white/80">Amount due</div>
              <div class="text-3xl font-bold">{{ (profile()?.totalOutstanding ?? 0) | inr }}</div>
              <div class="mt-0.5 text-xs text-white/80">Across {{ profile()?.unpaidBills ?? 0 }} unpaid bill(s)</div>
            </div>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-red-600 shadow transition hover:bg-red-50"
              (click)="openSubmit()"
            >⬆️ Upload Payment Slip</button>
          </div>
        } @else {
          <div class="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 p-5 text-white shadow-md">
            <div class="text-3xl">✅</div>
            <div>
              <div class="text-lg font-semibold">You're all settled up!</div>
              <div class="text-sm text-white/80">No outstanding balance right now.</div>
            </div>
          </div>
        }

        <!-- Summary cards -->
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div class="card flex items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-xl">🏦</div>
            <div class="min-w-0">
              <div class="truncate text-xs font-medium uppercase tracking-wide text-slate-400">Monthly Rent</div>
              <div class="text-lg font-bold text-slate-800">{{ (profile()?.monthlyRent ?? 0) | inr }}</div>
            </div>
          </div>
          <div class="card flex items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">⚡</div>
            <div class="min-w-0">
              <div class="truncate text-xs font-medium uppercase tracking-wide text-slate-400">Elec. Rate</div>
              <div class="text-lg font-bold text-slate-800">{{ (profile()?.currentElectricityRate ?? 0) | inr }}<span class="text-xs font-normal text-slate-400">/unit</span></div>
            </div>
          </div>
          <div class="card flex items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" [ngClass]="(profile()?.totalOutstanding ?? 0) > 0 ? 'bg-rose-50' : 'bg-emerald-50'">💰</div>
            <div class="min-w-0">
              <div class="truncate text-xs font-medium uppercase tracking-wide text-slate-400">Outstanding</div>
              <div class="text-lg font-bold" [class.text-red-600]="(profile()?.totalOutstanding ?? 0) > 0" [class.text-emerald-600]="(profile()?.totalOutstanding ?? 0) === 0">{{ (profile()?.totalOutstanding ?? 0) | inr }}</div>
            </div>
          </div>
          <div class="card flex items-center gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-xl">🧾</div>
            <div class="min-w-0">
              <div class="truncate text-xs font-medium uppercase tracking-wide text-slate-400">Unpaid Bills</div>
              <div class="text-lg font-bold text-slate-800">{{ profile()?.unpaidBills ?? 0 }}</div>
            </div>
          </div>
        </div>

        <!-- Bills -->
        <section class="card p-0 overflow-hidden">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 class="font-semibold text-slate-800">My Bills</h2>
              <p class="text-xs text-slate-400">Rent &amp; electricity charges each month</p>
            </div>
            <button class="btn-primary" (click)="openSubmit()">⬆️ Upload Slip</button>
          </div>

          <!-- Desktop table -->
          <div class="hidden overflow-x-auto md:block">
            <table class="min-w-full divide-y divide-slate-100">
              <thead class="bg-slate-50">
                <tr><th class="th">Month</th><th class="th">Rent</th><th class="th">Electricity</th><th class="th">Total</th><th class="th">Paid</th><th class="th">Balance</th><th class="th">Status</th><th class="th text-right">Actions</th></tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (b of bills(); track b.id) {
                  <tr class="transition hover:bg-slate-50/70">
                    <td class="td font-medium text-slate-800">{{ b.billingMonth | indate: true }}</td>
                    <td class="td">{{ b.rentAmount | inr }}</td>
                    <td class="td">{{ b.electricityAmount | inr }}<span class="text-xs text-slate-400"> · {{ b.unitsConsumed || 0 }}u</span></td>
                    <td class="td font-semibold">{{ b.totalAmount | inr }}</td>
                    <td class="td text-emerald-600">{{ b.amountPaid | inr }}</td>
                    <td class="td font-semibold" [class.text-red-600]="(b.totalAmount - b.amountPaid) > 0">{{ (b.totalAmount - b.amountPaid) | inr }}</td>
                    <td class="td"><span class="badge" [ngClass]="statusClass(b.status)">{{ statusLabel(b.status) }}</span></td>
                    <td class="td">
                      <div class="flex justify-end gap-2">
                        <button class="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 transition hover:bg-slate-100" (click)="download(b)">📄 Receipt</button>
                        @if (b.status !== 'PAID') {
                          <button class="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-700" (click)="openSubmit(b)">Pay</button>
                        }
                      </div>
                    </td>
                  </tr>
                }
                @if (!bills().length) { <tr><td class="td text-center text-slate-400" colspan="8">No bills yet.</td></tr> }
              </tbody>
            </table>
          </div>

          <!-- Mobile cards -->
          <div class="divide-y divide-slate-100 md:hidden">
            @for (b of bills(); track b.id) {
              <div class="p-4">
                <div class="flex items-start justify-between">
                  <div class="font-semibold text-slate-800">{{ b.billingMonth | indate: true }}</div>
                  <span class="badge" [ngClass]="statusClass(b.status)">{{ statusLabel(b.status) }}</span>
                </div>
                <div class="mt-2 grid grid-cols-2 gap-y-1 text-sm">
                  <span class="text-slate-500">Total</span><span class="text-right font-medium">{{ b.totalAmount | inr }}</span>
                  <span class="text-slate-500">Paid</span><span class="text-right text-emerald-600">{{ b.amountPaid | inr }}</span>
                  <span class="text-slate-500">Balance</span><span class="text-right font-semibold" [class.text-red-600]="(b.totalAmount - b.amountPaid) > 0">{{ (b.totalAmount - b.amountPaid) | inr }}</span>
                </div>
                <div class="mt-3 flex gap-2">
                  <button class="flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200" (click)="download(b)">📄 Receipt</button>
                  @if (b.status !== 'PAID') {
                    <button class="flex-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white" (click)="openSubmit(b)">Pay</button>
                  }
                </div>
              </div>
            }
            @if (!bills().length) { <div class="p-4 text-center text-sm text-slate-400">No bills yet.</div> }
          </div>
        </section>

        <div class="grid gap-6 lg:grid-cols-2">
          <!-- My submissions -->
          <section class="card">
            <div class="mb-3 flex items-center gap-2">
              <span class="text-lg">📤</span>
              <h2 class="font-semibold text-slate-800">My Payment Submissions</h2>
            </div>
            <div class="space-y-2">
              @for (s of submissions(); track s.id) {
                <div class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:bg-slate-50">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg text-base" [ngClass]="subIconBg(s.status)">{{ subIcon(s.status) }}</div>
                    <div>
                      <div class="text-sm font-semibold text-slate-700">{{ s.amount | inr }} <span class="font-normal text-slate-400">· Bill #{{ s.billId }}</span></div>
                      <div class="text-xs text-slate-400">{{ s.submittedAt | indate }} · {{ s.paymentMethod }}</div>
                    </div>
                  </div>
                  <span class="badge" [ngClass]="subClass(s.status)">{{ s.status }}</span>
                </div>
              }
              @if (!submissions().length) {
                <div class="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                  <div class="text-2xl">🧾</div>
                  <div class="mt-1 text-sm text-slate-500">No submissions yet.</div>
                  <div class="text-xs text-slate-400">Upload a slip after you pay.</div>
                </div>
              }
            </div>
          </section>

          <!-- Recent readings -->
          <section class="card">
            <div class="mb-3 flex items-center gap-2">
              <span class="text-lg">⚡</span>
              <h2 class="font-semibold text-slate-800">Recent Meter Readings</h2>
            </div>
            <div class="space-y-2">
              @for (r of readings(); track r.id) {
                <div class="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:bg-slate-50">
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-base">📊</div>
                    <div>
                      <div class="text-sm font-semibold text-slate-700">{{ r.unitsConsumed }} units</div>
                      <div class="text-xs text-slate-400">{{ r.readingDate | indate }} · {{ r.previousReading }} → {{ r.currentReading }}</div>
                    </div>
                  </div>
                  <div class="text-sm font-semibold text-slate-700">{{ r.electricityAmount | inr }}</div>
                </div>
              }
              @if (!readings().length) {
                <div class="rounded-xl border border-dashed border-slate-200 p-6 text-center">
                  <div class="text-2xl">📉</div>
                  <div class="mt-1 text-sm text-slate-500">No readings recorded.</div>
                </div>
              }
            </div>
          </section>
        </div>

        <footer class="pb-6 pt-2 text-center text-xs text-slate-400">
          Need help? Contact your property owner.
        </footer>
      </main>
    </div>

    <!-- Submit slip modal -->
    @if (showForm()) {
      <div class="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" (click)="showForm.set(false)">
        <div class="w-full max-w-md rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div class="flex items-center gap-2">
              <span class="text-lg">⬆️</span>
              <h2 class="text-lg font-semibold text-slate-800">Upload Payment Slip</h2>
            </div>
            <button class="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" (click)="showForm.set(false)">✕</button>
          </div>

          <div class="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
            <div>
              <label class="label">Which bill?</label>
              <select class="input" [(ngModel)]="form.billId" (ngModelChange)="onBillChange()">
                @for (b of bills(); track b.id) {
                  <option [ngValue]="b.id">{{ b.billingMonth | indate: true }} · bal {{ (b.totalAmount - b.amountPaid) | inr }}</option>
                }
              </select>
            </div>

            <div>
              <label class="label">Paid for</label>
              <div class="grid grid-cols-2 gap-2">
                @for (c of categories; track c.value) {
                  <button type="button"
                    class="rounded-xl border px-3 py-2 text-sm font-medium transition"
                    [ngClass]="form.category === c.value ? 'border-brand-500 bg-brand-50 text-brand-700 ring-1 ring-brand-200' : 'border-slate-200 text-slate-600 hover:bg-slate-50'"
                    (click)="form.category = c.value"
                  >{{ c.label }}</button>
                }
              </div>
            </div>

            <div>
              <label class="label">Amount paid</label>
              <div class="relative">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                <input class="input pl-7" type="number" [(ngModel)]="form.amount" />
              </div>
            </div>

            <div>
              <label class="label">Payment method</label>
              <select class="input" [(ngModel)]="form.paymentMethod">
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div><label class="label">Transaction / reference no.</label><input class="input" placeholder="e.g. UPI-REF-1234" [(ngModel)]="form.transactionReference" /></div>
            <div><label class="label">Note <span class="font-normal text-slate-400">(optional)</span></label><input class="input" placeholder="Anything the owner should know?" [(ngModel)]="form.note" /></div>

            <div>
              <label class="label">Payment slip image</label>
              <label class="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center transition hover:border-brand-300 hover:bg-brand-50/40">
                <span class="text-2xl">🖼️</span>
                @if (fileName()) {
                  <span class="text-sm font-medium text-brand-700">{{ fileName() }}</span>
                  <span class="text-xs text-slate-400">Tap to change</span>
                } @else {
                  <span class="text-sm font-medium text-slate-600">Tap to choose a screenshot</span>
                  <span class="text-xs text-slate-400">PNG, JPG or WEBP</span>
                }
                <input class="hidden" type="file" accept="image/png,image/jpeg,image/webp" (change)="onFile($event)" />
              </label>
            </div>
          </div>

          <div class="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
            <button class="btn-ghost" (click)="showForm.set(false)">Cancel</button>
            <button class="btn-primary" [disabled]="busy()" (click)="submit()">{{ busy() ? 'Uploading…' : 'Submit for approval' }}</button>
          </div>
        </div>
      </div>
    }
  `,
})
export class TenantPortalComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);
  private toast = inject(ToastService);

  profile = signal<TenantProfile | null>(null);
  bills = signal<Bill[]>([]);
  submissions = signal<PaymentSubmission[]>([]);
  readings = signal<MeterReading[]>([]);

  showForm = signal(false);
  busy = signal(false);
  fileName = signal<string>('');
  private file: File | null = null;

  form: {
    billId?: number;
    category: string;
    amount: number;
    paymentMethod: string;
    transactionReference?: string;
    note?: string;
  } = { category: 'BOTH', amount: 0, paymentMethod: 'UPI' };

  categories = [
    { value: 'BOTH', label: 'Rent + Elec.' },
    { value: 'RENT', label: 'Rent only' },
    { value: 'ELECTRICITY', label: 'Electricity' },
    { value: 'OTHER', label: 'Other' },
  ];

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.api.portalProfile().subscribe((p) => this.profile.set(p));
    this.api.portalBills().subscribe((b) => this.bills.set(b));
    this.api.portalSubmissions().subscribe((s) => this.submissions.set(s));
    this.api.portalReadings().subscribe((r) => this.readings.set(r));
  }

  openSubmit(bill?: Bill): void {
    const target = bill ?? this.bills().find((b) => b.status !== 'PAID') ?? this.bills()[0];
    this.form = {
      billId: target?.id,
      category: 'BOTH',
      amount: target ? Math.max(0, target.totalAmount - target.amountPaid) : 0,
      paymentMethod: 'UPI',
    };
    this.file = null;
    this.fileName.set('');
    this.showForm.set(true);
  }

  onBillChange(): void {
    const b = this.bills().find((x) => x.id === this.form.billId);
    if (b) this.form.amount = Math.max(0, b.totalAmount - b.amountPaid);
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.file = f;
    this.fileName.set(f?.name ?? '');
  }

  submit(): void {
    if (!this.form.billId) {
      this.toast.error('Please select a bill');
      return;
    }
    if (!this.file) {
      this.toast.error('Please attach a payment slip image');
      return;
    }
    if (!this.form.amount || this.form.amount <= 0) {
      this.toast.error('Enter a valid amount');
      return;
    }
    this.busy.set(true);
    this.api
      .portalSubmitSlip({
        billId: this.form.billId,
        amount: this.form.amount,
        category: this.form.category,
        paymentMethod: this.form.paymentMethod,
        transactionReference: this.form.transactionReference,
        note: this.form.note,
        slip: this.file,
      })
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.showForm.set(false);
          this.toast.success('Payment slip submitted for owner approval');
          this.loadAll();
        },
        error: (err) => {
          this.busy.set(false);
          this.toast.error(err?.error?.message ?? 'Upload failed');
        },
      });
  }

  download(b: Bill): void {
    this.api.portalDownloadReceipt(b.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bill-${b.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.toast.error('Could not download receipt'),
    });
  }

  statusClass(status: string): string {
    if (status === 'PAID') return 'bg-green-100 text-green-700';
    if (status === 'PARTIALLY_PAID') return 'bg-amber-100 text-amber-700';
    if (status === 'OVERDUE') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-600';
  }

  statusLabel(status: string): string {
    if (status === 'PARTIALLY_PAID') return 'Partial';
    if (status === 'PAID') return 'Paid';
    if (status === 'OVERDUE') return 'Overdue';
    if (status === 'UNPAID') return 'Unpaid';
    return status;
  }

  subClass(status: string): string {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700';
    if (status === 'REJECTED') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  }

  subIcon(status: string): string {
    if (status === 'APPROVED') return '✅';
    if (status === 'REJECTED') return '❌';
    return '⏳';
  }

  subIconBg(status: string): string {
    if (status === 'APPROVED') return 'bg-green-50';
    if (status === 'REJECTED') return 'bg-red-50';
    return 'bg-amber-50';
  }

  initials(): string {
    const name = this.auth.user()?.name ?? '';
    return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'R';
  }

  firstName(): string {
    return (this.auth.user()?.name ?? 'there').split(' ')[0];
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }
}
