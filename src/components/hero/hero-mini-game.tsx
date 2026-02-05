'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { MiniBoard } from './mini-board';
import { GameResult } from './game-result';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type GamePhase = 'picking' | 'revealing' | 'result';

interface GameState {
  phase: GamePhase;
  selectedSquares: Set<string>;
  colDigits: number[];
  rowDigits: number[];
  teamAScore: number;
  teamBScore: number;
  winningSquare: string | null;
  hasWon: boolean;
  revealStep: number;
}

const TEAMS = [
  { a: 'Chiefs', b: '49ers' },
  { a: 'Eagles', b: 'Cowboys' },
  { a: 'Bills', b: 'Dolphins' },
  { a: 'Lions', b: 'Packers' },
];

// Fisher-Yates shuffle
function shuffleArray(array: number[]): number[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getInitialState(): GameState {
  return {
    phase: 'picking',
    selectedSquares: new Set(),
    colDigits: [],
    rowDigits: [],
    teamAScore: 0,
    teamBScore: 0,
    winningSquare: null,
    hasWon: false,
    revealStep: 0,
  };
}

export function HeroMiniGame() {
  const [gameState, setGameState] = useState<GameState>(getInitialState);
  const [teams] = useState(() => TEAMS[Math.floor(Math.random() * TEAMS.length)]);

  const handleSquareClick = useCallback((row: number, col: number) => {
    if (gameState.phase !== 'picking') return;

    const key = `${row}-${col}`;
    setGameState((prev) => {
      const newSelected = new Set(prev.selectedSquares);

      if (newSelected.has(key)) {
        newSelected.delete(key);
      } else if (newSelected.size < 3) {
        newSelected.add(key);
      }

      return { ...prev, selectedSquares: newSelected };
    });
  }, [gameState.phase]);

  const handleLockPicks = useCallback(() => {
    // Generate random digits for 5x5 board (0-4 for simplicity, but show 0-9 randomly selected)
    const allDigits = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const colDigits = allDigits.slice(0, 5);
    const rowDigits = shuffleArray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5);

    // Generate scores - ~40% chance to match a user square
    let teamAScore: number;
    let teamBScore: number;
    let winningSquare: string | null = null;
    let hasWon = false;

    const shouldWin = Math.random() < 0.4;
    const userSquares = Array.from(gameState.selectedSquares);

    if (shouldWin && userSquares.length > 0) {
      // Pick a random user square to win
      const winnerKey = userSquares[Math.floor(Math.random() * userSquares.length)];
      const [winRow, winCol] = winnerKey.split('-').map(Number);
      const rowDigit = rowDigits[winRow];
      const colDigit = colDigits[winCol];

      // Generate score ending in those digits
      teamAScore = Math.floor(Math.random() * 4) * 10 + rowDigit;
      teamBScore = Math.floor(Math.random() * 4) * 10 + colDigit;
      winningSquare = winnerKey;
      hasWon = true;
    } else {
      // Random scores
      teamAScore = Math.floor(Math.random() * 42);
      teamBScore = Math.floor(Math.random() * 42);

      // Find winning square based on scores
      const winRowDigit = teamAScore % 10;
      const winColDigit = teamBScore % 10;

      // Check if any user square matches
      for (const square of userSquares) {
        const [row, col] = square.split('-').map(Number);
        if (rowDigits[row] === winRowDigit && colDigits[col] === winColDigit) {
          winningSquare = square;
          hasWon = true;
          break;
        }
      }

      // Find actual winning square position
      if (!hasWon) {
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 5; c++) {
            if (rowDigits[r] === winRowDigit && colDigits[c] === winColDigit) {
              winningSquare = `${r}-${c}`;
              break;
            }
          }
          if (winningSquare) break;
        }
      }
    }

    setGameState((prev) => ({
      ...prev,
      phase: 'revealing',
      colDigits,
      rowDigits,
      teamAScore,
      teamBScore,
      winningSquare,
      hasWon,
      revealStep: 0,
    }));

    // Animate reveal steps
    setTimeout(() => setGameState((p) => ({ ...p, revealStep: 1 })), 500);  // Show col digits
    setTimeout(() => setGameState((p) => ({ ...p, revealStep: 2 })), 1200); // Show row digits
    setTimeout(() => setGameState((p) => ({ ...p, revealStep: 3 })), 2000); // Show score
    setTimeout(() => setGameState((p) => ({ ...p, revealStep: 4 })), 2800); // Highlight winner
    setTimeout(() => setGameState((p) => ({ ...p, phase: 'result' })), 3500); // Show result
  }, [gameState.selectedSquares]);

  const handlePlayAgain = useCallback(() => {
    setGameState(getInitialState());
  }, []);

  const canLock = gameState.selectedSquares.size === 3;

  return (
    <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6 border">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-lg">Try It Free!</h3>
          <p className="text-sm text-gray-500">
            {gameState.phase === 'picking'
              ? `Pick ${3 - gameState.selectedSquares.size} more square${3 - gameState.selectedSquares.size !== 1 ? 's' : ''}`
              : gameState.phase === 'revealing'
              ? 'Revealing numbers...'
              : 'Game complete!'}
          </p>
        </div>
        <Badge variant="secondary">Demo</Badge>
      </div>

      {/* Score display during reveal/result */}
      {gameState.revealStep >= 3 && (
        <div className="text-center mb-4 animate-in zoom-in fade-in duration-500">
          <p className="text-xs text-gray-500 mb-1">Final Score</p>
          <p className="text-xl font-bold">
            {teams.a} <span className="text-2xl">{gameState.teamAScore}</span>
            {' - '}
            <span className="text-2xl">{gameState.teamBScore}</span> {teams.b}
          </p>
        </div>
      )}

      {/* Mini Board */}
      <MiniBoard
        selectedSquares={gameState.selectedSquares}
        colDigits={gameState.revealStep >= 1 ? gameState.colDigits : null}
        rowDigits={gameState.revealStep >= 2 ? gameState.rowDigits : null}
        winningSquare={gameState.revealStep >= 4 ? gameState.winningSquare : null}
        isRevealing={gameState.phase === 'revealing'}
        onSquareClick={handleSquareClick}
        disabled={gameState.phase !== 'picking'}
        teams={teams}
      />

      {/* Result or Action Buttons */}
      {gameState.phase === 'result' ? (
        <GameResult
          hasWon={gameState.hasWon}
          teamAScore={gameState.teamAScore}
          teamBScore={gameState.teamBScore}
          onPlayAgain={handlePlayAgain}
        />
      ) : (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          {gameState.phase === 'picking' && (
            <>
              <Button
                onClick={handleLockPicks}
                disabled={!canLock}
                className="flex-1"
              >
                {canLock ? 'Lock My Picks' : `Select ${3 - gameState.selectedSquares.size} More`}
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/signup">Create Real Board</Link>
              </Button>
            </>
          )}
          {gameState.phase === 'revealing' && (
            <div className="text-center w-full py-2 text-gray-500 text-sm">
              Assigning numbers...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
