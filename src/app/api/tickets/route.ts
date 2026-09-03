import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/api-auth';
import { nextReference, pad } from '@/lib/sequence';
import { sendTicketSupportMail } from '@/lib/ticket-mail';
import { MODE_SIGNALEMENT_VALUES, TICKET_STATUT_VALUES } from '@/lib/tickets';

const TICKET_INCLUDE = {
  partenaire: { select: { id: true, nom: true } },
  recuPar: { select: { id: true, nom: true, prenom: true } },
  priseEnChargePar: { select: { id: true, nom: true, prenom: true } },
  createdBy: { select: { id: true, nom: true, prenom: true } },
  _count: { select: { interventions: true } },
} as const;

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }
    const denied = requirePermission(user, 'technique', 'read');
    if (denied) return denied;

    const sp = request.nextUrl.searchParams;
    const statut = sp.get('statut');
    const partenaireId = sp.get('partenaireId');
    const from = sp.get('from');
    const to = sp.get('to');
    const q = sp.get('q')?.trim();
    const limit = Math.min(parseInt(sp.get('limit') || '300'), 1000);

    const where: Record<string, unknown> = {};
    if (statut && statut !== 'all' && TICKET_STATUT_VALUES.includes(statut)) where.statut = statut;
    if (partenaireId) where.partenaireId = partenaireId;
    if (from || to) {
      const range: Record<string, Date> = {};
      if (from) range.gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        range.lte = end;
      }
      where.dateSignalement = range;
    }
    if (q) {
      where.OR = [
        { numero: { contains: q, mode: 'insensitive' } },
        { incident: { contains: q, mode: 'insensitive' } },
        { signaleParNom: { contains: q, mode: 'insensitive' } },
        { partenaire: { nom: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      take: limit,
      orderBy: { dateSignalement: 'desc' },
      include: TICKET_INCLUDE,
    });

    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Error fetching tickets:', error);
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

    if (!data.partenaireId) {
      return NextResponse.json({ error: 'Le client est requis' }, { status: 400 });
    }
    if (!data.incident?.trim()) {
      return NextResponse.json({ error: "L'incident signalé est requis" }, { status: 400 });
    }
    const dateSignalement = data.dateSignalement ? new Date(data.dateSignalement) : new Date();
    if (isNaN(dateSignalement.getTime())) {
      return NextResponse.json({ error: 'Date de signalement invalide' }, { status: 400 });
    }
    if (dateSignalement.getTime() > Date.now() + 5 * 60 * 1000) {
      return NextResponse.json({ error: 'La date de signalement ne peut pas être dans le futur' }, { status: 400 });
    }
    if (!data.signaleParNom?.trim()) {
      return NextResponse.json({ error: 'Le nom de la personne ayant signalé est requis' }, { status: 400 });
    }
    if (!data.modeSignalement || !MODE_SIGNALEMENT_VALUES.includes(data.modeSignalement)) {
      return NextResponse.json({ error: 'Mode de signalisation invalide' }, { status: 400 });
    }

    const recuParId: string = data.recuParId || user.id;
    const [partenaire, recuPar, priseEnChargePar] = await Promise.all([
      prisma.partenaire.findUnique({ where: { id: data.partenaireId }, select: { id: true, nom: true } }),
      prisma.utilisateur.findUnique({ where: { id: recuParId }, select: { id: true } }),
      data.priseEnChargeParId
        ? prisma.utilisateur.findUnique({ where: { id: data.priseEnChargeParId }, select: { id: true } })
        : Promise.resolve(null),
    ]);
    if (!partenaire) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }
    if (!recuPar) {
      return NextResponse.json({ error: 'Utilisateur « À » introuvable' }, { status: 404 });
    }
    if (data.priseEnChargeParId && !priseEnChargePar) {
      return NextResponse.json({ error: 'Utilisateur « Prise en charge par » introuvable' }, { status: 404 });
    }

    const year = dateSignalement.getFullYear();
    const numero = await nextReference(
      `ticket:${year}`,
      (n) => `TCK-${year}-${pad(n)}`,
      async (ref) => !!(await prisma.ticket.findUnique({ where: { numero: ref }, select: { id: true } }))
    );

    const ticket = await prisma.ticket.create({
      data: {
        numero,
        partenaireId: partenaire.id,
        incident: data.incident.trim(),
        dateSignalement,
        signaleParNom: data.signaleParNom.trim(),
        signaleParPrenoms: data.signaleParPrenoms?.trim() || null,
        recuParId,
        modeSignalement: data.modeSignalement,
        priseEnChargeParId: data.priseEnChargeParId || null,
        statut: data.priseEnChargeParId ? 'en_cours' : 'ouvert',
        createdById: user.id,
      },
      include: TICKET_INCLUDE,
    });

    // Mail au support DCAT (asynchrone, ne bloque pas la création)
    const envoyerMail = data.envoyerMailSupport !== false;
    if (envoyerMail) {
      sendTicketSupportMail(ticket.id).catch(console.error);
    }

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json({ error: 'Erreur lors de la création du ticket' }, { status: 500 });
  }
}
