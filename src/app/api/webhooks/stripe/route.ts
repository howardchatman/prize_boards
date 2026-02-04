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
        const { board_id, square_id, user_id } = session.metadata || {};

        if (!square_id) {
          console.error('Missing square_id in session metadata');
          break;
        }

        // Update square as claimed
        const { error: updateError } = await supabase
          .from('squares')
          .update({
            status: 'claimed',
            claimed_at: new Date().toISOString(),
          })
          .eq('id', square_id);

        if (updateError) {
          console.error('Failed to update square:', updateError);
          throw updateError;
        }

        // Update entry payment status
        await supabase
          .from('entries')
          .update({
            payment_status: 'succeeded',
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('stripe_checkout_session_id', session.id);

        console.log(`Square ${square_id} marked as claimed`);
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { square_id } = session.metadata || {};

        if (!square_id) break;

        // Reset square to available if payment wasn't completed
        await supabase
          .from('squares')
          .update({
            claimed_by: null,
            status: 'available',
          })
          .eq('id', square_id)
          .eq('status', 'reserved');

        // Update entry payment status
        await supabase
          .from('entries')
          .update({ payment_status: 'canceled' })
          .eq('stripe_checkout_session_id', session.id);

        console.log(`Square ${square_id} reservation expired`);
        break;
      }

      case 'account.updated': {
        // Handle Stripe Connect account updates
        const account = event.data.object as Stripe.Account;
        console.log(`Stripe account ${account.id} updated`);
        break;
      }

      case 'invoice.paid': {
        // Handle subscription payments
        const eventData = event.data.object as unknown as Record<string, unknown>;
        const subscriptionId = eventData.subscription as string | undefined;

        if (subscriptionId) {
          try {
            const subResponse = await stripe.subscriptions.retrieve(subscriptionId);
            const subData = subResponse as unknown as {
              status: string;
              current_period_end: number;
            };

            await supabase
              .from('subscriptions')
              .update({
                is_active: subData.status === 'active',
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

        // Update subscription to inactive
        await supabase
          .from('subscriptions')
          .update({
            is_active: false,
            plan: 'payg',
          })
          .eq('stripe_subscription_id', subscription.id);

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
