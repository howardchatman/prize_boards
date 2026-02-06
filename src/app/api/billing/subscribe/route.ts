import { NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import type { Plan } from '@/types/database';

// Stripe Price IDs for each plan
const PRICE_IDS: Record<Exclude<Plan, 'payg'>, string> = {
  host_plus: process.env.STRIPE_PRICE_HOST_PLUS || '',
  pro_host: process.env.STRIPE_PRICE_PRO_HOST || '',
};

export async function POST(request: Request) {
  try {
    // Use regular client for auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Use admin client to bypass RLS for subscription management
    const adminSupabase = createAdminClient();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, returnTo } = await request.json();

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];
    if (!plan || plan === 'payg' || !priceId) {
      console.error('Invalid plan or missing price ID:', { plan, priceId, PRICE_IDS });
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const stripe = getStripe();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Determine success URL based on returnTo param
    const successUrl = returnTo === 'onboarding'
      ? `${appUrl}/onboarding?subscription=success`
      : `${appUrl}/dashboard?subscription=success`;
    const cancelUrl = returnTo === 'onboarding'
      ? `${appUrl}/onboarding?canceled=true`
      : `${appUrl}/dashboard/subscription?canceled=true`;

    // Get or create Stripe customer (use admin client to bypass RLS)
    const { data: subscription } = await adminSupabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;

      // Create subscription record (use admin client)
      await adminSupabase.from('subscriptions').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
        plan: 'payg',
        is_active: true,
      });
    }

    // Create Checkout Session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Subscription error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to create subscription checkout', details: errorMessage },
      { status: 500 }
    );
  }
}
