import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';

// GET /api/settings - Get all settings or filter by category
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const key = searchParams.get('key');

    // If requesting a specific key, return just that value (public access for boutique)
    // Only allow whitelisted keys for unauthenticated access
    const PUBLIC_KEYS = ['whatsapp_number', 'boutique_phone', 'boutique_email', 'boutique_address'];
    if (key) {
      if (!PUBLIC_KEYS.includes(key)) {
        // Non-public keys require authentication
        const session = await getSessionFromCookie();
        if (!session) {
          return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }
      }
      const setting = await prisma.setting.findUnique({
        where: { key },
      });
      return NextResponse.json(setting || { key, value: null });
    }

    // For listing all settings, require authentication
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const where = category ? { category } : {};
    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/settings - Update multiple settings
export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromCookie();
    if (!session) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const data = await request.json();
    
    // data should be an array of { key, value, label?, category? }
    const settings = Array.isArray(data) ? data : [data];
    
    const results = await Promise.all(
      settings.map(async (setting: { key: string; value: string; label?: string; category?: string }) => {
        return prisma.setting.upsert({
          where: { key: setting.key },
          update: { 
            value: setting.value,
            ...(setting.label && { label: setting.label }),
          },
          create: {
            key: setting.key,
            value: setting.value,
            label: setting.label || setting.key,
            category: setting.category || 'general',
          },
        });
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
