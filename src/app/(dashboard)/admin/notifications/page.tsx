'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bell, Send, Users, User, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/toast';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'active'>('all');
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Veuillez remplir le titre et le message');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, target }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'envoi');
      }

      const data = await response.json();
      
      setSent(true);
      toast.success(`${data.count} membre${data.count > 1 ? 's' : ''} notifié${data.count > 1 ? 's' : ''}`);
      
      // Reset form after success
      setTimeout(() => {
        setTitle('');
        setMessage('');
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

      {/* Formulaire d'envoi */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle notification</CardTitle>
          <CardDescription>
            Envoyez une notification à tous les membres ou aux membres actifs
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
              {/* Destinataires */}
              <div className="space-y-3">
                <Label>Destinataires</Label>
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

              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input
                  id="title"
                  placeholder="Ex: Nouveau tournoi ce weekend !"
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

              {/* Bouton d'envoi */}
              <Button 
                onClick={handleSend} 
                disabled={isSending || !title.trim() || !message.trim()}
                className="w-full"
              >
                {isSending ? (
                  'Envoi en cours...'
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
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Les notifications sont envoyées dans l&apos;application. Les membres les verront 
                dans leur centre de notifications. Pour les annonces importantes, 
                pensez aussi à utiliser le forum ou le chat du club.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
