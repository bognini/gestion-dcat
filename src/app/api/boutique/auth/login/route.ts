import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createBoutiqueSession, setBoutiqueSessionCookie } from '@/lib/boutique-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`boutique-login:${ip}`, { maxRequests: 5, windowSeconds: 60 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessayez dans une minute.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email et mot de passe requis' }, { status: 400 });
    }

    const client = await prisma.clientBoutique.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!client) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, client.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Identifiants invalides' }, { status: 401 });
    }

    if (!client.isEmailVerified) {
      return NextResponse.json(
        { error: 'Veuillez vérifier votre adresse email avant de vous connecter. Consultez votre boîte mail.' },
        { status: 403 }
      );
    }

    const token = await createBoutiqueSession(client.id);
    await setBoutiqueSessionCookie(token);

    return NextResponse.json({
      client: {
        id: client.id,
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        telephone: client.telephone,
        adresse: client.adresse,
        ville: client.ville,
        isEmailVerified: client.isEmailVerified,
      },
    });
  } catch (error) {
    console.error('Error logging in boutique client:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
