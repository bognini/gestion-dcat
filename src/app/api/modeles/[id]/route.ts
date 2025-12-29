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

    const modele = await prisma.modele.update({
      where: { id },
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
        marqueId: data.marqueId,
        familleId: data.familleId,
      },
      include: {
        marque: { select: { id: true, nom: true } },
        famille: { 
          select: { 
            id: true, 
            nom: true,
            categorieId: true,
            categorie: { select: { id: true, nom: true } } 
          } 
        },
      },
    });

    return NextResponse.json(modele);
  } catch (error) {
    console.error('Error updating modele:', error);
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

    const count = await prisma.produit.count({ where: { modeleId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: ${count} produit(s) utilisent ce modèle` },
        { status: 400 }
      );
    }

    await prisma.modele.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting modele:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
