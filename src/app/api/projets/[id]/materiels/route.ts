import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    const mouvements = await prisma.mouvementStock.findMany({
      where: { projetId: id },
      include: {
        produit: {
          select: { id: true, nom: true, sku: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(mouvements);
  } catch (error) {
    console.error('Error fetching project materials:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    // Check project exists
    const projet = await prisma.projet.findUnique({ where: { id } });
    if (!projet) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    if (!data.produitId) {
      return NextResponse.json({ error: 'Produit requis' }, { status: 400 });
    }

    if (!data.quantite || data.quantite <= 0) {
      return NextResponse.json({ error: 'Quantité invalide' }, { status: 400 });
    }

    // Check product stock
    const produit = await prisma.produit.findUnique({
      where: { id: data.produitId },
    });
    
    if (!produit) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    if (produit.quantite < data.quantite) {
      return NextResponse.json({ error: 'Stock insuffisant' }, { status: 400 });
    }

    // Create stock movement and update product quantity
    const [mouvement] = await prisma.$transaction([
      prisma.mouvementStock.create({
        data: {
          produitId: data.produitId,
          type: 'SORTIE',
          quantite: data.quantite,
          commentaire: data.motif || `Utilisé pour projet ${projet.reference || projet.nom}`,
          projetId: id,
          utilisateurId: user.id,
        },
        include: {
          produit: {
            select: { id: true, nom: true, sku: true },
          },
        },
      }),
      prisma.produit.update({
        where: { id: data.produitId },
        data: { quantite: { decrement: data.quantite } },
      }),
    ]);

    return NextResponse.json(mouvement);
  } catch (error) {
    console.error('Error adding material to project:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'ajout' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const mouvementId = request.nextUrl.searchParams.get('mouvementId');
    if (!mouvementId) {
      return NextResponse.json({ error: 'ID du mouvement requis' }, { status: 400 });
    }

    const mouvement = await prisma.mouvementStock.findUnique({
      where: { id: mouvementId },
    });

    if (!mouvement) {
      return NextResponse.json({ error: 'Mouvement non trouvé' }, { status: 404 });
    }

    // Restore stock and delete movement
    await prisma.$transaction([
      prisma.produit.update({
        where: { id: mouvement.produitId },
        data: { quantite: { increment: mouvement.quantite } },
      }),
      prisma.mouvementStock.delete({
        where: { id: mouvementId },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing material:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
