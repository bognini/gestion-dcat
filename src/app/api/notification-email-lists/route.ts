import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

function normalizeEmails(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const cleaned = input
    .filter((e) => typeof e === 'string')
    .map((e) => e.trim())
    .filter(Boolean);

  return Array.from(new Set(cleaned));
}

export async function GET() {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const lists = await prisma.notificationEmailList.findMany({
      orderBy: { eventKey: 'asc' },
    });

    return NextResponse.json(lists);
  } catch (error) {
    console.error('Error fetching notification email lists:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await request.json();

    const eventKey = typeof data.eventKey === 'string' ? data.eventKey.trim() : '';
    if (!eventKey) {
      return NextResponse.json({ error: 'eventKey requis' }, { status: 400 });
    }

    const label = typeof data.label === 'string' ? data.label.trim() : null;
    const emails = normalizeEmails(data.emails);

    const saved = await prisma.notificationEmailList.upsert({
      where: { eventKey },
      update: {
        label,
        emails,
      },
      create: {
        eventKey,
        label,
        emails,
      },
    });

    return NextResponse.json(saved);
  } catch (error) {
    console.error('Error saving notification email list:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
