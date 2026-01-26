'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Send, Globe, Building2, CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';

interface ClubStats {
  clubId: string | null;
  clubName: string;
  count: number;
}

interface WhatsAppStats {
  totalOptIn: number;
  byClub: ClubStats[];
  isConfigured: boolean;
}

export default function SuperAdminBroadcastPage() {
  const [message, setMessage] = useState('');
  const [targetClub, setTargetClub] = useState<string>('all');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [stats, setStats] = useState<WhatsAppStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load WhatsApp stats on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/super-admin/whatsapp/broadcast');
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalOptIn: data.stats?.totalOptIn || 0,
            byClub: data.stats?.byClub || [],
            isConfigured: data.isConfigured || false,
          });
        } else if (res.status === 403) {
          setError('Accès réservé aux super administrateurs');
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        setError('Erreur lors du chargement des statistiques');
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Veuillez écrire un message');
      return;
    }

    const targetCount = targetClub === 'all' 
      ? stats?.totalOptIn 
      : stats?.byClub.find(c => c.clubId === targetClub)?.count || 0;

    if (!confirm(`Envoyer ce message WhatsApp à ${targetCount} membre(s) ?`)) {
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/super-admin/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          clubId: targetClub === 'all' ? undefined : targetClub,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSent(true);
        toast.success(`${data.stats?.sent || 0} messages WhatsApp envoyés !`);
        
        // Reset form after success
        setTimeout(() => {
          setMessage('');
          setSent(false);
        }, 3000);
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    } finally {
      setIsSending(false);
    }
  };

  if (loadingStats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Super Admin Broadcast</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-900">{error}</h3>
                <p className="text-sm text-red-700">
                  Cette page est réservée aux super administrateurs de la plateforme.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Globe className="h-8 w-8" />
            Super Admin Broadcast
          </h1>
          <p className="text-muted-foreground">
            Envoyer un message WhatsApp à tous les clubs
          </p>
        </div>
      </div>

      {/* Stats globales */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  {stats?.totalOptIn || 0} membre(s) WhatsApp actifs
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Sur {stats?.byClub.length || 0} club(s) différents
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-green-500 text-green-700">
              {stats?.isConfigured ? 'Configuré' : 'Non configuré'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Stats par club */}
      {stats && stats.byClub.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Répartition par club
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {stats.byClub.map((club, index) => (
                <div 
                  key={club.clubId || index} 
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <span className="font-medium">{club.clubName}</span>
                  <Badge variant="secondary">{club.count} membre(s)</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire d'envoi */}
      <Card>
        <CardHeader>
          <CardTitle>Nouveau message WhatsApp</CardTitle>
          <CardDescription>
            Envoyez un message à tous les utilisateurs ou à un club spécifique
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold">Messages envoyés !</h3>
              <p className="text-muted-foreground">Les utilisateurs ont reçu votre message WhatsApp</p>
            </div>
          ) : (
            <>
              {/* Sélection du club cible */}
              <div className="space-y-2">
                <Label htmlFor="target">Destinataires</Label>
                <Select value={targetClub} onValueChange={setTargetClub}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner les destinataires" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Tous les clubs ({stats?.totalOptIn || 0} membres)
                      </div>
                    </SelectItem>
                    {stats?.byClub.map((club) => (
                      <SelectItem key={club.clubId || 'no-club'} value={club.clubId || 'no-club'}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {club.clubName} ({club.count} membres)
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="🎾 Bonjour à tous !&#10;&#10;Écrivez votre message ici..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/1000 caractères
                </p>
              </div>

              {/* Bouton d'envoi */}
              <Button 
                onClick={handleSend} 
                disabled={isSending || !message.trim() || !stats?.isConfigured}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer via WhatsApp
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Warning */}
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Attention
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Les messages WhatsApp sont envoyés directement aux téléphones des utilisateurs.
                Utilisez cette fonctionnalité avec parcimonie pour les annonces importantes uniquement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
