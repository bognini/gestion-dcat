import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // E-Market stats - with error handling for each query
    let totalCommandes = 0;
    let commandesThisMonth = 0;
    let commandesLastMonth = 0;
    let commandesByStatus: { statut: string; _count: { id: number } }[] = [];
    let totalClients = 0;
    let newClientsThisMonth = 0;
    let totalRevenue = { _sum: { totalTTC: 0 as number | null } };
    let revenueThisMonth = { _sum: { totalTTC: 0 as number | null } };
    let revenueLastMonth = { _sum: { totalTTC: 0 as number | null } };
    let topProducts: { produitId: string; _sum: { quantite: number | null; montant: number | null } }[] = [];
    let recentCommandes: { id: string; reference: string; totalTTC: number; statut: string; createdAt: Date; client: { nom: string; prenom: string | null } | null; _count: { lignes: number } }[] = [];

    try {
      [
        totalCommandes,
        commandesThisMonth,
        commandesLastMonth,
        commandesByStatus,
        totalClients,
        newClientsThisMonth,
        totalRevenue,
        revenueThisMonth,
        revenueLastMonth,
        topProducts,
        recentCommandes,
      ] = await Promise.all([
        prisma.commande.count().catch(() => 0),
        prisma.commande.count({ where: { createdAt: { gte: startOfMonth } } }).catch(() => 0),
        prisma.commande.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }).catch(() => 0),
        prisma.commande.groupBy({ by: ['statut'], _count: { id: true } }).catch(() => []),
        prisma.client.count().catch(() => 0),
        prisma.client.count({ where: { createdAt: { gte: startOfMonth } } }).catch(() => 0),
        prisma.commande.aggregate({ where: { statut: { in: ['livree', 'terminee'] } }, _sum: { totalTTC: true } }).catch(() => ({ _sum: { totalTTC: 0 } })),
        prisma.commande.aggregate({ where: { statut: { in: ['livree', 'terminee'] }, createdAt: { gte: startOfMonth } }, _sum: { totalTTC: true } }).catch(() => ({ _sum: { totalTTC: 0 } })),
        prisma.commande.aggregate({ where: { statut: { in: ['livree', 'terminee'] }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { totalTTC: true } }).catch(() => ({ _sum: { totalTTC: 0 } })),
        prisma.commandeLigne.groupBy({ by: ['produitId'], _sum: { quantite: true, montant: true }, orderBy: { _sum: { quantite: 'desc' } }, take: 5 }).catch(() => []),
        prisma.commande.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { client: { select: { nom: true, prenom: true } }, _count: { select: { lignes: true } } } }).catch(() => []),
      ]);
    } catch (e) {
      console.error('Stats query error:', e);
    }

    // Get product details for top products
    const productIds = topProducts.map(p => p.produitId).filter(Boolean) as string[];
    const products = await prisma.produit.findMany({
      where: { id: { in: productIds } },
      select: { id: true, nom: true, sku: true },
    });

    const topProductsWithDetails = topProducts.map(tp => {
      const product = products.find(p => p.id === tp.produitId);
      return {
        produitId: tp.produitId,
        nom: product?.nom || 'Produit inconnu',
        sku: product?.sku || '-',
        quantite: tp._sum.quantite || 0,
        montant: tp._sum.montant || 0,
      };
    });

    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const revenue = await prisma.commande.aggregate({
        where: {
          statut: { in: ['livree', 'terminee'] },
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalTTC: true },
      });
      
      monthlyRevenue.push({
        month: monthStart.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        revenue: revenue._sum.totalTTC || 0,
      });
    }

    // Calculate growth
    const revenueGrowth = revenueLastMonth._sum.totalTTC 
      ? ((revenueThisMonth._sum.totalTTC || 0) - revenueLastMonth._sum.totalTTC) / revenueLastMonth._sum.totalTTC * 100
      : 0;

    const commandesGrowth = commandesLastMonth 
      ? ((commandesThisMonth - commandesLastMonth) / commandesLastMonth) * 100
      : 0;

    return NextResponse.json({
      overview: {
        totalCommandes,
        commandesThisMonth,
        commandesGrowth: Math.round(commandesGrowth),
        totalClients,
        newClientsThisMonth,
        totalRevenue: totalRevenue._sum.totalTTC || 0,
        revenueThisMonth: revenueThisMonth._sum.totalTTC || 0,
        revenueGrowth: Math.round(revenueGrowth),
      },
      commandesByStatus: commandesByStatus.map(s => ({
        statut: s.statut,
        count: s._count.id,
      })),
      topProducts: topProductsWithDetails,
      monthlyRevenue,
      recentCommandes: recentCommandes.map(c => ({
        id: c.id,
        reference: c.reference,
        clientNom: c.client ? `${c.client.prenom || ''} ${c.client.nom}`.trim() : 'Client inconnu',
        totalTTC: c.totalTTC,
        statut: c.statut,
        lignesCount: c._count.lignes,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching marketing stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
