import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Find the employee linked to this user
    const employe = await prisma.employe.findUnique({
      where: { utilisateurId: user.id },
      include: {
        absences: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        fichesTransport: {
          orderBy: { date: 'desc' },
          take: 10,
          include: {
            lignes: {
              include: {
                partenaire: {
                  select: { id: true, nom: true },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
      },
      employe: employe ? {
        ...employe,
        photo: undefined,
        cv: undefined,
        hasPhoto: !!employe.photo,
        hasCV: !!employe.cv,
      } : null,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
