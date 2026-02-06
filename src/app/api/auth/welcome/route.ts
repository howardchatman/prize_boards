import { NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/send';

export async function POST(request: Request) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const userName = name || email.split('@')[0] || 'there';

    console.log('[Welcome API] Sending welcome email to:', email, 'userName:', userName);

    const result = await sendWelcomeEmail(email, userName);

    console.log('[Welcome API] Welcome email result:', JSON.stringify(result));

    return NextResponse.json(result);
  } catch (err) {
    console.error('[Welcome API] Error:', err);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
