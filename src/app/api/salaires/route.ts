import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mois = searchParams.get('mois'); // Format: YYYY-MM
    const statut = searchParams.get('statut');
    const employeId = searchParams.get('employeId');

    const where: { mois?: { gte: Date; lte: Date }; statut?: string; employeId?: string } = {};

    if (mois) {
      const [year, month] = mois.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      where.mois = { gte: startDate, lte: endDate };
    }
    if (statut && statut !== 'all') where.statut = statut;
    if (employeId) where.employeId = employeId;

    const salaires = await prisma.salaire.findMany({
      where,
      orderBy: [{ mois: 'desc' }, { employe: { nom: 'asc' } }],
      include: {
        employe: {
          select: { 
            id: true, 
            nom: true, 
            prenom: true, 
            poste: true, 
            departement: true,
            salaire: true,
          },
        },
      },
    });

    return NextResponse.json(salaires);
  } catch (error) {
    console.error('Error fetching salaires:', error);
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

    // Bulk creation for a month
    if (data.bulkGenerate && data.mois) {
      const [year, month] = data.mois.split('-').map(Number);
      const moisDate = new Date(year, month - 1, 1);

      // Get all employees with a salary defined
      const employes = await prisma.employe.findMany({
        where: {
          salaire: { not: null },
        },
        select: { id: true, salaire: true, nom: true, prenom: true },
      });

      if (employes.length === 0) {
        return NextResponse.json({ 
          error: 'Aucun employé avec un salaire défini trouvé',
          created: 0 
        }, { status: 400 });
      }

      // Check which employees already have salaries for this month
      const existingSalaires = await prisma.salaire.findMany({
        where: {
          mois: moisDate,
        },
        select: { employeId: true },
      });

      const existingEmployeIds = new Set(existingSalaires.map(s => s.employeId));
      const employesToCreate = employes.filter(e => !existingEmployeIds.has(e.id));

      if (employesToCreate.length === 0) {
        return NextResponse.json({ 
          message: 'Tous les salaires existent déjà pour ce mois',
          created: 0 
        });
      }

      // Create salaries for employees without one
      await prisma.salaire.createMany({
        data: employesToCreate.map(e => ({
          employeId: e.id,
          mois: moisDate,
          salaireBase: e.salaire || 0,
          primes: 0,
          deductions: 0,
          netAPayer: e.salaire || 0,
          statut: 'en_attente',
        })),
      });

      return NextResponse.json({ 
        message: `${employesToCreate.length} salaire(s) généré(s)`,
        created: employesToCreate.length 
      });
    }

    // Single creation
    if (!data.employeId || !data.mois) {
      return NextResponse.json({ error: 'Employé et mois requis' }, { status: 400 });
    }

    const [year, month] = data.mois.split('-').map(Number);
    const moisDate = new Date(year, month - 1, 1);

    const netAPayer = (data.salaireBase || 0) + (data.primes || 0) - (data.deductions || 0);

    const salaire = await prisma.salaire.create({
      data: {
        employeId: data.employeId,
        mois: moisDate,
        salaireBase: data.salaireBase || 0,
        primes: data.primes || 0,
        deductions: data.deductions || 0,
        netAPayer,
        statut: 'en_attente',
        notes: data.notes || null,
      },
      include: {
        employe: {
          select: { id: true, nom: true, prenom: true },
        },
      },
    });

    return NextResponse.json(salaire);
  } catch (error) {
    console.error('Error creating salaire:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
