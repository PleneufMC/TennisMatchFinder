'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Fingerprint, Loader2 } from 'lucide-react';
import { startAuthentication, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';
import { useTranslations } from '@/lib/i18n';

interface PasskeyLoginButtonProps {
  callbackUrl?: string;
  className?: string;
}

export function PasskeyLoginButton({ 
  callbackUrl = '/dashboard',
  className 
}: PasskeyLoginButtonProps) {
  const { t, locale } = useTranslations('auth.login');
  const [isLoading, setIsLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    setIsSupported(browserSupportsWebAuthn());
  }, []);

  const handlePasskeyLogin = async () => {
    if (!isSupported) {
      toast.error(locale === 'fr' 
        ? 'Votre navigateur ne supporte pas les Passkeys' 
        : 'Your browser does not support Passkeys');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Get authentication options from server
      const optionsRes = await fetch('/api/auth/passkey/authenticate');
      if (!optionsRes.ok) {
        throw new Error(locale === 'fr' 
          ? 'Erreur lors de la récupération des options' 
          : 'Error retrieving options');
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
        throw new Error(error.error || (locale === 'fr' ? 'Échec de l\'authentification' : 'Authentication failed'));
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

      toast.success(locale === 'fr' ? 'Connexion réussie !' : 'Successfully logged in!');
      
      // Redirect
      window.location.href = callbackUrl;
    } catch (error) {
      console.error('Passkey login error:', error);
      
      // Handle user cancellation gracefully
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.info(locale === 'fr' ? 'Authentification annulée' : 'Authentication cancelled');
      } else {
        toast.error(
          error instanceof Error 
            ? error.message 
            : (locale === 'fr' ? 'Erreur lors de la connexion' : 'Login error')
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
      {t('passkey')}
    </Button>
  );
}
