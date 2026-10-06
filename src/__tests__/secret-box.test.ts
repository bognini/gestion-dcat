import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { randomBytes } from 'crypto';
import { decryptSecret, encryptSecret, hasEncryptionKey, isEncrypted } from '@/lib/secret-box';

const { mailConfigUpdate } = vi.hoisted(() => ({ mailConfigUpdate: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { mailConfig: { update: mailConfigUpdate } } }));

import { readStoredSmtpPassword } from '@/lib/mail';

describe('chiffrement des secrets', () => {
  const previousKey = process.env.SECRETS_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.SECRETS_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  });

  afterEach(() => {
    if (previousKey === undefined) delete process.env.SECRETS_ENCRYPTION_KEY;
    else process.env.SECRETS_ENCRYPTION_KEY = previousKey;
  });

  it('chiffre puis déchiffre un mot de passe', () => {
    const encrypted = encryptSecret('M0t de passe:avec:deux-points é');
    expect(isEncrypted(encrypted)).toBe(true);
    expect(encrypted).not.toContain('M0t de passe');
    expect(decryptSecret(encrypted)).toBe('M0t de passe:avec:deux-points é');
  });

  it('produit un chiffré différent à chaque appel (IV aléatoire)', () => {
    expect(encryptSecret('secret')).not.toBe(encryptSecret('secret'));
  });

  it('renvoie tel quel un secret historique en clair', () => {
    expect(decryptSecret('ancien-mot-de-passe')).toBe('ancien-mot-de-passe');
  });

  it('rejette un chiffré altéré', () => {
    const encrypted = encryptSecret('secret');
    const tampered = encrypted.slice(0, -4) + (encrypted.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('rejette un déchiffrement avec une autre clé', () => {
    const encrypted = encryptSecret('secret');
    process.env.SECRETS_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    expect(() => decryptSecret(encrypted)).toThrow();
  });

  it('refuse de chiffrer sans clé et signale une clé de mauvaise taille', () => {
    delete process.env.SECRETS_ENCRYPTION_KEY;
    expect(hasEncryptionKey()).toBe(false);
    expect(() => encryptSecret('secret')).toThrow(/SECRETS_ENCRYPTION_KEY/);

    process.env.SECRETS_ENCRYPTION_KEY = randomBytes(16).toString('base64');
    expect(() => encryptSecret('secret')).toThrow(/32 octets/);
  });

  describe('readStoredSmtpPassword', () => {
    beforeEach(() => mailConfigUpdate.mockReset());

    it('rechiffre en base un mot de passe historique en clair', async () => {
      const pass = await readStoredSmtpPassword({ id: 'cfg1', smtpPass: 'en-clair' });

      expect(pass).toBe('en-clair');
      expect(mailConfigUpdate).toHaveBeenCalledOnce();
      const stored = mailConfigUpdate.mock.calls[0][0].data.smtpPass;
      expect(isEncrypted(stored)).toBe(true);
      expect(decryptSecret(stored)).toBe('en-clair');
    });

    it('déchiffre sans réécrire un mot de passe déjà chiffré', async () => {
      const pass = await readStoredSmtpPassword({ id: 'cfg1', smtpPass: encryptSecret('chiffre') });
      expect(pass).toBe('chiffre');
      expect(mailConfigUpdate).not.toHaveBeenCalled();
    });

    it('laisse le clair en place tant que la clé n’est pas configurée', async () => {
      delete process.env.SECRETS_ENCRYPTION_KEY;
      expect(await readStoredSmtpPassword({ id: 'cfg1', smtpPass: 'en-clair' })).toBe('en-clair');
      expect(mailConfigUpdate).not.toHaveBeenCalled();
    });
  });
});
