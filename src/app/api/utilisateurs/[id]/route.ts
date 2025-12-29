import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionFromCookie } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { id } = await params;

    const utilisateur = await prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!utilisateur) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json(utilisateur);
  } catch (error) {
    console.error('Error fetching utilisateur:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Only admins can update users (except self-updates for password)
    const { id } = await params;
    const isSelf = user.id === id;
    
    if (!isSelf && user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const data = await request.json();

    // Check if user exists
    const existing = await prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Admin can update all fields
    if (user.role === 'admin') {
      if (data.nom?.trim()) updateData.nom = data.nom.trim();
      if (data.prenom !== undefined) updateData.prenom = data.prenom?.trim() || null;
      if (data.email?.trim()) {
        // Check for duplicate email
        const emailExists = await prisma.utilisateur.findFirst({
          where: { email: data.email.trim(), NOT: { id } },
        });
        if (emailExists) {
          return NextResponse.json({ error: 'Cet email existe déjà' }, { status: 400 });
        }
        updateData.email = data.email.trim();
      }
      if (data.username?.trim()) {
        // Check for duplicate username
        const usernameExists = await prisma.utilisateur.findFirst({
          where: { username: data.username.trim(), NOT: { id } },
        });
        if (usernameExists) {
          return NextResponse.json({ error: "Ce nom d'utilisateur existe déjà" }, { status: 400 });
        }
        updateData.username = data.username.trim();
      }
      if (data.role) updateData.role = data.role;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
    }

    // Password update (admin or self)
    if (data.password?.trim() && data.password.length >= 6) {
      updateData.password = await bcrypt.hash(data.password, 10);
      updateData.mustChangePassword = false;
    }

    // Reset password flag (admin only)
    if (user.role === 'admin' && data.resetPassword) {
      const tempPassword = Math.random().toString(36).slice(-8);
      updateData.password = await bcrypt.hash(tempPassword, 10);
      updateData.mustChangePassword = true;
      // Return temp password to admin
      const utilisateur = await prisma.utilisateur.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          username: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          isActive: true,
        },
      });
      return NextResponse.json({ ...utilisateur, tempPassword });
    }

    const utilisateur = await prisma.utilisateur.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(utilisateur);
  } catch (error) {
    console.error('Error updating utilisateur:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionFromCookie();
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Only admins can delete users
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { id } = await params;

    // Prevent self-deletion
    if (user.id === id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    // Check if user exists
    const existing = await prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Soft delete: deactivate instead of deleting
    await prisma.utilisateur.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting utilisateur:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
