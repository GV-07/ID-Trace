/**
 * @fileOverview Utilities for generating 16-byte salted SHA-256 hashes.
 * Mirrors the logic requested for the ID-Trace cryptographic handshake.
 */

/**
 * Generates a random 16-byte cryptographic salt in hex format.
 */
export function generateSalt(length: number = 16): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generates a SHA-256 hash from a combined salt and input string.
 * Matches: hashlib.sha256((salt + input).encode()).hexdigest()
 */
export async function computeSaltedHash(input: string, salt: string): Promise<string> {
  // Normalize input: trim and uppercase for stability
  const normalizedInput = (input || '').trim().toUpperCase();
  const payload = salt + normalizedInput;
  
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(payload);
  
  // Use Web Crypto API for SHA-256 hashing
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
