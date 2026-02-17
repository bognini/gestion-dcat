import { NextResponse } from 'next/server';
import { clearBoutiqueSessionCookie } from '@/lib/boutique-auth';

export async function POST() {
  try {
    await clearBoutiqueSessionCookie();
    return NextResponse.json({ message: 'Déconnecté' });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
