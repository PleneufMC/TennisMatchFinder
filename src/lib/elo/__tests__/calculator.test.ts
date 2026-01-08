/**
 * Tests unitaires pour le calculateur ELO
 * 
 * Couverture :
 * - Calcul du facteur K dynamique
 * - Calcul du score attendu
 * - Calcul du nouvel ELO
 * - Bornes ELO (min/max)
 * - Intégration complète d'un match
 */

import {
  calculateKFactor,
  calculateExpectedScore,
  calculateNewElo,
  calculateMatchElo,
  calculateEloTrend,
  formatEloDelta,
  getEloDeltaColor,
  getEloRankTitle,
} from '../calculator';
import { ELO_CONSTANTS, DEFAULT_ELO_CONFIG } from '../types';
import type { PlayerForCalculation, MatchForCalculation } from '../types';

describe('ELO Calculator', () => {
  // ============================================
  // Tests du facteur K dynamique
  // ============================================
  describe('calculateKFactor', () => {
    it('retourne K=40 pour les nouveaux joueurs (<10 matchs)', () => {
      const player: PlayerForCalculation = {
        id: 'player1',
        currentElo: 1200,
        matchesPlayed: 5,
      };
      expect(calculateKFactor(player)).toBe(40);
    });

    it('retourne K=40 pour un joueur avec exactement 0 match', () => {
      const player: PlayerForCalculation = {
        id: 'player1',
        currentElo: 1200,
        matchesPlayed: 0,
      };
      expect(calculateKFactor(player)).toBe(40);
    });

    it('retourne K=32 pour les joueurs intermédiaires (10-29 matchs)', () => {
      const player: PlayerForCalculation = {
        id: 'player1',
        currentElo: 1200,
        matchesPlayed: 15,
      };
      expect(calculateKFactor(player)).toBe(32);
    });

    it('retourne K=32 pour un joueur avec exactement 10 matchs', () => {
      const player: PlayerForCalculation = {
        id: 'player1',
        currentElo: 1200,
        matchesPlayed: 10,
      };
      expect(calculateKFactor(player)).toBe(32);
    });

    it('retourne K=24 pour les joueurs établis (>=30 matchs)', () => {
      const player: PlayerForCalculation = {
        id: 'player1',
        currentElo: 1500,
        matchesPlayed: 50,
      };
      expect(calculateKFactor(player)).toBe(24);
    });

    it('retourne K=24 pour un joueur avec exactement 30 matchs', () => {
      const player: PlayerForCalculation = {
        id: 'player1',
        currentElo: 1500,
        matchesPlayed: 30,
      };
      expect(calculateKFactor(player)).toBe(24);
    });

    it('retourne K=16 pour les joueurs à haut ELO (>=1800)', () => {
      const player: PlayerForCalculation = {
        id: 'player1',
        currentElo: 1850,
        matchesPlayed: 100,
      };
      expect(calculateKFactor(player)).toBe(16);
    });

    it('retourne K=16 pour un joueur avec exactement 1800 ELO', () => {
      const player: PlayerForCalculation = {
        id: 'player1',
        currentElo: 1800,
        matchesPlayed: 50,
      };
      expect(calculateKFactor(player)).toBe(16);
    });

    it('priorité: haut ELO (K=16) même si nouveau joueur', () => {
      // Un joueur avec peu de matchs mais haut ELO (cas rare mais possible)
      const player: PlayerForCalculation = {
        id: 'player1',
        currentElo: 1900,
        matchesPlayed: 5,
      };
      expect(calculateKFactor(player)).toBe(16);
    });
  });

  // ============================================
  // Tests du score attendu
  // ============================================
  describe('calculateExpectedScore', () => {
    it('retourne 0.5 pour deux joueurs de même ELO', () => {
      const expected = calculateExpectedScore(1200, 1200);
      expect(expected).toBeCloseTo(0.5, 5);
    });

    it('retourne ~0.64 si joueur a +100 ELO', () => {
      // Formule: 1 / (1 + 10^((1200-1300)/400)) = 1 / (1 + 10^(-0.25))
      const expected = calculateExpectedScore(1300, 1200);
      expect(expected).toBeCloseTo(0.64, 2);
    });

    it('retourne ~0.36 si joueur a -100 ELO', () => {
      const expected = calculateExpectedScore(1200, 1300);
      expect(expected).toBeCloseTo(0.36, 2);
    });

    it('retourne ~0.76 si joueur a +200 ELO', () => {
      const expected = calculateExpectedScore(1400, 1200);
      expect(expected).toBeCloseTo(0.76, 2);
    });

    it('retourne ~0.24 si joueur a -200 ELO', () => {
      const expected = calculateExpectedScore(1200, 1400);
      expect(expected).toBeCloseTo(0.24, 2);
    });

    it('retourne une valeur entre 0 et 1', () => {
      // Test avec des valeurs extrêmes
      const veryHigh = calculateExpectedScore(3000, 100);
      const veryLow = calculateExpectedScore(100, 3000);
      
      expect(veryHigh).toBeGreaterThan(0);
      expect(veryHigh).toBeLessThan(1);
      expect(veryLow).toBeGreaterThan(0);
      expect(veryLow).toBeLessThan(1);
    });

    it('sum of both players expected scores = 1', () => {
      const player1Expected = calculateExpectedScore(1300, 1200);
      const player2Expected = calculateExpectedScore(1200, 1300);
      
      expect(player1Expected + player2Expected).toBeCloseTo(1, 5);
    });
  });

  // ============================================
  // Tests du calcul du nouvel ELO
  // ============================================
  describe('calculateNewElo', () => {
    it('gagne des points après une victoire', () => {
      const newElo = calculateNewElo(1200, 32, 0.5, 1, 1);
      expect(newElo).toBeGreaterThan(1200);
    });

    it('perd des points après une défaite', () => {
      const newElo = calculateNewElo(1200, 32, 0.5, 0, 1);
      expect(newElo).toBeLessThan(1200);
    });

    it('calcule correctement le delta pour un match équilibré', () => {
      // K=32, expected=0.5, actual=1 (victoire), modifier=1
      // Delta = 32 * 1 * (1 - 0.5) = 16
      const newElo = calculateNewElo(1200, 32, 0.5, 1, 1);
      expect(newElo).toBe(1216);
    });

    it('calcule correctement avec modificateur bonus (+15%)', () => {
      // K=32, expected=0.5, actual=1, modifier=1.15
      // Delta = 32 * 1.15 * (1 - 0.5) = 18.4 -> arrondi 18
      const newElo = calculateNewElo(1200, 32, 0.5, 1, 1.15);
      expect(newElo).toBe(1218);
    });

    it('respecte la borne MIN_ELO (100)', () => {
      // Même avec une grosse perte, ne descend pas sous 100
      const newElo = calculateNewElo(150, 40, 0.9, 0, 1);
      expect(newElo).toBeGreaterThanOrEqual(ELO_CONSTANTS.MIN_ELO);
    });

    it('respecte la borne MAX_ELO (3000)', () => {
      // Même avec un gros gain, ne dépasse pas 3000
      const newElo = calculateNewElo(2950, 40, 0.1, 1, 1.5);
      expect(newElo).toBeLessThanOrEqual(ELO_CONSTANTS.MAX_ELO);
    });

    it('retourne exactement 100 si le calcul donne moins', () => {
      const newElo = calculateNewElo(100, 40, 0.99, 0, 1);
      expect(newElo).toBe(ELO_CONSTANTS.MIN_ELO);
    });

    it('arrondit le résultat à l\'entier le plus proche', () => {
      // Vérifie que le résultat est un entier
      const newElo = calculateNewElo(1200, 32, 0.64, 1, 1.15);
      expect(Number.isInteger(newElo)).toBe(true);
    });
  });

  // ============================================
  // Tests du calcul complet d'un match
  // ============================================
  describe('calculateMatchElo', () => {
    const createPlayer = (
      id: string,
      elo: number,
      matches: number
    ): PlayerForCalculation => ({
      id,
      currentElo: elo,
      matchesPlayed: matches,
    });

    it('calcule correctement un match entre joueurs de même niveau', () => {
      const winner = createPlayer('winner', 1200, 20);
      const loser = createPlayer('loser', 1200, 20);
      
      const result = calculateMatchElo(winner, loser, [], []);
      
      // Le gagnant gagne des points
      expect(result.winner.delta).toBeGreaterThan(0);
      // Le perdant perd des points
      expect(result.loser.delta).toBeLessThan(0);
      // La somme des deltas devrait être proche de 0 (légère différence due aux modificateurs)
      expect(Math.abs(result.winner.delta + result.loser.delta)).toBeLessThan(10);
    });

    it('favorise le underdog avec le bonus upset', () => {
      const winner = createPlayer('winner', 1200, 20);
      const loser = createPlayer('loser', 1400, 20); // +200 ELO
      
      const result = calculateMatchElo(winner, loser, [], []);
      
      // Le winner devrait avoir un bonus upset
      expect(result.winner.modifiers.details.some(
        m => m.type === 'upset'
      )).toBe(true);
    });

    it('applique le bonus nouvel adversaire', () => {
      const winner = createPlayer('winner', 1200, 20);
      const loser = createPlayer('loser', 1200, 20);
      
      // Pas d'historique = nouvel adversaire
      const result = calculateMatchElo(winner, loser, [], []);
      
      expect(result.winner.modifiers.details.some(
        m => m.type === 'new_opponent'
      )).toBe(true);
    });

    it('n\'applique pas le bonus nouvel adversaire si historique existe', () => {
      const winner = createPlayer('winner', 1200, 20);
      const loser = createPlayer('loser', 1200, 20);
      
      // Historique avec ce même adversaire
      const winnerHistory: MatchForCalculation[] = [
        { opponentId: loser.id, playedAt: new Date(), winnerId: winner.id }
      ];
      
      const result = calculateMatchElo(winner, loser, winnerHistory, []);
      
      expect(result.winner.modifiers.details.some(
        m => m.type === 'new_opponent'
      )).toBe(false);
    });

    it('retourne les ELO before et after corrects', () => {
      const winner = createPlayer('winner', 1250, 25);
      const loser = createPlayer('loser', 1180, 15);
      
      const result = calculateMatchElo(winner, loser, [], []);
      
      expect(result.winner.eloBefore).toBe(1250);
      expect(result.loser.eloBefore).toBe(1180);
      expect(result.winner.eloAfter).toBe(result.winner.eloBefore + result.winner.delta);
      expect(result.loser.eloAfter).toBe(result.loser.eloBefore + result.loser.delta);
    });
  });

  // ============================================
  // Tests des fonctions utilitaires
  // ============================================
  describe('formatEloDelta', () => {
    it('ajoute un + pour les deltas positifs', () => {
      expect(formatEloDelta(15)).toBe('+15');
    });

    it('garde le - pour les deltas négatifs', () => {
      expect(formatEloDelta(-12)).toBe('-12');
    });

    it('retourne "0" pour un delta nul', () => {
      expect(formatEloDelta(0)).toBe('0');
    });
  });

  describe('getEloDeltaColor', () => {
    it('retourne vert pour un delta positif', () => {
      expect(getEloDeltaColor(10)).toBe('text-green-600');
    });

    it('retourne rouge pour un delta négatif', () => {
      expect(getEloDeltaColor(-10)).toBe('text-red-600');
    });

    it('retourne gris pour un delta nul', () => {
      expect(getEloDeltaColor(0)).toBe('text-gray-600');
    });
  });

  describe('calculateEloTrend', () => {
    it('retourne "up" si tendance positive (>10)', () => {
      const history = [
        { delta: 5 },
        { delta: 4 },
        { delta: 3 },
      ];
      expect(calculateEloTrend(history)).toBe('up');
    });

    it('retourne "down" si tendance négative (<-10)', () => {
      const history = [
        { delta: -5 },
        { delta: -4 },
        { delta: -3 },
      ];
      expect(calculateEloTrend(history)).toBe('down');
    });

    it('retourne "stable" si tendance entre -10 et 10', () => {
      const history = [
        { delta: 3 },
        { delta: -2 },
        { delta: 1 },
      ];
      expect(calculateEloTrend(history)).toBe('stable');
    });

    it('retourne "stable" si historique vide', () => {
      expect(calculateEloTrend([])).toBe('stable');
    });

    it('utilise seulement les N derniers matchs', () => {
      const history = [
        { delta: -20 }, // Récent: négatif
        { delta: -10 },
        { delta: -5 },
        { delta: -3 },
        { delta: -2 },
        { delta: 100 }, // Ce match ancien ne devrait pas compter (>5 matchs)
      ];
      expect(calculateEloTrend(history, 5)).toBe('down');
    });
  });

  describe('getEloRankTitle', () => {
    it('retourne Grand Maître pour ELO >= 2000', () => {
      const rank = getEloRankTitle(2100);
      expect(rank.title).toBe('Grand Maître');
    });

    it('retourne Expert pour ELO 1800-1999', () => {
      const rank = getEloRankTitle(1850);
      expect(rank.title).toBe('Expert');
    });

    it('retourne Avancé pour ELO 1600-1799', () => {
      const rank = getEloRankTitle(1650);
      expect(rank.title).toBe('Avancé');
    });

    it('retourne Intermédiaire+ pour ELO 1400-1599', () => {
      const rank = getEloRankTitle(1450);
      expect(rank.title).toBe('Intermédiaire+');
    });

    it('retourne Intermédiaire pour ELO 1200-1399', () => {
      const rank = getEloRankTitle(1250);
      expect(rank.title).toBe('Intermédiaire');
    });

    it('retourne Débutant+ pour ELO 1000-1199', () => {
      const rank = getEloRankTitle(1050);
      expect(rank.title).toBe('Débutant+');
    });

    it('retourne Débutant pour ELO < 1000', () => {
      const rank = getEloRankTitle(800);
      expect(rank.title).toBe('Débutant');
    });

    it('retourne une couleur et icône valides', () => {
      const rank = getEloRankTitle(1500);
      expect(rank.color).toMatch(/^text-/);
      expect(rank.icon).toBeTruthy();
    });
  });
});
