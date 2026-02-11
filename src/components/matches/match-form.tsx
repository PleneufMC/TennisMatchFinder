'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  UserPlus, 
  Trophy, 
  Calendar,
  Clock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Info
} from 'lucide-react';
import { MatchFormatSelector } from '@/components/matches/match-format-selector';
import { type MatchFormat, inferFormatFromScore, FORMAT_LABELS } from '@/lib/elo/format-coefficients';

interface Opponent {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo: number;
}

interface MatchFormProps {
  currentPlayer: {
    id: string;
    fullName: string;
    currentElo: number;
  };
  opponents: Opponent[];
  clubId: string;
  preselectedOpponentId?: string;
}

type FormStep = 'opponent' | 'score' | 'confirm';
type WinnerType = 'me' | 'opponent';

export function MatchForm({ currentPlayer, opponents, clubId, preselectedOpponentId }: MatchFormProps) {
  const router = useRouter();
  
  // Pré-sélectionner l'adversaire si fourni via l'URL (?opponent=id)
  const preselected = preselectedOpponentId
    ? opponents.find(o => o.id === preselectedOpponentId) ?? null
    : null;

  // État du formulaire
  const [step, setStep] = useState<FormStep>(preselected ? 'score' : 'opponent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(preselected);
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  // Données du match
  const [winner, setWinner] = useState<WinnerType | null>(null);
  const [score, setScore] = useState('');
  const [matchFormat, setMatchFormat] = useState<MatchFormat>('two_sets');
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0]);
  const [gameType, setGameType] = useState<'simple' | 'double'>('simple');
  const [surface, setSurface] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  // Invitation
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Filtrer les adversaires
  const filteredOpponents = opponents.filter(
    (o) =>
      o.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Validation du score en fonction du format
  const validateScore = (scoreStr: string, format: MatchFormat): boolean => {
    const sets = scoreStr.trim().split(/\s+/);
    if (sets.length === 0) return false;
    
    // Vérifier le nombre de sets selon le format
    const expectedSets: Record<MatchFormat, { min: number; max: number }> = {
      one_set: { min: 1, max: 1 },
      two_sets: { min: 2, max: 2 },
      two_sets_super_tb: { min: 2, max: 3 }, // 2 sets, ou 3 si Super TB au 3ème
      three_sets: { min: 2, max: 3 },
      super_tiebreak: { min: 1, max: 1 },    // Super TB seul = score unique (10-X)
    };
    
    const { min, max } = expectedSets[format];
    if (sets.length < min || sets.length > max) return false;
    
    // Valider chaque set
    return sets.every((set, index) => {
      // Pour le format "super_tiebreak" seul : un seul score de 10 pts minimum
      if (format === 'super_tiebreak') {
        const stbMatch = set.match(/^(\d+)-(\d+)$/);
        if (stbMatch) {
          const [, g1, g2] = stbMatch;
          const s1 = parseInt(g1 || '0');
          const s2 = parseInt(g2 || '0');
          // Le gagnant doit avoir au moins 10 pts et 2 pts d'écart
          const winner = Math.max(s1, s2);
          const loser = Math.min(s1, s2);
          return winner >= 10 && winner - loser >= 2;
        }
        return false;
      }
      
      // Pour le format "2 sets + Super TB" : le 3ème set peut être un Super TB
      if (format === 'two_sets_super_tb' && index === sets.length - 1 && sets.length === 3) {
        // Le 3ème set est un Super TB : 10-8, 11-9, etc.
        const stbMatch = set.match(/^(\d+)-(\d+)$/);
        if (stbMatch) {
          const [, g1, g2] = stbMatch;
          const s1 = parseInt(g1 || '0');
          const s2 = parseInt(g2 || '0');
          const winner = Math.max(s1, s2);
          const loser = Math.min(s1, s2);
          if (winner >= 10 && winner - loser >= 2) {
            return true;
          }
        }
      }
      
      // Vérifier le format de base d'un set normal
      const match = set.match(/^(\d)-(\d)(\((\d+)\))?$/);
      if (!match) return false;
      
      const [, games1, games2] = match;
      if (!games1 || !games2) return false;
      const g1 = parseInt(games1);
      const g2 = parseInt(games2);
      
      // Un set normal se termine 6-x où x <= 4, ou 7-5, ou 7-6
      if (g1 === 6 && g2 <= 4) return true;
      if (g2 === 6 && g1 <= 4) return true;
      if ((g1 === 7 && g2 === 5) || (g1 === 5 && g2 === 7)) return true;
      if ((g1 === 7 && g2 === 6) || (g1 === 6 && g2 === 7)) return true;
      
      return false;
    });
  };

  // Auto-inférer le format quand le score change
  const handleScoreChange = (newScore: string) => {
    setScore(newScore);
    // Suggérer un format basé sur le score entré
    if (newScore.trim()) {
      const inferred = inferFormatFromScore(newScore);
      setMatchFormat(inferred);
    }
  };

  // Message d'aide pour le format de score
  const getScoreHelpText = (format: MatchFormat): string => {
    switch (format) {
      case 'one_set': return 'Exemples: 6-4, 6-3, 7-6(5)';
      case 'two_sets': return 'Exemples: 6-4 6-2, 7-5 6-3';
      case 'two_sets_super_tb': return 'Exemples: 6-4 6-3, ou 6-4 4-6 10-8 si égalité';
      case 'three_sets': return 'Exemples: 6-4 3-6 7-5';
      case 'super_tiebreak': return 'Score du Super TB (10 pts min, 2 pts écart). Ex: 10-7, 11-9';
    }
  };

  // Déterminer le vainqueur à partir du score
  const determineWinnerFromScore = (scoreStr: string): 'player1' | 'player2' | null => {
    const sets = scoreStr.trim().split(/\s+/);
    let player1Sets = 0;
    let player2Sets = 0;
    
    for (const set of sets) {
      const match = set.match(/^(\d)-(\d)/);
      if (!match) return null;
      
      const [, g1, g2] = match;
      if (!g1 || !g2) return null;
      if (parseInt(g1) > parseInt(g2)) {
        player1Sets++;
      } else {
        player2Sets++;
      }
    }
    
    if (player1Sets > player2Sets) return 'player1';
    if (player2Sets > player1Sets) return 'player2';
    return null;
  };

  // Soumettre le match
  const handleSubmit = async () => {
    if (!selectedOpponent || !winner || !score) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!validateScore(score, matchFormat)) {
      setError(`Format de score invalide pour un match en ${FORMAT_LABELS[matchFormat]}. ${getScoreHelpText(matchFormat)}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const winnerId = winner === 'me' ? currentPlayer.id : selectedOpponent.id;
      
      const response = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          opponentId: selectedOpponent.id,
          winnerId,
          score,
          matchFormat,
          gameType,
          surface: surface || null,
          playedAt,
          notes: notes || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'enregistrement');
      }

      setSuccess(true);
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push('/matchs');
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Envoyer une invitation
  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) {
      setError('Veuillez remplir l\'email et le nom');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/matches/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clubId,
          email: inviteEmail,
          name: inviteName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'invitation');
      }

      setSuccess(true);
      setShowInviteForm(false);
      
      // Rafraîchir la page pour voir le nouveau membre
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render success state
  if (success) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Match enregistré !</h3>
        <p className="text-muted-foreground mb-4">
          Votre adversaire recevra une notification pour confirmer le résultat.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirection en cours...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Étape 1: Sélection de l'adversaire */}
      {step === 'opponent' && (
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Choisir votre adversaire</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Sélectionnez le membre du club contre qui vous avez joué
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Rechercher un joueur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Liste des adversaires */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {filteredOpponents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucun joueur trouvé</p>
              </div>
            ) : (
              filteredOpponents.map((opponent) => (
                <button
                  key={opponent.id}
                  onClick={() => {
                    setSelectedOpponent(opponent);
                    setStep('score');
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-accent ${
                    selectedOpponent?.id === opponent.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border'
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={opponent.avatarUrl || undefined} />
                    <AvatarFallback>
                      {opponent.fullName.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">{opponent.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      ELO: {opponent.currentElo}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-auto">
                    {opponent.currentElo > currentPlayer.currentElo ? '+' : ''}
                    {Math.abs(opponent.currentElo - currentPlayer.currentElo)} pts
                  </Badge>
                </button>
              ))
            )}
          </div>

          {/* Option d'invitation */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowInviteForm(!showInviteForm)}
              className="flex items-center gap-2 text-primary hover:underline text-sm"
            >
              <UserPlus className="h-4 w-4" />
              Votre adversaire n&apos;est pas membre ? Invitez-le !
            </button>

            {showInviteForm && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteName">Nom du joueur</Label>
                  <Input
                    id="inviteName"
                    placeholder="Jean Dupont"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleInvite}
                  disabled={isSubmitting || !inviteEmail || !inviteName}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Envoyer l&apos;invitation
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Étape 2: Détails du match */}
      {step === 'score' && selectedOpponent && (
        <div className="space-y-6">
          {/* Résumé adversaire */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedOpponent.avatarUrl || undefined} />
              <AvatarFallback>
                {selectedOpponent.fullName.split(' ').map((n) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">vs {selectedOpponent.fullName}</p>
              <p className="text-sm text-muted-foreground">ELO: {selectedOpponent.currentElo}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setStep('opponent')}>
              Changer
            </Button>
          </div>

          {/* Vainqueur */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Qui a gagné ?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setWinner('me')}
                className={`p-4 rounded-lg border-2 transition-colors text-center ${
                  winner === 'me'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-border hover:border-green-300'
                }`}
              >
                <Trophy className={`h-6 w-6 mx-auto mb-2 ${winner === 'me' ? 'text-green-600' : 'text-muted-foreground'}`} />
                <p className="font-medium">Moi</p>
                <p className="text-sm text-muted-foreground">{currentPlayer.fullName}</p>
              </button>
              <button
                onClick={() => setWinner('opponent')}
                className={`p-4 rounded-lg border-2 transition-colors text-center ${
                  winner === 'opponent'
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-border hover:border-green-300'
                }`}
              >
                <Trophy className={`h-6 w-6 mx-auto mb-2 ${winner === 'opponent' ? 'text-green-600' : 'text-muted-foreground'}`} />
                <p className="font-medium">Adversaire</p>
                <p className="text-sm text-muted-foreground">{selectedOpponent.fullName}</p>
              </button>
            </div>
          </div>

          {/* Format du match */}
          <MatchFormatSelector 
            value={matchFormat} 
            onChange={setMatchFormat} 
          />

          {/* Score */}
          <div className="space-y-2">
            <Label htmlFor="score">Score</Label>
            <Input
              id="score"
              placeholder={
                matchFormat === 'one_set' ? '6-4' : 
                matchFormat === 'super_tiebreak' ? '10-7' : 
                matchFormat === 'two_sets_super_tb' ? '6-4 4-6 10-8' :
                matchFormat === 'three_sets' ? '6-4 3-6 6-2' :
                '6-4 6-2'
              }
              value={score}
              onChange={(e) => handleScoreChange(e.target.value)}
              className={!score || validateScore(score, matchFormat) ? '' : 'border-red-500'}
            />
            {score && !validateScore(score, matchFormat) ? (
              <p className="text-sm text-red-500">Format invalide. {getScoreHelpText(matchFormat)}</p>
            ) : (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Info className="h-3 w-3" />
                {getScoreHelpText(matchFormat)}
              </p>
            )}
          </div>

          {/* Date du match */}
          <div className="space-y-2">
            <Label htmlFor="playedAt">Date du match</Label>
            <Input
              id="playedAt"
              type="date"
              value={playedAt}
              onChange={(e) => setPlayedAt(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Type de jeu */}
          <div className="space-y-2">
            <Label>Type de match</Label>
            <Select value={gameType} onValueChange={(v: 'simple' | 'double') => setGameType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="double">Double</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Surface (optionnel) */}
          <div className="space-y-2">
            <Label>Surface (optionnel)</Label>
            <Select value={surface} onValueChange={setSurface}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="terre battue">Terre battue</SelectItem>
                <SelectItem value="dur">Dur</SelectItem>
                <SelectItem value="gazon">Gazon</SelectItem>
                <SelectItem value="indoor">Indoor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes (optionnel) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Commentaires sur le match..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('opponent')} className="flex-1">
              Retour
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !winner || !score || !validateScore(score, matchFormat)}
              className="flex-1"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Enregistrer
            </Button>
          </div>

          {/* Info validation */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {selectedOpponent.fullName} recevra une notification pour confirmer ce résultat.
              Le match sera validé et les ELO mis à jour une fois confirmé.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
}
