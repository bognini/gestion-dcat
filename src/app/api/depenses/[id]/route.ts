import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

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

    const depense = await prisma.depense.update({
      where: { id },
      data: {
        description: data.description?.trim(),
        montant: data.montant,
        categorie: data.categorie,
        date: data.date ? new Date(data.date) : undefined,
      },
    });

    return NextResponse.json(depense);
  } catch (error) {
    console.error('Error updating depense:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
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

    await prisma.depense.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting depense:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
