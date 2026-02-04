'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BoardGrid } from './board-grid';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Board, Square } from '@/types/database';
import { toast } from 'sonner';

interface PublicBoardViewProps {
  board: Board;
  squares: Square[];
  currentUserId?: string;
}

export function PublicBoardView({ board, squares, currentUserId }: PublicBoardViewProps) {
  const router = useRouter();
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSquareClick = (square: Square) => {
    if (!currentUserId) {
      toast.error('Please sign in to claim squares');
      router.push(`/login?redirect=/board/${board.id}`);
      return;
    }

    if (board.status !== 'open') {
      toast.error('This board is not accepting new claims');
      return;
    }

    if (square.payment_status !== 'unpaid') {
      toast.error('This square is already claimed');
      return;
    }

    setSelectedSquare(square);
  };

  const handleClaimSquare = async () => {
    if (!selectedSquare || !currentUserId) return;

    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boardId: board.id,
          squareId: selectedSquare.id,
          squareRow: selectedSquare.row_index,
          squareCol: selectedSquare.col_index,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Something went wrong');
      setLoading(false);
    }
  };

  // Count how many squares the current user owns
  const userSquareCount = squares.filter(
    (s) => s.player_id === currentUserId && s.payment_status === 'paid'
  ).length;

  return (
    <>
      <BoardGrid
        board={board}
        squares={squares}
        currentUserId={currentUserId}
        onSquareClick={handleSquareClick}
        isInteractive={board.status === 'open'}
      />

      {currentUserId && userSquareCount > 0 && (
        <div className="mt-4 p-4 bg-primary/10 rounded-lg">
          <p className="font-medium">
            You own {userSquareCount} square{userSquareCount > 1 ? 's' : ''} on this board
          </p>
        </div>
      )}

      {/* Claim Square Dialog */}
      <Dialog open={!!selectedSquare} onOpenChange={() => setSelectedSquare(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Square</DialogTitle>
            <DialogDescription>
              You&apos;re about to claim a square on {board.name}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Position</p>
                  <p className="font-medium">
                    Row {selectedSquare?.row_index}, Column {selectedSquare?.col_index}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Price</p>
                  <p className="font-medium">${(board.square_price / 100).toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <strong>How winning works:</strong> After the board locks, numbers 0-9 will be
                randomly assigned to each row and column. Your square wins when the last digits
                of each team&apos;s score match your row and column numbers.
              </p>
              <p>
                <strong>Payout:</strong> {board.payout_type === 'standard'
                  ? '100% to final score winner'
                  : '20% each quarter, 40% final'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedSquare(null)}>
              Cancel
            </Button>
            <Button onClick={handleClaimSquare} disabled={loading}>
              {loading ? 'Processing...' : `Pay $${(board.square_price / 100).toFixed(2)}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
