import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import { sendNotificationEmail } from '@/lib/mail';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const includeInactive = request.nextUrl.searchParams.get('all') === 'true';
    const availableOnly = request.nextUrl.searchParams.get('available') === 'true';

    // Build where clause
    const whereClause: { isActive?: boolean; employe?: null } = {};
    if (!includeInactive) {
      whereClause.isActive = true;
    }
    if (availableOnly) {
      // Only users not linked to an employee
      whereClause.employe = null;
    }

    const utilisateurs = await prisma.utilisateur.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
      orderBy: [{ prenom: 'asc' }, { nom: 'asc' }],
    });

    return NextResponse.json(utilisateurs);
  } catch (error) {
    console.error('Error fetching utilisateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Only admins can create users
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await request.json();

    // Validate required fields
    if (!data.username?.trim()) {
      return NextResponse.json({ error: "Le nom d'utilisateur est requis" }, { status: 400 });
    }
    if (!data.email?.trim()) {
      return NextResponse.json({ error: "L'email est requis" }, { status: 400 });
    }
    if (!data.nom?.trim()) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 });
    }
    if (!data.password?.trim() || data.password.length < 6) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 6 caractères' }, { status: 400 });
    }

    // Check for existing username or email
    const existing = await prisma.utilisateur.findFirst({
      where: {
        OR: [
          { username: data.username.trim() },
          { email: data.email.trim() },
        ],
      },
    });

    if (existing) {
      if (existing.username === data.username.trim()) {
        return NextResponse.json({ error: "Ce nom d'utilisateur existe déjà" }, { status: 400 });
      }
      return NextResponse.json({ error: 'Cet email existe déjà' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const utilisateur = await prisma.utilisateur.create({
      data: {
        username: data.username.trim(),
        email: data.email.trim(),
        password: hashedPassword,
        nom: data.nom.trim(),
        prenom: data.prenom?.trim() || null,
        role: data.role || 'technicien',
        isActive: data.isActive ?? true,
        mustChangePassword: true,
      },
      select: {
        id: true,
        username: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Send notification email for new user creation
    const fullName = [utilisateur.prenom, utilisateur.nom].filter(Boolean).join(' ');
    const roleLabels: Record<string, string> = {
      admin: 'Administrateur',
      technicien: 'Technicien',
      marketing: 'Marketing',
      comptable: 'Comptable',
    };
    sendNotificationEmail(
      'new_user',
      `Nouvel utilisateur créé: ${fullName}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">Nouvel utilisateur créé</h2>
          <p>Un nouveau compte utilisateur a été créé dans Gestion DCAT.</p>
          <table style="border-collapse: collapse; width: 100%; margin-top: 16px;">
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Nom complet</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${fullName}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Identifiant</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${utilisateur.username}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${utilisateur.email}</td></tr>
            <tr><td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Rôle</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${roleLabels[utilisateur.role] || utilisateur.role}</td></tr>
          </table>
          <p style="margin-top: 16px; color: #6b7280; font-size: 12px;">Cette notification a été envoyée automatiquement par Gestion DCAT.</p>
        </div>
      `
    ).catch(console.error);

    return NextResponse.json(utilisateur);
  } catch (error) {
    console.error('Error creating utilisateur:', error);
    return NextResponse.json({ error: 'Erreur lors de la création' }, { status: 500 });
  }
}
