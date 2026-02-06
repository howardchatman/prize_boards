import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroMiniGame } from '@/components/hero/hero-mini-game';
import {
  Check,
  X,
  Zap,
  Shield,
  Trophy,
  Users,
  Grid3X3,
  CreditCard,
  Sparkles,
  Crown,
  Star,
} from 'lucide-react';

// Force dynamic rendering since Header uses auth state
export const dynamic = 'force-dynamic';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section with Background Image */}
        <section
          className="relative min-h-[90vh] flex items-center justify-center bg-cover md:bg-center bg-top bg-no-repeat"
          style={{
            backgroundImage: `url('/pb_hero_image.png')`,
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 container mx-auto px-4 py-20">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left side - Text content */}
              <div className="text-center lg:text-left">
                <Badge variant="secondary" className="mb-4 bg-white/90">
                  The easiest way to run sport boards
                </Badge>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-white">
                  Sport boards. Real prizes.
                  <br />
                  <span className="text-green-400">Automated payouts.</span>
                </h1>
                <p className="text-xl text-gray-200 max-w-xl mb-8">
                  Hosts set the rules. Fees are shown upfront. Payouts are automatic.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Button size="lg" className="bg-green-500 hover:bg-green-600 text-white" asChild>
                    <Link href="/signup">Create a Prize Board</Link>
                  </Button>
                  <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100" asChild>
                    <Link href="#how-it-works">See How It Works</Link>
                  </Button>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start text-sm text-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Collect entries online
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Numbers randomized automatically
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    Prizes paid out instantly
                  </div>
                </div>
              </div>

              {/* Right side - Mini Game */}
              <div className="flex justify-center lg:justify-end">
                <div className="w-full max-w-md">
                  <HeroMiniGame />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 text-green-600 border-green-200 bg-green-50">
                Simple 4-Step Process
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Running a sport board has never been easier. Create, share, and let us handle the rest.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {[
                {
                  step: '1',
                  icon: Grid3X3,
                  title: 'Create a Board',
                  description: 'Set up your 10×10 board with your event, square price, and payout rules.',
                  color: 'bg-blue-500',
                  lightColor: 'bg-blue-100',
                  textColor: 'text-blue-600',
                },
                {
                  step: '2',
                  icon: Users,
                  title: 'Share & Collect',
                  description: 'Share the link with participants. They pay online to claim squares.',
                  color: 'bg-purple-500',
                  lightColor: 'bg-purple-100',
                  textColor: 'text-purple-600',
                },
                {
                  step: '3',
                  icon: Sparkles,
                  title: 'Numbers Assigned',
                  description: 'When the board fills, numbers are randomly assigned to rows and columns.',
                  color: 'bg-orange-500',
                  lightColor: 'bg-orange-100',
                  textColor: 'text-orange-600',
                },
                {
                  step: '4',
                  icon: Trophy,
                  title: 'Auto Payouts',
                  description: 'Enter scores and winners receive payouts automatically via Stripe.',
                  color: 'bg-green-500',
                  lightColor: 'bg-green-100',
                  textColor: 'text-green-600',
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="relative group">
                    {/* Connector line */}
                    {index < 3 && (
                      <div className="hidden lg:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                    )}

                    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 hover:-translate-y-1">
                      {/* Step number badge */}
                      <div className={`absolute -top-3 -right-3 w-8 h-8 ${item.color} text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg`}>
                        {item.step}
                      </div>

                      {/* Icon */}
                      <div className={`w-16 h-16 ${item.lightColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-8 h-8 ${item.textColor}`} />
                      </div>

                      <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                      <p className="text-gray-600">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 mt-16 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Bank-level security</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-green-500" />
                <span>Instant payouts</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-500" />
                <span>Powered by Stripe</span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24 bg-gradient-to-b from-white to-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 text-green-600 border-green-200 bg-green-50">
                Transparent Pricing
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4">Choose Your Plan</h2>
              <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                Start free. Upgrade when you&apos;re ready for lower fees and premium features.
              </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
              {/* Free Plan */}
              <div className="relative bg-white rounded-3xl p-8 shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Free</h3>
                    <p className="text-gray-500 text-sm">Pay as you go</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold">7.5%</span>
                    <span className="text-gray-500">per board</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">No monthly fee</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">1 active board at a time</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Standard payout rules</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Auto payouts via Stripe</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Email support</span>
                  </li>
                </ul>

                <Button className="w-full" variant="outline" size="lg" asChild>
                  <Link href="/signup">Get Started Free</Link>
                </Button>
              </div>

              {/* Host+ Plan - Featured */}
              <div className="relative bg-gradient-to-br from-green-600 to-green-700 rounded-3xl p-8 shadow-2xl text-white transform md:-translate-y-4 md:scale-105">
                {/* Popular badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-yellow-400 text-yellow-900 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
                    <Star className="w-4 h-4" />
                    Most Popular
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-6 mt-2">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Host+</h3>
                    <p className="text-green-100 text-sm">For regular hosts</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold">$29</span>
                    <span className="text-green-100">/month</span>
                  </div>
                  <p className="text-sm text-green-100 mt-1">Only 5% platform fee</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span><strong>5 active boards</strong> simultaneously</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span><strong>Save 2.5%</strong> on every board</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Quarter & custom payouts</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Priority support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                    <span>Custom branding</span>
                  </li>
                </ul>

                <Button className="w-full bg-white text-green-700 hover:bg-gray-100" size="lg" asChild>
                  <Link href="/signup">Start Host+ Trial</Link>
                </Button>
                <p className="text-center text-green-100 text-xs mt-3">Pays for itself after 1 board!</p>
              </div>

              {/* Pro Host Plan */}
              <div className="relative bg-white rounded-3xl p-8 shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Pro Host</h3>
                    <p className="text-gray-500 text-sm">For power users</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold">$99</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                  <p className="text-sm text-purple-600 font-medium mt-1">Lowest 3% fee</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700"><strong>Unlimited</strong> active boards</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700"><strong>Save 4.5%</strong> on every board</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Custom payout rules</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">Dedicated support</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <span className="text-gray-700">API access</span>
                  </li>
                </ul>

                <Button className="w-full" variant="outline" size="lg" asChild>
                  <Link href="/signup">Go Pro</Link>
                </Button>
              </div>
            </div>

            {/* Feature Comparison Table */}
            <div className="max-w-4xl mx-auto">
              <h3 className="text-2xl font-bold text-center mb-8">Compare All Features</h3>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Feature</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Free</th>
                      <th className="text-center py-4 px-4 font-semibold text-green-600 bg-green-50">Host+</th>
                      <th className="text-center py-4 px-4 font-semibold text-gray-700">Pro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Platform Fee</td>
                      <td className="text-center py-4 px-4 text-gray-600">7.5%</td>
                      <td className="text-center py-4 px-4 text-green-600 bg-green-50 font-semibold">5%</td>
                      <td className="text-center py-4 px-4 text-purple-600 font-semibold">3%</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Active Boards</td>
                      <td className="text-center py-4 px-4 text-gray-600">1</td>
                      <td className="text-center py-4 px-4 text-green-600 bg-green-50 font-semibold">5</td>
                      <td className="text-center py-4 px-4 text-gray-600">Unlimited</td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Auto Payouts</td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-4 px-4 bg-green-50"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Custom Payout Rules</td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                      <td className="text-center py-4 px-4 bg-green-50"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Priority Support</td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                      <td className="text-center py-4 px-4 bg-green-50"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">Custom Branding</td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                      <td className="text-center py-4 px-4 bg-green-50"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-gray-700">API Access</td>
                      <td className="text-center py-4 px-4"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                      <td className="text-center py-4 px-4 bg-green-50"><X className="w-5 h-5 text-gray-300 mx-auto" /></td>
                      <td className="text-center py-4 px-4"><Check className="w-5 h-5 text-green-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500 mt-8">
              All plans include Stripe payment processing. Processing fees (2.9% + $0.30) charged separately by Stripe.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to run your first board?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto mb-8">
              Join thousands of hosts who trust Prize Boards for their sport pools.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/signup">Get Started for Free</Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
