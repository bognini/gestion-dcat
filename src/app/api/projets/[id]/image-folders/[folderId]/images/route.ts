import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; folderId: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id: projetId, folderId } = await params;
    const formData = await request.formData();
    
    const uploadedImages = [];

    // Process all files in the form data
    for (const [key, value] of formData.entries()) {
      if (value instanceof File && value.type.startsWith('image/')) {
        const bytes = await value.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const image = await prisma.projetImage.create({
          data: {
            projetId,
            folderId,
            description: null,
            fichier: buffer,
            filename: value.name,
            mime: value.type,
          },
        });

        uploadedImages.push({
          id: image.id,
          filename: image.filename,
          mime: image.mime,
          createdAt: image.createdAt,
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: uploadedImages.length,
      images: uploadedImages 
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
