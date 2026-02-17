import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 });
    }

    const client = await prisma.clientBoutique.findUnique({
      where: { verificationToken: token },
    });

    if (!client) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 });
    }

    if (client.verificationExpires && client.verificationExpires < new Date()) {
      return NextResponse.json({ error: 'Token expiré. Veuillez vous réinscrire.' }, { status: 400 });
    }

    await prisma.clientBoutique.update({
      where: { id: client.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationExpires: null,
      },
    });

    return NextResponse.json({ message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
