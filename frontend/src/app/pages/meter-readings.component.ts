import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../core/api.service';
import { MeterReading, OcrScanResponse, Room } from '../core/models';
import { ToastService } from '../core/toast.service';
import { InrPipe } from '../core/inr.pipe';
import { InDatePipe } from '../core/indate.pipe';

@Component({
  selector: 'app-meter-readings',
  standalone: true,
  imports: [CommonModule, FormsModule, InrPipe, InDatePipe],
  template: `
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Meter Readings</h1>
      <p class="text-sm text-slate-500">Upload a meter photo, detect the reading, and calculate electricity.</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Workflow -->
      <div class="card">
        <div class="mb-4 font-semibold text-slate-700">New reading</div>

        <!-- Step 1: select room -->
        <label class="label">1. Select room</label>
        <select class="input" [(ngModel)]="roomId" (ngModelChange)="onRoomChange()">
          <option [ngValue]="0">— choose —</option>
          @for (r of rooms(); track r.id) {
            <option [ngValue]="r.id">{{ r.roomNumber }} ({{ r.status }})</option>
          }
        </select>

        @if (roomId) {
          <!-- Step 2: previous reading -->
          <div class="mt-4 rounded-lg bg-slate-50 p-3 text-sm">
            <span class="text-slate-500">Previous Reading:</span>
            <span class="ml-2 text-lg font-bold">{{ previous() }}</span>
            <span class="ml-4 text-slate-500">Rate:</span>
            <span class="ml-1 font-semibold">{{ rate() | inr }}/unit</span>
          </div>

          <!-- Step 3: upload image -->
          <label class="label mt-4">3. Upload meter image (JPG / PNG / WEBP)</label>
          <input class="input" type="file" accept="image/jpeg,image/png,image/webp" (change)="onFile($event)" />

          @if (imagePreview()) {
            <img [src]="imagePreview()!" class="mt-3 max-h-48 rounded-lg border border-slate-200 object-contain" alt="meter" />
          }

          @if (file() && !scan()) {
            <button class="btn-primary mt-3 w-full" [disabled]="scanning()" (click)="runScan()">
              {{ scanning() ? 'Detecting…' : '🔍 Detect reading (OCR)' }}
            </button>
          }

          <!-- Step 4-5: OCR result + confirm/edit -->
          @if (scan(); as s) {
            <div class="mt-4 rounded-lg border border-brand-100 bg-brand-50 p-3 text-sm">
              <div class="font-semibold text-brand-700">AI Detected Reading: {{ s.detectedReading || 'n/a' }}</div>
              <div class="text-xs text-slate-500">Provider: {{ s.provider }} · confidence {{ (s.confidence * 100) | number: '1.0-0' }}%</div>
              <div class="mt-1 text-xs text-slate-400">{{ s.rawText }}</div>
            </div>
          }

          <label class="label mt-4">5. Confirm / edit current reading</label>
          <input class="input" type="number" [(ngModel)]="currentReading" (ngModelChange)="recompute()" />

          <label class="mt-3 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" [(ngModel)]="meterReset" (ngModelChange)="recompute()" />
            Meter was reset / replaced
          </label>

          <!-- Lower reading warning -->
          @if (lowerWarning()) {
            <div class="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
              ⚠️ Current meter reading is lower than the previous reading. Please verify the reading.
              <label class="mt-2 flex items-center gap-2">
                <input type="checkbox" [(ngModel)]="confirmLower" />
                I confirm this reading is correct
              </label>
            </div>
          }

          <!-- Step 6-7: calculation summary -->
          <div class="mt-4 rounded-lg bg-slate-800 p-4 text-white">
            <div class="grid grid-cols-2 gap-y-1 text-sm">
              <div class="text-slate-300">Units consumed</div><div class="text-right font-bold">{{ units() }}</div>
              <div class="text-slate-300">Rate</div><div class="text-right">{{ rate() | inr }}/unit</div>
              <div class="text-slate-300">Electricity charge</div><div class="text-right text-lg font-bold text-green-300">{{ electricity() | inr }}</div>
            </div>
          </div>

          <div class="mt-3">
            <label class="label">Reading date</label>
            <input class="input" type="date" [(ngModel)]="readingDate" />
          </div>

          <!-- Step 8: save -->
          <button class="btn-primary mt-4 w-full" [disabled]="!canSave() || saving()" (click)="save()">
            {{ saving() ? 'Saving…' : '💾 Save reading' }}
          </button>
        }
      </div>

      <!-- History -->
      <div class="card">
        <div class="mb-3 flex items-center justify-between">
          <span class="font-semibold text-slate-700">Reading history</span>
          @if (roomId) { <span class="text-xs text-slate-400">Room {{ roomLabel(roomId) }}</span> }
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-slate-100">
            <thead><tr><th class="th">Date</th><th class="th">Prev</th><th class="th">Curr</th><th class="th">Units</th><th class="th">Rate</th><th class="th">Amount</th></tr></thead>
            <tbody class="divide-y divide-slate-100">
              @for (r of history(); track r.id) {
                <tr>
                  <td class="td">{{ r.readingDate | indate }}</td>
                  <td class="td">{{ r.previousReading }}</td>
                  <td class="td">{{ r.currentReading }}</td>
                  <td class="td">{{ r.unitsConsumed }}</td>
                  <td class="td">{{ r.pricePerUnit | inr }}</td>
                  <td class="td font-semibold">{{ r.electricityAmount | inr }}</td>
                </tr>
              }
              @if (!history().length) { <tr><td class="td text-slate-400" colspan="6">No readings yet.</td></tr> }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class MeterReadingsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  rooms = signal<Room[]>([]);
  history = signal<MeterReading[]>([]);

  roomId = 0;
  previous = signal(0);
  rate = signal(0);
  currentReading: number | null = null;
  meterReset = false;
  confirmLower = false;
  readingDate = new Date().toISOString().slice(0, 10);

  file = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  scan = signal<OcrScanResponse | null>(null);
  scanning = signal(false);
  saving = signal(false);

  units = signal(0);
  electricity = signal(0);
  lowerWarning = signal(false);

  ngOnInit(): void {
    this.api.rooms().subscribe((r) => this.rooms.set(r.filter((x) => x.status === 'OCCUPIED')));
    this.api.readings().subscribe((h) => this.history.set(h));
  }

  roomLabel(id: number): string {
    return this.rooms().find((r) => r.id === id)?.roomNumber ?? `#${id}`;
  }

  onRoomChange(): void {
    this.resetWorkflow();
    if (!this.roomId) return;
    this.api.previousReading(this.roomId).subscribe((p) => {
      this.previous.set(p.previousReading);
      this.recompute();
    });
    const room = this.rooms().find((r) => r.id === this.roomId);
    this.rate.set(room?.electricityRate ?? 0);
    this.api.readings(this.roomId).subscribe((h) => this.history.set(h));
  }

  resetWorkflow(): void {
    this.currentReading = null;
    this.meterReset = false;
    this.confirmLower = false;
    this.file.set(null);
    this.imagePreview.set(null);
    this.scan.set(null);
    this.units.set(0);
    this.electricity.set(0);
    this.lowerWarning.set(false);
  }

  onFile(e: Event): void {
    const input = e.target as HTMLInputElement;
    const f = input.files?.[0] ?? null;
    this.file.set(f);
    this.scan.set(null);
    if (f) {
      const reader = new FileReader();
      reader.onload = () => this.imagePreview.set(reader.result as string);
      reader.readAsDataURL(f);
    } else {
      this.imagePreview.set(null);
    }
  }

  runScan(): void {
    const f = this.file();
    if (!f || !this.roomId) return;
    this.scanning.set(true);
    this.api.scanMeter(this.roomId, f).subscribe({
      next: (s) => {
        this.scanning.set(false);
        this.scan.set(s);
        this.previous.set(s.previousReading);
        if (s.appliedRate) this.rate.set(s.appliedRate);
        if (s.detectedReading) this.currentReading = parseFloat(s.detectedReading);
        this.recompute();
      },
      error: (e) => {
        this.scanning.set(false);
        this.toast.error(e?.error?.message ?? 'OCR failed');
      },
    });
  }

  recompute(): void {
    const curr = this.currentReading ?? 0;
    const prev = this.previous();
    let units: number;
    if (this.meterReset) {
      units = curr;
      this.lowerWarning.set(false);
    } else {
      this.lowerWarning.set(curr < prev && this.currentReading !== null);
      units = Math.max(0, curr - prev);
    }
    this.units.set(units);
    this.electricity.set(units * this.rate());
  }

  canSave(): boolean {
    if (this.currentReading === null) return false;
    if (this.lowerWarning() && !this.confirmLower) return false;
    return true;
  }

  save(): void {
    if (!this.roomId || this.currentReading === null) return;
    this.saving.set(true);
    this.api.saveReading({
      roomId: this.roomId,
      readingDate: this.readingDate,
      currentReading: this.currentReading,
      meterReset: this.meterReset,
      pricePerUnit: this.rate() || undefined,
      imageUrl: this.scan()?.imageUrl,
      readingSource: this.scan() ? 'OCR' : 'MANUAL',
      ocrDetectedReading: this.scan()?.detectedReading,
      confirmLowerReading: this.confirmLower,
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Reading saved');
        this.resetWorkflow();
        this.onRoomChange();
        this.api.readings().subscribe((h) => this.history.set(h));
      },
      error: (e) => {
        this.saving.set(false);
        this.toast.error(e?.error?.message ?? 'Failed to save');
      },
    });
  }
}
