import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeroMiniGame } from '@/components/hero/hero-mini-game';

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
            backgroundImage: `url('https://images.unsplash.com/photo-1549463029-5f6d0c2f9b0a?auto=format&fit=crop&w=2000&q=80')`,
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
        <section id="how-it-works" className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Running a sport board has never been easier. Create, share, and let us handle the rest.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Fees are shown upfront. Rules lock before the board starts.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: '1',
                  title: 'Create a Board',
                  description: 'Set up your 10×10 board with your event, square price, and payout rules.',
                },
                {
                  step: '2',
                  title: 'Share & Collect',
                  description: 'Share the link with participants. They pay online to claim squares.',
                },
                {
                  step: '3',
                  title: 'Numbers Assigned',
                  description: 'When the board fills, numbers are randomly assigned to rows and columns.',
                },
                {
                  step: '4',
                  title: 'Auto Payouts',
                  description: 'Enter scores and winners receive payouts automatically via Stripe.',
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Start for free with pay-as-you-go pricing. Upgrade for lower fees and more features.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Pay-As-You-Go</CardTitle>
                  <CardDescription>Perfect for casual hosts</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">Free</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      7.5% platform fee per board
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Unlimited boards (one active at a time)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Standard & quarter payouts
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Automatic payouts via Stripe
                    </li>
                  </ul>
                  <Button className="w-full mt-6" variant="outline" asChild>
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-primary">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Host+</CardTitle>
                      <CardDescription>For regular hosts</CardDescription>
                    </div>
                    <Badge>Popular</Badge>
                  </div>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$29</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <strong>5% platform fee</strong> (save 2.5%)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Up to 5 active boards
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Forward/reverse digit options
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Priority support
                    </li>
                  </ul>
                  <Button className="w-full mt-6" asChild>
                    <Link href="/signup">Start Free Trial</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pro Host</CardTitle>
                  <CardDescription>For power users</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">$99</span>
                    <span className="text-gray-500">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      <strong>3% platform fee</strong> (save 4.5%)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Unlimited active boards
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Custom payout rules
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-gray-400">◯</span>
                      <span className="text-gray-400">Crypto payouts (Pro feature – coming soon)</span>
                    </li>
                  </ul>
                  <Button className="w-full mt-6" variant="outline" asChild>
                    <Link href="/signup">Unlock Pro Features</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
            <p className="text-center text-xs text-gray-500 mt-8">
              Platform fees apply to total board entries. Payment processing fees charged separately.
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
