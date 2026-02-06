# Stripe Setup Guide for Prize Boards

This guide walks you through setting up Stripe for Prize Boards to accept payments and subscriptions.

## 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification
3. Enable Stripe Connect for your account (for paying out winners)

## 2. Get API Keys

1. Go to **Developers → API Keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

Add to your `.env.local`:
```
STRIPE_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

## 3. Create Subscription Products

### Host+ Plan ($29/month)

1. Go to **Products → Add Product**
2. Name: `Host+`
3. Description: `5% platform fee, priority support, up to 5 active boards`
4. Click **Add pricing**:
   - Price: `$29.00`
   - Billing period: `Monthly`
   - Click **Add price**
5. Copy the **Price ID** (starts with `price_`)

### Pro Host Plan ($99/month)

1. Go to **Products → Add Product**
2. Name: `Pro Host`
3. Description: `3% platform fee, unlimited boards, dedicated support`
4. Click **Add pricing**:
   - Price: `$99.00`
   - Billing period: `Monthly`
   - Click **Add price**
5. Copy the **Price ID** (starts with `price_`)

Add price IDs to your `.env.local`:
```
STRIPE_PRICE_HOST_PLUS=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_HOST=price_xxxxxxxxxxxxx
```

## 4. Set Up Webhooks

### For Local Development

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Forward webhooks:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. Copy the webhook signing secret (starts with `whsec_`)

### For Production (Vercel)

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `account.updated`
5. Click **Add endpoint**
6. Copy the **Signing secret** (click "Reveal")

Add to your `.env.local` (and Vercel):
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

## 5. Configure Stripe Billing Portal

1. Go to **Settings → Billing → Customer portal**
2. Enable the portal
3. Configure allowed actions:
   - Allow customers to update payment methods ✓
   - Allow customers to cancel subscriptions ✓
   - Allow customers to view invoice history ✓
4. Save changes

## 6. Environment Variables Summary

Your complete Stripe configuration in `.env.local`:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Subscription Price IDs
STRIPE_PRICE_HOST_PLUS=price_xxxxxxxxxxxxx
STRIPE_PRICE_PRO_HOST=price_xxxxxxxxxxxxx
```

## 7. Testing

### Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

### Test Subscription Flow
1. Sign up for a new account
2. Complete onboarding
3. Click "Subscribe to Host+" or "Subscribe to Pro"
4. Use test card `4242 4242 4242 4242`
5. Verify redirect back to dashboard
6. Check Stripe Dashboard for subscription

## 8. Go Live Checklist

Before going live:

- [ ] Switch API keys from `test` to `live`
- [ ] Create live products and prices (same steps as above)
- [ ] Update webhook endpoint to production URL
- [ ] Update all environment variables in Vercel
- [ ] Test a real transaction with a small amount
- [ ] Enable fraud prevention in Stripe Dashboard

## Troubleshooting

### "Invalid price" error
- Verify the price IDs in your environment match Stripe Dashboard
- Make sure you're using the correct mode (test vs live)

### Webhook signature verification failed
- Check the webhook secret matches your environment
- Ensure the endpoint URL is correct
- For local: make sure `stripe listen` is running

### Subscription not updating after payment
- Check webhook events are being received (Stripe Dashboard → Webhooks → Events)
- Look for errors in your server logs
- Verify database permissions for the subscriptions table
