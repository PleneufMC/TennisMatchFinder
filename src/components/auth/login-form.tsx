'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, ArrowRight, Loader2, CheckCircle, Fingerprint } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { loginMagicLinkSchema, type LoginMagicLinkInput } from '@/lib/validations/auth';
import { PasskeyLoginButton } from '@/components/auth/passkey-login-button';

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const verify = searchParams.get('verify');
  const error = searchParams.get('error');
  
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const form = useForm<LoginMagicLinkInput>({
    resolver: zodResolver(loginMagicLinkSchema),
    defaultValues: { email: '' },
  });

  // Connexion avec Magic Link via NextAuth
  const handleMagicLinkLogin = async (data: LoginMagicLinkInput) => {
    setIsLoading(true);
    try {
      const result = await signIn('email', {
        email: data.email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      setMagicLinkSent(true);
      toast.success('Email envoyé !', {
        description: 'Vérifiez votre boîte mail pour vous connecter.',
      });
    } catch (err) {
      toast.error('Erreur', {
        description: err instanceof Error ? err.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Affichage si vérification en attente (redirigé depuis NextAuth)
  if (verify === 'true' || magicLinkSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Vérifiez votre email</CardTitle>
          <CardDescription>
            {magicLinkSent ? (
              <>
                Nous avons envoyé un lien de connexion à{' '}
                <strong>{form.getValues('email')}</strong>
              </>
            ) : (
              'Un lien de connexion vous a été envoyé par email.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Cliquez sur le lien dans l&apos;email pour vous connecter.</p>
          <p className="mt-2">Le lien expire dans 24 heures.</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setMagicLinkSent(false)}
          >
            Renvoyer l&apos;email
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Affichage si erreur
  if (error) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-red-600">Erreur de connexion</CardTitle>
          <CardDescription>
            {error === 'Verification' 
              ? 'Le lien de connexion est invalide ou a expiré.'
              : 'Une erreur est survenue lors de la connexion.'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Réessayer</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Connexion</CardTitle>
        <CardDescription>
          Connectez-vous à votre compte TennisMatchFinder
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleMagicLinkLogin)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                className="pl-10"
                {...form.register('email')}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                Recevoir le lien de connexion
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Séparateur */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Ou connexion rapide
            </span>
          </div>
        </div>

        {/* Passkey Button */}
        <PasskeyLoginButton 
          callbackUrl={callbackUrl}
          className="w-full"
        />

        <div className="mt-6 rounded-lg bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Connexion sans mot de passe</p>
              <p className="text-muted-foreground mt-1">
                Entrez votre email et recevez un lien magique pour vous connecter instantanément.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link href="/register" className="text-primary hover:underline">
            S&apos;inscrire
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
