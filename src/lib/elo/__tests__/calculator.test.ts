/**
 * Tests unitaires pour le calculateur ELO
 * 
 * Ces tests protègent le différenciateur #1 de TennisMatchFinder :
 * un système ELO transparent et équitable.
 */

import {
  calculateExpectedScore,
  getKFactor,
  getKFactorLabel,
  calculateEloChange,
  calculateSimpleEloChange,
  calculateNewElo,
  calculateEloTrend,
  formatEloDelta,
  getEloDeltaColor,
  getEloRankTitle,
  ELO_CONFIG,
} from '../calculator';
import { ELO_CONSTANTS } from '../types';

// ============================================
// Tests calculateExpectedScore
// ============================================

describe('calculateExpectedScore', () => {
  test('retourne 0.5 pour deux joueurs de même ELO', () => {
    const result = calculateExpectedScore(1200, 1200);
    expect(result).toBeCloseTo(0.5, 2);
  });

  test('retourne ~0.76 pour +200 ELO d\'avantage', () => {
    const result = calculateExpectedScore(1400, 1200);
    expect(result).toBeCloseTo(0.76, 1);
  });

  test('retourne ~0.24 pour -200 ELO de désavantage', () => {
    const result = calculateExpectedScore(1200, 1400);
    expect(result).toBeCloseTo(0.24, 1);
  });

  test('retourne ~0.91 pour +400 ELO d\'avantage', () => {
    const result = calculateExpectedScore(1600, 1200);
    expect(result).toBeCloseTo(0.91, 1);
  });

  test('retourne toujours une valeur entre 0 et 1', () => {
    // Cas extrêmes
    const extreme1 = calculateExpectedScore(3000, 100);
    const extreme2 = calculateExpectedScore(100, 3000);
    
    expect(extreme1).toBeGreaterThan(0);
    expect(extreme1).toBeLessThan(1);
    expect(extreme2).toBeGreaterThan(0);
    expect(extreme2).toBeLessThan(1);
  });

  test('est symétrique (les deux probabilités somment à 1)', () => {
    const player1Expected = calculateExpectedScore(1300, 1200);
    const player2Expected = calculateExpectedScore(1200, 1300);
    
    expect(player1Expected + player2Expected).toBeCloseTo(1, 5);
  });
});

// ============================================
// Tests getKFactor
// ============================================

describe('getKFactor', () => {
  test('retourne 40 pour un nouveau joueur (< 10 matchs)', () => {
    expect(getKFactor(0)).toBe(40);
    expect(getKFactor(5)).toBe(40);
    expect(getKFactor(9)).toBe(40);
  });

  test('retourne 32 pour un joueur intermédiaire (10-29 matchs)', () => {
    expect(getKFactor(10)).toBe(32);
    expect(getKFactor(20)).toBe(32);
    expect(getKFactor(29)).toBe(32);
  });

  test('retourne 24 pour un joueur établi (≥ 30 matchs)', () => {
    expect(getKFactor(30)).toBe(24);
    expect(getKFactor(50)).toBe(24);
    expect(getKFactor(100)).toBe(24);
  });

  test('les valeurs correspondent à ELO_CONFIG', () => {
    expect(getKFactor(5)).toBe(ELO_CONFIG.K_FACTOR_NEW);
    expect(getKFactor(15)).toBe(ELO_CONFIG.K_FACTOR_INTER);
    expect(getKFactor(50)).toBe(ELO_CONFIG.K_FACTOR_ESTABLISHED);
  });
});

// ============================================
// Tests getKFactorLabel
// ============================================

describe('getKFactorLabel', () => {
  test('retourne "Nouveau joueur" pour < 10 matchs', () => {
    expect(getKFactorLabel(5)).toBe('Nouveau joueur');
  });

  test('retourne "Intermédiaire" pour 10-29 matchs', () => {
    expect(getKFactorLabel(15)).toBe('Intermédiaire');
  });

  test('retourne "Établi" pour ≥ 30 matchs', () => {
    expect(getKFactorLabel(50)).toBe('Établi');
  });
});

// ============================================
// Tests calculateEloChange (fonction principale)
// ============================================

describe('calculateEloChange', () => {
  test('le gagnant gagne des points, le perdant en perd', () => {
    const result = calculateEloChange({
      winnerElo: 1200,
      loserElo: 1200,
      winnerMatchCount: 20,
      loserMatchCount: 20,
      matchFormat: 'two_sets',
    });

    expect(result.winnerDelta).toBeGreaterThan(0);
    expect(result.loserDelta).toBeLessThan(0);
  });

  test('le delta minimum est de 1 point', () => {
    const result = calculateEloChange({
      winnerElo: 2500,
      loserElo: 1000,
      winnerMatchCount: 100,
      loserMatchCount: 100,
      matchFormat: 'super_tiebreak',
    });

    expect(result.winnerDelta).toBeGreaterThanOrEqual(1);
  });

  test('victoire contre joueur de même niveau ≈ K/2 points', () => {
    const result = calculateEloChange({
      winnerElo: 1200,
      loserElo: 1200,
      winnerMatchCount: 30,
      loserMatchCount: 30,
      matchFormat: 'three_sets', // Coefficient 1.0
    });

    // K=24 pour établi, expected=0.5, donc raw ≈ 12
    expect(result.breakdown.rawChange).toBeCloseTo(12, 0);
  });

  test('le perdant perd 80% de ce que le gagnant gagne', () => {
    const result = calculateEloChange({
      winnerElo: 1200,
      loserElo: 1200,
      winnerMatchCount: 30,
      loserMatchCount: 30,
      matchFormat: 'three_sets',
    });

    const loserRatio = Math.abs(result.loserDelta) / result.winnerDelta;
    expect(loserRatio).toBeCloseTo(0.8, 1);
  });

  describe('coefficients de format', () => {
    test('1 set = coefficient 0.5', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'one_set',
      });

      expect(result.breakdown.formatCoefficient).toBe(0.5);
    });

    test('2 sets = coefficient 0.8', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'two_sets',
      });

      expect(result.breakdown.formatCoefficient).toBe(0.8);
    });

    test('3 sets = coefficient 1.0 (impact maximal)', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
      });

      expect(result.breakdown.formatCoefficient).toBe(1.0);
    });

    test('super tiebreak = coefficient 0.3 (très aléatoire)', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'super_tiebreak',
      });

      expect(result.breakdown.formatCoefficient).toBe(0.3);
    });
  });

  describe('bonus nouvel adversaire (+15%)', () => {
    test('applique le bonus si isNewOpponent = true', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
        isNewOpponent: true,
      });

      expect(result.breakdown.newOpponentBonus).toBe(1.15);
    });

    test('pas de bonus si isNewOpponent = false', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
        isNewOpponent: false,
      });

      expect(result.breakdown.newOpponentBonus).toBe(1.0);
    });
  });

  describe('bonus upset (+20%)', () => {
    test('applique le bonus si victoire contre +100 ELO', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1300, // +100 ELO
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
      });

      expect(result.breakdown.upsetBonus).toBe(1.20);
    });

    test('pas de bonus si écart < 100 ELO', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1250, // Seulement +50
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
      });

      expect(result.breakdown.upsetBonus).toBe(1.0);
    });

    test('pas de bonus si le gagnant est mieux classé', () => {
      const result = calculateEloChange({
        winnerElo: 1400,
        loserElo: 1200, // Le gagnant était favori
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
      });

      expect(result.breakdown.upsetBonus).toBe(1.0);
    });
  });

  describe('malus répétition (-5% par match)', () => {
    test('applique le malus pour adversaires répétés', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
        recentMatchesVsSameOpponent: 2, // 2 matchs récents
      });

      // 1 - (2 * 0.05) = 0.90
      expect(result.breakdown.repetitionMalus).toBeCloseTo(0.90, 2);
    });

    test('le malus minimum est 0.70 (plancher)', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
        recentMatchesVsSameOpponent: 10, // Beaucoup de matchs
      });

      // Ne devrait pas descendre sous 0.70
      expect(result.breakdown.repetitionMalus).toBe(0.70);
    });

    test('pas de malus si 0 matchs récents', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
        recentMatchesVsSameOpponent: 0,
      });

      expect(result.breakdown.repetitionMalus).toBe(1.0);
    });
  });

  describe('bonus diversité hebdo (+10%)', () => {
    test('applique le bonus si ≥ 3 adversaires différents cette semaine', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
        weeklyUniqueOpponents: 3,
      });

      expect(result.breakdown.diversityBonus).toBe(1.10);
    });

    test('pas de bonus si < 3 adversaires', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'three_sets',
        weeklyUniqueOpponents: 2,
      });

      expect(result.breakdown.diversityBonus).toBe(1.0);
    });
  });

  describe('modificateur de marge', () => {
    test('victoire nette (6-0) = bonus ~1.15', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'one_set',
        winnerGames: 6,
        loserGames: 0, // 6-0
      });

      expect(result.breakdown.marginModifier).toBe(1.15);
    });

    test('match serré (7-6) = malus ~0.90', () => {
      const result = calculateEloChange({
        winnerElo: 1200,
        loserElo: 1200,
        winnerMatchCount: 30,
        loserMatchCount: 30,
        matchFormat: 'one_set',
        winnerGames: 7,
        loserGames: 6, // 7-6 tie-break
      });

      expect(result.breakdown.marginModifier).toBe(0.90);
    });
  });
});

// ============================================
// Tests calculateSimpleEloChange
// ============================================

describe('calculateSimpleEloChange', () => {
  test('retourne les deltas sans contexte', () => {
    const result = calculateSimpleEloChange(1200, 1200);

    expect(result.winnerDelta).toBeGreaterThan(0);
    expect(result.loserDelta).toBeLessThan(0);
  });

  test('utilise le format par défaut (two_sets)', () => {
    const result = calculateSimpleEloChange(1200, 1200);
    const withFormat = calculateSimpleEloChange(1200, 1200, 'two_sets');

    expect(result.winnerDelta).toBe(withFormat.winnerDelta);
  });
});

// ============================================
// Tests calculateNewElo (legacy)
// ============================================

describe('calculateNewElo', () => {
  test('respecte la limite minimum ELO (100)', () => {
    const result = calculateNewElo(
      150,  // currentElo
      40,   // kFactor
      0.9,  // expectedScore élevé (favori)
      0,    // actualScore = défaite
      1     // modifier
    );

    expect(result).toBeGreaterThanOrEqual(ELO_CONSTANTS.MIN_ELO);
  });

  test('respecte la limite maximum ELO (3000)', () => {
    const result = calculateNewElo(
      2950, // currentElo
      40,   // kFactor
      0.1,  // expectedScore bas (outsider)
      1,    // actualScore = victoire
      2     // modifier élevé
    );

    expect(result).toBeLessThanOrEqual(ELO_CONSTANTS.MAX_ELO);
  });

  test('applique le modificateur correctement', () => {
    const withoutMod = calculateNewElo(1200, 24, 0.5, 1, 1);
    const withMod = calculateNewElo(1200, 24, 0.5, 1, 1.5);

    // Avec modificateur 1.5, le delta devrait être ~50% plus grand
    const deltaWithout = withoutMod - 1200;
    const deltaWith = withMod - 1200;

    expect(deltaWith).toBeGreaterThan(deltaWithout);
  });
});

// ============================================
// Tests calculateEloTrend
// ============================================

describe('calculateEloTrend', () => {
  test('retourne "up" si gain > 10 points', () => {
    const history = [
      { delta: 5 },
      { delta: 8 },
    ];
    
    expect(calculateEloTrend(history)).toBe('up');
  });

  test('retourne "down" si perte > 10 points', () => {
    const history = [
      { delta: -7 },
      { delta: -6 },
    ];
    
    expect(calculateEloTrend(history)).toBe('down');
  });

  test('retourne "stable" si variation < 10 points', () => {
    const history = [
      { delta: 3 },
      { delta: -2 },
    ];
    
    expect(calculateEloTrend(history)).toBe('stable');
  });

  test('retourne "stable" pour historique vide', () => {
    expect(calculateEloTrend([])).toBe('stable');
  });
});

// ============================================
// Tests formatEloDelta
// ============================================

describe('formatEloDelta', () => {
  test('ajoute + devant les positifs', () => {
    expect(formatEloDelta(15)).toBe('+15');
  });

  test('garde le - devant les négatifs', () => {
    expect(formatEloDelta(-12)).toBe('-12');
  });

  test('affiche 0 sans signe', () => {
    expect(formatEloDelta(0)).toBe('0');
  });
});

// ============================================
// Tests getEloDeltaColor
// ============================================

describe('getEloDeltaColor', () => {
  test('retourne vert pour positif', () => {
    expect(getEloDeltaColor(10)).toBe('text-green-600');
  });

  test('retourne rouge pour négatif', () => {
    expect(getEloDeltaColor(-10)).toBe('text-red-600');
  });

  test('retourne gris pour zéro', () => {
    expect(getEloDeltaColor(0)).toBe('text-gray-600');
  });
});

// ============================================
// Tests getEloRankTitle
// ============================================

describe('getEloRankTitle', () => {
  test('Grand Maître pour ≥ 2000', () => {
    const rank = getEloRankTitle(2000);
    expect(rank.title).toBe('Grand Maître');
    expect(rank.icon).toBe('👑');
  });

  test('Expert pour 1800-1999', () => {
    const rank = getEloRankTitle(1800);
    expect(rank.title).toBe('Expert');
    expect(rank.icon).toBe('🏆');
  });

  test('Avancé pour 1600-1799', () => {
    const rank = getEloRankTitle(1600);
    expect(rank.title).toBe('Avancé');
    expect(rank.icon).toBe('⭐');
  });

  test('Intermédiaire+ pour 1400-1599', () => {
    const rank = getEloRankTitle(1400);
    expect(rank.title).toBe('Intermédiaire+');
  });

  test('Intermédiaire pour 1200-1399 (ELO par défaut)', () => {
    const rank = getEloRankTitle(1200);
    expect(rank.title).toBe('Intermédiaire');
    expect(rank.icon).toBe('🎾');
  });

  test('Débutant+ pour 1000-1199', () => {
    const rank = getEloRankTitle(1000);
    expect(rank.title).toBe('Débutant+');
  });

  test('Débutant pour < 1000', () => {
    const rank = getEloRankTitle(800);
    expect(rank.title).toBe('Débutant');
    expect(rank.icon).toBe('🌱');
  });
});

// ============================================
// Tests d'intégration / scénarios réels
// ============================================

describe('Scénarios de match réels', () => {
  test('match équilibré entre deux intermédiaires', () => {
    const result = calculateEloChange({
      winnerElo: 1200,
      loserElo: 1200,
      winnerMatchCount: 20,
      loserMatchCount: 20,
      matchFormat: 'two_sets',
      winnerGames: 12, // 6-4 6-3
      loserGames: 7,
    });

    // Devrait gagner entre 10-15 points
    expect(result.winnerDelta).toBeGreaterThan(8);
    expect(result.winnerDelta).toBeLessThan(20);
  });

  test('exploit : débutant bat un expert', () => {
    const result = calculateEloChange({
      winnerElo: 1200,
      loserElo: 1500, // +300 ELO !
      winnerMatchCount: 5,  // Nouveau joueur
      loserMatchCount: 50,
      matchFormat: 'three_sets',
      isNewOpponent: true,
    });

    // Bonus upset + nouveau joueur K élevé = gros gain
    expect(result.winnerDelta).toBeGreaterThan(25);
    expect(result.breakdown.upsetBonus).toBe(1.20);
  });

  test('match entre joueurs qui se connaissent trop bien', () => {
    const result = calculateEloChange({
      winnerElo: 1400,
      loserElo: 1350,
      winnerMatchCount: 40,
      loserMatchCount: 40,
      matchFormat: 'two_sets',
      recentMatchesVsSameOpponent: 4, // Trop de matchs ensemble
    });

    // Malus répétition = gain réduit
    expect(result.breakdown.repetitionMalus).toBe(0.80);
    expect(result.winnerDelta).toBeLessThan(10);
  });

  test('joueur actif avec diversité d\'adversaires', () => {
    const result = calculateEloChange({
      winnerElo: 1300,
      loserElo: 1300,
      winnerMatchCount: 25,
      loserMatchCount: 25,
      matchFormat: 'two_sets',
      isNewOpponent: true,
      weeklyUniqueOpponents: 4, // Joue contre plein de monde
    });

    // Bonus nouvel adversaire + diversité
    expect(result.breakdown.newOpponentBonus).toBe(1.15);
    expect(result.breakdown.diversityBonus).toBe(1.10);
  });
});
