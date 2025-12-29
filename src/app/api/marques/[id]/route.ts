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

    const marque = await prisma.marque.update({
      where: { id },
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
      },
    });

    return NextResponse.json(marque);
  } catch (error) {
    console.error('Error updating marque:', error);
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

    const produitCount = await prisma.produit.count({ where: { marqueId: id } });
    const modeleCount = await prisma.modele.count({ where: { marqueId: id } });

    if (produitCount > 0 || modeleCount > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: utilisé par ${produitCount} produit(s) et ${modeleCount} modèle(s)` },
        { status: 400 }
      );
    }

    await prisma.marque.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting marque:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
