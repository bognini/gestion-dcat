import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function PUT(
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

    if (!data.nom?.trim()) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }

    // Check for duplicate name
    const existing = await prisma.fournisseur.findFirst({
      where: {
        nom: { equals: data.nom, mode: 'insensitive' },
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Ce nom existe déjà' }, { status: 400 });
    }

    const fournisseur = await prisma.fournisseur.update({
      where: { id },
      data: {
        nom: data.nom.trim(),
        contact: data.contact?.trim() || null,
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        adresse: data.adresse?.trim() || null,
      },
    });

    return NextResponse.json(fournisseur);
  } catch (error) {
    console.error('Error updating fournisseur:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
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

    const { id } = await params;

    // Check for associated movements
    const mouvementCount = await prisma.mouvementStock.count({
      where: { fournisseurId: id },
    });

    if (mouvementCount > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: ${mouvementCount} mouvement(s) de stock associé(s)` },
        { status: 400 }
      );
    }

    await prisma.fournisseur.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting fournisseur:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
