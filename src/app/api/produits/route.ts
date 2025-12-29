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

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const categorieId = searchParams.get('categorieId');
    const marqueId = searchParams.get('marqueId');

    const searchTags = search
      .trim()
      .toLowerCase()
      .split(/[\s,]+/)
      .filter(Boolean);

    const produits = await prisma.produit.findMany({
      where: {
        AND: [
          search ? {
            OR: [
              { nom: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
              ...(searchTags.length > 0 ? [{ tags: { hasSome: searchTags } }] : []),
            ],
          } : {},
          categorieId ? { categorieId } : {},
          marqueId ? { marqueId } : {},
        ],
      },
      include: {
        categorie: { select: { id: true, nom: true } },
        famille: { select: { id: true, nom: true } },
        marque: { select: { id: true, nom: true } },
        modele: { select: { id: true, nom: true } },
        emplacement: { select: { id: true, nom: true } },
      },
      orderBy: { nom: 'asc' },
      take: 100,
    });

    return NextResponse.json(produits);
  } catch (error) {
    console.error('Error fetching produits:', error);
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

    if (!data.nom?.trim()) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }

    // Generate SKU if not provided
    let sku = data.sku?.trim();
    if (!sku) {
      const prefix = data.categorieId ? 'PRD' : 'GEN';
      const count = await prisma.produit.count();
      sku = `${prefix}-${String(count + 1).padStart(5, '0')}`;
    }

    // Check if SKU already exists
    if (sku) {
      const existingSku = await prisma.produit.findFirst({
        where: { sku: { equals: sku, mode: 'insensitive' } },
      });
      if (existingSku) {
        return NextResponse.json({ error: 'Ce SKU existe déjà' }, { status: 400 });
      }
    }

    const produit = await prisma.produit.create({
      data: {
        nom: data.nom.trim(),
        sku,
        gtin: data.gtin?.trim() || null,
        description: data.description?.trim() || null,
        tags: parseTags(data.tags),
        categorieId: data.categorieId || null,
        familleId: data.familleId || null,
        marqueId: data.marqueId || null,
        modeleId: data.modeleId || null,
        emplacementId: data.emplacementId || null,
        quantite: 0, // Always start at 0, use stock movements to add
        seuilAlerte: data.seuilAlerte || null,
        prixAchat: data.prixAchat || null,
        coutLogistique: data.coutLogistique || null,
        prixVenteMin: data.prixVenteMin || null,
        poids: data.poids || null,
        couleur: data.couleur?.trim() || null,
        notes: data.notes?.trim() || null,
      },
      include: {
        categorie: true,
        famille: true,
        marque: true,
        modele: true,
        emplacement: true,
      },
    });

    return NextResponse.json(produit);
  } catch (error) {
    console.error('Error creating produit:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
