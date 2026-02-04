// Database types for Prize Boards

export type SubscriptionTier = 'free' | 'host_plus' | 'pro';
export type SubscriptionStatus = 'inactive' | 'active' | 'canceled' | 'past_due';
export type BoardStatus = 'draft' | 'open' | 'locked' | 'completed';
export type PayoutType = 'standard' | 'quarters' | 'custom';
export type CommissionType = 'percentage' | 'flat';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid';
export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';
export type ScorePeriod = 'q1' | 'q2' | 'q3' | 'final';

// Payout rules structure
export interface PayoutRules {
  // For standard: { final: 100 }
  // For quarters: { q1: 20, q2: 20, q3: 20, final: 40 }
  // For custom: any valid distribution that sums to 100
  [period: string]: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  stripe_customer_id: string | null;
  stripe_account_id: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  host_id: string;
  name: string;
  sport_event: string;
  square_price: number; // in cents
  status: BoardStatus;
  payout_type: PayoutType;
  payout_rules: PayoutRules;
  host_commission_type: CommissionType | null;
  host_commission_value: number | null;
  row_numbers: number[] | null; // 0-9 randomized
  col_numbers: number[] | null; // 0-9 randomized
  lock_at: string | null;
  total_pot: number; // in cents
  created_at: string;
  updated_at: string;
  // Joined data
  host?: Profile;
  squares?: Square[];
}

export interface Square {
  id: string;
  board_id: string;
  row_index: number; // 0-9
  col_index: number; // 0-9
  player_id: string | null;
  payment_status: PaymentStatus;
  payment_intent_id: string | null;
  claimed_at: string | null;
  // Joined data
  player?: Profile;
}

export interface Score {
  id: string;
  board_id: string;
  period: ScorePeriod;
  team_a_score: number;
  team_b_score: number;
  entered_at: string;
  entered_by: string | null;
}

export interface Payout {
  id: string;
  board_id: string;
  square_id: string;
  player_id: string;
  period: ScorePeriod;
  amount: number; // in cents
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  created_at: string;
  paid_at: string | null;
  // Joined data
  player?: Profile;
  square?: Square;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  tier: 'host_plus' | 'pro';
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

// Platform fee rates by tier
export const PLATFORM_FEES: Record<SubscriptionTier, number> = {
  free: 0.075, // 7.5%
  host_plus: 0.05, // 5%
  pro: 0.03, // 3%
};

// Default payout rules
export const DEFAULT_PAYOUT_RULES: Record<PayoutType, PayoutRules> = {
  standard: { final: 100 },
  quarters: { q1: 20, q2: 20, q3: 20, final: 40 },
  custom: { final: 100 }, // User will customize
};

// Max host commission percentage
export const MAX_HOST_COMMISSION_PERCENT = 20;
