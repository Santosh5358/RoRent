import { Pipe, PipeTransform } from '@angular/core';

/** Formats an ISO date string using Indian formatting, e.g. 2026-03-01 -> 01 Mar 2026. */
@Pipe({ name: 'indate', standalone: true })
export class InDatePipe implements PipeTransform {
  transform(value: string | null | undefined, monthOnly = false): string {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    if (monthOnly) {
      return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
