import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const adminUser = await prisma.utilisateur.findFirst({
      where: { role: 'admin' },
    });

    return NextResponse.json({ adminExists: !!adminUser });
  } catch (error) {
    console.error('Check admin error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}
