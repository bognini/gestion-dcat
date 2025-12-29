import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periode = searchParams.get('periode') || 'semaine';

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (periode) {
      case 'jour':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'mois':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'semaine':
      default:
        const dayOfWeek = now.getDay();
        const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
    }

    // Get all users who are intervenants on interventions in the period
    const interventionIntervenants = await prisma.interventionIntervenant.findMany({
      where: {
        intervention: {
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
      },
      include: {
        utilisateur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
        intervention: {
          select: {
            id: true,
            reference: true,
            date: true,
            problemeSignale: true,
            typeMaintenance: true,
            statut: true,
            lieu: true,
            partenaire: {
              select: { nom: true },
            },
          },
        },
      },
    });

    // Group by technician
    const technicienMap = new Map<string, {
      id: string;
      nom: string;
      prenom: string | null;
      interventions: Array<{
        id: string;
        reference: string | null;
        date: Date;
        partenaire: { nom: string };
        problemeSignale: string;
        typeMaintenance: string;
        statut: string;
        lieu: string | null;
      }>;
    }>();

    for (const ii of interventionIntervenants) {
      const userId = ii.utilisateur.id;
      if (!technicienMap.has(userId)) {
        technicienMap.set(userId, {
          id: userId,
          nom: ii.utilisateur.nom,
          prenom: ii.utilisateur.prenom,
          interventions: [],
        });
      }
      technicienMap.get(userId)!.interventions.push(ii.intervention);
    }

    // Convert to array and sort by name
    const techniciens = Array.from(technicienMap.values())
      .sort((a, b) => a.nom.localeCompare(b.nom))
      .map(t => ({
        ...t,
        interventions: t.interventions.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ),
      }));

    return NextResponse.json(techniciens);
  } catch (error) {
    console.error('Error fetching programme:', error);
    return NextResponse.json({ error: 'Failed to fetch programme' }, { status: 500 });
  }
}
