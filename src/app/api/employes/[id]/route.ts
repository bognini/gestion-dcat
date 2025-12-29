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

    const employe = await prisma.employe.findUnique({
      where: { id },
      include: {
        utilisateur: {
          select: { id: true, username: true, email: true, isActive: true },
        },
        absences: {
          orderBy: { dateDebut: 'desc' },
          take: 10,
        },
      },
    });

    if (!employe) {
      return NextResponse.json({ error: 'Employé non trouvé' }, { status: 404 });
    }

    // Remove binary data
    return NextResponse.json({
      ...employe,
      photo: undefined,
      cv: undefined,
      hasPhoto: !!employe.photo,
      hasCV: !!employe.cv,
    });
  } catch (error) {
    console.error('Error fetching employe:', error);
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

    const employe = await prisma.employe.update({
      where: { id },
      data: {
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
        dateEmbauche: data.dateEmbauche ? new Date(data.dateEmbauche) : undefined,
        poste: data.poste,
        departement: data.departement || null,
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        salaire: data.salaire ? parseFloat(data.salaire) : null,
        typeContrat: data.typeContrat || null,
        utilisateurId: data.utilisateurId || null,
      },
      include: {
        utilisateur: {
          select: { id: true, username: true, nom: true, prenom: true, email: true },
        },
      },
    });

    return NextResponse.json(employe);
  } catch (error) {
    console.error('Error updating employe:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
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

    await prisma.employe.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employe:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
