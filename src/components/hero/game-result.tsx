'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GameResultProps {
  hasWon: boolean;
  teamAScore: number;
  teamBScore: number;
  onPlayAgain: () => void;
}

export function GameResult({ hasWon, onPlayAgain }: GameResultProps) {
  return (
    <div className="mt-4 text-center space-y-3">
      {/* Result message */}
      <div
        className={cn(
          'py-3 px-4 rounded-lg animate-in zoom-in fade-in duration-300',
          hasWon ? 'bg-green-50 text-green-800' : 'bg-gray-50 text-gray-700'
        )}
      >
        {hasWon ? (
          <>
            <div className="text-2xl mb-1">🎉</div>
            <p className="font-bold text-lg">You Won!</p>
            <p className="text-sm">Your square matched the winning score!</p>
          </>
        ) : (
          <>
            <div className="text-2xl mb-1">😮</div>
            <p className="font-bold text-lg">So Close!</p>
            <p className="text-sm">Better luck next time!</p>
          </>
        )}
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          className={cn('flex-1', hasWon && 'animate-bounce')}
          asChild
        >
          <Link href="/signup">
            {hasWon ? 'Claim Your Luck - Create a Board' : 'Try for Real Stakes'}
          </Link>
        </Button>
        <Button variant="outline" onClick={onPlayAgain} className="flex-1">
          Play Again
        </Button>
      </div>
    </div>
  );
}
