import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Prize Boards (&quot;Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">2. Description of Service</h2>
            <p>
              Prize Boards is a platform that enables users to create and participate in sport squares boards
              for entertainment purposes. The Service facilitates:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Creation of sport squares boards by hosts</li>
              <li>Square selection and payment processing</li>
              <li>Automated prize distribution to winners</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">3. User Accounts</h2>
            <p>
              To use certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">4. Payment Terms</h2>
            <p>
              All payments are processed securely through Stripe. By making a payment, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Pay all fees associated with your purchases</li>
              <li>Our refund policy as stated in Section 5</li>
              <li>Platform fees as disclosed at the time of transaction</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">5. Refund Policy</h2>
            <p>
              Square purchases are generally non-refundable once the board is locked. Refunds may be issued at
              our discretion in cases of:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Event cancellation</li>
              <li>Technical errors on our part</li>
              <li>Board cancellation by the host before locking</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">6. Prohibited Activities</h2>
            <p>
              You may not use the Service to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Engage in fraudulent activities</li>
              <li>Manipulate or attempt to manipulate outcomes</li>
              <li>Create multiple accounts to circumvent limits</li>
              <li>Harass, abuse, or harm other users</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">7. Limitation of Liability</h2>
            <p>
              Prize Boards is provided &quot;as is&quot; without warranties of any kind. We are not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Any indirect, incidental, or consequential damages</li>
              <li>Loss of profits or data</li>
              <li>Service interruptions or errors</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant
              changes via email or through the Service. Continued use of the Service after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">9. Contact Us</h2>
            <p>
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:support@prize-boards.com" className="text-primary hover:underline">
                support@prize-boards.com
              </a>
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
