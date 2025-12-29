import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function capitalizeMonth(dateStr: string): string {
  // Capitalize the first letter of the month in French date strings
  // French format: "01 janvier 2024" -> "01 Janvier 2024"
  return dateStr.replace(/^(\d+\s)(\w)/, (_, prefix, firstLetter) => prefix + firstLetter.toUpperCase());
}

export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatted = d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    ...options,
  });
  return capitalizeMonth(formatted);
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const formatted = d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  return capitalizeMonth(formatted);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
}


export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}

export function generateReference(prefix: string): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${year}${month}-${random}`;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function calculateEndDate(startDate: Date, durationDays: number): Date {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);
  return endDate;
}

export const ROLES = {
  ADMIN: 'admin',
  TECHNICIEN: 'technicien',
  MARKETING: 'marketing',
  COMPTABLE: 'comptable',
  ASSISTANTE: 'assistante',
} as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  technicien: 'Technicien',
  marketing: 'Marketing',
  comptable: 'Comptable',
  assistante: 'Assistante',
};

export type Role = (typeof ROLES)[keyof typeof ROLES];
