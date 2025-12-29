import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const charges = await prisma.charge.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(charges);
  } catch (error) {
    console.error('Error fetching charges:', error);
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

    const charge = await prisma.charge.create({
      data: {
        nom: data.nom,
        description: data.description || null,
        montant: data.montant,
        type: data.type,
        frequence: data.frequence,
        dateDebut: new Date(data.dateDebut),
        dateFin: data.dateFin ? new Date(data.dateFin) : null,
        isActive: true,
      },
    });

    return NextResponse.json(charge);
  } catch (error) {
    console.error('Error creating charge:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
