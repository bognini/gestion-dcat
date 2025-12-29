import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const depenses = await prisma.depense.findMany({
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(depenses);
  } catch (error) {
    console.error('Error fetching depenses:', error);
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

    const depense = await prisma.depense.create({
      data: {
        description: data.description,
        montant: data.montant,
        categorie: data.categorie,
        date: new Date(data.date),
      },
    });

    return NextResponse.json(depense);
  } catch (error) {
    console.error('Error creating depense:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
