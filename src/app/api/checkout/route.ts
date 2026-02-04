import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, calculatePlatformFee } from '@/lib/stripe';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId, squareId, squareRow, squareCol } = await request.json();

    if (!boardId || !squareId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get board details
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*, host:profiles!boards_host_id_fkey(stripe_account_id, subscription_tier)')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (board.status !== 'open') {
      return NextResponse.json({ error: 'Board is not accepting new claims' }, { status: 400 });
    }

    // Check square availability
    const { data: square, error: squareError } = await supabase
      .from('squares')
      .select('*')
      .eq('id', squareId)
      .single();

    if (squareError || !square) {
      return NextResponse.json({ error: 'Square not found' }, { status: 404 });
    }

    if (square.payment_status !== 'unpaid') {
      return NextResponse.json({ error: 'Square is already claimed' }, { status: 400 });
    }

    // Get host's subscription tier for fee calculation
    const host = board.host as { stripe_account_id: string | null; subscription_tier: string } | null;
    const tier = (host?.subscription_tier || 'free') as 'free' | 'host_plus' | 'pro';

    // Calculate platform fee
    const platformFee = calculatePlatformFee(board.square_price, tier);

    // Mark square as pending before creating checkout session
    const { error: updateError } = await supabase
      .from('squares')
      .update({
        player_id: user.id,
        payment_status: 'pending',
      })
      .eq('id', squareId)
      .eq('payment_status', 'unpaid'); // Only update if still unpaid

    if (updateError) {
      return NextResponse.json({ error: 'Failed to reserve square' }, { status: 500 });
    }

    // Create Stripe Checkout session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Build session params
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Square (${squareRow}, ${squareCol}) - ${board.name}`,
              description: `Sport board square for ${board.sport_event}`,
            },
            unit_amount: board.square_price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/board/${boardId}?success=true&square=${squareId}`,
      cancel_url: `${appUrl}/board/${boardId}?canceled=true`,
      metadata: {
        board_id: boardId,
        square_id: squareId,
        user_id: user.id,
      },
      customer_email: user.email || undefined,
    };

    // If host has a Stripe Connect account, use destination charge
    // Otherwise, all funds go to platform (for MVP/testing)
    if (host?.stripe_account_id) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFee,
        transfer_data: {
          destination: host.stripe_account_id,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Update square with payment intent ID
    await supabase
      .from('squares')
      .update({ payment_intent_id: session.id })
      .eq('id', squareId);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
