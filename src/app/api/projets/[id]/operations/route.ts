import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: projetId } = await params;
    const data = await request.json();

    const operation = await prisma.operation.create({
      data: {
        intitule: data.intitule,
        description: data.description || null,
        dateLimite: data.dateLimite ? new Date(data.dateLimite) : null,
        responsableId: data.responsableId || null,
        projetId,
      },
    });

    return NextResponse.json(operation);
  } catch (error) {
    console.error('Error creating operation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
