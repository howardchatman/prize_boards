'use client';

import { cn } from '@/lib/utils';

interface MiniBoardProps {
  selectedSquares: Set<string>;
  colDigits: number[] | null;
  rowDigits: number[] | null;
  winningSquare: string | null;
  isRevealing: boolean;
  onSquareClick: (row: number, col: number) => void;
  disabled: boolean;
  teams: { a: string; b: string };
}

export function MiniBoard({
  selectedSquares,
  colDigits,
  rowDigits,
  winningSquare,
  isRevealing,
  onSquareClick,
  disabled,
  teams,
}: MiniBoardProps) {
  return (
    <div className="w-full">
      {/* Team labels */}
      <div className="flex justify-between text-xs text-gray-500 mb-1 px-1">
        <span>{teams.a} (row)</span>
        <span>{teams.b} (column)</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-6 gap-0.5 sm:gap-1">
        {/* Header row with column digits */}
        <div className="aspect-square bg-gray-800 text-white flex items-center justify-center text-xs font-bold rounded-tl">
          {/* Corner */}
        </div>
        {[0, 1, 2, 3, 4].map((colIdx) => (
          <div
            key={`col-${colIdx}`}
            className={cn(
              'aspect-square bg-gray-800 text-white flex items-center justify-center text-xs sm:text-sm font-bold',
              colIdx === 4 && 'rounded-tr',
              colDigits && 'animate-in slide-in-from-top-4 fade-in duration-300'
            )}
            style={colDigits ? { animationDelay: `${colIdx * 80}ms` } : undefined}
          >
            {colDigits ? colDigits[colIdx] : '?'}
          </div>
        ))}

        {/* Grid rows */}
        {[0, 1, 2, 3, 4].map((rowIdx) => (
          <div key={`row-${rowIdx}`} className="contents">
            {/* Row digit */}
            <div
              className={cn(
                'aspect-square bg-gray-800 text-white flex items-center justify-center text-xs sm:text-sm font-bold',
                rowIdx === 4 && 'rounded-bl',
                rowDigits && 'animate-in slide-in-from-left-4 fade-in duration-300'
              )}
              style={rowDigits ? { animationDelay: `${rowIdx * 80}ms` } : undefined}
            >
              {rowDigits ? rowDigits[rowIdx] : '?'}
            </div>

            {/* Squares */}
            {[0, 1, 2, 3, 4].map((colIdx) => {
              const key = `${rowIdx}-${colIdx}`;
              const isSelected = selectedSquares.has(key);
              const isWinner = winningSquare === key;
              const isCorner = rowIdx === 4 && colIdx === 4;

              return (
                <button
                  key={key}
                  onClick={() => onSquareClick(rowIdx, colIdx)}
                  disabled={disabled}
                  className={cn(
                    'aspect-square flex items-center justify-center text-xs sm:text-sm font-medium transition-all duration-200 border min-h-[40px]',
                    isCorner && 'rounded-br',
                    // Default state
                    !isSelected && !isWinner && 'bg-white hover:bg-gray-50',
                    // Selected state
                    isSelected && !isWinner && 'bg-primary/20 text-primary ring-2 ring-primary scale-105',
                    // Winner state
                    isWinner && 'bg-green-100 text-green-700 ring-4 ring-green-500 animate-pulse',
                    // Disabled cursor
                    disabled && !isSelected && 'cursor-default',
                    !disabled && 'cursor-pointer hover:scale-105'
                  )}
                >
                  {isSelected && !isWinner && '★'}
                  {isWinner && '🏆'}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600 justify-center">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-white border rounded"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-primary/20 border border-primary rounded"></div>
          <span>Your Pick</span>
        </div>
        {winningSquare && (
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-100 border border-green-500 rounded"></div>
            <span>Winner!</span>
          </div>
        )}
      </div>
    </div>
  );
}
