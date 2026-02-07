import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';

export async function GET() {
  const checks: Record<string, unknown> = {};

  // Check env vars (don't expose full keys)
  checks.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
    ? `set (${process.env.STRIPE_SECRET_KEY.substring(0, 7)}...)`
    : 'MISSING';
  checks.STRIPE_PRICE_HOST_PLUS = process.env.STRIPE_PRICE_HOST_PLUS || 'MISSING';
  checks.STRIPE_PRICE_PRO_HOST = process.env.STRIPE_PRICE_PRO_HOST || 'MISSING';
  checks.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ? 'set' : 'MISSING';

  // Test Stripe connection
  try {
    const stripe = getStripe();
    const balance = await stripe.balance.retrieve();
    checks.stripe_connection = 'OK';
    checks.stripe_mode = balance.livemode ? 'LIVE' : 'TEST';
  } catch (err) {
    checks.stripe_connection = `FAILED: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }

  // Test price IDs exist
  if (process.env.STRIPE_PRICE_HOST_PLUS && process.env.STRIPE_PRICE_HOST_PLUS !== 'price_xxx') {
    try {
      const stripe = getStripe();
      const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_HOST_PLUS);
      checks.host_plus_price = `OK - $${(price.unit_amount || 0) / 100}/${price.recurring?.interval}`;
    } catch (err) {
      checks.host_plus_price = `FAILED: ${err instanceof Error ? err.message : 'Unknown'}`;
    }
  }

  if (process.env.STRIPE_PRICE_PRO_HOST && process.env.STRIPE_PRICE_PRO_HOST !== 'price_xxx') {
    try {
      const stripe = getStripe();
      const price = await stripe.prices.retrieve(process.env.STRIPE_PRICE_PRO_HOST);
      checks.pro_host_price = `OK - $${(price.unit_amount || 0) / 100}/${price.recurring?.interval}`;
    } catch (err) {
      checks.pro_host_price = `FAILED: ${err instanceof Error ? err.message : 'Unknown'}`;
    }
  }

  return NextResponse.json(checks, { status: 200 });
}
