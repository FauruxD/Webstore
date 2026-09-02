import crypto from 'crypto';

/**
 * Generate a high-entropy random URL-safe secret token.
 * Default 32 bytes (256-bit entropy) hex string.
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Compute SHA-256 hash of a raw token for safe database storage.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Verify a raw token against a stored SHA-256 hash in constant time.
 */
export function verifyToken(rawToken: string, storedHash: string): boolean {
  const computedHash = hashToken(rawToken);
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(storedHash));
}

/**
 * Generate an MD5/SHA256 hash of a Buffer or string for duplicate proof detection.
 */
export function computeFileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
