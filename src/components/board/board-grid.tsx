'use client';

import { useState } from 'react';
import type { Board, Square } from '@/types/database';
import { cn } from '@/lib/utils';

interface BoardGridProps {
  board: Board;
  squares: Square[];
  currentUserId?: string;
  onSquareClick?: (square: Square) => void;
  isInteractive?: boolean;
}

export function BoardGrid({
  board,
  squares,
  currentUserId,
  onSquareClick,
  isInteractive = true,
}: BoardGridProps) {
  const [hoveredSquare, setHoveredSquare] = useState<string | null>(null);

  // Create a 2D grid from squares
  const grid: (Square | null)[][] = Array(10)
    .fill(null)
    .map(() => Array(10).fill(null));

  squares.forEach((square) => {
    grid[square.row_index][square.col_index] = square;
  });

  // Get column and row numbers (or placeholders if not assigned yet)
  const colNumbers = board.col_numbers || Array(10).fill('?');
  const rowNumbers = board.row_numbers || Array(10).fill('?');

  const getSquareStatus = (square: Square | null) => {
    if (!square) return 'unavailable';
    if (square.payment_status === 'paid') {
      if (square.player_id === currentUserId) return 'owned';
      return 'claimed';
    }
    if (square.payment_status === 'pending') return 'pending';
    return 'available';
  };

  const getSquareClasses = (status: string) => {
    const baseClasses = 'aspect-square flex items-center justify-center text-xs font-medium transition-colors border';

    switch (status) {
      case 'available':
        return cn(baseClasses, 'bg-white hover:bg-primary/10 cursor-pointer');
      case 'pending':
        return cn(baseClasses, 'bg-yellow-50 text-yellow-700');
      case 'claimed':
        return cn(baseClasses, 'bg-gray-100 text-gray-500');
      case 'owned':
        return cn(baseClasses, 'bg-primary/20 text-primary');
      default:
        return cn(baseClasses, 'bg-gray-50');
    }
  };

  const handleSquareClick = (square: Square | null) => {
    if (!square || !isInteractive || !onSquareClick) return;
    if (square.payment_status !== 'unpaid') return;
    onSquareClick(square);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[500px]">
        {/* Header row with column numbers */}
        <div className="grid grid-cols-11 gap-0.5 mb-0.5">
          <div className="aspect-square bg-gray-800 text-white flex items-center justify-center text-xs font-bold rounded-tl">
            {/* Corner cell */}
          </div>
          {colNumbers.map((num, i) => (
            <div
              key={`col-${i}`}
              className="aspect-square bg-gray-800 text-white flex items-center justify-center text-sm font-bold"
            >
              {num}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {grid.map((row, rowIdx) => (
          <div key={`row-${rowIdx}`} className="grid grid-cols-11 gap-0.5 mb-0.5">
            {/* Row number */}
            <div className="aspect-square bg-gray-800 text-white flex items-center justify-center text-sm font-bold">
              {rowNumbers[rowIdx]}
            </div>
            {/* Squares */}
            {row.map((square, colIdx) => {
              const status = getSquareStatus(square);
              const isHovered = hoveredSquare === `${rowIdx}-${colIdx}`;

              return (
                <div
                  key={`cell-${rowIdx}-${colIdx}`}
                  className={cn(
                    getSquareClasses(status),
                    isHovered && status === 'available' && 'ring-2 ring-primary'
                  )}
                  onClick={() => handleSquareClick(square)}
                  onMouseEnter={() => setHoveredSquare(`${rowIdx}-${colIdx}`)}
                  onMouseLeave={() => setHoveredSquare(null)}
                >
                  {status === 'owned' && '★'}
                  {status === 'claimed' && '✓'}
                  {status === 'pending' && '⏳'}
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary/20 border"></div>
            <span>Your Square</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border"></div>
            <span>Claimed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-50 border"></div>
            <span>Payment Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}
