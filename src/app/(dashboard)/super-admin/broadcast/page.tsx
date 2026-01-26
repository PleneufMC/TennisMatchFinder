'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageCircle, Send, Users, Building2, CheckCircle, Loader2, Globe, AlertTriangle } from 'lucide-react';
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

interface GlobalStats {
  totalOptIn: number;
  byClub: ClubStats[];
}

export default function SuperAdminBroadcastPage() {
  const [message, setMessage] = useState('');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load global WhatsApp stats on mount
  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch('/api/super-admin/whatsapp/broadcast');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setIsConfigured(data.isConfigured || false);
        } else if (res.status === 403) {
          setError('Accès réservé aux super administrateurs');
        } else {
          setError('Erreur lors du chargement des stats');
        }
      } catch (err) {
        console.error('Error loading stats:', err);
        setError('Erreur de connexion');
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Veuillez entrer un message');
      return;
    }

    const targetDescription = selectedClub === 'all' 
      ? `tous les utilisateurs (${stats?.totalOptIn || 0} personnes)`
      : stats?.byClub.find(c => c.clubId === selectedClub)?.clubName || 'ce club';

    // Confirmation pour éviter les envois accidentels
    const confirmed = window.confirm(
      `⚠️ Attention !\n\nVous allez envoyer un message WhatsApp à ${targetDescription}.\n\nCette action est irréversible.\n\nContinuer ?`
    );

    if (!confirmed) return;

    setIsSending(true);

    try {
      const body: { message: string; clubId?: string } = {
        message: `📢 TennisMatchFinder\n\n${message}`,
      };

      if (selectedClub !== 'all') {
        body.clubId = selectedClub;
      }

      const response = await fetch('/api/super-admin/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSent(true);
        toast.success(`Message envoyé à ${data.stats?.sent || 0} utilisateur(s)`);
        
        // Reset form after success
        setTimeout(() => {
          setMessage('');
          setSelectedClub('all');
          setSent(false);
        }, 3000);
      } else {
        toast.error(data.error || 'Erreur lors de l\'envoi');
      }
    } catch (err) {
      console.error('Error sending broadcast:', err);
      toast.error('Impossible d\'envoyer le message');
    } finally {
      setIsSending(false);
    }
  };

  const getRecipientsCount = () => {
    if (!stats) return 0;
    if (selectedClub === 'all') return stats.totalOptIn;
    return stats.byClub.find(c => c.clubId === selectedClub)?.count || 0;
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
          <div>
            <h1 className="text-3xl font-bold">Super Admin</h1>
          </div>
        </div>
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
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
            Broadcast Global
          </h1>
          <p className="text-muted-foreground">
            Envoyer un message WhatsApp à tous les clubs
          </p>
        </div>
        <Badge variant="destructive" className="ml-auto">
          Super Admin
        </Badge>
      </div>

      {/* Stats globales */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900 dark:text-green-100">
                      WhatsApp activé
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {stats.totalOptIn} utilisateur{stats.totalOptIn > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {isConfigured ? (
                  <Badge variant="outline" className="border-green-500 text-green-700">
                    Configuré
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-red-500 text-red-700">
                    Non configuré
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Clubs avec WhatsApp</p>
                  <p className="text-2xl font-bold">
                    {stats.byClub.filter(c => c.count > 0).length} club{stats.byClub.filter(c => c.count > 0).length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats par club */}
      {stats && stats.byClub.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Répartition par club</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.byClub
                .filter(c => c.count > 0)
                .sort((a, b) => b.count - a.count)
                .map((club, index) => (
                  <div 
                    key={club.clubId || index} 
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <span className="font-medium">{club.clubName}</span>
                    <Badge variant="secondary">{club.count}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire d'envoi */}
      {isConfigured ? (
        <Card>
          <CardHeader>
            <CardTitle>Envoyer un message</CardTitle>
            <CardDescription>
              Ce message sera envoyé à tous les utilisateurs qui ont activé WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sent ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold">Message envoyé !</h3>
                <p className="text-muted-foreground">Les utilisateurs ont été notifiés par WhatsApp</p>
              </div>
            ) : (
              <>
                {/* Sélection du club */}
                <div className="space-y-2">
                  <Label htmlFor="club">Destinataires</Label>
                  <Select value={selectedClub} onValueChange={setSelectedClub}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner les destinataires" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Tous les clubs ({stats?.totalOptIn || 0} utilisateurs)
                        </div>
                      </SelectItem>
                      {stats?.byClub
                        .filter(c => c.clubId && c.count > 0)
                        .sort((a, b) => b.count - a.count)
                        .map((club) => (
                          <SelectItem key={club.clubId} value={club.clubId!}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              {club.clubName} ({club.count})
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {getRecipientsCount()} destinataire{getRecipientsCount() > 1 ? 's' : ''}
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Écrivez votre message ici..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    maxLength={900}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {message.length}/900 caractères
                  </p>
                </div>

                {/* Prévisualisation */}
                {message && (
                  <div className="space-y-2">
                    <Label>Aperçu</Label>
                    <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                      <p className="text-sm whitespace-pre-wrap">
                        📢 TennisMatchFinder{'\n\n'}{message}
                      </p>
                    </div>
                  </div>
                )}

                {/* Avertissement */}
                <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm text-yellow-800 dark:text-yellow-200">
                        <p className="font-semibold">Attention</p>
                        <p>
                          Cette action enverra un message WhatsApp à {getRecipientsCount()} utilisateur{getRecipientsCount() > 1 ? 's' : ''}.
                          Utilisez cette fonctionnalité avec parcimonie pour éviter le spam.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Bouton d'envoi */}
                <Button 
                  onClick={handleSend} 
                  disabled={isSending || !message.trim() || getRecipientsCount() === 0}
                  className="w-full"
                  variant="destructive"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Envoyer à {getRecipientsCount()} utilisateur{getRecipientsCount() > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  WhatsApp non configuré
                </h3>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Pour activer l&apos;envoi de messages WhatsApp, configurez les variables d&apos;environnement :
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-2 list-disc list-inside">
                  <li>WHATSAPP_ACCESS_TOKEN</li>
                  <li>WHATSAPP_PHONE_NUMBER_ID</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
