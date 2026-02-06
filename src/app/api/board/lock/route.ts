import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendBoardLockedEmailBatch } from '@/lib/email/send';

// Fisher-Yates shuffle for provably random number assignment
function shuffleArray(array: number[]): number[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

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

    const { boardId } = await request.json();

    if (!boardId) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });
    }

    // Get board and verify ownership
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('id, title, event_name, host_id, status')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    if (board.host_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the board host can lock the board' },
        { status: 403 }
      );
    }

    if (board.status !== 'open') {
      return NextResponse.json(
        { error: 'Only open boards can be locked' },
        { status: 400 }
      );
    }

    // Generate random digits for rows and columns
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const rowDigits = shuffleArray(digits);
    const colDigits = shuffleArray(digits);

    // Lock the board
    const { error: updateError } = await supabase
      .from('boards')
      .update({
        status: 'locked',
        row_digits: rowDigits,
        col_digits: colDigits,
        locked_at: new Date().toISOString(),
      })
      .eq('id', boardId);

    if (updateError) {
      console.error('Failed to lock board:', updateError);
      return NextResponse.json(
        { error: 'Failed to lock board' },
        { status: 500 }
      );
    }

    // Get all players with claimed squares
    const { data: claimedSquares } = await supabase
      .from('squares')
      .select('claimed_by')
      .eq('board_id', boardId)
      .eq('status', 'claimed')
      .not('claimed_by', 'is', null);

    if (claimedSquares && claimedSquares.length > 0) {
      // Get unique player IDs
      const playerIds = [...new Set(claimedSquares.map((s) => s.claimed_by))];

      // Get player profiles
      const { data: players } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', playerIds);

      if (players && players.length > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prize-boards.com';
        const boardUrl = `${baseUrl}/board/${boardId}`;

        // Prepare recipients list
        const recipients = players
          .filter((p) => p.email)
          .map((p) => ({
            email: p.email!,
            userName: p.full_name || p.email!.split('@')[0],
          }));

        // Send emails (fire and forget)
        sendBoardLockedEmailBatch(recipients, board.title, board.event_name, boardUrl)
          .then((result) => {
            console.log(`Board locked emails: ${result.success} sent, ${result.failed} failed`);
          })
          .catch((err) => {
            console.error('Failed to send board locked emails:', err);
          });
      }
    }

    return NextResponse.json({
      success: true,
      rowDigits,
      colDigits,
    });
  } catch (error) {
    console.error('Error locking board:', error);
    return NextResponse.json(
      { error: 'Failed to lock board' },
      { status: 500 }
    );
  }
}
