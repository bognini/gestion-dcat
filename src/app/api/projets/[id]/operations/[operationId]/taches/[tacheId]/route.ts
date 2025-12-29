import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string; tacheId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { operationId, tacheId } = await params;
    const data = await request.json();

    // Update task
    const updateData: Record<string, unknown> = {};

    if (data.statut !== undefined) updateData.statut = data.statut;
    if (typeof data.intitule === 'string' && data.intitule.trim()) updateData.intitule = data.intitule.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.dureeMinutes !== undefined) updateData.dureeMinutes = data.dureeMinutes === '' ? null : data.dureeMinutes;
    if (data.assigneId !== undefined) updateData.assigneId = data.assigneId || null;
    if (data.dateLimite !== undefined) updateData.dateLimite = data.dateLimite ? new Date(data.dateLimite) : null;

    const tache = await prisma.tache.update({
      where: { id: tacheId },
      data: {
        ...updateData,
      },
    });

    // Check if all tasks in operation are complete
    const allTasks = await prisma.tache.findMany({
      where: { operationId },
    });

    const allComplete = allTasks.length > 0 && allTasks.every(t => t.statut === 'termine');
    const anyInProgress = allTasks.some(t => t.statut === 'en_cours');

    // Auto-update operation status based on tasks
    let newOperationStatus = 'a_faire';
    let newProgression = 0;

    if (allComplete) {
      newOperationStatus = 'termine';
      newProgression = 100;
    } else if (anyInProgress || allTasks.some(t => t.statut === 'termine')) {
      newOperationStatus = 'en_cours';
      const completedCount = allTasks.filter(t => t.statut === 'termine').length;
      newProgression = Math.round((completedCount / allTasks.length) * 100);
    }

    await prisma.operation.update({
      where: { id: operationId },
      data: {
        statut: newOperationStatus,
        progression: newProgression,
      },
    });

    return NextResponse.json(tache);
  } catch (error) {
    console.error('Error updating tache:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; operationId: string; tacheId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { operationId, tacheId } = await params;

    await prisma.tache.delete({
      where: { id: tacheId },
    });

    const remainingTasks = await prisma.tache.findMany({
      where: { operationId },
    });

    const allComplete = remainingTasks.length > 0 && remainingTasks.every(t => t.statut === 'termine');
    const anyInProgress = remainingTasks.some(t => t.statut === 'en_cours');

    let newOperationStatus = 'a_faire';
    let newProgression = 0;

    if (allComplete) {
      newOperationStatus = 'termine';
      newProgression = 100;
    } else if (remainingTasks.length > 0 && (anyInProgress || remainingTasks.some(t => t.statut === 'termine'))) {
      newOperationStatus = 'en_cours';
      const completedCount = remainingTasks.filter(t => t.statut === 'termine').length;
      newProgression = Math.round((completedCount / remainingTasks.length) * 100);
    }

    await prisma.operation.update({
      where: { id: operationId },
      data: {
        statut: newOperationStatus,
        progression: newProgression,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tache:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
