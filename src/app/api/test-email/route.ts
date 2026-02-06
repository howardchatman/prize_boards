import { NextResponse } from 'next/server';
import { getResend, FROM_EMAIL } from '@/lib/resend';

export async function GET() {
  // Check if API key is set
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      success: false,
      error: 'RESEND_API_KEY is not set',
      hint: 'Add RESEND_API_KEY to your Vercel environment variables',
    });
  }

  // Try to initialize Resend
  try {
    const resend = getResend();

    // Try to send a test email (will only work to verified email or with verified domain)
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'delivered@resend.dev', // Resend's test address that always succeeds
      subject: 'Prize Boards Email Test',
      html: '<p>This is a test email from Prize Boards.</p>',
    });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        from_email: FROM_EMAIL,
        hint: error.message.includes('domain')
          ? 'You need to verify your domain in Resend dashboard'
          : 'Check your Resend API key and domain settings',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully!',
      email_id: data?.id,
      from_email: FROM_EMAIL,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
      from_email: FROM_EMAIL,
    });
  }
}
