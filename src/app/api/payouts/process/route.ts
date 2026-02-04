import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  calculatePayoutBreakdown,
  calculatePrizeAmounts,
  getWinningSquarePosition,
} from '@/lib/stripe';
import type { Board, Square, Score, PayoutRules, ScorePeriod } from '@/types/database';

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

    // Get board with host profile
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('*, host:profiles!boards_host_id_fkey(subscription_tier)')
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
      .from('scores')
      .select('*')
      .eq('board_id', boardId);

    if (!scores || scores.length === 0) {
      return NextResponse.json({ error: 'No scores entered' }, { status: 400 });
    }

    // Get all paid squares with player info
    const { data: squares } = await supabase
      .from('squares')
      .select('*')
      .eq('board_id', boardId)
      .eq('payment_status', 'paid');

    if (!squares || squares.length === 0) {
      return NextResponse.json({ error: 'No paid squares found' }, { status: 400 });
    }

    // Calculate payout breakdown
    const host = board.host as { subscription_tier: string } | null;
    const tier = (host?.subscription_tier || 'free') as 'free' | 'host_plus' | 'pro';

    const breakdown = calculatePayoutBreakdown(
      board.total_pot,
      tier,
      board.host_commission_type as 'percentage' | 'flat' | null,
      board.host_commission_value
    );

    // Calculate prize amounts for each period
    const payoutRules = board.payout_rules as PayoutRules;
    const prizeAmounts = calculatePrizeAmounts(breakdown.prizePool, payoutRules);

    // Create map of squares by position
    const squareMap: Record<string, Square> = {};
    squares.forEach((square) => {
      const key = `${square.row_index}-${square.col_index}`;
      squareMap[key] = square;
    });

    // Map row/col numbers to actual indices
    const rowNumbers = board.row_numbers as number[];
    const colNumbers = board.col_numbers as number[];

    // Create payouts for each score period
    const payoutsToCreate: {
      board_id: string;
      square_id: string;
      player_id: string;
      period: string;
      amount: number;
      status: string;
    }[] = [];

    for (const score of scores) {
      const prizeAmount = prizeAmounts[score.period];
      if (!prizeAmount) continue;

      // Get winning digits (last digit of each score)
      const winningPosition = getWinningSquarePosition(
        score.team_a_score,
        score.team_b_score
      );

      // Find the row/col indices that have these numbers assigned
      const rowIndex = rowNumbers.indexOf(winningPosition.row);
      const colIndex = colNumbers.indexOf(winningPosition.col);

      if (rowIndex === -1 || colIndex === -1) {
        console.error(`Could not find position for ${winningPosition.row}-${winningPosition.col}`);
        continue;
      }

      // Find the winning square
      const key = `${rowIndex}-${colIndex}`;
      const winningSquare = squareMap[key];

      if (!winningSquare || !winningSquare.player_id) {
        console.log(`No player for winning square at ${key}`);
        continue;
      }

      payoutsToCreate.push({
        board_id: boardId,
        square_id: winningSquare.id,
        player_id: winningSquare.player_id,
        period: score.period,
        amount: prizeAmount,
        status: 'pending',
      });
    }

    // Insert all payouts
    if (payoutsToCreate.length > 0) {
      const { error: payoutError } = await adminSupabase
        .from('payouts')
        .insert(payoutsToCreate);

      if (payoutError) {
        console.error('Failed to create payouts:', payoutError);
        return NextResponse.json({ error: 'Failed to create payouts' }, { status: 500 });
      }
    }

    // Mark board as completed
    const { error: updateError } = await adminSupabase
      .from('boards')
      .update({ status: 'completed' })
      .eq('id', boardId);

    if (updateError) {
      console.error('Failed to update board status:', updateError);
    }

    return NextResponse.json({
      success: true,
      payoutsCreated: payoutsToCreate.length,
      breakdown: {
        totalPot: breakdown.totalPot,
        platformFee: breakdown.platformFee,
        hostCommission: breakdown.hostCommission,
        prizePool: breakdown.prizePool,
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
