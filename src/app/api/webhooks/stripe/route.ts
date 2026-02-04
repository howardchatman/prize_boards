import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { board_id, square_id } = session.metadata || {};

        if (!square_id) {
          console.error('Missing square_id in session metadata');
          break;
        }

        // Update square as paid
        const { error: updateError } = await supabase
          .from('squares')
          .update({
            payment_status: 'paid',
            claimed_at: new Date().toISOString(),
          })
          .eq('id', square_id);

        if (updateError) {
          console.error('Failed to update square:', updateError);
          throw updateError;
        }

        // Update board total pot
        if (board_id) {
          const { data: board } = await supabase
            .from('boards')
            .select('square_price, total_pot')
            .eq('id', board_id)
            .single();

          if (board) {
            await supabase
              .from('boards')
              .update({ total_pot: board.total_pot + board.square_price })
              .eq('id', board_id);
          }
        }

        console.log(`Square ${square_id} marked as paid`);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { square_id } = session.metadata || {};

        if (!square_id) break;

        // Reset square to unpaid if payment wasn't completed
        await supabase
          .from('squares')
          .update({
            player_id: null,
            payment_status: 'unpaid',
            payment_intent_id: null,
          })
          .eq('id', square_id)
          .eq('payment_status', 'pending');

        console.log(`Square ${square_id} reservation expired`);
        break;
      }

      case 'account.updated': {
        // Handle Stripe Connect account updates
        const account = event.data.object as Stripe.Account;

        // Find user with this Stripe account ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_account_id', account.id)
          .single();

        if (profile) {
          console.log(`Stripe account ${account.id} updated for user ${profile.id}`);
        }
        break;
      }

      case 'invoice.paid': {
        // Handle subscription payments
        // Extract subscription info from event data
        const eventData = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = eventData.subscription as string | undefined;

        if (subscriptionId) {
          try {
            const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
            // Access data from the response object
            const subData = subResponse as unknown as {
              status: string;
              current_period_start: number;
              current_period_end: number;
            };

            await supabase
              .from('subscriptions')
              .update({
                status: subData.status === 'active' ? 'active' : 'past_due',
                current_period_start: new Date(subData.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subData.current_period_end * 1000).toISOString(),
              })
              .eq('stripe_subscription_id', subscriptionId);
          } catch (err) {
            console.error('Failed to update subscription:', err);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        // Update subscription and user tier
        const { data: sub } = await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id)
          .select('user_id')
          .single();

        if (sub) {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: 'free',
              subscription_status: 'inactive',
            })
            .eq('id', sub.user_id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
