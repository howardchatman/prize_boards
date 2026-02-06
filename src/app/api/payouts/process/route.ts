import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getWinningSquarePosition } from '@/lib/stripe';
import { sendPayoutEmail } from '@/lib/email/send';
import type { Board, Square, PayoutRule } from '@/types/database';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { boardId } = await request.json();

    if (!boardId) {
      return NextResponse.json({ error: 'Missing board ID' }, { status: 400 });
    }

    // Get board
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*')
      .eq('id', boardId)
      .single();

    if (boardError || !board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    // Verify user is the host
    if (board.host_id !== user.id) {
      return NextResponse.json({ error: 'Only the host can process payouts' }, { status: 403 });
    }

    // Check board status
    if (board.status !== 'locked') {
      return NextResponse.json({ error: 'Board must be locked to process payouts' }, { status: 400 });
    }

    // Get all scores
    const { data: scores } = await supabase
      .from('board_scores')
      .select('*')
      .eq('board_id', boardId);

    if (!scores || scores.length === 0) {
      return NextResponse.json({ error: 'No scores entered' }, { status: 400 });
    }

    // Get all claimed squares
    const { data: squares } = await supabase
      .from('squares')
      .select('*')
      .eq('board_id', boardId)
      .eq('status', 'claimed');

    if (!squares || squares.length === 0) {
      return NextResponse.json({ error: 'No claimed squares found' }, { status: 400 });
    }

    // Calculate total pot
    const totalPotCents = squares.length * board.square_price_cents;

    // Calculate deductions
    const platformFeeCents = Math.round(totalPotCents * (board.platform_fee_percent / 100));
    let hostFeeCents = 0;
    if (board.host_fee_percent) {
      hostFeeCents = Math.round(totalPotCents * (board.host_fee_percent / 100));
    } else if (board.host_fee_flat_cents) {
      hostFeeCents = board.host_fee_flat_cents;
    }

    const prizePoolCents = totalPotCents - platformFeeCents - hostFeeCents;

    // Get payout rules
    const payoutRules = board.payout_rules as PayoutRule[];

    // Create map of squares by position
    const squareMap: Record<string, Square> = {};
    squares.forEach((square) => {
      const key = `${square.row_index}-${square.col_index}`;
      squareMap[key] = square as Square;
    });

    // Map row/col digits to actual indices
    const rowDigits = board.row_digits as number[];
    const colDigits = board.col_digits as number[];

    // Create payout events for each score
    const payoutEventsToCreate: {
      board_id: string;
      event_key: string;
      label: string;
      percent: number;
      row_digit: number;
      col_digit: number;
      winning_square_id: string | null;
      winner_user_id: string | null;
      prize_amount_cents: number;
      status: string;
    }[] = [];

    for (const score of scores) {
      // Find the matching payout rule
      const rule = payoutRules.find(r => r.event === score.event_key);
      if (!rule) continue;

      const prizeAmountCents = Math.round(prizePoolCents * (rule.percent / 100));

      // Get winning digits (last digit of each score)
      const winningPosition = getWinningSquarePosition(
        score.team_a_score,
        score.team_b_score
      );

      // Find the row/col indices that have these digits assigned
      const rowIndex = rowDigits.indexOf(winningPosition.row);
      const colIndex = colDigits.indexOf(winningPosition.col);

      let winningSquareId: string | null = null;
      let winnerUserId: string | null = null;

      if (rowIndex !== -1 && colIndex !== -1) {
        const key = `${rowIndex}-${colIndex}`;
        const winningSquare = squareMap[key];

        if (winningSquare && winningSquare.claimed_by) {
          winningSquareId = winningSquare.id;
          winnerUserId = winningSquare.claimed_by;
        }
      }

      payoutEventsToCreate.push({
        board_id: boardId,
        event_key: score.event_key,
        label: score.event_key === 'Q1' ? 'Quarter 1' :
               score.event_key === 'HALF' ? 'Halftime' :
               score.event_key === 'Q3' ? 'Quarter 3' : 'Final',
        percent: rule.percent,
        row_digit: winningPosition.row,
        col_digit: winningPosition.col,
        winning_square_id: winningSquareId,
        winner_user_id: winnerUserId,
        prize_amount_cents: prizeAmountCents,
        status: winnerUserId ? 'pending' : 'canceled',
      });
    }

    // Insert all payout events
    if (payoutEventsToCreate.length > 0) {
      const { error: payoutError } = await adminSupabase
        .from('payout_events')
        .insert(payoutEventsToCreate);

      if (payoutError) {
        console.error('Failed to create payout events:', payoutError);
        return NextResponse.json({ error: 'Failed to create payout events' }, { status: 500 });
      }
    }

    // Mark board as completed
    const { error: updateError } = await adminSupabase
      .from('boards')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', boardId);

    if (updateError) {
      console.error('Failed to update board status:', updateError);
    }

    // Send payout notification emails to winners (fire and forget)
    const winnersToNotify = payoutEventsToCreate.filter(
      (p) => p.winner_user_id && p.prize_amount_cents > 0
    );

    if (winnersToNotify.length > 0) {
      (async () => {
        try {
          // Get unique winner IDs
          const winnerIds = [...new Set(winnersToNotify.map((w) => w.winner_user_id!))];

          // Get winner profiles
          const { data: winnerProfiles } = await adminSupabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', winnerIds);

          if (winnerProfiles) {
            const profileMap = Object.fromEntries(
              winnerProfiles.map((p) => [p.id, p])
            );

            // Send email for each payout event
            for (const payout of winnersToNotify) {
              const winner = profileMap[payout.winner_user_id!];
              if (winner?.email) {
                // Find the square position
                const square = squares.find((s) => s.id === payout.winning_square_id);
                const squarePosition = square
                  ? `Row ${square.row_index + 1}, Col ${square.col_index + 1}`
                  : 'Unknown';

                await sendPayoutEmail(
                  winner.email,
                  winner.full_name || winner.email.split('@')[0],
                  board.title,
                  board.event_name,
                  payout.label,
                  payout.prize_amount_cents,
                  squarePosition
                );
              }
            }
          }
        } catch (emailErr) {
          console.error('Failed to send payout emails:', emailErr);
        }
      })();
    }

    return NextResponse.json({
      success: true,
      payoutEventsCreated: payoutEventsToCreate.length,
      breakdown: {
        totalPot: totalPotCents,
        platformFee: platformFeeCents,
        hostFee: hostFeeCents,
        prizePool: prizePoolCents,
      },
    });
  } catch (error) {
    console.error('Payout processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process payouts' },
      { status: 500 }
    );
  }
}
