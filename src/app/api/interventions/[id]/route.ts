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

    const intervention = await prisma.intervention.findUnique({
      where: { id },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        superviseur: {
          select: { id: true, nom: true, prenom: true },
        },
        intervenants: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true },
            },
          },
        },
      },
    });

    if (!intervention) {
      return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });
    }

    return NextResponse.json(intervention);
  } catch (error) {
    console.error('Error fetching intervention:', error);
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

    const existing = await prisma.intervention.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    
    if (data.date) updateData.date = new Date(data.date);
    if (data.partenaireId) updateData.partenaireId = data.partenaireId;
    if (data.problemeSignale?.trim()) updateData.problemeSignale = data.problemeSignale.trim();
    if (data.typeMaintenance) updateData.typeMaintenance = data.typeMaintenance;
    if (data.typeDefaillance !== undefined) updateData.typeDefaillance = data.typeDefaillance || null;
    if (data.causeDefaillance !== undefined) updateData.causeDefaillance = data.causeDefaillance || null;
    if (data.modeIntervention !== undefined) updateData.modeIntervention = data.modeIntervention || null;
    if (data.lieu !== undefined) updateData.lieu = data.lieu?.trim() || null;
    if (data.dureeMinutes !== undefined) updateData.dureeMinutes = data.dureeMinutes ? parseInt(data.dureeMinutes) : null;
    if (data.rapport !== undefined) updateData.rapport = data.rapport?.trim() || null;
    if (data.recommandations !== undefined) updateData.recommandations = data.recommandations?.trim() || null;
    if (data.statut) updateData.statut = data.statut;

    // Update intervenants if provided
    if (data.intervenantIds !== undefined) {
      // Delete existing
      await prisma.interventionIntervenant.deleteMany({
        where: { interventionId: id },
      });
      // Create new
      if (data.intervenantIds.length > 0) {
        await prisma.interventionIntervenant.createMany({
          data: data.intervenantIds.map((userId: string) => ({
            interventionId: id,
            userId,
          })),
        });
      }
    }

    const intervention = await prisma.intervention.update({
      where: { id },
      data: updateData,
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        intervenants: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true },
            },
          },
        },
      },
    });

    return NextResponse.json(intervention);
  } catch (error) {
    console.error('Error updating intervention:', error);
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

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id } = await params;

    const existing = await prisma.intervention.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });
    }

    await prisma.intervention.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting intervention:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
