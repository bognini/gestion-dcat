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

    const absence = await prisma.demandeAbsence.update({
      where: { id },
      data: {
        statut: data.statut,
        commentaire: data.commentaire || null,
      },
      include: {
        employe: {
          select: { id: true, nom: true, prenom: true },
        },
      },
    });

    return NextResponse.json(absence);
  } catch (error) {
    console.error('Error updating absence:', error);
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

    await prisma.demandeAbsence.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting absence:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
