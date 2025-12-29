import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const partenaireId = request.nextUrl.searchParams.get('partenaireId');

    const contacts = await prisma.contact.findMany({
      where: partenaireId ? { partenaireId } : {},
      orderBy: [{ estPrincipal: 'desc' }, { nom: 'asc' }],
      include: {
        partenaire: { select: { id: true, nom: true } },
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const data = await request.json();

    if (!data.nom?.trim()) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }
    if (!data.partenaireId) {
      return NextResponse.json({ error: 'Le partenaire est requis' }, { status: 400 });
    }

    // If this contact is set as principal, unset others
    if (data.estPrincipal) {
      await prisma.contact.updateMany({
        where: { partenaireId: data.partenaireId },
        data: { estPrincipal: false },
      });
    }

    const contact = await prisma.contact.create({
      data: {
        nom: data.nom.trim(),
        prenom: data.prenom?.trim() || null,
        fonction: data.fonction?.trim() || null,
        email: data.email?.trim() || null,
        telephone: data.telephone?.trim() || null,
        estPrincipal: data.estPrincipal || false,
        partenaireId: data.partenaireId,
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
