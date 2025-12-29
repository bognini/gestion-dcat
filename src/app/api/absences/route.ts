import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const absences = await prisma.demandeAbsence.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        employe: {
          select: { id: true, nom: true, prenom: true, poste: true },
        },
      },
    });

    return NextResponse.json(absences);
  } catch (error) {
    console.error('Error fetching absences:', error);
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

    if (!data.employeId) {
      return NextResponse.json({ error: 'Employé requis' }, { status: 400 });
    }
    if (!data.type) {
      return NextResponse.json({ error: 'Type d\'absence requis' }, { status: 400 });
    }
    if (!data.dateDebut || !data.dateFin) {
      return NextResponse.json({ error: 'Dates requises' }, { status: 400 });
    }

    const absence = await prisma.demandeAbsence.create({
      data: {
        employeId: data.employeId,
        type: data.type,
        dateDebut: new Date(data.dateDebut),
        dateFin: new Date(data.dateFin),
        motif: data.motif || null,
        statut: 'en_attente',
      },
      include: {
        employe: {
          select: { id: true, nom: true, prenom: true },
        },
      },
    });

    return NextResponse.json(absence);
  } catch (error) {
    console.error('Error creating absence:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
