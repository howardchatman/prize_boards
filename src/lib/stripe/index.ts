import Stripe from 'stripe';

// Lazy initialization to avoid build-time errors
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backwards compatibility, export as stripe
export const stripe = {
  get checkout() {
    return getStripe().checkout;
  },
  get webhooks() {
    return getStripe().webhooks;
  },
  get subscriptions() {
    return getStripe().subscriptions;
  },
};

// Platform fee rates by subscription tier
export const PLATFORM_FEE_RATES = {
  free: 0.075, // 7.5%
  host_plus: 0.05, // 5%
  pro: 0.03, // 3%
} as const;

// Calculate platform fee for a given amount and tier
export function calculatePlatformFee(
  amountInCents: number,
  tier: keyof typeof PLATFORM_FEE_RATES = 'free'
): number {
  return Math.round(amountInCents * PLATFORM_FEE_RATES[tier]);
}

// Calculate payout amounts after deducting fees
export function calculatePayoutBreakdown(
  totalPotInCents: number,
  platformFeeTier: keyof typeof PLATFORM_FEE_RATES,
  hostCommissionType: 'percentage' | 'flat' | null,
  hostCommissionValue: number | null
) {
  // Platform fee
  const platformFee = calculatePlatformFee(totalPotInCents, platformFeeTier);

  // Host commission
  let hostCommission = 0;
  if (hostCommissionType === 'percentage' && hostCommissionValue) {
    hostCommission = Math.round(totalPotInCents * (hostCommissionValue / 100));
  } else if (hostCommissionType === 'flat' && hostCommissionValue) {
    hostCommission = hostCommissionValue;
  }

  // Prize pool is what's left after fees
  const prizePool = totalPotInCents - platformFee - hostCommission;

  return {
    totalPot: totalPotInCents,
    platformFee,
    hostCommission,
    prizePool,
    platformFeeRate: PLATFORM_FEE_RATES[platformFeeTier],
  };
}

// Calculate individual prize amounts based on payout rules
export function calculatePrizeAmounts(
  prizePool: number,
  payoutRules: Record<string, number>
): Record<string, number> {
  const prizes: Record<string, number> = {};

  for (const [period, percentage] of Object.entries(payoutRules)) {
    prizes[period] = Math.round(prizePool * (percentage / 100));
  }

  return prizes;
}

// Determine winning square for a given score
export function getWinningSquarePosition(
  teamAScore: number,
  teamBScore: number
): { row: number; col: number } {
  // Last digit of Team A's score = row
  // Last digit of Team B's score = column
  return {
    row: teamAScore % 10,
    col: teamBScore % 10,
  };
}
