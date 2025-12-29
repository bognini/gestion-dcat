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

    const images = await prisma.projetImage.findMany({
      where: { projetId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        description: true,
        filename: true,
        mime: true,
        createdAt: true,
      },
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error fetching project images:', error);
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
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const image = await prisma.projetImage.create({
      data: {
        projetId,
        description: description || null,
        fichier: buffer,
        filename: file.name,
        mime: file.type,
      },
    });

    return NextResponse.json({
      id: image.id,
      description: image.description,
      filename: image.filename,
      mime: image.mime,
      createdAt: image.createdAt,
    });
  } catch (error) {
    console.error('Error uploading project image:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
