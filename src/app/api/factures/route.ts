import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const factures = await prisma.facture.findMany({
      orderBy: { date: 'desc' },
      select: {
        id: true,
        reference: true,
        date: true,
        dateEcheance: true,
        clientNom: true,
        objet: true,
        totalHT: true,
        totalTTC: true,
        montantPaye: true,
        resteAPayer: true,
        statut: true,
        _count: { select: { lignes: true } },
      },
    });

    return NextResponse.json(factures);
  } catch (error) {
    console.error('Error fetching factures:', error);
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

    // Validate required fields
    if (!data.clientNom?.trim()) {
      return NextResponse.json({ error: 'Le nom du client est requis' }, { status: 400 });
    }
    if (!data.lignes || data.lignes.length === 0) {
      return NextResponse.json({ error: 'Au moins une ligne est requise' }, { status: 400 });
    }

    // Generate unique reference: FAC-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.facture.count({
      where: {
        date: {
          gte: new Date(year, 0, 1),
          lt: new Date(year + 1, 0, 1),
        },
      },
    });
    const reference = `FAC-${year}-${String(count + 1).padStart(4, '0')}`;

    // Calculate totals
    const totalHT = data.lignes.reduce((sum: number, l: { montant: number }) => sum + (l.montant || 0), 0);
    const totalTTC = totalHT; // No TVA for now

    const facture = await prisma.facture.create({
      data: {
        reference,
        clientNom: data.clientNom,
        clientAdresse: data.clientAdresse || null,
        clientVille: data.clientVille || null,
        clientPays: data.clientPays || 'Côte d\'Ivoire',
        clientEmail: data.clientEmail || null,
        clientTelephone: data.clientTelephone || null,
        partenaireId: data.partenaireId || null,
        devisId: data.devisId || null,
        dateEcheance: data.dateEcheance ? new Date(data.dateEcheance) : null,
        objet: data.objet || null,
        totalHT,
        totalTTC,
        resteAPayer: totalTTC,
        statut: 'brouillon',
        notes: data.notes || null,
        createdById: user.id,
        lignes: {
          create: data.lignes.map((l: {
            ordre: number;
            produitId?: string;
            reference: string;
            designation: string;
            details?: string;
            quantite: number;
            unite: string;
            prixUnitaire: number;
            montant: number;
          }) => ({
            ordre: l.ordre,
            produitId: l.produitId || null,
            reference: l.reference,
            designation: l.designation,
            details: l.details || null,
            quantite: l.quantite,
            unite: l.unite,
            prixUnitaire: l.prixUnitaire,
            montant: l.montant,
          })),
        },
      },
      include: {
        lignes: true,
      },
    });

    return NextResponse.json(facture);
  } catch (error) {
    console.error('Error creating facture:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
