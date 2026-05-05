import { describe, it, expect } from 'vitest';
import { generateToken, hashPassword, verifyPassword, validatePassword } from '@/lib/auth';

describe('generateToken', () => {
  it('returns a 64-char hex string', () => {
    const token = generateToken();
    expect(token).toHaveLength(64);
    expect(token).toMatch(/^[0-9a-f]+$/);
  });

  it('generates unique tokens', () => {
    const tokens = new Set(Array.from({ length: 100 }, () => generateToken()));
    expect(tokens.size).toBe(100);
  });
});

describe('hashPassword / verifyPassword', () => {
  it('hashes and verifies a password correctly', async () => {
    const hash = await hashPassword('Secure1!');
    expect(await verifyPassword('Secure1!', hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('two hashes of the same password are different (salt)', async () => {
    const h1 = await hashPassword('Secure1!');
    const h2 = await hashPassword('Secure1!');
    expect(h1).not.toBe(h2);
  });
});

describe('validatePassword', () => {
  it('accepts a strong password', () => {
    expect(validatePassword('Secure1!').isValid).toBe(true);
  });

  it('rejects passwords missing each requirement', () => {
    expect(validatePassword('short1!').length).toBe(false);
    expect(validatePassword('alllowercase1!').uppercase).toBe(false);
    expect(validatePassword('ALLUPPERCASE1!').lowercase).toBe(false);
    expect(validatePassword('NoNumber!').number).toBe(false);
    expect(validatePassword('NoSpecial1').special).toBe(false);
  });
});
