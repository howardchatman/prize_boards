'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Board, BoardScore, PayoutRule } from '@/types/database';

type EventKey = 'Q1' | 'HALF' | 'Q3' | 'FINAL';

const EVENTS: { id: EventKey; label: string }[] = [
  { id: 'Q1', label: 'Quarter 1' },
  { id: 'HALF', label: 'Halftime' },
  { id: 'Q3', label: 'Quarter 3' },
  { id: 'FINAL', label: 'Final' },
];

export default function ScoresPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<Board | null>(null);
  const [existingScores, setExistingScores] = useState<BoardScore[]>([]);
  const [scores, setScores] = useState<Record<EventKey, { teamA: string; teamB: string }>>({
    Q1: { teamA: '', teamB: '' },
    HALF: { teamA: '', teamB: '' },
    Q3: { teamA: '', teamB: '' },
    FINAL: { teamA: '', teamB: '' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Load board
      const { data: boardData } = await supabase
        .from('boards')
        .select('*')
        .eq('id', boardId)
        .single();

      if (boardData) {
        setBoard(boardData as Board);
      }

      // Load existing scores
      const { data: scoresData } = await supabase
        .from('board_scores')
        .select('*')
        .eq('board_id', boardId);

      if (scoresData) {
        setExistingScores(scoresData as BoardScore[]);

        // Populate form with existing scores
        const newScores = { ...scores };
        scoresData.forEach((score) => {
          const eventKey = score.event_key as EventKey;
          if (eventKey in newScores) {
            newScores[eventKey] = {
              teamA: score.team_a_score.toString(),
              teamB: score.team_b_score.toString(),
            };
          }
        });
        setScores(newScores);
      }

      setLoading(false);
    }

    loadData();
  }, [boardId]);

  const handleScoreChange = (
    eventKey: EventKey,
    team: 'teamA' | 'teamB',
    value: string
  ) => {
    setScores((prev) => ({
      ...prev,
      [eventKey]: {
        ...prev[eventKey],
        [team]: value,
      },
    }));
  };

  const handleSaveScores = async () => {
    if (!board) return;

    setSaving(true);
    const supabase = createClient();

    // Determine which events to save based on payout rules
    const payoutRules = board.payout_rules as PayoutRule[];
    const eventsToSave = payoutRules.map(r => r.event);

    try {
      for (const eventKey of eventsToSave) {
        const score = scores[eventKey as EventKey];
        if (!score || !score.teamA || !score.teamB) continue;

        const teamAScore = parseInt(score.teamA);
        const teamBScore = parseInt(score.teamB);

        if (isNaN(teamAScore) || isNaN(teamBScore)) continue;

        // Upsert score
        const existingScore = existingScores.find((s) => s.event_key === eventKey);

        if (existingScore) {
          await supabase
            .from('board_scores')
            .update({
              team_a_score: teamAScore,
              team_b_score: teamBScore,
            })
            .eq('id', existingScore.id);
        } else {
          await supabase
            .from('board_scores')
            .insert({
              board_id: boardId,
              event_key: eventKey,
              team_a_score: teamAScore,
              team_b_score: teamBScore,
            });
        }
      }

      toast.success('Scores saved successfully');
      router.refresh();
    } catch (error) {
      toast.error('Failed to save scores');
    } finally {
      setSaving(false);
    }
  };

  const handleProcessPayouts = async () => {
    if (!board) return;

    setProcessing(true);

    try {
      const response = await fetch('/api/payouts/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ boardId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process payouts');
      }

      toast.success(`Payouts processed! ${data.payoutEventsCreated} winners identified.`);
      router.push(`/dashboard/board/${boardId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process payouts');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Board not found</p>
      </div>
    );
  }

  if (board.status !== 'locked' && board.status !== 'completed') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Board must be locked to enter scores</p>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // Get events from payout rules
  const payoutRules = board.payout_rules as PayoutRule[];
  const eventsToShow = EVENTS.filter(e => payoutRules.some(r => r.event === e.id));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Enter Scores</h1>
        <p className="text-gray-600">{board.title}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Game Scores</CardTitle>
          <CardDescription>
            Enter the scores for each period. Winners are determined by the last digit of each score.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {eventsToShow.map((event) => (
              <div key={event.id} className="space-y-2">
                <Label className="text-base font-medium">{event.label}</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`${event.id}-teamA`} className="text-sm text-gray-500">
                      Team A Score
                    </Label>
                    <Input
                      id={`${event.id}-teamA`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={scores[event.id].teamA}
                      onChange={(e) => handleScoreChange(event.id, 'teamA', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`${event.id}-teamB`} className="text-sm text-gray-500">
                      Team B Score
                    </Label>
                    <Input
                      id={`${event.id}-teamB`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={scores[event.id].teamB}
                      onChange={(e) => handleScoreChange(event.id, 'teamB', e.target.value)}
                    />
                  </div>
                </div>
                {scores[event.id].teamA && scores[event.id].teamB && (
                  <p className="text-sm text-gray-500">
                    Winning square: Row {parseInt(scores[event.id].teamA) % 10},
                    Column {parseInt(scores[event.id].teamB) % 10}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 mt-8">
            <Button onClick={handleSaveScores} disabled={saving}>
              {saving ? 'Saving...' : 'Save Scores'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Process Payouts Section */}
      <Card>
        <CardHeader>
          <CardTitle>Process Payouts</CardTitle>
          <CardDescription>
            Once all scores are entered, process payouts to determine winners and distribute prizes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 text-yellow-800 p-4 rounded-md text-sm">
              <strong>Important:</strong> Make sure all scores are correct before processing payouts.
              This action will mark the board as completed and cannot be undone.
            </div>
            <Button
              onClick={handleProcessPayouts}
              disabled={processing || board.status === 'completed'}
            >
              {processing ? 'Processing...' : board.status === 'completed' ? 'Payouts Already Processed' : 'Process Payouts'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
