import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Link href="/">
              <Image
                src="/prize_boards_logo/full_logo_black_words.png"
                alt="Prize Boards"
                width={160}
                height={40}
              />
            </Link>
            <p className="text-sm text-gray-600">
              Sport boards. Real prizes. Automated payouts.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/#how-it-works" className="text-sm text-gray-600 hover:text-gray-900">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="text-sm text-gray-600 hover:text-gray-900">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-900">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-900">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-sm text-gray-600 hover:text-gray-900">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-gray-900">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8">
          <p className="text-xs text-gray-500 text-center max-w-2xl mx-auto">
            Prize Boards is a platform for creating private sport boards and distributing prizes
            based on predefined outcomes. Prize Boards does not set odds, accept wagers, or
            participate in outcomes.
          </p>
          <p className="text-xs text-gray-400 text-center mt-4">
            &copy; {new Date().getFullYear()} Prize Boards. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
