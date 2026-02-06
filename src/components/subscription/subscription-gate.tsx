'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import type { Plan } from '@/types/database';

interface SubscriptionGateProps {
  children: React.ReactNode;
  requirePaidPlan?: boolean; // If true, only paid plans (not PAYG) allow access
  feature?: string; // Name of the feature being gated
}

const PLANS = [
  {
    id: 'payg' as Plan,
    name: 'Pay-As-You-Go',
    price: 'Free',
    priceNote: '7.5% platform fee per board',
    features: [
      'Create unlimited boards',
      'One active board at a time',
      'Standard & quarter payouts',
      'Automatic payouts via Stripe',
      'Email notifications',
    ],
    cta: 'Start Free',
  },
  {
    id: 'host_plus' as Plan,
    name: 'Host+',
    price: '$29',
    priceNote: '/month • 5% platform fee',
    features: [
      'Up to 5 active boards',
      'Forward/reverse digit options',
      'Priority email support',
      'Save 2.5% on every board',
      'Analytics dashboard',
    ],
    popular: true,
    cta: 'Subscribe',
  },
  {
    id: 'pro_host' as Plan,
    name: 'Pro Host',
    price: '$99',
    priceNote: '/month • 3% platform fee',
    features: [
      'Unlimited active boards',
      'Custom payout rules',
      'Save 4.5% on every board',
      'White-label options',
      'Early access to new features',
      'Dedicated support',
    ],
    cta: 'Subscribe',
  },
];

export function SubscriptionGate({ children, requirePaidPlan = false, feature }: SubscriptionGateProps) {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [subscribing, setSubscribing] = useState<Plan | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function checkSubscription() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan, is_active')
        .eq('user_id', user.id)
        .single();

      if (subscription) {
        if (requirePaidPlan) {
          // Require a paid plan
          setHasAccess(subscription.is_active && subscription.plan !== 'payg');
        } else {
          // Any active plan (including PAYG) grants access
          setHasAccess(subscription.is_active);
        }
      } else {
        setHasAccess(false);
      }

      setLoading(false);
    }

    checkSubscription();
  }, [requirePaidPlan, router]);

  const handleSelectPlan = async (plan: Plan) => {
    setSubscribing(plan);

    try {
      if (plan === 'payg') {
        // Create PAYG subscription directly
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Check if subscription exists
          const { data: existing } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (existing) {
            // Update existing
            await supabase
              .from('subscriptions')
              .update({ plan: 'payg', is_active: true })
              .eq('user_id', user.id);
          } else {
            // Create new
            await supabase
              .from('subscriptions')
              .insert({ user_id: user.id, plan: 'payg', is_active: true });
          }

          setHasAccess(true);
          router.refresh();
        }
      } else {
        // Redirect to Stripe checkout for paid plans
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
      }
    } catch (error) {
      console.error('Subscription error:', error);
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show plan selection
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-gray-600 mt-2">
          {feature
            ? `Select a plan to access ${feature}`
            : 'Select a plan to start hosting sport squares boards'}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${plan.popular ? 'border-2 border-primary shadow-lg' : ''}`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">Most Popular</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">{plan.price}</span>
              </div>
              <CardDescription className="mt-1">{plan.priceNote}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => handleSelectPlan(plan.id)}
                disabled={subscribing !== null}
              >
                {subscribing === plan.id ? 'Processing...' : plan.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <p className="text-center text-sm text-gray-500">
        All plans include Stripe payment processing. Processing fees (2.9% + $0.30) are charged separately by Stripe.
        <br />
        You can upgrade, downgrade, or cancel anytime.
      </p>
    </div>
  );
}
