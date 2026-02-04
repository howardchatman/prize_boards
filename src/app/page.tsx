import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// Force dynamic rendering since Header uses auth state
export const dynamic = 'force-dynamic';
import { Badge } from '@/components/ui/badge';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <Badge variant="secondary" className="mb-4">
              The easiest way to run sport boards
            </Badge>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
              Sport boards. Real prizes.
              <br />
              <span className="text-primary">Automated payouts.</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Hosts set the rules. Fees are shown upfront. Payouts are automatic.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" asChild>
                <Link href="/signup">Create a Prize Board</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#how-it-works">See How It Works</Link>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Collect entries online
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Numbers randomized automatically
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                Prizes paid out instantly
              </div>
            </div>
          </div>
        </section>

        {/* Demo Board Preview */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl shadow-2xl p-6 border">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Super Bowl LVIII Board</h3>
                    <p className="text-sm text-gray-500">$10 per square • 67/100 claimed</p>
                    <p className="text-xs text-gray-400 mt-1">Payouts: Q1 • Half • Q3 • Final</p>
                  </div>
                  <Badge>Open</Badge>
                </div>
                {/* Mini board preview - static for demo */}
                <div className="grid grid-cols-11 gap-0.5 text-xs">
                  <div className="bg-gray-100 p-2 text-center font-bold"></div>
                  {[3, 7, 1, 9, 4, 0, 8, 2, 6, 5].map((n, i) => (
                    <div key={`col-${i}`} className="bg-gray-100 p-2 text-center font-bold">{n}</div>
                  ))}
                  {[2, 8, 0, 5, 1, 9, 6, 3, 7, 4].map((rowNum, rowIdx) => (
                    <div key={`row-group-${rowIdx}`} className="contents">
                      <div className="bg-gray-100 p-2 text-center font-bold">{rowNum}</div>
                      {Array(10).fill(0).map((_, colIdx) => {
                        // Deterministic pattern for demo
                        const isClaimed = (rowIdx + colIdx) % 3 !== 0;
                        return (
                          <div
                            key={`cell-${rowIdx}-${colIdx}`}
                            className={`p-2 text-center border ${
                              isClaimed ? 'bg-primary/10 text-primary' : 'bg-white hover:bg-gray-50'
                            }`}
                          >
                            {isClaimed ? '✓' : ''}
                          </div>
                        );
                      })}
                    </div>
                  ))}
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
