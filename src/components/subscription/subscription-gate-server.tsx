'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { toast } from 'sonner';
import type { Plan } from '@/types/database';

const PLANS = [
  {
    id: 'payg' as Plan,
    name: 'Pay-As-You-Go',
    price: 'Free',
    priceNote: '7.5% platform fee per board',
    icon: Zap,
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
    icon: Crown,
    features: [
      'Up to 5 active boards',
      'Forward/reverse digit options',
      'Priority email support',
      'Save 2.5% on every board',
      'Analytics dashboard',
    ],
    popular: true,
    cta: 'Subscribe to Host+',
  },
  {
    id: 'pro_host' as Plan,
    name: 'Pro Host',
    price: '$99',
    priceNote: '/month • 3% platform fee',
    icon: Rocket,
    features: [
      'Unlimited active boards',
      'Custom payout rules',
      'Save 4.5% on every board',
      'White-label options',
      'Early access to new features',
      'Dedicated support',
    ],
    cta: 'Subscribe to Pro',
  },
];

export function SubscriptionGateServer() {
  const [subscribing, setSubscribing] = useState<Plan | null>(null);
  const router = useRouter();

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

          toast.success('Welcome to Prize Boards!');
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
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      setSubscribing(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-gray-600 mt-4 text-lg">
          Select a plan to start hosting sport squares boards.
          Start free with Pay-As-You-Go, or save on fees with a subscription.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${plan.popular ? 'border-2 border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-white">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-4 p-3 bg-gray-100 rounded-full w-fit">
                  <Icon className="h-6 w-6 text-gray-700" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                </div>
                <CardDescription className="mt-1">{plan.priceNote}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4 flex-1">
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-4">
                <Button
                  className="w-full"
                  size="lg"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={subscribing !== null}
                >
                  {subscribing === plan.id ? 'Processing...' : plan.cta}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <p className="text-sm text-gray-500">
          All plans include Stripe payment processing. Processing fees (2.9% + $0.30) are charged separately by Stripe.
        </p>
        <p className="text-sm text-gray-500">
          You can upgrade, downgrade, or cancel your subscription anytime from your account settings.
        </p>
      </div>
    </div>
  );
}
