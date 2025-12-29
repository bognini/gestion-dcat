import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'gestion_dcat_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface SessionUser {
  id: string;
  username: string;
  email: string;
  nom: string;
  prenom: string | null;
  role: string;
  avatarUrl: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export async function createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  // Update last login
  await prisma.utilisateur.update({
    where: { id: userId },
    data: { lastLogin: new Date() },
  });

  return token;
}

export async function getSessionFromCookie(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  return getSessionUser(sessionToken);
}

export async function getSessionUser(token: string): Promise<SessionUser | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: {
      utilisateur: {
        select: {
          id: true,
          username: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          avatarUrl: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  if (!session.utilisateur.isActive) {
    return null;
  }

  return {
    id: session.utilisateur.id,
    username: session.utilisateur.username,
    email: session.utilisateur.email,
    nom: session.utilisateur.nom,
    prenom: session.utilisateur.prenom,
    role: session.utilisateur.role,
    avatarUrl: session.utilisateur.avatarUrl,
  };
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function authenticateUser(
  usernameOrEmail: string,
  password: string
): Promise<SessionUser | null> {
  const user = await prisma.utilisateur.findFirst({
    where: {
      OR: [
        { username: usernameOrEmail },
        { email: usernameOrEmail.toLowerCase() },
      ],
      isActive: true,
    },
  });

  if (!user) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    avatarUrl: user.avatarUrl,
  };
}

// Password validation
export interface PasswordValidation {
  length: boolean;
  lowercase: boolean;
  uppercase: boolean;
  number: boolean;
  special: boolean;
  isValid: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  return {
    ...checks,
    isValid: Object.values(checks).every(Boolean),
  };
}
