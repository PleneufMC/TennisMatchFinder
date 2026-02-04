'use client';

import { useState } from 'react';
import { Mail, Send, Eye, AlertTriangle, CheckCircle, Loader2, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Player {
  id: string;
  name: string;
  email: string;
  inscritDepuis: string;
}

interface PreviewResponse {
  success: boolean;
  count: number;
  players: Player[];
  message?: string;
  error?: string;
}

interface SendResponse {
  success: boolean;
  message: string;
  stats?: {
    total: number;
    sent: number;
    failed: number;
  };
  errors?: string[];
  error?: string;
}

export default function CampagnesEmailPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewResponse | null>(null);
  const [sendResult, setSendResult] = useState<SendResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Charger la prévisualisation
  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);
    setPreviewData(null);
    setSendResult(null);

    try {
      const response = await fetch('/api/admin/email-inactive-players');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du chargement');
      }

      setPreviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  // Envoyer les emails
  const sendEmails = async () => {
    setShowConfirmDialog(false);
    setIsSending(true);
    setError(null);
    setSendResult(null);

    try {
      const response = await fetch('/api/admin/email-inactive-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi');
      }

      setSendResult(data);
      // Recharger la prévisualisation pour voir les changements
      // (Normalement les joueurs qui ont reçu l'email devraient toujours apparaître
      // car on ne change pas leur statut matchesPlayed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            Campagnes Email
          </h1>
          <p className="text-muted-foreground">
            Envoyez des emails de relance aux joueurs inactifs
          </p>
        </div>
      </div>

      {/* Carte principale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Joueurs sans match enregistré
          </CardTitle>
          <CardDescription>
            Ces joueurs se sont inscrits mais n'ont jamais enregistré de match.
            Envoyez-leur un email pour les encourager à utiliser la plateforme.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Boutons d'action */}
          <div className="flex gap-4">
            <Button onClick={loadPreview} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              {isLoading ? 'Chargement...' : 'Voir les destinataires'}
            </Button>

            {previewData && previewData.count > 0 && (
              <Button
                variant="default"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowConfirmDialog(true)}
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isSending ? 'Envoi en cours...' : `Envoyer à ${previewData.count} joueurs`}
              </Button>
            )}
          </div>

          {/* Message d'erreur */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Résultat d'envoi */}
          {sendResult && (
            <Alert className={sendResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
              {sendResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle className={sendResult.success ? 'text-green-800' : 'text-red-800'}>
                {sendResult.success ? 'Campagne envoyée !' : 'Erreur'}
              </AlertTitle>
              <AlertDescription className={sendResult.success ? 'text-green-700' : 'text-red-700'}>
                {sendResult.stats && (
                  <div className="mt-2 space-y-1">
                    <p>✅ Emails envoyés : <strong>{sendResult.stats.sent}</strong></p>
                    {sendResult.stats.failed > 0 && (
                      <p>❌ Échecs : <strong>{sendResult.stats.failed}</strong></p>
                    )}
                  </div>
                )}
                {sendResult.errors && sendResult.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm">Voir les erreurs</summary>
                    <ul className="mt-1 text-sm list-disc list-inside">
                      {sendResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Prévisualisation des destinataires */}
          {previewData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  {previewData.count} joueur{previewData.count > 1 ? 's' : ''} concerné{previewData.count > 1 ? 's' : ''}
                </h3>
                <Badge variant="outline">
                  Prévisualisation
                </Badge>
              </div>

              {previewData.count === 0 ? (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Aucun joueur inactif</AlertTitle>
                  <AlertDescription>
                    Tous les joueurs inscrits ont déjà enregistré au moins un match. 🎉
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Inscrit le</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.players.slice(0, 50).map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell className="text-muted-foreground">{player.email}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(player.inscritDepuis)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {previewData.count > 50 && (
                    <div className="p-3 text-center text-sm text-muted-foreground bg-muted/50">
                      ... et {previewData.count - 50} autres joueurs
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Aperçu visuel de l'email */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              📧 Aperçu de l'email envoyé
            </h3>
            <p className="text-sm text-muted-foreground">
              <strong>Objet :</strong> 🎾 [Prénom], ton classement ELO t'attend !
            </p>
            
            {/* Rendu visuel de l'email */}
            <div className="border rounded-lg overflow-hidden shadow-sm">
              <div style={{ 
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
                padding: '24px', 
                textAlign: 'center' 
              }}>
                <h2 style={{ color: '#ffffff', margin: 0, fontSize: '22px', fontWeight: 'bold' }}>
                  🎾 TennisMatchFinder
                </h2>
              </div>
              
              <div style={{ padding: '32px', backgroundColor: '#ffffff' }}>
                <h3 style={{ color: '#1f2937', margin: '0 0 12px 0', fontSize: '20px' }}>
                  Salut <span className="text-green-600">[Prénom]</span> !
                </h3>
                
                <p style={{ color: '#4b5563', fontSize: '15px', lineHeight: 1.6 }}>
                  Tu as rejoint TennisMatchFinder, mais tu n'as pas encore enregistré de match. 
                  <strong> C'est dommage !</strong>
                </p>
                
                <div style={{ 
                  backgroundColor: '#f0fdf4', 
                  borderLeft: '4px solid #16a34a', 
                  padding: '12px 16px', 
                  margin: '20px 0',
                  borderRadius: '0 8px 8px 0'
                }}>
                  <p style={{ color: '#166534', margin: 0, fontSize: '14px' }}>
                    <strong>Le savais-tu ?</strong><br/>
                    En enregistrant ton premier match, tu obtiens immédiatement un classement ELO !
                  </p>
                </div>
                
                <div style={{ textAlign: 'center', margin: '28px 0' }}>
                  <span style={{ 
                    display: 'inline-block',
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', 
                    color: '#ffffff', 
                    padding: '14px 32px', 
                    borderRadius: '8px', 
                    fontSize: '16px', 
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)'
                  }}>
                    🎾 Enregistrer mon premier match
                  </span>
                </div>
                
                <p style={{ color: '#9ca3af', fontSize: '12px', textAlign: 'center', marginTop: '24px' }}>
                  <a href="#" style={{ color: '#9ca3af' }}>Gérer mes préférences email</a>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmation */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer l'envoi</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point d'envoyer un email à <strong>{previewData?.count || 0} joueurs</strong>.
              <br /><br />
              Cette action est irréversible. Les emails seront envoyés immédiatement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Annuler
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={sendEmails}
            >
              <Send className="mr-2 h-4 w-4" />
              Confirmer l'envoi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
