/**
 * Meta Data Deletion Callback
 * 
 * This endpoint handles data deletion requests from Meta (Facebook/WhatsApp)
 * as required by their platform policies.
 * 
 * Documentation: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const APP_SECRET = process.env.META_APP_SECRET || process.env.FACEBOOK_APP_SECRET || '';

interface DataDeletionRequest {
  signed_request: string;
}

interface DecodedPayload {
  user_id: string;
  algorithm: string;
  issued_at: number;
}

/**
 * Parse and verify the signed request from Meta
 */
function parseSignedRequest(signedRequest: string, secret: string): DecodedPayload | null {
  try {
    const [encodedSig, payload] = signedRequest.split('.');
    
    if (!encodedSig || !payload) {
      console.error('[Meta Data Deletion] Invalid signed request format');
      return null;
    }

    // Decode the payload
    const decodedPayload = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
    ) as DecodedPayload;

    // Verify signature if we have a secret
    if (secret) {
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      if (encodedSig !== expectedSig) {
        console.error('[Meta Data Deletion] Invalid signature');
        return null;
      }
    }

    return decodedPayload;
  } catch (error) {
    console.error('[Meta Data Deletion] Error parsing signed request:', error);
    return null;
  }
}

/**
 * POST - Handle data deletion request from Meta
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return NextResponse.json(
        { error: 'Missing signed_request' },
        { status: 400 }
      );
    }

    const payload = parseSignedRequest(signedRequest, APP_SECRET);

    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid signed request' },
        { status: 400 }
      );
    }

    const userId = payload.user_id;
    
    // Generate a unique confirmation code
    const confirmationCode = crypto.randomUUID();
    
    // Log the deletion request
    console.log(`[Meta Data Deletion] Received deletion request for user: ${userId}`);
    console.log(`[Meta Data Deletion] Confirmation code: ${confirmationCode}`);

    // TODO: Implement actual data deletion logic here
    // - Find user by Meta/Facebook user ID
    // - Delete or anonymize their data
    // - Log the deletion for compliance

    // Return the required response format
    // Meta expects a JSON response with a URL where users can check deletion status
    return NextResponse.json({
      url: `https://tennismatchfinder.net/data-deletion?id=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch (error) {
    console.error('[Meta Data Deletion] Error processing request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - Provide information about data deletion
 */
export async function GET() {
  return NextResponse.json({
    message: 'Meta Data Deletion Callback Endpoint',
    description: 'This endpoint handles data deletion requests from Meta platforms (Facebook, WhatsApp, Instagram)',
    documentation: 'https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback',
  });
}
