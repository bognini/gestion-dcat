import { describe, it, expect } from 'vitest';
import { hasPermission, canWrite, canDelete, getAccessibleModules } from '@/lib/permissions';
import { requirePermission } from '@/lib/api-auth';

describe('matrice de permissions', () => {
  it('admin a tous les droits sur tous les modules', () => {
    for (const m of ['administration', 'calendrier', 'stock', 'technique', 'marketing', 'finance', 'parametres'] as const) {
      expect(hasPermission('admin', m, 'manage')).toBe(true);
    }
  });

  it('comptable écrit en finance mais pas en stock ni technique', () => {
    expect(canWrite('comptable', 'finance')).toBe(true);
    expect(canWrite('comptable', 'stock')).toBe(false);
    expect(canWrite('comptable', 'technique')).toBe(false);
    expect(canDelete('comptable', 'finance')).toBe(false);
  });

  it('technicien écrit en stock et technique mais ne supprime pas', () => {
    expect(canWrite('technicien', 'stock')).toBe(true);
    expect(canWrite('technicien', 'technique')).toBe(true);
    expect(canDelete('technicien', 'technique')).toBe(false);
    expect(canWrite('technicien', 'finance')).toBe(false);
  });

  it('assistante ne touche ni à la technique ni à la finance', () => {
    expect(canWrite('assistante', 'stock')).toBe(true);
    expect(hasPermission('assistante', 'technique', 'read')).toBe(false);
    expect(hasPermission('assistante', 'finance', 'read')).toBe(false);
  });

  it('un rôle inconnu n’a aucun droit', () => {
    expect(hasPermission('pirate', 'stock', 'read')).toBe(false);
    expect(getAccessibleModules('pirate')).toEqual([]);
  });
});

describe('requirePermission', () => {
  it('retourne null quand le droit est accordé', () => {
    expect(requirePermission({ role: 'technicien' }, 'stock', 'write')).toBeNull();
  });

  it('retourne une réponse 403 quand le droit est refusé', async () => {
    const res = requirePermission({ role: 'comptable' }, 'stock', 'write');
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = await res!.json();
    expect(body.error).toMatch(/refusé/i);
  });

  it('accepte si au moins un des modules listés est autorisé', () => {
    expect(requirePermission({ role: 'comptable' }, ['technique', 'finance'], 'write')).toBeNull();
    expect(requirePermission({ role: 'assistante' }, ['technique', 'finance'], 'write')?.status).toBe(403);
  });
});
