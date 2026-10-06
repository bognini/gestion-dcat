import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

// Chiffrement symétrique des secrets stockés en base (ex. MailConfig.smtpPass).
// Format : enc:v1:<iv base64>:<tag base64>:<chiffré base64> (AES-256-GCM).
// La clé vient de SECRETS_ENCRYPTION_KEY : 32 octets encodés en base64
// (générer avec `openssl rand -base64 32`).

const PREFIX = 'enc:v1:';
const ALGO = 'aes-256-gcm';

function getKey(): Buffer | null {
  const raw = process.env.SECRETS_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  const key = Buffer.from(raw, 'base64');
  if (key.length !== 32) {
    throw new Error('SECRETS_ENCRYPTION_KEY doit faire 32 octets encodés en base64');
  }
  return key;
}

export function hasEncryptionKey(): boolean {
  return getKey() !== null;
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plain: string): string {
  const key = getKey();
  if (!key) {
    throw new Error('SECRETS_ENCRYPTION_KEY non configurée : impossible de chiffrer le secret');
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

// Les valeurs sans préfixe sont des secrets historiques en clair : renvoyées telles quelles.
export function decryptSecret(value: string): string {
  if (!isEncrypted(value)) return value;

  const key = getKey();
  if (!key) {
    throw new Error('SECRETS_ENCRYPTION_KEY non configurée : impossible de déchiffrer le secret');
  }
  const [ivB64, tagB64, dataB64] = value.slice(PREFIX.length).split(':');
  if (!ivB64 || !tagB64 || dataB64 === undefined) {
    throw new Error('Secret chiffré mal formé');
  }
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}
