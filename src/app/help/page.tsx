import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { HelpCircle, DollarSign, Users, Grid3X3, Shield, Mail } from 'lucide-react';

const faqs = [
  {
    category: 'Getting Started',
    icon: HelpCircle,
    questions: [
      {
        q: 'What is Prize Boards?',
        a: 'Prize Boards is a platform for hosting sport squares boards. Create a 10x10 grid, invite friends, collect payments automatically, and distribute prizes based on game scores.',
      },
      {
        q: 'How do I create my first board?',
        a: 'Sign up for an account, complete onboarding, then click "Create New Board" from your dashboard. Set your event, price per square, and payout structure.',
      },
      {
        q: 'How do players join my board?',
        a: 'Share your unique board link or invite code. Players can view the board, select available squares, and pay securely via Stripe.',
      },
    ],
  },
  {
    category: 'Payments & Pricing',
    icon: DollarSign,
    questions: [
      {
        q: 'What are the platform fees?',
        a: 'Pay-As-You-Go: 7.5% per board. Host+: 5% ($29/mo). Pro Host: 3% ($99/mo). Stripe processing fees (2.9% + $0.30) are charged separately.',
      },
      {
        q: 'How do payouts work?',
        a: 'After you enter game scores, Prize Boards automatically calculates winners based on score digits. Payouts are sent directly to winners via Stripe.',
      },
      {
        q: 'Can I set my own commission as a host?',
        a: 'Yes! Hosts can add a commission up to 20% of the pot. This is clearly displayed to players before they purchase squares.',
      },
    ],
  },
  {
    category: 'Board Management',
    icon: Grid3X3,
    questions: [
      {
        q: 'When are numbers assigned?',
        a: 'Numbers are randomly assigned when you lock the board. You can set an auto-lock time or manually lock. Once locked, numbers cannot be changed.',
      },
      {
        q: 'What payout structures are available?',
        a: 'Standard (100% to final winner), Quarter (20% Q1, 20% Half, 20% Q3, 40% Final), or Custom percentages you define.',
      },
      {
        q: 'Can I edit a board after publishing?',
        a: 'You can edit board details until it\'s locked. Once locked, the grid and numbers are final to ensure fairness.',
      },
    ],
  },
  {
    category: 'Account & Security',
    icon: Shield,
    questions: [
      {
        q: 'How is my payment information secured?',
        a: 'All payments are processed by Stripe, a PCI Level 1 certified payment processor. We never store your card details.',
      },
      {
        q: 'How do I upgrade my subscription?',
        a: 'Go to Dashboard → Subscription to view plans and upgrade. Changes take effect immediately.',
      },
      {
        q: 'Can I cancel my subscription?',
        a: 'Yes, you can cancel anytime from your Subscription settings. You\'ll retain access until the end of your billing period.',
      },
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-gray-50 to-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about Prize Boards
            </p>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="space-y-12">
              {faqs.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.category}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-2xl font-semibold">{section.category}</h2>
                    </div>
                    <div className="space-y-4">
                      {section.questions.map((faq, i) => (
                        <Card key={i}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">{faq.q}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-gray-600">{faq.a}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-xl mx-auto">
              <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Still have questions?</h2>
              <p className="text-gray-600 mb-6">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
