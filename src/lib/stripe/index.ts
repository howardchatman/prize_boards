import Stripe from 'stripe';
import type { Plan } from '@/types/database';

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

// Platform fee rates by plan
export const PLATFORM_FEE_RATES: Record<Plan, number> = {
  payg: 0.075, // 7.5%
  host_plus: 0.05, // 5%
  pro_host: 0.03, // 3%
};

// Calculate platform fee for a given amount and plan
export function calculatePlatformFee(
  amountInCents: number,
  plan: Plan = 'payg'
): number {
  return Math.round(amountInCents * PLATFORM_FEE_RATES[plan]);
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
