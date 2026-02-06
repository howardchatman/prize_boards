import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';
import type { Plan } from '@/types/database';

// Stripe Price IDs for each plan (you'll need to create these in Stripe Dashboard)
const PRICE_IDS: Record<Exclude<Plan, 'payg'>, string> = {
  host_plus: process.env.STRIPE_PRICE_HOST_PLUS || 'price_host_plus',
  pro_host: process.env.STRIPE_PRICE_PRO_HOST || 'price_pro_host',
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, returnTo } = await request.json();

    if (!plan || plan === 'payg' || !PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
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

    // Get or create Stripe customer
    let { data: subscription } = await supabase
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

      // Create subscription record
      await supabase.from('subscriptions').insert({
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
          price: PRICE_IDS[plan as keyof typeof PRICE_IDS],
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
    return NextResponse.json(
      { error: 'Failed to create subscription checkout' },
      { status: 500 }
    );
  }
}
