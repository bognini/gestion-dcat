import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const BOUTIQUE_SESSION_COOKIE = 'boutique_session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface BoutiqueClientSession {
  id: string;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string;
  adresse: string | null;
  ville: string | null;
  emailVerified: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createBoutiqueSession(clientId: string): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION);

  await prisma.clientBoutiqueSession.create({
    data: { clientId, token, expiresAt },
  });

  return token;
}

export async function setBoutiqueSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(BOUTIQUE_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION / 1000,
  });
}

export async function clearBoutiqueSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(BOUTIQUE_SESSION_COOKIE);
}

export async function getBoutiqueClientFromCookie(): Promise<BoutiqueClientSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(BOUTIQUE_SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.clientBoutiqueSession.findUnique({
    where: { token },
    include: {
      client: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          adresse: true,
          ville: true,
          emailVerified: true,
          isActive: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date() || !session.client.isActive) {
    if (session) {
      await prisma.clientBoutiqueSession.delete({ where: { id: session.id } }).catch(() => {});
    }
    return null;
  }

  return {
    id: session.client.id,
    nom: session.client.nom,
    prenom: session.client.prenom,
    email: session.client.email,
    telephone: session.client.telephone,
    adresse: session.client.adresse,
    ville: session.client.ville,
    emailVerified: session.client.emailVerified,
  };
}
