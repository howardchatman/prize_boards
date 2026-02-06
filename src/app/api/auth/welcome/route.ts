import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/send';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'there';
    const userEmail = user.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'No email found' }, { status: 400 });
    }

    console.log('[Welcome API] Sending welcome email to:', userEmail, 'userName:', userName);

    const result = await sendWelcomeEmail(userEmail, userName);

    console.log('[Welcome API] Welcome email result:', result);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Welcome API] Error:', err);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
