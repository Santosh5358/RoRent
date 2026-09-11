import { Pipe, PipeTransform } from '@angular/core';

/** Formats a number as Indian Rupees, e.g. 9240 -> ₹9,240. */
@Pipe({ name: 'inr', standalone: true })
export class InrPipe implements PipeTransform {
  transform(value: number | string | null | undefined, showSymbol = true): string {
    if (value === null || value === undefined || value === '') return showSymbol ? '₹0' : '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return showSymbol ? '₹0' : '0';
    const formatted = new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
    }).format(num);
    return showSymbol ? `₹${formatted}` : formatted;
  }
}
