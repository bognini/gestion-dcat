import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { operationId } = await params;
    const data = await request.json();

    const updateData: Record<string, unknown> = {};
    if (typeof data.intitule === 'string' && data.intitule.trim()) updateData.intitule = data.intitule.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.dateLimite !== undefined) updateData.dateLimite = data.dateLimite ? new Date(data.dateLimite) : null;
    if (data.responsableId !== undefined) updateData.responsableId = data.responsableId || null;

    const operation = await prisma.operation.update({
      where: { id: operationId },
      data: updateData,
    });

    return NextResponse.json(operation);
  } catch (error) {
    console.error('Error updating operation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { operationId } = await params;

    await prisma.operation.delete({
      where: { id: operationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting operation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
