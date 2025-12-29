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

    const partenaire = await prisma.partenaire.findUnique({
      where: { id },
    });

    if (!partenaire) {
      return NextResponse.json({ error: 'Partenaire non trouvé' }, { status: 404 });
    }

    return NextResponse.json(partenaire);
  } catch (error) {
    console.error('Error fetching partenaire:', error);
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

    const partenaire = await prisma.partenaire.update({
      where: { id },
      data: {
        nom: data.nom.trim(),
        type: data.type || 'client',
        secteur: data.secteur?.trim() || null,
        adresse: data.adresse?.trim() || null,
        ville: data.ville?.trim() || null,
        pays: data.pays?.trim() || null,
        email: data.email?.trim() || null,
        telephone1: data.telephone1?.trim() || null,
        telephone2: data.telephone2?.trim() || null,
        siteWeb: data.siteWeb?.trim() || null,
        notes: data.notes?.trim() || null,
      },
    });

    return NextResponse.json(partenaire);
  } catch (error) {
    console.error('Error updating partenaire:', error);
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

    // Check if partenaire is used in devis
    const devisCount = await prisma.devis.count({ where: { partenaireId: id } });
    if (devisCount > 0) {
      return NextResponse.json(
        { error: `Impossible de supprimer: ${devisCount} devis utilisent ce partenaire` },
        { status: 400 }
      );
    }

    await prisma.partenaire.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting partenaire:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
