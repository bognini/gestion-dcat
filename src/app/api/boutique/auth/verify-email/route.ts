import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    const client = await prisma.clientBoutique.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!client) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 });
    }

    if (client.emailVerificationExpiry && client.emailVerificationExpiry < new Date()) {
      return NextResponse.json({ error: 'Token expiré. Veuillez vous réinscrire.' }, { status: 400 });
    }

    await prisma.clientBoutique.update({
      where: { id: client.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      },
    });

    return NextResponse.json({ message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
