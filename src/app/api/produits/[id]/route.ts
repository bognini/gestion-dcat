import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function parseTags(input: unknown): string[] {
  const raw =
    Array.isArray(input)
      ? input
      : typeof input === 'string'
        ? input.split(',')
        : [];

  const normalized = raw
    .map((t) => (typeof t === 'string' ? t.trim().toLowerCase() : ''))
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

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

    const produit = await prisma.produit.findUnique({
      where: { id },
      include: {
        categorie: true,
        famille: true,
        marque: true,
        modele: true,
        emplacement: true,
        mouvements: {
          orderBy: { date: 'desc' },
          take: 20,
          include: {
            utilisateur: { select: { nom: true, prenom: true } },
            fournisseur: { select: { nom: true } },
          },
        },
      },
    });

    if (!produit) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    return NextResponse.json(produit);
  } catch (error) {
    console.error('Error fetching produit:', error);
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

    // Build update object - only include fields that are provided
    const updateData: Record<string, unknown> = {};

    // Required field validation only if nom is provided (partial update support)
    if (data.nom !== undefined) {
      if (!data.nom?.trim()) {
        return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
      }
      updateData.nom = data.nom.trim();
    }

    // String fields
    if (data.sku !== undefined) updateData.sku = data.sku?.trim() || null;
    if (data.gtin !== undefined) updateData.gtin = data.gtin?.trim() || null;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.couleur !== undefined) updateData.couleur = data.couleur?.trim() || null;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

    // Tags
    if (data.tags !== undefined) updateData.tags = parseTags(data.tags);

    // Foreign keys
    if (data.categorieId !== undefined) updateData.categorieId = data.categorieId || null;
    if (data.familleId !== undefined) updateData.familleId = data.familleId || null;
    if (data.marqueId !== undefined) updateData.marqueId = data.marqueId || null;
    if (data.modeleId !== undefined) updateData.modeleId = data.modeleId || null;
    if (data.emplacementId !== undefined) updateData.emplacementId = data.emplacementId || null;

    // Numeric fields
    if (data.seuilAlerte !== undefined) updateData.seuilAlerte = data.seuilAlerte ?? null;
    if (data.prixAchat !== undefined) updateData.prixAchat = data.prixAchat ?? null;
    if (data.coutLogistique !== undefined) updateData.coutLogistique = data.coutLogistique ?? null;
    if (data.prixVenteMin !== undefined) updateData.prixVenteMin = data.prixVenteMin ?? null;
    if (data.poids !== undefined) updateData.poids = data.poids ?? null;

    // E-Market publishing fields
    if (data.isPublished !== undefined) updateData.isPublished = data.isPublished;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.promoPrice !== undefined) updateData.promoPrice = data.promoPrice;
    if (data.promoStart !== undefined) updateData.promoStart = data.promoStart ? new Date(data.promoStart as string) : null;
    if (data.promoEnd !== undefined) updateData.promoEnd = data.promoEnd ? new Date(data.promoEnd as string) : null;
    if (data.prixVente !== undefined) updateData.prixVente = data.prixVente;
    if (data.images !== undefined) updateData.images = data.images;

    const produit = await prisma.produit.update({
      where: { id },
      data: updateData,
      include: {
        categorie: true,
        marque: true,
        modele: true,
        emplacement: true,
      },
    });

    return NextResponse.json(produit);
  } catch (error) {
    console.error('Error updating produit:', error);
    const message = error instanceof Error ? error.message : '';
    const lower = message.toLowerCase();
    if (lower.includes('tags') && (lower.includes('column') || lower.includes('does not exist'))) {
      return NextResponse.json(
        { error: 'Colonne "tags" manquante en base. Appliquez les migrations Prisma puis redémarrez le serveur.' },
        { status: 500 }
      );
    }
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

    // Check if produit is used in devis lines
    const devisLigneCount = await prisma.devisLigne.count({ where: { produitId: id } });
    if (devisLigneCount > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: ${devisLigneCount} ligne(s) de devis utilisent ce produit` },
        { status: 400 }
      );
    }

    await prisma.produit.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting produit:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
