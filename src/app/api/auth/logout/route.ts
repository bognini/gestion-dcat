import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession, clearSessionCookie } from '@/lib/auth';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('gestion_dcat_session')?.value;

    if (sessionToken) {
      await deleteSession(sessionToken);
    }

    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la déconnexion' },
      { status: 500 }
    );
  }
}
