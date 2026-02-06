'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Grid3X3,
  CreditCard,
  Medal,
  Target,
  Users,
  Wallet,
  TrendingUp,
  Rocket,
  CheckCircle2,
  Flame
} from 'lucide-react';

type Step = 'welcome' | 'role' | 'host-intro' | 'subscription' | 'complete';

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>('welcome');
  const [role, setRole] = useState<'host' | 'player' | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [boardSize, setBoardSize] = useState(1000); // Example pot size
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);

  // Check if returning from successful subscription checkout
  useEffect(() => {
    if (searchParams.get('subscription') === 'success') {
      setRole('host');
      setStep('complete');
      setSubscriptionSuccess(true);
      // Clean up URL
      router.replace('/onboarding');
    }
  }, [searchParams, router]);

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // Check if already completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        router.push('/dashboard');
        return;
      }

      setUserName(profile?.full_name || user.email?.split('@')[0] || 'there');
      setLoading(false);
    }

    checkUser();
  }, [router]);

  const handleSubscribe = async (plan: 'host_plus' | 'pro_host') => {
    setSubscribing(true);
    try {
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, returnTo: 'onboarding' }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to start checkout');
        setSubscribing(false);
      }
    } catch {
      toast.error('Something went wrong');
      setSubscribing(false);
    }
  };

  const completeOnboarding = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Create PAYG subscription if none exists
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingSub) {
        await supabase
          .from('subscriptions')
          .insert({ user_id: user.id, plan: 'payg', is_active: true });
      } else {
        // Ensure subscription is active
        await supabase
          .from('subscriptions')
          .update({ is_active: true })
          .eq('user_id', user.id);
      }

      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user.id);
    }

    if (role === 'host') {
      router.push('/dashboard/board/create');
    } else {
      router.push('/dashboard');
    }
  };

  // Calculate fees for each plan
  const calculateFees = (potSize: number) => {
    const payg = potSize * 0.075;
    const hostPlus = potSize * 0.05;
    const proHost = potSize * 0.03;

    return {
      payg: { fee: payg, keep: potSize - payg },
      hostPlus: { fee: hostPlus, monthlyFee: 29, keep: potSize - hostPlus, savings: payg - hostPlus },
      proHost: { fee: proHost, monthlyFee: 79, keep: potSize - proHost, savings: payg - proHost },
    };
  };

  const fees = calculateFees(boardSize);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {['welcome', 'role', role === 'host' ? 'host-intro' : null, role === 'host' ? 'subscription' : null, 'complete'].filter(Boolean).map((s, i, arr) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    arr.indexOf(step) >= i ? 'bg-primary' : 'bg-gray-300'
                  }`}
                />
                {i < arr.length - 1 && (
                  <div className={`w-8 h-0.5 ${arr.indexOf(step) > i ? 'bg-primary' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step: Welcome */}
        {step === 'welcome' && (
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <Image
                  src="/prize_boards_logo/full_logo_black_words.png"
                  alt="Prize Boards"
                  width={200}
                  height={50}
                />
              </div>
              <CardTitle className="text-3xl">Welcome, {userName}!</CardTitle>
              <CardDescription className="text-lg">
                You&apos;re all set to start using Prize Boards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Prize Boards makes it easy to run sport squares pools with friends, family, or coworkers.
                Collect payments, randomize numbers, and pay out winners automatically.
              </p>
              <div className="grid grid-cols-3 gap-4 py-4">
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Grid3X3 className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Create boards</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <CreditCard className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Collect payments</p>
                </div>
                <div className="text-center">
                  <div className="flex justify-center mb-2">
                    <Medal className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Auto payouts</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={() => setStep('role')}>
                Let&apos;s Get Started
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Choose Role */}
        {step === 'role' && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">What brings you here?</CardTitle>
              <CardDescription>
                You can do both, but let&apos;s start with what you want to do first
              </CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setRole('host');
                  setStep('host-intro');
                }}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:border-green-500 hover:bg-green-50 ${
                  role === 'host' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
                  <Target className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">I want to host a board</h3>
                <p className="text-sm text-gray-600">
                  Create a sport squares board for an upcoming game. Invite friends and collect entries.
                </p>
                <Badge className="mt-3 bg-green-100 text-green-700 hover:bg-green-100">Most popular</Badge>
              </button>

              <button
                onClick={() => {
                  setRole('player');
                  setStep('complete');
                }}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:border-green-500 hover:bg-green-50 ${
                  role === 'player' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="p-3 bg-green-100 rounded-lg w-fit mb-3">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">I want to join a board</h3>
                <p className="text-sm text-gray-600">
                  Someone shared a board with you? Join and claim your squares to win prizes.
                </p>
              </button>
            </CardContent>
            <CardFooter>
              <Button variant="ghost" onClick={() => setStep('welcome')}>
                Back
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Host Intro */}
        {step === 'host-intro' && (
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full">
                  <Flame className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Hosting is easy!</CardTitle>
              <CardDescription>
                Here&apos;s how Prize Boards works for hosts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    title: 'Create your board',
                    desc: 'Pick your game, set the square price, and choose payout rules.',
                  },
                  {
                    step: '2',
                    title: 'Share with friends',
                    desc: 'Send the link via text, email, or social media. They pay online.',
                  },
                  {
                    step: '3',
                    title: 'Lock & reveal numbers',
                    desc: 'When ready, lock the board. Numbers are randomly assigned.',
                  },
                  {
                    step: '4',
                    title: 'Enter scores, we pay winners',
                    desc: 'Just enter the game scores. Winners get paid automatically!',
                  },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-medium">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('role')}>
                Back
              </Button>
              <Button onClick={() => setStep('subscription')}>
                Next: Choose Your Plan
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Subscription Upsell */}
        {step === 'subscription' && (
          <div className="space-y-6">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-green-100 rounded-full">
                    <Wallet className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Keep More of Your Winnings</CardTitle>
                <CardDescription className="text-lg">
                  Choose a plan that fits your hosting style. Serious hosts save hundreds with a subscription.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Earnings Calculator */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-semibold text-center mb-4">See How Much You Could Save</h4>
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <span className="text-sm text-gray-600">Board size:</span>
                    <div className="flex items-center gap-2">
                      {[500, 1000, 2500, 5000].map((size) => (
                        <button
                          key={size}
                          onClick={() => setBoardSize(size)}
                          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            boardSize === size
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-white border hover:bg-gray-100'
                          }`}
                        >
                          ${size.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comparison Chart */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    {/* PAYG */}
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="text-gray-500 text-sm mb-1">Free (PAYG)</div>
                      <div className="text-xs text-gray-400 mb-3">7.5% fee</div>
                      <div className="text-2xl font-bold text-red-500">-${fees.payg.fee.toFixed(0)}</div>
                      <div className="text-xs text-gray-500 mt-1">Platform fee</div>
                    </div>

                    {/* Host+ */}
                    <div className="bg-primary/5 rounded-lg p-4 border-2 border-primary relative">
                      <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                        Most Popular
                      </Badge>
                      <div className="text-primary font-semibold text-sm mb-1">Host+</div>
                      <div className="text-xs text-gray-400 mb-3">5% fee + $29/mo</div>
                      <div className="text-2xl font-bold text-green-600">
                        +${fees.hostPlus.savings.toFixed(0)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">saved per board</div>
                    </div>

                    {/* Pro Host */}
                    <div className="bg-white rounded-lg p-4 border">
                      <div className="text-gray-700 font-semibold text-sm mb-1">Pro Host</div>
                      <div className="text-xs text-gray-400 mb-3">3% fee + $79/mo</div>
                      <div className="text-2xl font-bold text-green-600">
                        +${fees.proHost.savings.toFixed(0)}
                      </div>
                      <div className="text-xs text-green-600 mt-1">saved per board</div>
                    </div>
                  </div>
                </div>

                {/* Plans */}
                <div className="grid md:grid-cols-3 gap-4">
                  {/* PAYG */}
                  <div className="rounded-xl border-2 border-gray-200 p-5">
                    <h3 className="font-bold text-lg">Free</h3>
                    <p className="text-sm text-gray-500 mb-4">Pay as you go</p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">7.5%</span>
                      <span className="text-gray-500 text-sm"> per board</span>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Unlimited boards
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Auto payouts
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Basic support
                      </li>
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setStep('complete')}
                    >
                      Start Free
                    </Button>
                  </div>

                  {/* Host+ - FEATURED */}
                  <div className="rounded-xl border-2 border-primary p-5 relative bg-primary/5 shadow-lg scale-105">
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-4">
                      Recommended
                    </Badge>
                    <h3 className="font-bold text-lg text-primary">Host+</h3>
                    <p className="text-sm text-gray-500 mb-4">For regular hosts</p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">$29</span>
                      <span className="text-gray-500 text-sm">/month</span>
                      <div className="text-green-600 text-sm font-medium">Only 5% fee</div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Everything in Free
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> <strong>Save 2.5%</strong> on every board
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Priority support
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Custom branding
                      </li>
                    </ul>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => handleSubscribe('host_plus')}
                      disabled={subscribing}
                    >
                      {subscribing ? 'Loading...' : 'Get Host+ →'}
                    </Button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                      Pays for itself after just 1 board!
                    </p>
                  </div>

                  {/* Pro Host */}
                  <div className="rounded-xl border-2 border-gray-200 p-5">
                    <h3 className="font-bold text-lg">Pro Host</h3>
                    <p className="text-sm text-gray-500 mb-4">High volume hosts</p>
                    <div className="mb-4">
                      <span className="text-3xl font-bold">$79</span>
                      <span className="text-gray-500 text-sm">/month</span>
                      <div className="text-green-600 text-sm font-medium">Lowest 3% fee</div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 mb-6">
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Everything in Host+
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> <strong>Lowest fees</strong>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Dedicated support
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> API access
                      </li>
                    </ul>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleSubscribe('pro_host')}
                      disabled={subscribing}
                    >
                      {subscribing ? 'Loading...' : 'Get Pro Host'}
                    </Button>
                  </div>
                </div>

                {/* Social Proof */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <p className="text-green-800 font-medium">
                    Over 500 hosts saved $50,000+ in fees last month with Host+
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="ghost" onClick={() => setStep('host-intro')}>
                  Back
                </Button>
                <Button variant="link" onClick={() => setStep('complete')}>
                  Maybe later, start free →
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <Card className="text-center">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 rounded-full bg-green-100">
                  {subscriptionSuccess ? (
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                  ) : (
                    <Rocket className="h-12 w-12 text-green-600" />
                  )}
                </div>
              </div>
              <CardTitle className="text-2xl">
                {subscriptionSuccess ? 'Welcome to Host+!' : "You're all set!"}
              </CardTitle>
              <CardDescription>
                {subscriptionSuccess
                  ? "Your subscription is active. Time to create your first board!"
                  : role === 'host'
                  ? "Let's create your first board"
                  : "You're ready to join boards and win prizes"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionSuccess ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium">
                      ✓ You now have access to the reduced 5% platform fee
                    </p>
                  </div>
                  <p className="text-gray-600">
                    Click below to create your first board and start saving on fees immediately!
                  </p>
                </div>
              ) : role === 'host' ? (
                <p className="text-gray-600">
                  Click below to create your first board. You can always come back to the dashboard
                  to manage your boards and see your earnings.
                </p>
              ) : (
                <p className="text-gray-600">
                  Ask your friend for the board link or invite code. You can also browse public boards
                  from your dashboard.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button className="w-full" size="lg" onClick={completeOnboarding}>
                {role === 'host' ? 'Create My First Board' : 'Go to Dashboard'}
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Skip to dashboard</Link>
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
