/**
 * Type declarations for web-push module
 * This is needed because @types/web-push is a devDependency
 * and not installed in production builds on Netlify
 */

declare module 'web-push' {
  export interface VapidKeys {
    publicKey: string;
    privateKey: string;
  }

  export interface PushSubscription {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
    expirationTime?: number | null;
  }

  export interface RequestOptions {
    gcmAPIKey?: string;
    vapidDetails?: {
      subject: string;
      publicKey: string;
      privateKey: string;
    };
    timeout?: number;
    TTL?: number;
    headers?: Record<string, string>;
    contentEncoding?: 'aes128gcm' | 'aesgcm';
    proxy?: string;
    agent?: any;
    urgency?: 'very-low' | 'low' | 'normal' | 'high';
    topic?: string;
  }

  export interface SendResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  export interface WebPushError extends Error {
    statusCode: number;
    headers: Record<string, string>;
    body: string;
    endpoint: string;
  }

  export function generateVAPIDKeys(): VapidKeys;

  export function setVapidDetails(
    subject: string,
    publicKey: string,
    privateKey: string
  ): void;

  export function setGCMAPIKey(apiKey: string): void;

  export function sendNotification(
    subscription: PushSubscription,
    payload?: string | Buffer | null,
    options?: RequestOptions
  ): Promise<SendResult>;

  export function encrypt(
    userPublicKey: string,
    userAuth: string,
    payload: string | Buffer,
    contentEncoding?: 'aes128gcm' | 'aesgcm'
  ): {
    localPublicKey: string;
    salt: string;
    cipherText: Buffer;
  };

  export function getVapidHeaders(
    audience: string,
    subject: string,
    publicKey: string,
    privateKey: string,
    contentEncoding?: 'aes128gcm' | 'aesgcm',
    expiration?: number
  ): {
    Authorization: string;
    'Crypto-Key': string;
  };

  const webpush: {
    generateVAPIDKeys: typeof generateVAPIDKeys;
    setVapidDetails: typeof setVapidDetails;
    setGCMAPIKey: typeof setGCMAPIKey;
    sendNotification: typeof sendNotification;
    encrypt: typeof encrypt;
    getVapidHeaders: typeof getVapidHeaders;
  };

  export default webpush;
}
