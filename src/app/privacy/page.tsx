import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Information We Collect</h2>
            <p>We collect the following types of information:</p>

            <h3 className="text-xl font-medium">Personal Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name and email address when you create an account</li>
              <li>Payment information processed securely through Stripe</li>
              <li>Profile information you choose to provide</li>
            </ul>

            <h3 className="text-xl font-medium">Usage Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Boards you create or join</li>
              <li>Squares you purchase</li>
              <li>Device and browser information</li>
              <li>IP address and general location</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide and improve our Service</li>
              <li>Process payments and distribute prizes</li>
              <li>Send important notifications about your boards</li>
              <li>Respond to your support requests</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Service Providers:</strong> Third parties that help us operate our Service
                (e.g., Stripe for payments, Resend for emails)
              </li>
              <li>
                <strong>Board Participants:</strong> Your name may be visible to other participants
                in boards you join
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law or to protect our rights
              </li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Encryption in transit and at rest</li>
              <li>Secure payment processing via Stripe (PCI compliant)</li>
              <li>Regular security assessments</li>
              <li>Access controls and authentication</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Delete your account and associated data</li>
              <li>Opt out of marketing communications</li>
              <li>Export your data</li>
            </ul>
            <p>
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@prize-boards.com" className="text-primary hover:underline">
                privacy@prize-boards.com
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Cookies and Tracking</h2>
            <p>
              We use essential cookies to maintain your session and preferences. We may also use
              analytics cookies to understand how our Service is used. You can control cookies
              through your browser settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to
              provide services. We may retain certain information for legal compliance, fraud
              prevention, or legitimate business purposes.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Children&apos;s Privacy</h2>
            <p>
              Our Service is not intended for users under 18 years of age. We do not knowingly
              collect information from children. If you believe a child has provided us with
              personal information, please contact us.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of significant
              changes via email or through the Service. The &quot;Last updated&quot; date indicates when
              the policy was last revised.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">10. Contact Us</h2>
            <p>
              For questions about this Privacy Policy, contact us at:{' '}
              <a href="mailto:privacy@prize-boards.com" className="text-primary hover:underline">
                privacy@prize-boards.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
