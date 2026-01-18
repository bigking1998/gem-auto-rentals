import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  format,
  formatDistance,
  formatRelative,
  differenceInDays,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  isWithinInterval,
  parseISO,
} from 'date-fns';

// Class Name Utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency Formatting
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Number Formatting
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return num.toString();
}

export function formatCompactNumber(num: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(num);
}

// Date Formatting
export function formatDate(
  date: Date | string,
  formatString: string = 'MMM d, yyyy'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatString);
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'MMM d, yyyy h:mm a');
}

export function formatTime(date: Date | string): string {
  return formatDate(date, 'h:mm a');
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatRelative(d, new Date());
}

export function formatDistanceFromNow(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(d, new Date(), { addSuffix: true });
}

// Date Utilities
export function getDaysBetween(startDate: Date, endDate: Date): number {
  return differenceInDays(endDate, startDate);
}

export function getDateRange(startDate: Date, endDate: Date): Date[] {
  const days: Date[] = [];
  let currentDate = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (currentDate <= end) {
    days.push(currentDate);
    currentDate = addDays(currentDate, 1);
  }

  return days;
}

export function isDateInRange(
  date: Date,
  startDate: Date,
  endDate: Date
): boolean {
  return isWithinInterval(date, {
    start: startOfDay(startDate),
    end: endOfDay(endDate),
  });
}

export { addDays, subDays, startOfDay, endOfDay, parseISO };

// Phone Number Formatting
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }

  return phone;
}

// String Utilities
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function capitalizeWords(str: string): string {
  return str.split(' ').map(capitalize).join(' ');
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Validation Utilities
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s()-]{10,}$/;
  return phoneRegex.test(phone);
}

export function isValidLicensePlate(plate: string): boolean {
  const plateRegex = /^[A-Z0-9]{1,8}$/i;
  return plateRegex.test(plate.replace(/[\s-]/g, ''));
}

// Calculation Utilities
export function calculateRentalTotal(
  dailyRate: number,
  days: number,
  extras: {
    insurance?: boolean;
    gps?: boolean;
    childSeat?: boolean;
    additionalDriver?: boolean;
  } = {}
): { baseAmount: number; extrasAmount: number; total: number } {
  const baseAmount = dailyRate * days;

  let extrasAmount = 0;
  if (extras.insurance) extrasAmount += 25 * days;
  if (extras.gps) extrasAmount += 10 * days;
  if (extras.childSeat) extrasAmount += 8 * days;
  if (extras.additionalDriver) extrasAmount += 15 * days;

  return {
    baseAmount,
    extrasAmount,
    total: baseAmount + extrasAmount,
  };
}

// Status Badge Utilities
export type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

export function getBookingStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'ACTIVE':
    case 'COMPLETED':
      return 'success';
    case 'PENDING':
    case 'CONFIRMED':
      return 'info';
    case 'CANCELLED':
      return 'error';
    default:
      return 'default';
  }
}

export function getVehicleStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'AVAILABLE':
      return 'success';
    case 'RENTED':
      return 'info';
    case 'MAINTENANCE':
      return 'warning';
    case 'RETIRED':
      return 'error';
    default:
      return 'default';
  }
}

export function getPaymentStatusVariant(status: string): StatusVariant {
  switch (status) {
    case 'SUCCEEDED':
      return 'success';
    case 'PENDING':
    case 'PROCESSING':
      return 'info';
    case 'FAILED':
      return 'error';
    case 'REFUNDED':
      return 'warning';
    default:
      return 'default';
  }
}

// Local Storage Utilities
export function getLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setLocalStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Error saving to localStorage');
  }
}

export function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    console.error('Error removing from localStorage');
  }
}

// Debounce Utility
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: unknown, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
