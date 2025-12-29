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

    const salaire = await prisma.salaire.findUnique({
      where: { id },
      include: {
        employe: {
          select: { id: true, nom: true, prenom: true, poste: true },
        },
      },
    });

    if (!salaire) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
    }

    return NextResponse.json(salaire);
  } catch (error) {
    console.error('Error:', error);
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

    const netAPayer = (data.salaireBase || 0) + (data.primes || 0) - (data.deductions || 0);

    const salaire = await prisma.salaire.update({
      where: { id },
      data: {
        salaireBase: data.salaireBase,
        primes: data.primes || 0,
        deductions: data.deductions || 0,
        netAPayer,
        statut: data.statut,
        datePaiement: data.datePaiement ? new Date(data.datePaiement) : null,
        modePaiement: data.modePaiement || null,
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
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
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

    const { id } = await params;

    await prisma.salaire.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
