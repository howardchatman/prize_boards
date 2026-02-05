// Database types for Prize Boards (matches new schema)

// Enums matching PostgreSQL enums
export type Plan = 'payg' | 'host_plus' | 'pro_host';
export type BoardStatus = 'draft' | 'open' | 'locked' | 'completed' | 'canceled';
export type PayoutType = 'standard' | 'quarter' | 'custom';
export type SquareStatus = 'available' | 'reserved' | 'claimed';
export type PaymentStatus = 'requires_action' | 'processing' | 'succeeded' | 'failed' | 'refunded' | 'canceled';
export type PayoutStatus = 'pending' | 'scheduled' | 'paid' | 'failed' | 'canceled';

// Payout rules structure
export interface PayoutRule {
  event: string; // Q1, HALF, Q3, FINAL, or custom
  percent: number;
}

export interface Profile {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  email_notifications: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Board {
  id: string;
  host_id: string;
  title: string;
  event_name: string;
  sport: string | null;
  square_price_cents: number;
  status: BoardStatus;
  payout_type: PayoutType;
  payout_rules: PayoutRule[];
  host_fee_percent: number | null;
  host_fee_flat_cents: number | null;
  host_fee_cap_percent: number;
  platform_fee_percent: number;
  invite_code: string;
  is_public: boolean;
  lock_at: string | null;
  locked_at: string | null;
  completed_at: string | null;
  row_digits: number[] | null;
  col_digits: number[] | null;
  created_at: string;
  updated_at: string;
  // Joined data
  host?: Profile;
  squares?: Square[];
}

export interface Square {
  id: string;
  board_id: string;
  row_index: number;
  col_index: number;
  status: SquareStatus;
  claimed_by: string | null;
  claimed_at: string | null;
  price_cents: number | null;
  created_at: string;
  updated_at: string;
  // Joined data
  claimer?: Profile;
}

export interface Entry {
  id: string;
  board_id: string;
  square_id: string;
  user_id: string;
  amount_cents: number;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  // Joined data
  square?: Square;
  user?: Profile;
}

export interface PayoutEvent {
  id: string;
  board_id: string;
  event_key: string;
  label: string;
  percent: number;
  row_digit: number | null;
  col_digit: number | null;
  winning_square_id: string | null;
  winner_user_id: string | null;
  prize_amount_cents: number | null;
  status: PayoutStatus;
  stripe_transfer_id: string | null;
  stripe_payout_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  winning_square?: Square;
  winner?: Profile;
}

export interface BoardScore {
  id: string;
  board_id: string;
  event_key: string;
  team_a_score: number;
  team_b_score: number;
  created_at: string;
  updated_at: string;
}

// Platform fee rates by plan
export const PLATFORM_FEES: Record<Plan, number> = {
  payg: 0.075, // 7.5%
  host_plus: 0.05, // 5%
  pro_host: 0.03, // 3%
};

// Default payout rules
export const DEFAULT_PAYOUT_RULES: Record<PayoutType, PayoutRule[]> = {
  standard: [{ event: 'FINAL', percent: 100 }],
  quarter: [
    { event: 'Q1', percent: 20 },
    { event: 'HALF', percent: 20 },
    { event: 'Q3', percent: 20 },
    { event: 'FINAL', percent: 40 },
  ],
  custom: [{ event: 'FINAL', percent: 100 }],
};

// Max host fee percentage
export const MAX_HOST_FEE_PERCENT = 20;

// Generate a random invite code
export function generateInviteCode(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
