'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getClient } from '@/lib/supabase/client';
import { loginMagicLinkSchema, loginPasswordSchema, type LoginMagicLinkInput, type LoginPasswordInput } from '@/lib/validations/auth';

type LoginMode = 'magic-link' | 'password';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  
  const [mode, setMode] = useState<LoginMode>('magic-link');
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  // Form pour magic link
  const magicLinkForm = useForm<LoginMagicLinkInput>({
    resolver: zodResolver(loginMagicLinkSchema),
    defaultValues: { email: '' },
  });

  // Form pour mot de passe
  const passwordForm = useForm<LoginPasswordInput>({
    resolver: zodResolver(loginPasswordSchema),
    defaultValues: { email: '', password: '' },
  });

  const supabase = getClient();

  // Connexion avec Magic Link
  const handleMagicLinkLogin = async (data: LoginMagicLinkInput) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${redirect}`,
        },
      });

      if (error) throw error;

      setMagicLinkSent(true);
      toast.success('Email envoyé !', {
        description: 'Vérifiez votre boîte mail pour vous connecter.',
      });
    } catch (error) {
      toast.error('Erreur', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Connexion avec mot de passe
  const handlePasswordLogin = async (data: LoginPasswordInput) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      toast.success('Connexion réussie !');
      router.push(redirect);
      router.refresh();
    } catch (error) {
      toast.error('Erreur de connexion', {
        description: error instanceof Error ? error.message : 'Email ou mot de passe incorrect',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Affichage après envoi du magic link
  if (magicLinkSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle>Vérifiez votre email</CardTitle>
          <CardDescription>
            Nous avons envoyé un lien de connexion à{' '}
            <strong>{magicLinkForm.getValues('email')}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p>Cliquez sur le lien dans l&apos;email pour vous connecter.</p>
          <p className="mt-2">Le lien expire dans 1 heure.</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setMagicLinkSent(false)}
          >
            Renvoyer l&apos;email
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setMagicLinkSent(false);
              setMode('password');
            }}
          >
            Se connecter avec un mot de passe
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
        {mode === 'magic-link' ? (
          <form onSubmit={magicLinkForm.handleSubmit(handleMagicLinkLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.com"
                  className="pl-10"
                  {...magicLinkForm.register('email')}
                  error={magicLinkForm.formState.errors.email?.message}
                />
              </div>
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
        ) : (
          <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-password">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email-password"
                  type="email"
                  placeholder="votre@email.com"
                  className="pl-10"
                  {...passwordForm.register('email')}
                  error={passwordForm.formState.errors.email?.message}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  href="/reset-password"
                  className="text-sm text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...passwordForm.register('password')}
                  error={passwordForm.formState.errors.password?.message}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        )}

        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
            ou
          </span>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => setMode(mode === 'magic-link' ? 'password' : 'magic-link')}
        >
          {mode === 'magic-link'
            ? 'Se connecter avec un mot de passe'
            : 'Recevoir un lien par email'}
        </Button>
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
