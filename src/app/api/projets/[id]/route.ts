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

    const projet = await prisma.projet.findUnique({
      where: { id },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        responsable: {
          select: { id: true, nom: true, prenom: true },
        },
        operations: {
          include: {
            taches: {
              include: {
                assigne: {
                  select: { id: true, nom: true, prenom: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        mouvements: {
          include: {
            produit: {
              select: { id: true, nom: true, sku: true },
            },
          },
          orderBy: { date: 'desc' },
          take: 10,
        },
        _count: {
          select: { operations: true, mouvements: true, documents: true },
        },
      },
    });

    if (!projet) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    return NextResponse.json(projet);
  } catch (error) {
    console.error('Error fetching projet:', error);
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

    // Check if project exists
    const existing = await prisma.projet.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (data.nom?.trim()) updateData.nom = data.nom.trim();
    if (data.partenaireId) updateData.partenaireId = data.partenaireId;
    if (data.categorie) updateData.categorie = data.categorie;
    if (data.type) updateData.type = data.type;
    if (data.devisEstimatif !== undefined) updateData.devisEstimatif = data.devisEstimatif ? parseFloat(data.devisEstimatif) : null;
    if (data.dureeJours !== undefined) updateData.dureeJours = data.dureeJours ? parseInt(data.dureeJours) : null;
    if (data.dateDebut !== undefined) updateData.dateDebut = data.dateDebut ? new Date(data.dateDebut) : null;
    if (data.dateFinEstimative !== undefined) updateData.dateFinEstimative = data.dateFinEstimative ? new Date(data.dateFinEstimative) : null;
    if (data.dateFinReelle !== undefined) updateData.dateFinReelle = data.dateFinReelle ? new Date(data.dateFinReelle) : null;
    if (data.lieu !== undefined) updateData.lieu = data.lieu?.trim() || null;
    if (data.responsableId !== undefined) updateData.responsableId = data.responsableId || null;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.priorite) updateData.priorite = data.priorite;
    if (data.etat) updateData.etat = data.etat;
    if (data.progression !== undefined) updateData.progression = parseInt(data.progression);

    const projet = await prisma.projet.update({
      where: { id },
      data: updateData,
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        responsable: {
          select: { id: true, nom: true, prenom: true },
        },
      },
    });

    return NextResponse.json(projet);
  } catch (error) {
    console.error('Error updating projet:', error);
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

    // Only admins can delete projects
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.projet.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Projet non trouvé' }, { status: 404 });
    }

    await prisma.projet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting projet:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
