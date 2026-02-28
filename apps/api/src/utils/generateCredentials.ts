import crypto from 'crypto';

export function generateUsername(prefix: string, id: string): string {
  return `${prefix}_${id}`;
}

export function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$';
  let password = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export function generateDisplayId(parentId: string | null, sequence: number): string {
  if (parentId) {
    return `${parentId}_${sequence}`;
  }
  return String(sequence);
}
