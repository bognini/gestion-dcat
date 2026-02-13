import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, validatePassword } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 attempts per 10 minutes per IP
    const ip = getClientIp(request);
    const rateLimit = checkRateLimit(`setup:${ip}`, { maxRequests: 3, windowSeconds: 600 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer plus tard.' },
        { status: 429 }
      );
    }

    // Check if admin already exists
    const existingAdmin = await prisma.utilisateur.findFirst({
      where: { role: 'admin' },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Un administrateur existe déjà' },
        { status: 400 }
      );
    }

    const { nom, username, email, password } = await request.json();

    // Validate required fields
    if (!nom || !username || !email || !password) {
      return NextResponse.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'Le mot de passe ne respecte pas les critères de sécurité' },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const existingUser = await prisma.utilisateur.findFirst({
      where: {
        OR: [
          { username },
          { email: email.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ce nom d\'utilisateur ou cette adresse e-mail est déjà utilisé(e)' },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);

    const user = await prisma.utilisateur.create({
      data: {
        nom,
        username,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        mustChangePassword: false,
      },
      select: {
        id: true,
        username: true,
        email: true,
        nom: true,
        role: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la configuration' },
      { status: 500 }
    );
  }
}
