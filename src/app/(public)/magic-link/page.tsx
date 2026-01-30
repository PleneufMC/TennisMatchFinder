'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smartphone, ExternalLink, Copy, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

// Loading component
function MagicLinkLoading() {
  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold">Chargement...</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Détecte si l'utilisateur est dans un WebView (navigateur intégré à une app)
 */
function isWebView(): boolean {
  if (typeof window === 'undefined') return false;
  
  const ua = navigator.userAgent.toLowerCase();
  
  // iOS WebViews
  const isIOSWebView = /(iphone|ipod|ipad).*applewebkit(?!.*safari)/i.test(navigator.userAgent);
  
  // Instagram, Facebook, LinkedIn, Twitter in-app browsers
  const isInAppBrowser = /instagram|fbav|fban|linkedin|twitter|line|wv|webview/i.test(ua);
  
  // Android WebView
  const isAndroidWebView = /android.*wv/i.test(ua) || /android.*version\/[\d.]+.*chrome\/[\d.]+ mobile/i.test(ua);
  
  // Yahoo Mail app
  const isYahooMail = /yahoomailapp/i.test(ua);
  
  // Gmail app
  const isGmailApp = /gsa\//i.test(ua);
  
  // Outlook app
  const isOutlookApp = /outlookapp/i.test(ua);
  
  // Generic WebView detection
  const genericWebView = !ua.includes('safari') && ua.includes('applewebkit');
  
  return isIOSWebView || isInAppBrowser || isAndroidWebView || isYahooMail || isGmailApp || isOutlookApp || genericWebView;
}

/**
 * Détecte le type d'appareil
 */
function getDeviceType(): 'ios' | 'android' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

function MagicLinkContent() {
  const searchParams = useSearchParams();
  const [isInWebView, setIsInWebView] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');
  const [copied, setCopied] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Reconstruire l'URL de callback NextAuth
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  
  const authUrl = token && email 
    ? `/api/auth/callback/email?token=${token}&email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent(callbackUrl)}`
    : null;

  const fullAuthUrl = authUrl 
    ? `https://tennismatchfinder.net${authUrl}`
    : null;

  useEffect(() => {
    setIsInWebView(isWebView());
    setDeviceType(getDeviceType());
    
    // Si pas dans un WebView, rediriger automatiquement
    if (!isWebView() && authUrl) {
      setRedirecting(true);
      window.location.href = authUrl;
    }
  }, [authUrl]);

  const handleCopyLink = async () => {
    if (!fullAuthUrl) return;
    
    try {
      await navigator.clipboard.writeText(fullAuthUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback pour les navigateurs qui ne supportent pas clipboard
      const textArea = document.createElement('textarea');
      textArea.value = fullAuthUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleOpenInBrowser = () => {
    if (!fullAuthUrl) return;
    
    // Sur iOS, essayer d'ouvrir dans Safari
    if (deviceType === 'ios') {
      // x-safari-https:// peut fonctionner sur certaines versions
      window.location.href = fullAuthUrl;
    } else {
      // Sur Android, intent peut ouvrir le navigateur par défaut
      window.open(fullAuthUrl, '_system');
    }
  };

  // Pas de token valide
  if (!token || !email) {
    return (
      <div className="container max-w-md py-12">
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <CardTitle className="text-red-700 dark:text-red-300">Lien invalide</CardTitle>
            <CardDescription>
              Ce lien de connexion est invalide ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href="/login">Demander un nouveau lien</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Redirection en cours (pas dans un WebView)
  if (redirecting) {
    return (
      <div className="container max-w-md py-12">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-semibold">Connexion en cours...</h3>
              <p className="text-muted-foreground mt-2">Vous allez être redirigé automatiquement.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dans un WebView - afficher les instructions
  return (
    <div className="container max-w-md py-12">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <Smartphone className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle>Ouvrir dans {deviceType === 'ios' ? 'Safari' : 'votre navigateur'}</CardTitle>
          <CardDescription>
            Pour vous connecter, ce lien doit être ouvert dans {deviceType === 'ios' ? 'Safari' : 'votre navigateur'} plutôt que dans l&apos;application email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instructions selon le device */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Comment faire ?</h4>
            {deviceType === 'ios' ? (
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  Appuyez sur le bouton <strong>&quot;Copier le lien&quot;</strong> ci-dessous
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  Ouvrez <strong>Safari</strong>
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  Collez le lien dans la barre d&apos;adresse
                </li>
              </ol>
            ) : (
              <ol className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2">
                  <span className="font-bold text-primary">1.</span>
                  Appuyez sur le bouton <strong>&quot;Copier le lien&quot;</strong> ci-dessous
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">2.</span>
                  Ouvrez <strong>Chrome</strong> ou votre navigateur
                </li>
                <li className="flex gap-2">
                  <span className="font-bold text-primary">3.</span>
                  Collez le lien dans la barre d&apos;adresse
                </li>
              </ol>
            )}
          </div>

          {/* Bouton copier */}
          <Button 
            onClick={handleCopyLink} 
            className="w-full" 
            size="lg"
            variant={copied ? 'secondary' : 'default'}
          >
            {copied ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2" />
                Lien copié !
              </>
            ) : (
              <>
                <Copy className="h-5 w-5 mr-2" />
                Copier le lien
              </>
            )}
          </Button>

          {/* Bouton essayer d'ouvrir */}
          <Button 
            onClick={handleOpenInBrowser} 
            variant="outline" 
            className="w-full"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Essayer d&apos;ouvrir dans {deviceType === 'ios' ? 'Safari' : 'le navigateur'}
          </Button>

          {/* Email de destination */}
          <p className="text-center text-sm text-muted-foreground">
            Connexion pour : <strong>{email}</strong>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Export avec Suspense boundary
export default function MagicLinkPage() {
  return (
    <Suspense fallback={<MagicLinkLoading />}>
      <MagicLinkContent />
    </Suspense>
  );
}
