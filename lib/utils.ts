import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'USD',
  },
  locale = 'en-US'
) {
  return new Intl.NumberFormat(locale, {
    ...options,
  }).format(amount);
}

export function formatAbbreviatedNumber(
  num: number,
  decimals: number = 1
): string {
  if (num === 0) return '0';

  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  const units = [
    { value: 1e12, suffix: 'T' }, // Trillion
    { value: 1e9, suffix: 'B' }, // Billion
    { value: 1e6, suffix: 'M' }, // Million
    { value: 1e3, suffix: 'K' }, // Thousand
  ];

  for (const unit of units) {
    if (absNum >= unit.value) {
      const formatted = (absNum / unit.value).toFixed(decimals);
      const cleaned = parseFloat(formatted).toString();
      return `${sign}${cleaned}${unit.suffix}`;
    }
  }

  return num.toFixed(decimals).replace(/\.?0+$/, '');
}
