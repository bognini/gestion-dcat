import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { requirePermission } from '@/lib/api-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const denied = requirePermission(user, 'technique', 'write');
    if (denied) return denied;

    const { operationId } = await params;
    const data = await request.json();

    const tache = await prisma.tache.create({
      data: {
        intitule: data.intitule,
        description: data.description || null,
        dureeMinutes: data.dureeMinutes || null,
        dateLimite: data.dateLimite ? new Date(data.dateLimite) : null,
        operationId,
        assigneId: data.assigneId || null,
      },
    });

    return NextResponse.json(tache);
  } catch (error) {
    console.error('Error creating tache:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
