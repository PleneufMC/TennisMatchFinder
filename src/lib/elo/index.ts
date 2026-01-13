/**
 * Module ELO - Export principal
 */

export * from './format-coefficients';
export * from './calculator';
export { 
  ELO_CONSTANTS, 
  DEFAULT_ELO_CONFIG,
  type EloConfig,
  type ModifierType,
  type ModifierDetail,
  type ModifiersResult,
  type MatchForCalculation,
  type PlayerForCalculation,
  type EloChangeResult,
  type MatchEloResult,
} from './types';
export * from './modifiers';
