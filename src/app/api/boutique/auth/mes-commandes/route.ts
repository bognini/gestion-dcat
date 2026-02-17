import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getBoutiqueClientFromCookie } from '@/lib/boutique-auth';

export async function GET() {
  try {
    const client = await getBoutiqueClientFromCookie();
    if (!client) {
      return NextResponse.json([], { status: 401 });
    }

    const commandes = await prisma.commande.findMany({
      where: { clientBoutiqueId: client.id },
      orderBy: { date: 'desc' },
      take: 50,
      include: {
        lignes: {
          select: {
            id: true,
            designation: true,
            quantite: true,
            prixUnitaire: true,
            montant: true,
          },
        },
      },
    });

    return NextResponse.json(commandes);
  } catch (error) {
    console.error('Error fetching client orders:', error);
    return NextResponse.json([], { status: 500 });
  }
}
