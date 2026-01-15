/**
 * Server-side WebAuthn utilities
 */

import { db } from '@/lib/db';
import { passkeys, webauthnChallenges, users } from '@/lib/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { 
  rpID, 
  rpName, 
  expectedOrigin, 
  CHALLENGE_TTL_MS,
  base64urlToUint8Array,
  uint8ArrayToBase64url,
  type StoredPasskey,
  type PasskeyWithUser,
} from './config';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  AuthenticatorTransportFuture,
} from '@simplewebauthn/types';

/**
 * Store a challenge in the database
 */
export async function storeChallenge(
  challenge: string,
  type: 'registration' | 'authentication',
  userId?: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  
  await db.insert(webauthnChallenges).values({
    challenge,
    type,
    userId: userId || null,
    expiresAt,
  });
}

/**
 * Verify and consume a challenge
 */
export async function verifyAndConsumeChallenge(
  challenge: string,
  type: 'registration' | 'authentication'
): Promise<{ valid: boolean; userId?: string }> {
  const result = await db
    .select()
    .from(webauthnChallenges)
    .where(
      and(
        eq(webauthnChallenges.challenge, challenge),
        eq(webauthnChallenges.type, type)
      )
    )
    .limit(1);

  const storedChallenge = result[0];
  
  if (!storedChallenge) {
    return { valid: false };
  }

  // Delete the challenge (one-time use)
  await db
    .delete(webauthnChallenges)
    .where(eq(webauthnChallenges.id, storedChallenge.id));

  // Check expiration
  if (new Date() > storedChallenge.expiresAt) {
    return { valid: false };
  }

  return { 
    valid: true, 
    userId: storedChallenge.userId || undefined 
  };
}

/**
 * Clean up expired challenges
 */
export async function cleanupExpiredChallenges(): Promise<void> {
  await db
    .delete(webauthnChallenges)
    .where(lt(webauthnChallenges.expiresAt, new Date()));
}

/**
 * Get user's passkeys
 */
export async function getUserPasskeys(userId: string): Promise<StoredPasskey[]> {
  const result = await db
    .select()
    .from(passkeys)
    .where(eq(passkeys.userId, userId));

  return result.map(p => ({
    id: p.id,
    credentialId: p.credentialId,
    credentialPublicKey: p.credentialPublicKey,
    counter: p.counter,
    credentialDeviceType: p.credentialDeviceType as 'singleDevice' | 'multiDevice',
    credentialBackedUp: p.credentialBackedUp,
    transports: p.transports as AuthenticatorTransportFuture[] | undefined,
    name: p.name,
    lastUsedAt: p.lastUsedAt,
    createdAt: p.createdAt,
  }));
}

/**
 * Get passkey by credential ID
 */
export async function getPasskeyByCredentialId(
  credentialId: string
): Promise<PasskeyWithUser | null> {
  const result = await db
    .select({
      passkey: passkeys,
      user: users,
    })
    .from(passkeys)
    .innerJoin(users, eq(passkeys.userId, users.id))
    .where(eq(passkeys.credentialId, credentialId))
    .limit(1);

  const row = result[0];
  if (!row) return null;

  return {
    id: row.passkey.id,
    userId: row.passkey.userId,
    credentialId: row.passkey.credentialId,
    credentialPublicKey: row.passkey.credentialPublicKey,
    counter: row.passkey.counter,
    credentialDeviceType: row.passkey.credentialDeviceType as 'singleDevice' | 'multiDevice',
    credentialBackedUp: row.passkey.credentialBackedUp,
    transports: row.passkey.transports as AuthenticatorTransportFuture[] | undefined,
    name: row.passkey.name,
    lastUsedAt: row.passkey.lastUsedAt,
    createdAt: row.passkey.createdAt,
    userEmail: row.user.email || undefined,
    userName: row.user.name || undefined,
  };
}

/**
 * Save a new passkey
 */
export async function savePasskey(
  userId: string,
  credentialId: string,
  credentialPublicKey: string,
  counter: number,
  credentialDeviceType: 'singleDevice' | 'multiDevice',
  credentialBackedUp: boolean,
  transports?: AuthenticatorTransportFuture[],
  name?: string
): Promise<void> {
  await db.insert(passkeys).values({
    userId,
    credentialId,
    credentialPublicKey,
    counter,
    credentialDeviceType,
    credentialBackedUp,
    transports: transports || null,
    name: name || null,
  });
}

/**
 * Update passkey counter after authentication
 */
export async function updatePasskeyCounter(
  credentialId: string,
  newCounter: number
): Promise<void> {
  await db
    .update(passkeys)
    .set({ 
      counter: newCounter,
      lastUsedAt: new Date(),
    })
    .where(eq(passkeys.credentialId, credentialId));
}

/**
 * Delete a passkey
 */
export async function deletePasskey(
  userId: string,
  passkeyId: string
): Promise<boolean> {
  const result = await db
    .delete(passkeys)
    .where(
      and(
        eq(passkeys.id, passkeyId),
        eq(passkeys.userId, userId)
      )
    )
    .returning();

  return result.length > 0;
}

/**
 * Generate registration options for a user
 */
export async function generatePasskeyRegistrationOptions(
  userId: string,
  userEmail: string,
  userName?: string
) {
  // Get existing passkeys to exclude
  const existingPasskeys = await getUserPasskeys(userId);
  
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: userEmail,
    userDisplayName: userName || userEmail,
    // Don't prompt for an existing passkey
    excludeCredentials: existingPasskeys.map(p => ({
      id: p.credentialId,
      transports: p.transports,
    })),
    authenticatorSelection: {
      // Prefer platform authenticators (Touch ID, Face ID)
      authenticatorAttachment: 'platform',
      // Require user verification (biometric/PIN)
      userVerification: 'required',
      // Allow discoverable credentials (passkeys)
      residentKey: 'required',
    },
  });

  // Store the challenge
  await storeChallenge(options.challenge, 'registration', userId);

  return options;
}

/**
 * Verify registration response and save passkey
 */
export async function verifyPasskeyRegistration(
  userId: string,
  response: RegistrationResponseJSON,
  passkeyName?: string
) {
  // Get the actual challenge from the response
  const clientDataJSON = JSON.parse(
    Buffer.from(response.response.clientDataJSON, 'base64url').toString('utf-8')
  );
  
  const challengeVerify = await verifyAndConsumeChallenge(
    clientDataJSON.challenge,
    'registration'
  );

  if (!challengeVerify.valid) {
    throw new Error('Challenge invalide ou expiré');
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: clientDataJSON.challenge,
    expectedOrigin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new Error('Échec de la vérification de l\'enregistrement');
  }

  const { registrationInfo } = verification;
  const { credential } = registrationInfo;

  // Save the passkey - handle both Uint8Array and string types
  const credentialIdStr = typeof credential.id === 'string' 
    ? credential.id 
    : uint8ArrayToBase64url(new Uint8Array(credential.id));
  
  const publicKeyStr = typeof credential.publicKey === 'string'
    ? credential.publicKey
    : uint8ArrayToBase64url(new Uint8Array(credential.publicKey));

  await savePasskey(
    userId,
    credentialIdStr,
    publicKeyStr,
    credential.counter,
    registrationInfo.credentialDeviceType,
    registrationInfo.credentialBackedUp,
    response.response.transports as AuthenticatorTransportFuture[] | undefined,
    passkeyName
  );

  return {
    verified: true,
    credentialId: credentialIdStr,
  };
}

/**
 * Generate authentication options
 */
export async function generatePasskeyAuthenticationOptions(userEmail?: string) {
  let allowCredentials: { id: string; transports?: AuthenticatorTransportFuture[] }[] = [];
  let userId: string | undefined;

  // If email provided, get user's passkeys
  if (userEmail) {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, userEmail))
      .limit(1);

    if (user[0]) {
      userId = user[0].id;
      const userPasskeys = await getUserPasskeys(userId);
      allowCredentials = userPasskeys.map(p => ({
        id: p.credentialId,
        transports: p.transports,
      }));
    }
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'required',
    // If no email provided, allow any discoverable credential (passkey)
    allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
  });

  // Store the challenge
  await storeChallenge(options.challenge, 'authentication', userId);

  return options;
}

/**
 * Verify authentication response
 */
export async function verifyPasskeyAuthentication(
  response: AuthenticationResponseJSON
) {
  // Get the passkey
  const passkey = await getPasskeyByCredentialId(response.id);
  
  if (!passkey) {
    throw new Error('Passkey non trouvé');
  }

  // Get challenge from response
  const clientDataJSON = JSON.parse(
    Buffer.from(response.response.clientDataJSON, 'base64url').toString('utf-8')
  );

  // Verify challenge
  const challengeResult = await verifyAndConsumeChallenge(
    clientDataJSON.challenge,
    'authentication'
  );

  if (!challengeResult.valid) {
    throw new Error('Challenge invalide ou expiré');
  }

  // Convert public key from base64url to Uint8Array with proper ArrayBuffer type
  const publicKeyBytes = base64urlToUint8Array(passkey.credentialPublicKey);
  // Ensure we have a proper Uint8Array with ArrayBuffer (not ArrayBufferLike)
  const publicKey = new Uint8Array(publicKeyBytes.buffer.slice(0)) as Uint8Array<ArrayBuffer>;

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge: clientDataJSON.challenge,
    expectedOrigin,
    expectedRPID: rpID,
    credential: {
      id: passkey.credentialId,
      publicKey,
      counter: passkey.counter,
      transports: passkey.transports,
    },
    requireUserVerification: true,
  });

  if (!verification.verified) {
    throw new Error('Échec de la vérification de l\'authentification');
  }

  // Update the counter
  await updatePasskeyCounter(
    passkey.credentialId,
    verification.authenticationInfo.newCounter
  );

  return {
    verified: true,
    userId: passkey.userId,
    userEmail: passkey.userEmail,
    userName: passkey.userName,
  };
}
