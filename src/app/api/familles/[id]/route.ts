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

    const famille = await prisma.famille.findUnique({
      where: { id },
      include: {
        categorie: {
          select: { id: true, nom: true },
        },
        _count: {
          select: { produits: true },
        },
      },
    });

    if (!famille) {
      return NextResponse.json({ error: 'Famille non trouvée' }, { status: 404 });
    }

    return NextResponse.json(famille);
  } catch (error) {
    console.error('Error:', error);
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
      return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
    }

    // Check if name already exists in same category (excluding current)
    const existing = await prisma.famille.findFirst({
      where: {
        nom: data.nom.trim(),
        categorieId: data.categorieId,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'Cette famille existe déjà dans cette catégorie' }, { status: 400 });
    }

    const famille = await prisma.famille.update({
      where: { id },
      data: {
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
        categorieId: data.categorieId,
      },
      include: {
        categorie: {
          select: { id: true, nom: true },
        },
      },
    });

    return NextResponse.json(famille);
  } catch (error) {
    console.error('Error:', error);
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

    // Check if famille has products
    const famille = await prisma.famille.findUnique({
      where: { id },
      include: { _count: { select: { produits: true } } },
    });

    if (!famille) {
      return NextResponse.json({ error: 'Famille non trouvée' }, { status: 404 });
    }

    if (famille._count.produits > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: ${famille._count.produits} produit(s) utilisent cette famille` },
        { status: 400 }
      );
    }

    await prisma.famille.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
