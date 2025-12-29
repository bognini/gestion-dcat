import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const employes = await prisma.employe.findMany({
      orderBy: { nom: 'asc' },
      include: {
        utilisateur: {
          select: { id: true, username: true, email: true, isActive: true },
        },
        _count: {
          select: { absences: true },
        },
      },
    });

    // Remove binary data from response
    const result = employes.map(e => ({
      ...e,
      photo: undefined,
      cv: undefined,
      hasPhoto: !!e.photo,
      hasCV: !!e.cv,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching employes:', error);
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

    if (!data.nom?.trim() || !data.prenom?.trim()) {
      return NextResponse.json({ error: 'Nom et prénom requis' }, { status: 400 });
    }
    if (!data.poste?.trim()) {
      return NextResponse.json({ error: 'Poste requis' }, { status: 400 });
    }
    if (!data.dateEmbauche) {
      return NextResponse.json({ error: 'Date d\'embauche requise' }, { status: 400 });
    }

    const employe = await prisma.employe.create({
      data: {
        nom: data.nom,
        prenom: data.prenom,
        dateNaissance: data.dateNaissance ? new Date(data.dateNaissance) : null,
        dateEmbauche: new Date(data.dateEmbauche),
        poste: data.poste,
        departement: data.departement || null,
        email: data.email || null,
        telephone: data.telephone || null,
        adresse: data.adresse || null,
        salaire: data.salaire ? parseFloat(data.salaire) : null,
        typeContrat: data.typeContrat || null,
      },
    });

    return NextResponse.json(employe);
  } catch (error) {
    console.error('Error creating employe:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
