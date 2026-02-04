import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';
import { PLATFORM_FEES, type Plan } from '@/types/database';

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
      .select('*')
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

    if (square.status !== 'available') {
      return NextResponse.json({ error: 'Square is already claimed' }, { status: 400 });
    }

    // Calculate platform fee based on board's snapshot fee
    const platformFeePercent = board.platform_fee_percent / 100; // Convert to decimal
    const platformFee = Math.round(board.square_price_cents * platformFeePercent);

    // Mark square as reserved before creating checkout session
    const { error: updateError } = await supabase
      .from('squares')
      .update({
        claimed_by: user.id,
        status: 'reserved',
      })
      .eq('id', squareId)
      .eq('status', 'available'); // Only update if still available

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
              name: `Square (${squareRow}, ${squareCol}) - ${board.title}`,
              description: `Sport board square for ${board.event_name}`,
            },
            unit_amount: board.square_price_cents,
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

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Create entry record
    await supabase
      .from('entries')
      .insert({
        board_id: boardId,
        square_id: squareId,
        user_id: user.id,
        amount_cents: board.square_price_cents,
        stripe_checkout_session_id: session.id,
        payment_status: 'processing',
      });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
