import { SYSTEM_BET_TYPES, VALID_AH_LINES } from './bets.utils';

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface BetInput {
  type: string;
  stake: number;
  selections: any[];
  system_type?: string;
  each_way?: boolean;
  ew_fraction?: number;
  ew_places?: number;
  handicap_line?: number;
  total_line?: number;
  idempotency_key?: string;
}

export function validateBetInput(input: BetInput): ValidationResult {
  const { type, stake, selections } = input;

  if (!type || !stake || !selections) {
    return { valid: false, error: 'type, stake, and selections are required' };
  }
  if (typeof stake !== 'number' || stake <= 0) {
    return { valid: false, error: 'stake must be a positive number' };
  }
  if (!Array.isArray(selections) || selections.length === 0) {
    return { valid: false, error: 'selections must be a non-empty array' };
  }

  for (const sel of selections) {
    if (!sel.event_id || !sel.market_type || !sel.selection_name || typeof sel.odds !== 'number' || isNaN(sel.odds) || sel.odds <= 0) {
      return { valid: false, error: 'each selection must have event_id, market_type, selection_name, and valid odds (> 0)' };
    }
  }

  switch (type) {
    case 'single':
      if (selections.length !== 1) {
        return { valid: false, error: 'single bet requires exactly 1 selection' };
      }
      break;

    case 'accumulator':
      if (selections.length < 2) {
        return { valid: false, error: 'accumulator requires at least 2 selections' };
      }
      break;

    case 'system': {
      const systemType = input.system_type;
      if (!systemType || !SYSTEM_BET_TYPES[systemType]) {
        return { valid: false, error: `system_type must be one of: ${Object.keys(SYSTEM_BET_TYPES).join(', ')}` };
      }
      const config = SYSTEM_BET_TYPES[systemType];
      if (selections.length < config.minSelections || selections.length > config.maxSelections) {
        return { valid: false, error: `${config.name} requires exactly ${config.minSelections} selections` };
      }
      break;
    }

    case 'each_way':
      if (selections.length !== 1) {
        return { valid: false, error: 'each-way bet requires exactly 1 selection' };
      }
      if (!input.ew_fraction || ![4, 5].includes(input.ew_fraction)) {
        return { valid: false, error: 'ew_fraction must be 4 or 5' };
      }
      if (!input.ew_places || input.ew_places < 2 || input.ew_places > 5) {
        return { valid: false, error: 'ew_places must be between 2 and 5' };
      }
      break;

    case 'asian_handicap':
      if (selections.length !== 1) {
        return { valid: false, error: 'asian handicap requires exactly 1 selection' };
      }
      if (input.handicap_line === undefined || !VALID_AH_LINES.includes(input.handicap_line)) {
        return { valid: false, error: `handicap_line must be one of the valid lines (e.g., -0.5, +0.25, -1)` };
      }
      break;

    case 'over_under':
      if (selections.length !== 1) {
        return { valid: false, error: 'over/under requires exactly 1 selection' };
      }
      if (input.total_line === undefined || input.total_line <= 0) {
        return { valid: false, error: 'total_line must be a positive number' };
      }
      break;

    default:
      return { valid: false, error: `unsupported bet type: ${type}` };
  }

  return { valid: true };
}
