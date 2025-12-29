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

    const config = await prisma.mailConfig.findFirst();

    return NextResponse.json({
      id: config?.id || null,
      smtpHost: config?.smtpHost || '',
      smtpPort: config?.smtpPort || 587,
      smtpUser: config?.smtpUser || '',
      hasPassword: !!config?.smtpPass,
      smtpFrom: config?.smtpFrom || '',
      smtpFromName: config?.smtpFromName || 'Gestion DCAT',
      smtpSecure: config?.smtpSecure ?? true,
      notificationEmails: config?.notificationEmails || [],
    });
  } catch (error) {
    console.error('Error fetching mail config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await request.json();

    const existing = await prisma.mailConfig.findFirst({ select: { id: true } });

    const smtpHost = typeof data.smtpHost === 'string' ? data.smtpHost.trim() : undefined;
    const smtpUser = typeof data.smtpUser === 'string' ? data.smtpUser.trim() : undefined;
    const smtpFrom = typeof data.smtpFrom === 'string' ? data.smtpFrom.trim() : undefined;
    const smtpFromName = typeof data.smtpFromName === 'string' ? data.smtpFromName.trim() : undefined;
    const smtpSecure = typeof data.smtpSecure === 'boolean' ? data.smtpSecure : undefined;

    const smtpPort =
      typeof data.smtpPort === 'number'
        ? data.smtpPort
        : typeof data.smtpPort === 'string' && data.smtpPort.trim() && !Number.isNaN(parseInt(data.smtpPort, 10))
          ? parseInt(data.smtpPort, 10)
          : undefined;

    const nextPassword = typeof data.smtpPass === 'string' ? data.smtpPass : undefined;
    const shouldUpdatePassword = typeof nextPassword === 'string' && nextPassword.trim().length > 0;

    const notificationEmails = data.notificationEmails !== undefined ? normalizeEmails(data.notificationEmails) : undefined;

    const dataToWrite = {
      ...(smtpHost !== undefined ? { smtpHost: smtpHost || null } : {}),
      ...(smtpPort !== undefined ? { smtpPort } : {}),
      ...(smtpUser !== undefined ? { smtpUser: smtpUser || null } : {}),
      ...(shouldUpdatePassword ? { smtpPass: nextPassword.trim() } : {}),
      ...(smtpFrom !== undefined ? { smtpFrom: smtpFrom || null } : {}),
      ...(smtpFromName !== undefined ? { smtpFromName: smtpFromName || null } : {}),
      ...(smtpSecure !== undefined ? { smtpSecure } : {}),
      ...(notificationEmails !== undefined ? { notificationEmails } : {}),
    };

    const saved = existing
      ? await prisma.mailConfig.update({
          where: { id: existing.id },
          data: dataToWrite,
        })
      : await prisma.mailConfig.create({
          data: {
            smtpHost: smtpHost || null,
            smtpPort: smtpPort || 587,
            smtpUser: smtpUser || null,
            smtpPass: shouldUpdatePassword ? nextPassword.trim() : null,
            smtpFrom: smtpFrom || null,
            smtpFromName: smtpFromName || 'Gestion DCAT',
            smtpSecure: smtpSecure ?? true,
            notificationEmails: notificationEmails || [],
          },
        });

    return NextResponse.json({
      id: saved.id,
      smtpHost: saved.smtpHost || '',
      smtpPort: saved.smtpPort || 587,
      smtpUser: saved.smtpUser || '',
      hasPassword: !!saved.smtpPass,
      smtpFrom: saved.smtpFrom || '',
      smtpFromName: saved.smtpFromName || 'Gestion DCAT',
      smtpSecure: saved.smtpSecure,
      notificationEmails: saved.notificationEmails || [],
    });
  } catch (error) {
    console.error('Error saving mail config:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
