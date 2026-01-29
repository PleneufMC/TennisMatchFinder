/**
 * Section Parrainages pour le profil
 * 
 * Affiche le lien de parrainage, les stats et la liste des filleuls.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserPlus, Copy, Check, Share2, Users, Trophy, 
  Gift, ChevronRight, Loader2, Network
} from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

interface ReferralStats {
  totalReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  rewardedReferrals: number;
}

interface ReferredPlayer {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  currentElo: number;
  status: 'pending' | 'completed' | 'rewarded';
  joinedAt: Date | null;
}

interface ReferralData {
  stats: ReferralStats;
  referredPlayers: ReferredPlayer[];
  referralLink: string;
}

export function ReferralSection() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await fetch('/api/referrals');
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!data?.referralLink) return;
    
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      toast.success('Lien copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Erreur lors de la copie');
    }
  };

  const shareLink = async () => {
    if (!data?.referralLink) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Rejoins TennisMatchFinder !',
          text: 'Je t\'invite à rejoindre TennisMatchFinder pour trouver des partenaires de tennis.',
          url: data.referralLink,
        });
      } catch (error) {
        // User cancelled or error
        if ((error as Error).name !== 'AbortError') {
          copyLink(); // Fallback to copy
        }
      }
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { stats, referredPlayers, referralLink } = data;
  
  // Calcul progression vers badges
  const ambassadorProgress = Math.min((stats.completedReferrals / 3) * 100, 100);
  const networkerProgress = Math.min((stats.completedReferrals / 10) * 100, 100);
  const hasAmbassador = stats.completedReferrals >= 3;
  const hasNetworker = stats.completedReferrals >= 10;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Mes parrainages
        </CardTitle>
        <CardDescription>
          Invitez vos amis et gagnez des badges exclusifs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lien de parrainage */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="h-5 w-5 text-primary" />
            <span className="font-medium">Votre lien de parrainage</span>
          </div>
          
          <div className="flex gap-2">
            <div className="flex-1 bg-background rounded-md px-3 py-2 text-sm font-mono truncate border">
              {referralLink}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyLink}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="default"
              size="icon"
              onClick={shareLink}
              className="flex-shrink-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-primary">{stats.completedReferrals}</p>
            <p className="text-xs text-muted-foreground">Filleuls inscrits</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold">{stats.pendingReferrals}</p>
            <p className="text-xs text-muted-foreground">En attente</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <p className="text-2xl font-bold text-amber-600">{stats.rewardedReferrals}</p>
            <p className="text-xs text-muted-foreground">Récompensés</p>
          </div>
        </div>

        {/* Progression vers les badges */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Progression vers les badges</h4>
          
          {/* Badge Ambassador */}
          <div className="flex items-center gap-4">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              hasAmbassador 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-500'
            }`}>
              <UserPlus className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Ambassador</span>
                <span className="text-xs text-muted-foreground">
                  {stats.completedReferrals}/3
                </span>
              </div>
              <Progress value={ambassadorProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {hasAmbassador ? '✓ Débloqué !' : '3 filleuls inscrits'}
              </p>
            </div>
          </div>

          {/* Badge Networker */}
          <div className="flex items-center gap-4">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              hasNetworker 
                ? 'bg-purple-500 text-white' 
                : 'bg-purple-100 dark:bg-purple-900/30 text-purple-500'
            }`}>
              <Network className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Networker</span>
                <span className="text-xs text-muted-foreground">
                  {stats.completedReferrals}/10
                </span>
              </div>
              <Progress value={networkerProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {hasNetworker ? '✓ Débloqué !' : '10 filleuls inscrits'}
              </p>
            </div>
          </div>
        </div>

        {/* Liste des filleuls */}
        {referredPlayers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Vos filleuls</h4>
            <div className="space-y-2">
              {referredPlayers.slice(0, 5).map((player) => {
                const initials = player.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <Link
                    key={player.id}
                    href={`/profil/${player.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={player.avatarUrl || undefined} />
                      <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{player.fullName}</p>
                      <p className="text-xs text-muted-foreground">{player.currentElo} ELO</p>
                    </div>
                    <Badge variant={player.status === 'completed' ? 'success' : 'secondary'} className="text-xs">
                      {player.status === 'completed' ? 'Inscrit' : 'En attente'}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
            {referredPlayers.length > 5 && (
              <p className="text-xs text-muted-foreground text-center">
                Et {referredPlayers.length - 5} autre(s)...
              </p>
            )}
          </div>
        )}

        {/* CTA si pas encore de filleuls */}
        {referredPlayers.length === 0 && (
          <div className="text-center py-4">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Vous n&apos;avez pas encore de filleuls.<br />
              Partagez votre lien pour commencer !
            </p>
            <Button onClick={shareLink}>
              <Share2 className="h-4 w-4 mr-2" />
              Partager mon lien
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
