import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const statut = request.nextUrl.searchParams.get('statut');
    const clientId = request.nextUrl.searchParams.get('clientId');

    const where: Record<string, unknown> = {};
    if (statut && statut !== 'all') where.statut = statut;
    if (clientId) where.clientId = clientId;

    const commandes = await prisma.commande.findMany({
      where,
      include: {
        client: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        lignes: {
          include: {
            produit: {
              select: { id: true, nom: true, sku: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(commandes);
  } catch (error) {
    console.error('Error fetching commandes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.clientId) {
      return NextResponse.json({ error: 'Le client est requis' }, { status: 400 });
    }
    if (!data.lignes || data.lignes.length === 0) {
      return NextResponse.json({ error: 'Au moins une ligne est requise' }, { status: 400 });
    }

    // Generate reference
    const year = new Date().getFullYear();
    const count = await prisma.commande.count({
      where: {
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    const reference = `CMD-${year}-${String(count + 1).padStart(4, '0')}`;

    // Calculate totals
    let totalHT = 0;
    const lignesData = data.lignes.map((ligne: { produitId: string; designation: string; quantite: number; prixUnitaire: number }) => {
      const montant = ligne.quantite * ligne.prixUnitaire;
      totalHT += montant;
      return {
        produitId: ligne.produitId,
        designation: ligne.designation,
        quantite: ligne.quantite,
        prixUnitaire: ligne.prixUnitaire,
        montant,
      };
    });

    const commande = await prisma.commande.create({
      data: {
        reference,
        clientId: data.clientId,
        statut: data.statut || 'en_attente',
        modePaiement: data.modePaiement || null,
        adresseLivraison: data.adresseLivraison?.trim() || null,
        notes: data.notes?.trim() || null,
        totalHT,
        totalTTC: totalHT, // Pas de TVA
        lignes: {
          create: lignesData,
        },
      },
      include: {
        client: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
        lignes: {
          include: {
            produit: {
              select: { id: true, nom: true, sku: true },
            },
          },
        },
      },
    });

    return NextResponse.json(commande);
  } catch (error) {
    console.error('Error creating commande:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
