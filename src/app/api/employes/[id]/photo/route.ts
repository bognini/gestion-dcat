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
      select: { photo: true, photoFilename: true, photoMime: true },
    });

    if (!employe || !employe.photo) {
      return NextResponse.json({ error: 'Photo non trouvée' }, { status: 404 });
    }

    return new NextResponse(employe.photo, {
      headers: {
        'Content-Type': employe.photoMime || 'image/jpeg',
        'Content-Disposition': `inline; filename="${employe.photoFilename || 'photo.jpg'}"`,
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
        photo: buffer,
        photoFilename: file.name,
        photoMime: file.type,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Erreur' }, { status: 500 });
  }
}
