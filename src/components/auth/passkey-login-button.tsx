'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2 } from 'lucide-react';
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

interface PasskeyLoginButtonProps {
  callbackUrl?: string;
  className?: string;
}

export function PasskeyLoginButton({ 
  callbackUrl = '/dashboard',
  className 
}: PasskeyLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    setIsSupported(browserSupportsWebAuthn());
  }, []);

  const handlePasskeyLogin = async () => {
    if (!isSupported) {
      toast.error('Votre navigateur ne supporte pas les Passkeys');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Get authentication options from server
      const optionsRes = await fetch('/api/auth/passkey/authenticate');
      if (!optionsRes.ok) {
        throw new Error('Erreur lors de la récupération des options');
      }
      const options = await optionsRes.json();

      // Step 2: Start WebAuthn authentication (triggers biometric prompt)
      const authResponse = await startAuthentication({ optionsJSON: options });

      // Step 3: Verify with server
      const verifyRes = await fetch('/api/auth/passkey/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: authResponse }),
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        throw new Error(error.error || 'Échec de l\'authentification');
      }

      const { userId, email } = await verifyRes.json();

      // Step 4: Create session with NextAuth credentials provider
      const result = await signIn('passkey', {
        userId,
        email,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      toast.success('Connexion réussie !');
      
      // Redirect
      window.location.href = callbackUrl;
    } catch (error) {
      console.error('Passkey login error:', error);
      
      // Handle user cancellation gracefully
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.info('Authentification annulée');
      } else {
        toast.error(
          error instanceof Error 
            ? error.message 
            : 'Erreur lors de la connexion'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handlePasskeyLogin}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="mr-2 h-4 w-4" />
      )}
      Connexion avec Passkey
    </Button>
  );
}
