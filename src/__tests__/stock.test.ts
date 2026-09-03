import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseDateMouvement, periodeBounds, toISODate } from '@/lib/stock';

const session = { id: '', role: 'admin', nom: 'Test', prenom: 'Admin', email: 't@t.t', username: 'test' };
vi.mock('@/lib/auth', () => ({ getSessionFromCookie: vi.fn(async () => session) }));
vi.mock('@/lib/mail', () => ({ sendNotificationEmail: vi.fn(async () => ({ sent: 0, total: 0 })) }));

describe('parseDateMouvement', () => {
  it('vide → maintenant', () => {
    const d = parseDateMouvement('');
    expect(d).toBeInstanceOf(Date);
    expect(Math.abs((d as Date).getTime() - Date.now())).toBeLessThan(5000);
  });
  it('accepte une date passée au format YYYY-MM-DD', () => {
    const d = parseDateMouvement('2026-08-15') as Date;
    expect(d).toBeInstanceOf(Date);
    expect(toISODate(d)).toBe('2026-08-15');
  });
  it('refuse le futur et les dates invalides', () => {
    const future = new Date();
    future.setDate(future.getDate() + 2);
    expect(parseDateMouvement(toISODate(future))).toBeInstanceOf(NextResponse);
    expect(parseDateMouvement('n importe quoi')).toBeInstanceOf(NextResponse);
    expect(parseDateMouvement('2010-01-01')).toBeInstanceOf(NextResponse);
  });
});

describe('periodeBounds', () => {
  const now = new Date(2026, 8, 3, 10, 30); // 3 sept. 2026
  it('mois → du 1er au jour courant', () => {
    const { from, to } = periodeBounds('month', now);
    expect(toISODate(from)).toBe('2026-09-01');
    expect(toISODate(to)).toBe('2026-09-03');
  });
  it('année → du 1er janvier', () => {
    expect(toISODate(periodeBounds('year', now).from)).toBe('2026-01-01');
  });
  it('7 jours → 6 jours avant', () => {
    expect(toISODate(periodeBounds('week', now).from)).toBe('2026-08-28');
  });
});

const dbOk = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
const json = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

describe.skipIf(!dbOk)('mouvements datés et statistiques par période (intégration DB)', () => {
  const stamp = Date.now();
  let userId = '';
  let produitId = '';
  const mouvementIds: string[] = [];

  beforeAll(async () => {
    const user = await prisma.utilisateur.create({
      data: { username: `s${stamp}`, email: `s${stamp}@test.local`, password: 'x', nom: 'Stock', role: 'admin' },
    });
    userId = user.id;
    session.id = user.id;
    const produit = await prisma.produit.create({
      data: { nom: `Produit test ${stamp}`, sku: `TST-${stamp}`, quantite: 0, prixAchat: 1000, prixVenteMin: 1500 },
    });
    produitId = produit.id;
  });

  afterAll(async () => {
    await prisma.mouvementStock.deleteMany({ where: { id: { in: mouvementIds } } });
    await prisma.produit.delete({ where: { id: produitId } }).catch(() => undefined);
    await prisma.utilisateur.delete({ where: { id: userId } }).catch(() => undefined);
    await prisma.$disconnect();
  });

  it('enregistre la date saisie et la retrouve dans les statistiques de la bonne période', async () => {
    const { POST } = await import('@/app/api/mouvements/route');
    const { GET: stats } = await import('@/app/api/stock/statistiques/route');

    // Entrée datée du 15 août 2026, sortie datée d'aujourd'hui
    const e = await POST(json('/api/mouvements', 'POST', { type: 'ENTREE', produitId, quantite: 10, date: '2026-08-15', etat: 'neuf' }));
    expect(e.status).toBe(200);
    const entree = await e.json();
    mouvementIds.push(entree.id);
    expect(toISODate(new Date(entree.date))).toBe('2026-08-15');

    const s = await POST(json('/api/mouvements', 'POST', { type: 'SORTIE', produitId, quantite: 3, prixVenteDefinitif: 2000, destinationType: 'PARTICULIER', destination: 'Client', demandeurId: userId }));
    expect(s.status).toBe(200);
    mouvementIds.push((await s.json()).id);

    const aout = await (await stats(json('/api/stock/statistiques?from=2026-08-01&to=2026-08-31', 'GET'))).json();
    const aoutEntrees = aout.periode.serie.find((x: { periode: string }) => x.periode === '2026-08-15');
    expect(aoutEntrees?.entrees).toBeGreaterThanOrEqual(10);

    const today = toISODate(new Date());
    const jour = await (await stats(json(`/api/stock/statistiques?from=${today}&to=${today}`, 'GET'))).json();
    expect(jour.periode.granularite).toBe('jour');
    expect(jour.periode.sorties).toBeGreaterThanOrEqual(3);
    expect(jour.periode.totalVentes).toBeGreaterThanOrEqual(6000);
    // L'entrée d'août n'est pas dans la période du jour
    expect(jour.periode.serie.some((x: { periode: string }) => x.periode === '2026-08-15')).toBe(false);

    // Le stock instantané, lui, reflète les deux mouvements
    const produit = await prisma.produit.findUnique({ where: { id: produitId } });
    expect(produit?.quantite).toBe(7);
  });

  it('refuse une date de mouvement dans le futur', async () => {
    const { POST } = await import('@/app/api/mouvements/route');
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const res = await POST(json('/api/mouvements', 'POST', { type: 'ENTREE', produitId, quantite: 1, date: toISODate(future) }));
    expect(res.status).toBe(400);
  });

  it('un rôle sans droit stock reçoit 403', async () => {
    const { POST } = await import('@/app/api/mouvements/route');
    session.role = 'comptable';
    const res = await POST(json('/api/mouvements', 'POST', { type: 'ENTREE', produitId, quantite: 1 }));
    session.role = 'admin';
    expect(res.status).toBe(403);
  });
});
