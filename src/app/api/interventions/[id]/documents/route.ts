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

    const { id } = await params;

    const documents = await prisma.interventionDocument.findMany({
      where: { interventionId: id },
      select: {
        id: true,
        nom: true,
        filename: true,
        mime: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
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

    const { id } = await params;

    // Check intervention exists
    const intervention = await prisma.intervention.findUnique({ where: { id } });
    if (!intervention) {
      return NextResponse.json({ error: 'Intervention non trouvée' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const nom = formData.get('nom') as string;

    if (!file) {
      return NextResponse.json({ error: 'Fichier requis' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const document = await prisma.interventionDocument.create({
      data: {
        interventionId: id,
        nom: nom || file.name,
        filename: file.name,
        mime: file.type,
        fichier: buffer,
      },
      select: {
        id: true,
        nom: true,
        filename: true,
        mime: true,
        createdAt: true,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'upload' }, { status: 500 });
  }
}
