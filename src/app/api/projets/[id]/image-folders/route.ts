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

    const { id: projetId } = await params;

    const folders = await prisma.projetImageFolder.findMany({
      where: { projetId },
      include: {
        images: {
          select: {
            id: true,
            description: true,
            filename: true,
            mime: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { images: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching image folders:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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

    if (!data.nom?.trim()) {
      return NextResponse.json({ error: 'Le nom du dossier est requis' }, { status: 400 });
    }

    const folder = await prisma.projetImageFolder.create({
      data: {
        projetId,
        nom: data.nom.trim(),
        description: data.description?.trim() || null,
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error creating image folder:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
