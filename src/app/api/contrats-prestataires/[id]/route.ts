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

    const contrat = await prisma.contratPrestataire.findUnique({
      where: { id },
      include: {
        partenaire: {
          select: { id: true, nom: true, adresse: true, ville: true, email: true, telephone1: true },
        },
      },
    });

    if (!contrat) {
      return NextResponse.json({ error: 'Non trouvé' }, { status: 404 });
    }

    return NextResponse.json(contrat);
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

    const contrat = await prisma.contratPrestataire.update({
      where: { id },
      data: {
        objet: data.objet,
        description: data.description || null,
        montant: data.montant ? parseFloat(data.montant) : undefined,
        dateDebut: data.dateDebut ? new Date(data.dateDebut) : undefined,
        dateFin: data.dateFin ? new Date(data.dateFin) : null,
        delaiExecution: data.delaiExecution || null,
        conditionsPaiement: data.conditionsPaiement || null,
        statut: data.statut,
        notes: data.notes || null,
      },
      include: {
        partenaire: {
          select: { id: true, nom: true },
        },
      },
    });

    return NextResponse.json(contrat);
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

    await prisma.contratPrestataire.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
