'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Send, Users, User, CheckCircle, Smartphone, Loader2, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/toast';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const [target, setTarget] = useState<'all' | 'active'>('all');
  const [sendPush, setSendPush] = useState(true);
  const [sendInApp, setSendInApp] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [pushStats, setPushStats] = useState<{ totalSubscriptions: number; uniqueUsers: number } | null>(null);
  const [whatsappStats, setWhatsappStats] = useState<{ totalOptIn: number; activeOptIn: number; isConfigured: boolean } | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Load push and WhatsApp stats on mount
  useEffect(() => {
    async function loadStats() {
      try {
        // Load push stats
        const pushRes = await fetch('/api/admin/push/broadcast');
        if (pushRes.ok) {
          const data = await pushRes.json();
          setPushStats(data.stats);
        }

        // Load WhatsApp stats
        const whatsappRes = await fetch('/api/admin/whatsapp/broadcast');
        if (whatsappRes.ok) {
          const data = await whatsappRes.json();
          setWhatsappStats({
            totalOptIn: data.stats?.totalOptIn || 0,
            activeOptIn: data.stats?.activeOptIn || 0,
            isConfigured: data.isConfigured || false,
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Veuillez remplir le titre et le message');
      return;
    }

    if (!sendPush && !sendInApp && !sendWhatsApp) {
      toast.error('Sélectionnez au moins un type de notification');
      return;
    }

    setIsSending(true);

    try {
      let inAppCount = 0;
      let pushCount = 0;
      let whatsappCount = 0;

      // Send in-app notifications
      if (sendInApp) {
        const response = await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, message, target }),
        });

        if (response.ok) {
          const data = await response.json();
          inAppCount = data.count || 0;
        }
      }

      // Send push notifications
      if (sendPush) {
        const response = await fetch('/api/admin/push/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, message, url: url || undefined }),
        });

        if (response.ok) {
          const data = await response.json();
          pushCount = data.stats?.sent || 0;
        }
      }

      // Send WhatsApp notifications
      if (sendWhatsApp) {
        const whatsappMessage = `🎾 ${title}\n\n${message}${url ? `\n\n👉 tennismatchfinder.net${url}` : ''}`;
        const response = await fetch('/api/admin/whatsapp/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: whatsappMessage,
            targetActive: target === 'active',
          }),
        });

        if (response.ok) {
          const data = await response.json();
          whatsappCount = data.stats?.sent || 0;
        }
      }
      
      setSent(true);
      
      const messages = [];
      if (sendInApp && inAppCount > 0) messages.push(`${inAppCount} in-app`);
      if (sendPush && pushCount > 0) messages.push(`${pushCount} push`);
      if (sendWhatsApp && whatsappCount > 0) messages.push(`${whatsappCount} WhatsApp`);
      
      toast.success(messages.length > 0 ? `Envoyé : ${messages.join(' + ')}` : 'Notification envoyée');
      
      // Reset form after success
      setTimeout(() => {
        setTitle('');
        setMessage('');
        setUrl('');
        setSent(false);
      }, 3000);
    } catch (error) {
      toast.error('Impossible d\'envoyer la notification');
    } finally {
      setIsSending(false);
    }
  };

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
            <Bell className="h-8 w-8" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            Envoyer des messages aux membres du club
          </p>
        </div>
      </div>

      {/* Stats Push */}
      {!loadingStats && pushStats && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">
                    Notifications Push activées
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {pushStats.uniqueUsers} utilisateur{pushStats.uniqueUsers > 1 ? 's' : ''} • {pushStats.totalSubscriptions} appareil{pushStats.totalSubscriptions > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="border-green-500 text-green-700">
                Actif
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire d'envoi */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle notification</CardTitle>
          <CardDescription>
            Envoyez une notification à tous les membres du club
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {sent ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold">Notification envoyée !</h3>
              <p className="text-muted-foreground">Les membres ont été notifiés</p>
            </div>
          ) : (
            <>
              {/* Type de notification */}
              <div className="space-y-4">
                <Label>Type de notification</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">In-App</p>
                        <p className="text-xs text-muted-foreground">Visible dans l&apos;application</p>
                      </div>
                    </div>
                    <Switch checked={sendInApp} onCheckedChange={setSendInApp} />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">Push</p>
                        <p className="text-xs text-muted-foreground">
                          Sur les téléphones ({pushStats?.uniqueUsers || 0} utilisateur{(pushStats?.uniqueUsers || 0) > 1 ? 's' : ''})
                        </p>
                      </div>
                    </div>
                    <Switch checked={sendPush} onCheckedChange={setSendPush} />
                  </div>
                  {whatsappStats?.isConfigured && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
                      <div className="flex items-center gap-3">
                        <MessageCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium">WhatsApp</p>
                          <p className="text-xs text-muted-foreground">
                            Message direct ({whatsappStats?.totalOptIn || 0} membre{(whatsappStats?.totalOptIn || 0) > 1 ? 's' : ''} opt-in)
                          </p>
                        </div>
                      </div>
                      <Switch checked={sendWhatsApp} onCheckedChange={setSendWhatsApp} />
                    </div>
                  )}
                </div>
              </div>

              {/* Destinataires (pour in-app) */}
              {sendInApp && (
                <div className="space-y-3">
                  <Label>Destinataires (in-app)</Label>
                  <RadioGroup value={target} onValueChange={(v) => setTarget(v as 'all' | 'active')}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="all" id="all" />
                      <Label htmlFor="all" className="flex items-center gap-2 cursor-pointer">
                        <Users className="h-4 w-4" />
                        Tous les membres
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="active" id="active" />
                      <Label htmlFor="active" className="flex items-center gap-2 cursor-pointer">
                        <User className="h-4 w-4" />
                        Membres actifs uniquement
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  placeholder="Ex: 🎾 Nouveau tournoi ce weekend !"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Écrivez votre message ici..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {message.length}/500 caractères
                </p>
              </div>

              {/* URL (pour push) */}
              {sendPush && (
                <div className="space-y-2">
                  <Label htmlFor="url">Lien (optionnel)</Label>
                  <Input
                    id="url"
                    placeholder="Ex: /tournaments/123 ou /forum"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Page à ouvrir quand l&apos;utilisateur clique sur la notification
                  </p>
                </div>
              )}

              {/* Bouton d'envoi */}
              <Button 
                onClick={handleSend} 
                disabled={isSending || !title.trim() || !message.trim() || (!sendPush && !sendInApp && !sendWhatsApp)}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer la notification
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                À propos des notifications
              </h3>
              <ul className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                <li><strong>In-App</strong> : Visibles dans le centre de notifications de l&apos;app</li>
                <li><strong>Push</strong> : Envoyées sur les téléphones/ordinateurs des membres qui ont activé les notifications push</li>
                <li><strong>WhatsApp</strong> : Message direct aux membres qui ont activé WhatsApp dans leurs paramètres</li>
              </ul>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                💡 Conseil : Utilisez WhatsApp pour les annonces urgentes et importantes !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
