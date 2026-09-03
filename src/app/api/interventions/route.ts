import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nextReference, pad } from '@/lib/sequence';
import { getSessionFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const statut = request.nextUrl.searchParams.get('statut');
    const type = request.nextUrl.searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (statut && statut !== 'all') where.statut = statut;
    if (type && type !== 'all') where.typeMaintenance = type;

    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '200'), 500);

    const interventions = await prisma.intervention.findMany({
      take: limit,
      where,
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        ticket: { select: { id: true, numero: true, statut: true } },
        intervenants: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(interventions);
  } catch (error) {
    console.error('Error fetching interventions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const denied = requirePermission(user, 'technique', 'write');
    if (denied) return denied;

    const data = await request.json();

    // Ticket d'incident lié (optionnel : le reporting a posteriori reste possible sans ticket)
    let ticket: { id: string; partenaireId: string; statut: string; incident: string } | null = null;
    if (data.ticketId) {
      ticket = await prisma.ticket.findUnique({
        where: { id: data.ticketId },
        select: { id: true, partenaireId: true, statut: true, incident: true },
      });
      if (!ticket) {
        return NextResponse.json({ error: 'Ticket introuvable' }, { status: 404 });
      }
      if (!data.partenaireId) data.partenaireId = ticket.partenaireId;
      if (data.partenaireId !== ticket.partenaireId) {
        return NextResponse.json({ error: 'Le client de l\'intervention doit être celui du ticket' }, { status: 400 });
      }
      if (!data.problemeSignale?.trim()) data.problemeSignale = ticket.incident;
    }

    // Validate required fields
    if (!data.partenaireId) {
      return NextResponse.json({ error: 'Le partenaire est requis' }, { status: 400 });
    }
    if (!data.date) {
      return NextResponse.json({ error: 'La date est requise' }, { status: 400 });
    }
    if (!data.problemeSignale?.trim()) {
      return NextResponse.json({ error: 'Le problème signalé est requis' }, { status: 400 });
    }
    if (!data.typeMaintenance) {
      return NextResponse.json({ error: 'Le type de maintenance est requis' }, { status: 400 });
    }

    // Référence unique YYYY-XXXX via séquence atomique
    const year = new Date().getFullYear();
    const reference = await nextReference(
      `intervention:${year}`,
      (n) => `${year}-${pad(n)}`,
      async (ref) => !!(await prisma.intervention.findUnique({ where: { reference: ref }, select: { id: true } }))
    );

    const statut: string = data.statut || 'a_faire';

    const intervention = await prisma.$transaction(async (tx) => {
      // Le ticket suit l'intervention : terminé → fermé, sinon en cours.
      // Mis à jour avant la création pour que la réponse reflète le nouveau statut du ticket.
      if (ticket) {
        await tx.ticket.update({
          where: { id: ticket.id },
          data: statut === 'termine'
            ? { statut: 'ferme', fermeAt: new Date() }
            : { statut: 'en_cours', fermeAt: null },
        });
      }

      const created = await tx.intervention.create({
      data: {
        reference,
        ticketId: ticket?.id || null,
        date: new Date(data.date),
        partenaireId: data.partenaireId,
        problemeSignale: data.problemeSignale.trim(),
        typeMaintenance: data.typeMaintenance,
        typeDefaillance: data.typeDefaillance || null,
        causeDefaillance: data.causeDefaillance || null,
        modeIntervention: data.modeIntervention || null,
        lieu: data.lieu?.trim() || null,
        dureeMinutes: data.dureeMinutes ? parseInt(data.dureeMinutes) : null,
        rapport: data.rapport?.trim() || null,
        recommandations: data.recommandations?.trim() || null,
        statut,
        intervenants: data.intervenantIds?.length > 0 ? {
          create: data.intervenantIds.map((userId: string) => ({
            userId,
          })),
        } : undefined,
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
        ticket: { select: { id: true, numero: true, statut: true } },
        intervenants: {
          include: {
            utilisateur: {
              select: { id: true, nom: true, prenom: true },
            },
          },
        },
      },
      });
      return created;
    });

    return NextResponse.json(intervention);
  } catch (error) {
    console.error('Error creating intervention:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
