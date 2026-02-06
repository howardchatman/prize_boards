import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendBoardInviteEmail } from '@/lib/email/send';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId, emails } = await request.json();

    if (!boardId || !emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: 'Board ID and at least one email are required' },
        { status: 400 }
      );
    }

    // Validate emails (max 10 at a time)
    if (emails.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 invitations at a time' },
        { status: 400 }
      );
    }

    // Get board details and verify ownership
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id, name, sport_event, square_price, host_id')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (board.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the board host can send invitations' },
        { status: 403 }
      );
    }

    // Get host profile for the inviter name
    const { data: hostProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const inviterName = hostProfile?.full_name || user.email?.split('@')[0] || 'A friend';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prize-boards.com';
    const boardUrl = `${baseUrl}/board/${boardId}`;

    // Send invitations
    const results = await Promise.allSettled(
      emails.map((email: string) =>
        sendBoardInviteEmail(
          email.trim(),
          inviterName,
          board.name,
          board.sport_event,
          board.square_price,
          boardUrl
        )
      )
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.length - sent;

    return NextResponse.json({
      success: true,
      sent,
      failed,
      message: failed > 0
        ? `Sent ${sent} invitations. ${failed} failed.`
        : `Sent ${sent} invitation${sent !== 1 ? 's' : ''} successfully!`,
    });
  } catch (error) {
    console.error('Error sending invitations:', error);
    return NextResponse.json(
      { error: 'Failed to send invitations' },
      { status: 500 }
    );
  }
}
