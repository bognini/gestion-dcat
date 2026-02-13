import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie, hashPassword, verifyPassword, validatePassword } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function PUT(request: NextRequest) {
  try {
    // Rate limit: 3 attempts per 5 minutes per IP
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`change-pwd:${ip}`, { maxRequests: 3, windowSeconds: 300 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer dans quelques minutes.' },
        { status: 429 }
      );
    }

    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await request.json();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Les mots de passe ne correspondent pas' }, { status: 400 });
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      return NextResponse.json({ error: 'Le mot de passe ne respecte pas les critères de sécurité' }, { status: 400 });
    }

    // Fetch current user with password
    const dbUser = await prisma.utilisateur.findUnique({
      where: { id: user.id },
      select: { password: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, dbUser.password);
    if (!isValid) {
      return NextResponse.json({ error: 'Le mot de passe actuel est incorrect' }, { status: 403 });
    }

    // Hash and save new password
    const hashedPassword = await hashPassword(newPassword);
    await prisma.utilisateur.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    return NextResponse.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
