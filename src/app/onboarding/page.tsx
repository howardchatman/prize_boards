'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Step = 'welcome' | 'role' | 'host-intro' | 'complete';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('welcome');
  const [role, setRole] = useState<'host' | 'player' | null>(null);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

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

  const completeOnboarding = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {['welcome', 'role', role === 'host' ? 'host-intro' : null, 'complete'].filter(Boolean).map((s, i, arr) => (
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
              <div className="text-5xl mb-4">🎉</div>
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
                  <div className="text-2xl mb-1">📋</div>
                  <p className="text-sm text-gray-600">Create boards</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">💳</div>
                  <p className="text-sm text-gray-600">Collect payments</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🏆</div>
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
                className={`p-6 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 ${
                  role === 'host' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="font-bold text-lg mb-2">I want to host a board</h3>
                <p className="text-sm text-gray-600">
                  Create a sport squares board for an upcoming game. Invite friends and collect entries.
                </p>
                <Badge className="mt-3" variant="secondary">Most popular</Badge>
              </button>

              <button
                onClick={() => {
                  setRole('player');
                  setStep('complete');
                }}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:border-primary hover:bg-primary/5 ${
                  role === 'player' ? 'border-primary bg-primary/5' : 'border-gray-200'
                }`}
              >
                <div className="text-4xl mb-3">🎮</div>
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
              <div className="text-5xl mb-4">🏈</div>
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

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-1">💡 Pro tip</h4>
                <p className="text-sm text-green-700">
                  Start with the free plan (7.5% fee). Upgrade later to save on fees if you host often.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep('role')}>
                Back
              </Button>
              <Button onClick={() => setStep('complete')}>
                Got it, let&apos;s go!
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Step: Complete */}
        {step === 'complete' && (
          <Card className="text-center">
            <CardHeader>
              <div className="text-5xl mb-4">🚀</div>
              <CardTitle className="text-2xl">You&apos;re all set!</CardTitle>
              <CardDescription>
                {role === 'host'
                  ? "Let's create your first board"
                  : "You're ready to join boards and win prizes"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {role === 'host' ? (
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
