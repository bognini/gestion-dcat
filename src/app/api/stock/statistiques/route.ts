import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/api-auth';

/**
 * GET /api/stock/statistiques?from=YYYY-MM-DD&to=YYYY-MM-DD&granularite=jour|mois
 *
 * Deux familles d'indicateurs :
 *  - `instantane` : état du stock maintenant (indépendant de la période)
 *  - `periode`    : flux (entrées, sorties, ventes) entre `from` et `to` inclus
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const denied = requirePermission(user, 'stock', 'read');
    if (denied) return denied;

    const sp = request.nextUrl.searchParams;
    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    const from = sp.get('from') ? new Date(sp.get('from') as string) : defaultFrom;
    const to = sp.get('to') ? new Date(sp.get('to') as string) : today;
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return NextResponse.json({ error: 'Période invalide' }, { status: 400 });
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    if (from > to) {
      return NextResponse.json({ error: 'La date de début doit précéder la date de fin' }, { status: 400 });
    }
    const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
    const granularite = sp.get('granularite') === 'mois' || (sp.get('granularite') !== 'jour' && spanDays > 62) ? 'mois' : 'jour';

    // ----- Instantané -----
    const produits = await prisma.produit.findMany({
      select: {
        id: true, nom: true, sku: true, quantite: true, seuilAlerte: true,
        prixAchat: true, prixVenteMin: true,
        categorie: { select: { nom: true } },
      },
    });
    const instantane = {
      totalProduits: produits.length,
      totalUnites: produits.reduce((s, p) => s + p.quantite, 0),
      valeurStock: produits.reduce((s, p) => s + (p.prixVenteMin || 0) * p.quantite, 0),
      valeurRevient: produits.reduce((s, p) => s + (p.prixAchat || 0) * p.quantite, 0),
      lowStockCount: produits.filter((p) => p.seuilAlerte && p.quantite > 0 && p.quantite <= p.seuilAlerte).length,
      outOfStockCount: produits.filter((p) => p.quantite === 0).length,
      topByQuantity: [...produits].sort((a, b) => b.quantite - a.quantite).slice(0, 5)
        .map((p) => ({ id: p.id, nom: p.nom, sku: p.sku, quantite: p.quantite })),
      lowStockProducts: produits.filter((p) => p.seuilAlerte && p.quantite <= p.seuilAlerte)
        .sort((a, b) => a.quantite - b.quantite).slice(0, 5)
        .map((p) => ({ id: p.id, nom: p.nom, sku: p.sku, quantite: p.quantite, seuilAlerte: p.seuilAlerte })),
      parCategorie: Object.entries(
        produits.reduce((acc, p) => {
          const cat = p.categorie?.nom || 'Non catégorisé';
          acc[cat] = acc[cat] || { count: 0, value: 0 };
          acc[cat].count += p.quantite;
          acc[cat].value += (p.prixVenteMin || 0) * p.quantite;
          return acc;
        }, {} as Record<string, { count: number; value: number }>)
      ).map(([categorie, v]) => ({ categorie, ...v })),
    };

    // ----- Période -----
    const mouvements = await prisma.mouvementStock.findMany({
      where: { date: { gte: from, lte: to } },
      select: {
        id: true, type: true, quantite: true, date: true, prixVenteDefinitif: true,
        produit: { select: { id: true, nom: true, sku: true, prixAchat: true, categorie: { select: { nom: true } } } },
      },
      orderBy: { date: 'asc' },
    });

    const entrees = mouvements.filter((m) => m.type === 'ENTREE');
    const sorties = mouvements.filter((m) => m.type === 'SORTIE');
    const ventes = sorties.filter((m) => m.prixVenteDefinitif);

    const bucketKey = (d: Date) =>
      granularite === 'mois'
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
        : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    // Série complète (buckets vides inclus) pour un graphique continu
    const serieMap = new Map<string, { periode: string; entrees: number; sorties: number; ventes: number }>();
    const cursor = new Date(from);
    while (cursor <= to) {
      const k = bucketKey(cursor);
      if (!serieMap.has(k)) serieMap.set(k, { periode: k, entrees: 0, sorties: 0, ventes: 0 });
      if (granularite === 'mois') cursor.setMonth(cursor.getMonth() + 1, 1);
      else cursor.setDate(cursor.getDate() + 1);
    }
    for (const m of mouvements) {
      const b = serieMap.get(bucketKey(m.date));
      if (!b) continue;
      if (m.type === 'ENTREE') b.entrees += m.quantite;
      else {
        b.sorties += m.quantite;
        b.ventes += (m.prixVenteDefinitif || 0) * m.quantite;
      }
    }

    const topSorties = Object.values(
      sorties.reduce((acc, m) => {
        const k = m.produit.id;
        acc[k] = acc[k] || { id: k, nom: m.produit.nom, sku: m.produit.sku, quantite: 0, montant: 0 };
        acc[k].quantite += m.quantite;
        acc[k].montant += (m.prixVenteDefinitif || 0) * m.quantite;
        return acc;
      }, {} as Record<string, { id: string; nom: string; sku: string | null; quantite: number; montant: number }>)
    ).sort((a, b) => b.quantite - a.quantite).slice(0, 5);

    const sortiesParCategorie = Object.entries(
      sorties.reduce((acc, m) => {
        const cat = m.produit.categorie?.nom || 'Non catégorisé';
        acc[cat] = acc[cat] || { quantite: 0, montant: 0 };
        acc[cat].quantite += m.quantite;
        acc[cat].montant += (m.prixVenteDefinitif || 0) * m.quantite;
        return acc;
      }, {} as Record<string, { quantite: number; montant: number }>)
    ).map(([categorie, v]) => ({ categorie, ...v })).sort((a, b) => b.quantite - a.quantite);

    const periode = {
      from: from.toISOString(),
      to: to.toISOString(),
      granularite,
      nbMouvements: mouvements.length,
      entrees: entrees.reduce((s, m) => s + m.quantite, 0),
      sorties: sorties.reduce((s, m) => s + m.quantite, 0),
      nbEntrees: entrees.length,
      nbSorties: sorties.length,
      totalVentes: ventes.reduce((s, m) => s + (m.prixVenteDefinitif || 0) * m.quantite, 0),
      coutSorties: sorties.reduce((s, m) => s + (m.produit.prixAchat || 0) * m.quantite, 0),
      serie: Array.from(serieMap.values()),
      topSorties,
      sortiesParCategorie,
    };

    return NextResponse.json({ instantane, periode });
  } catch (error) {
    console.error('Error computing stock statistics:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
