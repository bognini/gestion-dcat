import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/api-auth';
import { MODE_SIGNALEMENT_VALUES } from '@/lib/tickets';

const TICKET_INCLUDE = {
  partenaire: { select: { id: true, nom: true } },
  recuPar: { select: { id: true, nom: true, prenom: true } },
  priseEnChargePar: { select: { id: true, nom: true, prenom: true } },
  createdBy: { select: { id: true, nom: true, prenom: true } },
  interventions: {
    orderBy: { date: 'desc' as const },
    select: {
      id: true,
      reference: true,
      date: true,
      statut: true,
      typeMaintenance: true,
      dureeMinutes: true,
      intervenants: { include: { utilisateur: { select: { id: true, nom: true, prenom: true } } } },
    },
  },
} as const;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const denied = requirePermission(user, 'technique', 'read');
    if (denied) return denied;

    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE });
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error fetching ticket:', error);
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
    const denied = requirePermission(user, 'technique', 'write');
    if (denied) return denied;

    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.ticket.findUnique({
      where: { id },
      include: { _count: { select: { interventions: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (data.incident !== undefined) {
      if (!String(data.incident).trim()) {
        return NextResponse.json({ error: "L'incident signalé est requis" }, { status: 400 });
      }
      updateData.incident = String(data.incident).trim();
    }
    if (data.dateSignalement !== undefined) {
      const d = new Date(data.dateSignalement);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Date de signalement invalide' }, { status: 400 });
      }
      updateData.dateSignalement = d;
    }
    if (data.signaleParNom !== undefined) {
      if (!String(data.signaleParNom).trim()) {
        return NextResponse.json({ error: 'Le nom de la personne ayant signalé est requis' }, { status: 400 });
      }
      updateData.signaleParNom = String(data.signaleParNom).trim();
    }
    if (data.signaleParPrenoms !== undefined) updateData.signaleParPrenoms = data.signaleParPrenoms?.trim() || null;
    if (data.modeSignalement !== undefined) {
      if (!MODE_SIGNALEMENT_VALUES.includes(data.modeSignalement)) {
        return NextResponse.json({ error: 'Mode de signalisation invalide' }, { status: 400 });
      }
      updateData.modeSignalement = data.modeSignalement;
    }
    if (data.recuParId !== undefined && data.recuParId) updateData.recuParId = data.recuParId;
    if (data.priseEnChargeParId !== undefined) updateData.priseEnChargeParId = data.priseEnChargeParId || null;
    if (data.partenaireId !== undefined && data.partenaireId !== existing.partenaireId) {
      if (existing._count.interventions > 0) {
        return NextResponse.json(
          { error: 'Impossible de changer le client : des interventions sont déjà liées à ce ticket' },
          { status: 400 }
        );
      }
      updateData.partenaireId = data.partenaireId;
    }

    // Statut : la fermeture ne se fait que via la fiche d'intervention.
    if (data.statut !== undefined && data.statut !== existing.statut) {
      if (data.statut === 'ferme') {
        return NextResponse.json(
          { error: "Un ticket se ferme en terminant l'intervention qui lui est liée" },
          { status: 400 }
        );
      }
      if (!['ouvert', 'en_cours'].includes(data.statut)) {
        return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
      }
      if (existing.statut === 'ferme' && user.role !== 'admin') {
        return NextResponse.json({ error: 'Seul un administrateur peut réouvrir un ticket fermé' }, { status: 403 });
      }
      updateData.statut = data.statut;
      if (existing.statut === 'ferme') updateData.fermeAt = null;
    } else if (existing.statut === 'ouvert' && (updateData.priseEnChargeParId as string | null)) {
      // Une prise en charge fait passer le ticket « en cours »
      updateData.statut = 'en_cours';
    }

    const ticket = await prisma.ticket.update({ where: { id }, data: updateData, include: TICKET_INCLUDE });
    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du ticket' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const denied = requirePermission(user, 'technique', 'delete');
    if (denied) return denied;

    const { id } = await params;
    const existing = await prisma.ticket.findUnique({
      where: { id },
      include: { _count: { select: { interventions: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Ticket non trouvé' }, { status: 404 });
    }
    if (existing._count.interventions > 0) {
      return NextResponse.json(
        { error: 'Ce ticket a des interventions liées et ne peut pas être supprimé' },
        { status: 400 }
      );
    }

    await prisma.ticket.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
