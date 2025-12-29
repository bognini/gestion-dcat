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

    const categorie = await prisma.categorie.findUnique({
      where: { id },
      include: {
        produits: { take: 10, orderBy: { nom: 'asc' } },
        _count: { select: { produits: true } },
      },
    });

    if (!categorie) {
      return NextResponse.json({ error: 'Catégorie non trouvée' }, { status: 404 });
    }

    return NextResponse.json(categorie);
  } catch (error) {
    console.error('Error fetching categorie:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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

    const categorie = await prisma.categorie.update({
      where: { id },
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
      },
    });

    return NextResponse.json(categorie);
  } catch (error) {
    console.error('Error updating categorie:', error);
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

    // Check if category has products
    const count = await prisma.produit.count({ where: { categorieId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: ${count} produit(s) utilisent cette catégorie` },
        { status: 400 }
      );
    }

    await prisma.categorie.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting categorie:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
