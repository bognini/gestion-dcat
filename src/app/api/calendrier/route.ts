import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const startParam = request.nextUrl.searchParams.get('start');
    const endParam = request.nextUrl.searchParams.get('end');

    const start = startParam ? new Date(startParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endParam ? new Date(endParam) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    // Fetch interventions (terminée and planifiée)
    const interventions = await prisma.intervention.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        statut: {
          in: ['termine', 'planifie', 'a_faire'],
        },
      },
      select: {
        id: true,
        reference: true,
        date: true,
        statut: true,
        typeMaintenance: true,
        lieu: true,
        partenaire: {
          select: { nom: true },
        },
      },
    });

    // Fetch operations/tasks with dates
    const operations = await prisma.operation.findMany({
      where: {
        OR: [
          {
            dateDebut: {
              gte: start,
              lte: end,
            },
          },
          {
            dateFin: {
              gte: start,
              lte: end,
            },
          },
        ],
      },
      select: {
        id: true,
        intitule: true,
        dateDebut: true,
        dateFin: true,
        statut: true,
        projet: {
          select: { nom: true, reference: true },
        },
      },
    });

    // Fetch tasks with due dates
    const taches = await prisma.tache.findMany({
      where: {
        OR: [
          {
            dateDebut: {
              gte: start,
              lte: end,
            },
          },
          {
            dateFin: {
              gte: start,
              lte: end,
            },
          },
        ],
      },
      select: {
        id: true,
        intitule: true,
        dateDebut: true,
        dateFin: true,
        statut: true,
        operation: {
          select: {
            projet: {
              select: { nom: true },
            },
          },
        },
      },
    });

    // Fetch missions
    const missions = await prisma.ficheMission.findMany({
      where: {
        OR: [
          {
            dateDepart: {
              gte: start,
              lte: end,
            },
          },
          {
            dateRetour: {
              gte: start,
              lte: end,
            },
          },
        ],
        statut: {
          in: ['planifiee', 'en_cours'],
        },
      },
      select: {
        id: true,
        reference: true,
        titre: true,
        destination: true,
        dateDepart: true,
        dateRetour: true,
        statut: true,
        participants: {
          select: {
            utilisateur: {
              select: { prenom: true, nom: true },
            },
          },
          take: 2,
        },
      },
    });

    // Fetch subscription deadlines
    const abonnements = await prisma.abonnement.findMany({
      where: {
        statut: 'actif',
        dateProchainePaiement: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        nom: true,
        fournisseur: true,
        montant: true,
        dateProchainePaiement: true,
        periodicite: true,
      },
    });

    const evenements = await prisma.evenement.findMany({
      where: {
        AND: [
          { dateDebut: { lte: end } },
          { dateFin: { gte: start } },
        ],
      },
      select: {
        id: true,
        titre: true,
        type: true,
        description: true,
        dateDebut: true,
        dateFin: true,
        lieu: true,
        couleur: true,
        participants: {
          select: {
            utilisateur: {
              select: { prenom: true, nom: true },
            },
          },
          take: 3,
        },
      },
      orderBy: { dateDebut: 'asc' },
    });

    // Transform to calendar events
    const events = [
      ...interventions.map(int => ({
        id: `int-${int.id}`,
        titre: `${int.reference || 'Intervention'} - ${int.partenaire.nom}`,
        type: 'intervention',
        typeLabel: int.statut === 'termine' ? 'Terminée' : 'Planifiée',
        dateDebut: int.date,
        dateFin: int.date,
        lieu: int.lieu,
        couleur: int.statut === 'termine' ? '#10b981' : int.typeMaintenance === 'planifiee' ? '#8b5cf6' : '#f59e0b',
        link: `/technique/interventions/${int.id}`,
      })),
      ...operations.map(op => ({
        id: `op-${op.id}`,
        titre: `${op.projet.reference || op.projet.nom}: ${op.intitule}`,
        type: 'operation',
        typeLabel: 'Opération',
        dateDebut: op.dateDebut || op.dateFin,
        dateFin: op.dateFin || op.dateDebut,
        couleur: op.statut === 'termine' ? '#10b981' : '#3b82f6',
        link: null,
      })),
      ...taches.map(t => ({
        id: `task-${t.id}`,
        titre: `Tâche: ${t.intitule}`,
        type: 'tache',
        typeLabel: 'Tâche',
        dateDebut: t.dateDebut || t.dateFin,
        dateFin: t.dateFin || t.dateDebut,
        couleur: t.statut === 'termine' ? '#6b7280' : '#ef4444',
        link: null,
      })),
      ...missions.map((m: { id: string; titre: string; destination: string; dateDepart: Date; dateRetour: Date | null; statut: string; participants: { utilisateur: { prenom: string | null; nom: string } }[] }) => {
        const participantNames = m.participants
          .map((p: { utilisateur: { prenom: string | null; nom: string } }) => [p.utilisateur.prenom, p.utilisateur.nom].filter(Boolean).join(' '))
          .join(', ');
        return {
          id: `mission-${m.id}`,
          titre: `🚗 ${m.titre} - ${m.destination}`,
          type: 'mission',
          typeLabel: 'Mission',
          dateDebut: m.dateDepart,
          dateFin: m.dateRetour || m.dateDepart,
          lieu: m.destination,
          couleur: m.statut === 'en_cours' ? '#f97316' : '#8b5cf6',
          link: `/technique/fiches-mission`,
          description: participantNames ? `Participants: ${participantNames}` : undefined,
        };
      }),
      ...abonnements.map((a: { id: string; nom: string; fournisseur: string; montant: number; dateProchainePaiement: Date | null; periodicite: string }) => ({
        id: `abo-${a.id}`,
        titre: `💳 ${a.nom} - ${a.fournisseur}`,
        type: 'abonnement',
        typeLabel: 'Abonnement',
        dateDebut: a.dateProchainePaiement,
        dateFin: a.dateProchainePaiement,
        couleur: '#ec4899', // Pink for subscriptions
        link: `/administration/abonnements`,
        description: `${a.montant.toLocaleString('fr-FR')} FCFA/${a.periodicite === 'annuel' ? 'an' : 'mois'}`,
      })),
      ...evenements.map((e) => {
        const participantNames = e.participants
          .map((p) => [p.utilisateur.prenom, p.utilisateur.nom].filter(Boolean).join(' '))
          .filter(Boolean)
          .join(', ');
        return {
          id: `evt-${e.id}`,
          titre: e.titre,
          type: 'evenement',
          typeLabel: e.type.replace(/_/g, ' '),
          dateDebut: e.dateDebut,
          dateFin: e.dateFin,
          lieu: e.lieu,
          couleur: e.couleur || '#6366f1',
          link: null,
          description: e.description || (participantNames ? `Participants: ${participantNames}` : undefined),
        };
      }),
    ].filter(e => e.dateDebut); // Filter out events without dates

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
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

    const titre = typeof data.titre === 'string' ? data.titre.trim() : '';
    const type = typeof data.type === 'string' ? data.type.trim() : '';
    const dateDebut = data.dateDebut ? new Date(data.dateDebut) : null;
    const dateFin = data.dateFin ? new Date(data.dateFin) : null;

    if (!titre) {
      return NextResponse.json({ error: 'Titre requis' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Type requis' }, { status: 400 });
    }

    if (!dateDebut || Number.isNaN(dateDebut.getTime())) {
      return NextResponse.json({ error: 'Date début invalide' }, { status: 400 });
    }

    if (!dateFin || Number.isNaN(dateFin.getTime())) {
      return NextResponse.json({ error: 'Date fin invalide' }, { status: 400 });
    }

    if (dateFin < dateDebut) {
      return NextResponse.json({ error: 'La date de fin doit être après la date de début' }, { status: 400 });
    }

    const participantIds = Array.isArray(data.participantIds)
      ? data.participantIds.filter((id: unknown) => typeof id === 'string' && id.trim()).map((id: string) => id.trim())
      : [];

    const evenement = await prisma.evenement.create({
      data: {
        titre,
        type,
        description: typeof data.description === 'string' && data.description.trim() ? data.description.trim() : null,
        dateDebut,
        dateFin,
        journeeEntiere: !!data.journeeEntiere,
        lieu: typeof data.lieu === 'string' && data.lieu.trim() ? data.lieu.trim() : null,
        couleur: typeof data.couleur === 'string' && data.couleur.trim() ? data.couleur.trim() : null,
        rappel: !!data.rappel,
        rappelDelai: typeof data.rappelDelai === 'number' ? data.rappelDelai : null,
        createdById: user.id,
        participants: {
          create: participantIds.map((userId: string) => ({ userId })),
        },
      },
      select: {
        id: true,
        titre: true,
        type: true,
        description: true,
        dateDebut: true,
        dateFin: true,
        lieu: true,
        couleur: true,
        participants: {
          select: { userId: true },
        },
      },
    });

    return NextResponse.json(evenement);
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
