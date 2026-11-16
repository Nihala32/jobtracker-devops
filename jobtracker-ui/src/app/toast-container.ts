import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toast-wrap" role="status" aria-live="polite">
      @for (t of toastService.toasts(); track t.id) {
        <div [class]="'toast ' + t.type" (click)="toastService.dismiss(t.id)">
          <span class="t-dot"></span>{{ t.message }}
        </div>
      }
    </div>
  `
})
export class Toasts {
  toastService = inject(ToastService);
}
