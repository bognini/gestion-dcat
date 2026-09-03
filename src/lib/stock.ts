import { NextResponse } from 'next/server';

/**
 * Interprète la date saisie pour un mouvement de stock.
 * - vide → maintenant
 * - "YYYY-MM-DD" → ce jour-là, à l'heure courante (conserve l'ordre de saisie dans la journée)
 * - sinon → date ISO complète
 * Refuse le futur et les dates de plus de 5 ans.
 */
export function parseDateMouvement(raw: unknown): Date | NextResponse {
  if (raw === undefined || raw === null || raw === '') return new Date();
  const str = String(raw);
  let d: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const [y, m, day] = str.split('-').map(Number);
    const now = new Date();
    d = new Date(y, m - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());
  } else {
    d = new Date(str);
  }
  if (isNaN(d.getTime())) {
    return NextResponse.json({ error: 'Date du mouvement invalide' }, { status: 400 });
  }
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  if (d > endOfToday) {
    return NextResponse.json({ error: 'La date du mouvement ne peut pas être dans le futur' }, { status: 400 });
  }
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 5);
  if (d < minDate) {
    return NextResponse.json({ error: 'La date du mouvement est trop ancienne (plus de 5 ans)' }, { status: 400 });
  }
  return d;
}

/** Bornes [from, to] pour un préréglage de période, en heure locale. */
export function periodeBounds(preset: 'today' | 'week' | 'month' | 'year', now = new Date()): { from: Date; to: Date } {
  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  switch (preset) {
    case 'week':
      from.setDate(from.getDate() - 6);
      break;
    case 'month':
      from.setDate(1);
      break;
    case 'year':
      from.setMonth(0, 1);
      break;
  }
  return { from, to };
}

export function toISODate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
