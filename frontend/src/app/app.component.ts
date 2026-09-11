import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './core/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>

    <!-- Toast notifications -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      @for (t of toast.toasts(); track t.id) {
        <div
          class="flex items-center gap-3 rounded-lg px-4 py-3 text-sm shadow-lg ring-1"
          [class.bg-green-50]="t.type === 'success'"
          [class.text-green-800]="t.type === 'success'"
          [class.ring-green-200]="t.type === 'success'"
          [class.bg-red-50]="t.type === 'error'"
          [class.text-red-800]="t.type === 'error'"
          [class.ring-red-200]="t.type === 'error'"
          [class.bg-white]="t.type === 'info'"
          [class.text-slate-700]="t.type === 'info'"
          [class.ring-slate-200]="t.type === 'info'"
        >
          <span>{{ t.message }}</span>
          <button class="ml-2 text-slate-400 hover:text-slate-600" (click)="toast.dismiss(t.id)">✕</button>
        </div>
      }
    </div>
  `,
})
export class AppComponent {
  toast = inject(ToastService);
}
