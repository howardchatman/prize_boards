'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { Plan } from '@/types/database';

const PLANS = [
  {
    id: 'payg' as Plan,
    name: 'Pay-As-You-Go',
    price: 'Free',
    priceNote: '7.5% platform fee',
    features: [
      'Unlimited boards (one active at a time)',
      'Standard & quarter payouts',
      'Automatic payouts via Stripe',
    ],
  },
  {
    id: 'host_plus' as Plan,
    name: 'Host+',
    price: '$29',
    priceNote: '/month • 5% platform fee',
    features: [
      'Up to 5 active boards',
      'Forward/reverse digit options',
      'Priority support',
      'Save 2.5% on fees',
    ],
    popular: true,
  },
  {
    id: 'pro_host' as Plan,
    name: 'Pro Host',
    price: '$99',
    priceNote: '/month • 3% platform fee',
    features: [
      'Unlimited active boards',
      'Custom payout rules',
      'Save 4.5% on fees',
      'Early access to new features',
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPlan, setCurrentPlan] = useState<Plan>('payg');
  const [loading, setLoading] = useState<Plan | null>(null);
  const [hasStripeCustomer, setHasStripeCustomer] = useState(false);

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast.error('Subscription canceled');
    }
  }, [searchParams]);

  useEffect(() => {
    async function fetchSubscription() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('plan, stripe_customer_id')
          .eq('user_id', user.id)
          .single();

        if (subscription) {
          setCurrentPlan(subscription.plan as Plan);
          setHasStripeCustomer(!!subscription.stripe_customer_id);
        }
      }
    }

    fetchSubscription();
  }, []);

  const handleSubscribe = async (plan: Plan) => {
    if (plan === 'payg' || plan === currentPlan) return;

    setLoading(plan);

    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start subscription');
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      setLoading(null);
    }
  };

  const handleManageBilling = async () => {
    setLoading('payg'); // Just to show loading state

    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal');
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-gray-600 mt-1">
          Manage your subscription and billing
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            You are currently on the{' '}
            <span className="font-medium text-foreground">
              {PLANS.find(p => p.id === currentPlan)?.name}
            </span>{' '}
            plan
          </CardDescription>
        </CardHeader>
        {hasStripeCustomer && currentPlan !== 'payg' && (
          <CardFooter>
            <Button variant="outline" onClick={handleManageBilling} disabled={loading !== null}>
              {loading ? 'Loading...' : 'Manage Billing'}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Available Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={plan.popular ? 'border-primary' : ''}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{plan.priceNote}</CardDescription>
                </div>
                {plan.popular && <Badge>Popular</Badge>}
                {plan.id === currentPlan && (
                  <Badge variant="secondary">Current</Badge>
                )}
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {plan.id === currentPlan ? (
                <Button className="w-full" variant="outline" disabled>
                  Current Plan
                </Button>
              ) : plan.id === 'payg' ? (
                <Button className="w-full" variant="outline" disabled>
                  Free Tier
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading !== null}
                >
                  {loading === plan.id ? 'Loading...' : `Upgrade to ${plan.name}`}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-gray-500">
        All plans include Stripe payment processing. Processing fees (2.9% + $0.30) charged separately by Stripe.
      </p>
    </div>
  );
}
