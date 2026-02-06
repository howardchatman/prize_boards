import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/send';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, full_name')
        .eq('user_id', data.user.id)
        .single();

      // If they have a specific redirect, use it
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // New users go to onboarding, returning users go to dashboard
      if (!profile?.onboarding_completed) {
        // Send welcome email to new users (fire and forget)
        const userName = profile?.full_name || data.user.email?.split('@')[0] || 'there';
        sendWelcomeEmail(data.user.email!, userName).catch((err) => {
          console.error('Failed to send welcome email:', err);
        });

        return NextResponse.redirect(`${origin}/onboarding`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
