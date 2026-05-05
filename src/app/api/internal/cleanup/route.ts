import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const secret = process.env.CLEANUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 503 });
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const [sessions, boutiqueSessions] = await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.clientBoutiqueSession.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]);

  return NextResponse.json({
    deleted: {
      sessions: sessions.count,
      boutiqueSessions: boutiqueSessions.count,
    },
    timestamp: now.toISOString(),
  });
}
