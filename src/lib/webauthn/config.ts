/**
 * WebAuthn / Passkey Configuration
 * 
 * Enables biometric authentication (Touch ID, Face ID, fingerprint)
 * for quick and secure login on mobile devices.
 */

import type { 
  AuthenticatorTransportFuture,
  CredentialDeviceType,
} from '@simplewebauthn/types';

// Relying Party (RP) configuration
export const rpName = 'TennisMatchFinder';
export const rpID = process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || 
  (process.env.NODE_ENV === 'production' ? 'tennismatchfinder.net' : 'localhost');

// Expected origin(s) for credential verification
export const expectedOrigin = process.env.NEXT_PUBLIC_APP_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://tennismatchfinder.net' 
    : 'http://localhost:3000');

// Challenge expiration time (5 minutes)
export const CHALLENGE_TTL_MS = 5 * 60 * 1000;

// Types for database storage
export interface StoredPasskey {
  id: string;
  credentialId: string;
  credentialPublicKey: string;
  counter: number;
  credentialDeviceType: CredentialDeviceType;
  credentialBackedUp: boolean;
  transports?: AuthenticatorTransportFuture[];
  name?: string | null;
  lastUsedAt?: Date | null;
  createdAt: Date;
}

export interface PasskeyWithUser extends StoredPasskey {
  userId: string;
  userEmail?: string;
  userName?: string;
}

/**
 * Convert base64url string to Uint8Array
 */
export function base64urlToUint8Array(base64url: string): Uint8Array {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64url string
 */
export function uint8ArrayToBase64url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Generate a random challenge
 */
export function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return uint8ArrayToBase64url(array);
}

/**
 * Get a friendly name for the device based on transports
 */
export function getDeviceName(transports?: string[]): string {
  if (!transports || transports.length === 0) {
    return 'Passkey';
  }
  
  if (transports.includes('internal')) {
    // Platform authenticator (Touch ID, Face ID, Windows Hello)
    return 'Cet appareil';
  }
  
  if (transports.includes('hybrid')) {
    return 'Passkey multi-appareil';
  }
  
  if (transports.includes('usb')) {
    return 'Clé de sécurité USB';
  }
  
  if (transports.includes('nfc')) {
    return 'Clé de sécurité NFC';
  }
  
  if (transports.includes('ble')) {
    return 'Clé de sécurité Bluetooth';
  }
  
  return 'Passkey';
}
