import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, createSession, setSessionCookie } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 attempts per 60 seconds per IP
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`login:${ip}`, { maxRequests: 5, windowSeconds: 60 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives de connexion. Veuillez réessayer dans une minute.' },
        { status: 429, headers: { 'Retry-After': Math.ceil((rateLimit.resetAt - Date.now()) / 1000).toString() } }
      );
    }

    const { usernameOrEmail, password } = await request.json();

    if (!usernameOrEmail || !password) {
      return NextResponse.json(
        { error: 'Identifiant et mot de passe requis' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(usernameOrEmail, password);

    if (!user) {
      return NextResponse.json(
        { error: 'Identifiants invalides' },
        { status: 401 }
      );
    }

    // Create session
    const userAgent = request.headers.get('user-agent') || undefined;
    const forwarded = request.headers.get('x-forwarded-for');
    const ipAddress = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || undefined;
    
    const token = await createSession(user.id, userAgent, ipAddress);
    await setSessionCookie(token);

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la connexion' },
      { status: 500 }
    );
  }
}
