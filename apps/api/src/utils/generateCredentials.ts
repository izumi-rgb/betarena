import crypto from 'crypto';

export function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
  let password = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

/**
 * Generate a random alphanumeric string (no vowels to avoid accidental words).
 * Character set: bcdfghjklmnpqrstvwxyz0123456789 (31 chars)
 */
export function generateRandomId(length: number = 6): string {
  const chars = 'bcdfghjklmnpqrstvwxyz0123456789';
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
