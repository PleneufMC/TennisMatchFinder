'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, Building2, User, Phone, Globe, MapPin, Users } from 'lucide-react';

interface ClubCreationFormProps {
  userEmail: string;
  userName: string;
}

export function ClubCreationForm({ userEmail, userName }: ClubCreationFormProps) {
  const router = useRouter();
  
  // État du formulaire
  const [requesterName, setRequesterName] = useState(userName);
  const [requesterPhone, setRequesterPhone] = useState('');
  const [clubName, setClubName] = useState('');
  const [clubDescription, setClubDescription] = useState('');
  const [clubAddress, setClubAddress] = useState('');
  const [clubWebsite, setClubWebsite] = useState('');
  const [estimatedMembers, setEstimatedMembers] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clubName || clubName.length < 3) {
      setError('Le nom du club doit contenir au moins 3 caractères');
      return;
    }

    if (!requesterName) {
      setError('Votre nom est requis');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/clubs/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterName,
          requesterPhone: requesterPhone || null,
          clubName,
          clubDescription: clubDescription || null,
          clubAddress: clubAddress || null,
          clubWebsite: clubWebsite || null,
          estimatedMembers: estimatedMembers ? parseInt(estimatedMembers) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la demande');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Demande envoyée !</h3>
        <p className="text-muted-foreground mb-4">
          Votre demande de création du club <strong>{clubName}</strong> a été envoyée.
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Vous recevrez une réponse par email à <strong>{userEmail}</strong> sous 24-48h.
        </p>
        <Button variant="outline" onClick={() => router.push('/')}>
          Retour à l'accueil
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Section Responsable */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          Vos informations
        </h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="requesterName">Votre nom *</Label>
            <Input
              id="requesterName"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              placeholder="Jean Dupont"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="requesterPhone">
              <Phone className="h-3 w-3 inline mr-1" />
              Téléphone (optionnel)
            </Label>
            <Input
              id="requesterPhone"
              type="tel"
              value={requesterPhone}
              onChange={(e) => setRequesterPhone(e.target.value)}
              placeholder="06 12 34 56 78"
            />
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Email de contact : <strong>{userEmail}</strong>
        </div>
      </div>

      <hr />

      {/* Section Club */}
      <div className="space-y-4">
        <h3 className="font-medium flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Informations du club
        </h3>

        <div className="space-y-2">
          <Label htmlFor="clubName">Nom du club *</Label>
          <Input
            id="clubName"
            value={clubName}
            onChange={(e) => setClubName(e.target.value)}
            placeholder="Tennis Club de Paris"
            required
            minLength={3}
          />
          <p className="text-xs text-muted-foreground">
            Minimum 3 caractères. Ce nom sera visible par tous les membres.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="clubDescription">Description (optionnel)</Label>
          <Textarea
            id="clubDescription"
            value={clubDescription}
            onChange={(e) => setClubDescription(e.target.value)}
            placeholder="Décrivez votre club en quelques mots..."
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="clubAddress">
              <MapPin className="h-3 w-3 inline mr-1" />
              Adresse (optionnel)
            </Label>
            <Input
              id="clubAddress"
              value={clubAddress}
              onChange={(e) => setClubAddress(e.target.value)}
              placeholder="123 rue du Tennis, 75001 Paris"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="clubWebsite">
              <Globe className="h-3 w-3 inline mr-1" />
              Site web (optionnel)
            </Label>
            <Input
              id="clubWebsite"
              type="url"
              value={clubWebsite}
              onChange={(e) => setClubWebsite(e.target.value)}
              placeholder="https://www.monclub.fr"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedMembers">
            <Users className="h-3 w-3 inline mr-1" />
            Nombre estimé de membres (optionnel)
          </Label>
          <Input
            id="estimatedMembers"
            type="number"
            min="1"
            value={estimatedMembers}
            onChange={(e) => setEstimatedMembers(e.target.value)}
            placeholder="50"
          />
          <p className="text-xs text-muted-foreground">
            Cela nous aide à dimensionner l'infrastructure.
          </p>
        </div>
      </div>

      <hr />

      {/* Bouton de soumission */}
      <div className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Votre demande sera examinée par notre équipe. Vous recevrez une réponse 
            par email sous 24 à 48 heures. En cas d'approbation, vous deviendrez 
            automatiquement l'administrateur du club.
          </AlertDescription>
        </Alert>

        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Envoi en cours...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Envoyer ma demande
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
