import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BoardGrid } from '@/components/board/board-grid';
import { BoardActions } from '@/components/board/board-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function BoardDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: board } = await supabase
    .from('boards')
    .select('*')
    .eq('id', id)
    .single();

  if (!board) {
    notFound();
  }

  // Check if user is the host
  const isHost = board.host_id === user.id;

  if (!isHost && board.status === 'draft') {
    notFound();
  }

  const { data: squares } = await supabase
    .from('squares')
    .select('*')
    .eq('board_id', id);

  const { data: scores } = await supabase
    .from('scores')
    .select('*')
    .eq('board_id', id)
    .order('period');

  const paidSquares = squares?.filter((s) => s.payment_status === 'paid').length || 0;
  const totalPot = paidSquares * board.square_price;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'open':
        return 'bg-green-100 text-green-700';
      case 'locked':
        return 'bg-yellow-100 text-yellow-700';
      case 'completed':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{board.name}</h1>
            <Badge className={getStatusColor(board.status)}>{board.status}</Badge>
          </div>
          <p className="text-gray-600">{board.sport_event}</p>
        </div>

        {isHost && (
          <div className="flex gap-2">
            <BoardActions board={board} />
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Square Price</p>
            <p className="text-2xl font-bold">${(board.square_price / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Squares Claimed</p>
            <p className="text-2xl font-bold">{paidSquares} / 100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Pot</p>
            <p className="text-2xl font-bold">${(totalPot / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Payout Type</p>
            <p className="text-2xl font-bold capitalize">{board.payout_type}</p>
          </CardContent>
        </Card>
      </div>

      {/* Board Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Board Grid</CardTitle>
          <CardDescription>
            {board.status === 'draft' && 'This board is in draft mode. Publish it to allow players to claim squares.'}
            {board.status === 'open' && 'Players can click on available squares to claim them.'}
            {board.status === 'locked' && 'This board is locked. Numbers have been assigned.'}
            {board.status === 'completed' && 'This board is completed.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BoardGrid
            board={board}
            squares={squares || []}
            currentUserId={user.id}
            isInteractive={board.status === 'open'}
          />
        </CardContent>
      </Card>

      {/* Payout Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Rules</CardTitle>
          <CardDescription>
            How prizes will be distributed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(board.payout_rules as Record<string, number>).map(([period, percentage]) => (
              <div key={period} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="capitalize">{period === 'q1' ? 'Quarter 1' : period === 'q2' ? 'Halftime' : period === 'q3' ? 'Quarter 3' : 'Final'}</span>
                <span className="font-medium">{percentage}%</span>
              </div>
            ))}
          </div>
          {board.host_commission_type && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-500">
                Host Commission: {board.host_commission_type === 'percentage'
                  ? `${board.host_commission_value}%`
                  : `$${((board.host_commission_value || 0) / 100).toFixed(2)}`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scores (if locked or completed) */}
      {(board.status === 'locked' || board.status === 'completed') && isHost && (
        <Card>
          <CardHeader>
            <CardTitle>Scores</CardTitle>
            <CardDescription>
              Enter game scores to determine winners
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scores && scores.length > 0 ? (
              <div className="space-y-2">
                {scores.map((score) => (
                  <div key={score.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="capitalize">{score.period}</span>
                    <span className="font-mono">
                      {score.team_a_score} - {score.team_b_score}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No scores entered yet.</p>
            )}
            <Button className="mt-4" asChild>
              <Link href={`/dashboard/board/${id}/scores`}>
                {scores && scores.length > 0 ? 'Edit Scores' : 'Enter Scores'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Share Link */}
      {board.status === 'open' && (
        <Card>
          <CardHeader>
            <CardTitle>Share This Board</CardTitle>
            <CardDescription>
              Send this link to players so they can join
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <code className="flex-1 bg-gray-100 p-3 rounded text-sm overflow-x-auto">
                {typeof window !== 'undefined' ? `${window.location.origin}/board/${id}` : `/board/${id}`}
              </code>
              <Button
                variant="outline"
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/board/${id}`)}
              >
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
