import { NextResponse } from 'next/server';
import { hasPermission, type Module, type Action } from './permissions';

type SessionUser = { role: string };

/**
 * Vérifie côté serveur que l'utilisateur connecté possède le droit demandé
 * sur au moins un des modules indiqués. Retourne une réponse 403 prête à
 * renvoyer, ou null si l'accès est autorisé.
 *
 *   const denied = requirePermission(user, 'stock', 'write');
 *   if (denied) return denied;
 */
export function requirePermission(
  user: SessionUser,
  module: Module | Module[],
  action: Action
): NextResponse | null {
  const modules = Array.isArray(module) ? module : [module];
  if (modules.some((m) => hasPermission(user.role, m, action))) return null;
  return NextResponse.json(
    { error: 'Accès refusé : vos droits ne permettent pas cette action' },
    { status: 403 }
  );
}
