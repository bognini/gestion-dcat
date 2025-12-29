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

    const employe = await prisma.employe.findUnique({
      where: { id },
      select: { cv: true, cvFilename: true, cvMime: true },
    });

    if (!employe || !employe.cv) {
      return NextResponse.json({ error: 'CV non trouvé' }, { status: 404 });
    }

    return new NextResponse(employe.cv, {
      headers: {
        'Content-Type': employe.cvMime || 'application/pdf',
        'Content-Disposition': `inline; filename="${employe.cvFilename || 'cv.pdf'}"`,
      },
    });
  } catch (error) {
    console.error('Error:', error);
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
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    await prisma.employe.update({
      where: { id },
      data: {
        cv: buffer,
        cvFilename: file.name,
        cvMime: file.type,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
