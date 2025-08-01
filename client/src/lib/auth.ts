import CryptoJS from 'crypto-js';

/**
 * Hash password using SHA3 with email as salt
 * @param password - Plain text password
 * @param email - User email used as salt
 * @returns Hashed password
 */
export function hashPassword(password: string, email: string): string {
  const saltedPassword = password + email;
  return CryptoJS.SHA3(saltedPassword).toString();
}

/**
 * Verify password against stored hash
 * @param password - Plain text password to verify
 * @param email - User email used as salt
 * @param storedHash - Stored password hash
 * @returns True if password matches
 */
export function verifyPassword(password: string, email: string, storedHash: string): boolean {
  const hashedInput = hashPassword(password, email);
  return hashedInput === storedHash;
}