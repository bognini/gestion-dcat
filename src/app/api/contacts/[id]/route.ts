import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;
    const data = await request.json();

    if (!data.nom?.trim()) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }

    // Get current contact to know the partenaireId
    const currentContact = await prisma.contact.findUnique({ where: { id } });
    if (!currentContact) {
      return NextResponse.json({ error: 'Contact non trouvé' }, { status: 404 });
    }

    // If this contact is set as principal, unset others
    if (data.estPrincipal) {
      await prisma.contact.updateMany({
        where: { partenaireId: currentContact.partenaireId, NOT: { id } },
        data: { estPrincipal: false },
      });
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        nom: data.nom.trim(),
        prenom: data.prenom?.trim() || null,
        fonction: data.fonction?.trim() || null,
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        estPrincipal: data.estPrincipal || false,
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    await prisma.contact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
