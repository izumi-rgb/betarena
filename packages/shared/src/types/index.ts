export type UserRole = 'admin' | 'agent' | 'sub_agent' | 'member';

export interface User {
  id: number;
  display_id: string;
  username: string;
  role: UserRole;
  nickname: string | null;
  is_active: boolean;
  created_by: number | null;
  parent_agent_id: number | null;
  can_create_sub_agent: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditAccount {
  id: number;
  user_id: number;
  balance: string;
  total_received: string;
  total_sent: string;
  updated_at: string;
}

export type CreditTransactionType = 'create' | 'transfer' | 'deduct';

export interface CreditTransaction {
  id: number;
  from_user_id: number | null;
  to_user_id: number;
  amount: string;
  type: CreditTransactionType;
  note: string | null;
  created_at: string;
}

export type BetType = 'single' | 'accumulator' | 'system' | 'each_way' | 'asian_handicap' | 'over_under';
export type BetStatus = 'open' | 'won' | 'lost' | 'void' | 'cashout';

export interface Bet {
  id: number;
  bet_uid: string;
  user_id: number;
  type: BetType;
  status: BetStatus;
  stake: string;
  potential_win: string | null;
  actual_win: string | null;
  odds_snapshot: Record<string, unknown>;
  selections: Record<string, unknown>[];
  settled_at: string | null;
  created_at: string;
}

export type EventStatus = 'scheduled' | 'live' | 'finished';

export interface SportEvent {
  id: number;
  external_id: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  starts_at: string;
  status: EventStatus;
  score: Record<string, unknown> | null;
  raw_data: Record<string, unknown> | null;
  updated_at: string;
}

export interface Odds {
  id: number;
  event_id: number;
  market_type: string;
  selections: { name: string; odds: number; status: string }[];
  is_live: boolean;
  updated_at: string;
}

export type LogAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.refresh'
  | 'auth.brute_force'
  | 'bet.place'
  | 'bet.settle'
  | 'credit.create'
  | 'credit.transfer'
  | 'user.create'
  | 'user.suspend'
  | 'user.activate'
  | 'privilege.grant'
  | 'privilege.revoke'
  | 'sqli.attempt';

export type LogResult = 'success' | 'failure' | 'blocked';

export interface SystemLog {
  id: number;
  user_id: number | null;
  role: UserRole | null;
  action: LogAction;
  ip_address: string | null;
  user_agent: string | null;
  payload: Record<string, unknown> | null;
  result: LogResult;
  threat_flag: boolean;
  created_at: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  error: string | null;
}

export type OddsFormat = 'decimal' | 'fractional' | 'american';
