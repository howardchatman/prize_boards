import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function PlayerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get all squares owned by user
  const { data: squares } = await supabase
    .from('squares')
    .select('*, board:boards(*)')
    .eq('player_id', user.id)
    .eq('payment_status', 'paid');

  // Get user's payouts
  const { data: payouts } = await supabase
    .from('payouts')
    .select('*, board:boards(name)')
    .eq('player_id', user.id)
    .order('created_at', { ascending: false });

  // Group squares by board
  const boardSquares: Record<string, { board: any; squares: any[] }> = {};
  squares?.forEach((square) => {
    const boardId = square.board_id;
    if (!boardSquares[boardId]) {
      boardSquares[boardId] = {
        board: square.board,
        squares: [],
      };
    }
    boardSquares[boardId].squares.push(square);
  });

  // Calculate stats
  const totalSquares = squares?.length || 0;
  const totalSpent = squares?.reduce((sum, s) => sum + (s.board?.square_price || 0), 0) || 0;
  const totalWon = payouts
    ?.filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getPayoutStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Boards</h1>
        <p className="text-gray-600">View your squares and winnings</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Boards Joined</p>
            <p className="text-2xl font-bold">{Object.keys(boardSquares).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Squares</p>
            <p className="text-2xl font-bold">{totalSquares}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="text-2xl font-bold">${(totalSpent / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Won</p>
            <p className="text-2xl font-bold text-green-600">${(totalWon / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Boards with Squares */}
      <Card>
        <CardHeader>
          <CardTitle>Your Squares</CardTitle>
          <CardDescription>Boards where you own squares</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(boardSquares).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(boardSquares).map(([boardId, { board, squares: boardSquareList }]) => (
                <Link
                  key={boardId}
                  href={`/board/${boardId}`}
                  className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{board?.name}</h3>
                      <p className="text-sm text-gray-500">{board?.sport_event}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {boardSquareList.length} square{boardSquareList.length > 1 ? 's' : ''} •
                        ${((boardSquareList.length * (board?.square_price || 0)) / 100).toFixed(2)} invested
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {boardSquareList.slice(0, 5).map((sq) => (
                          <span
                            key={sq.id}
                            className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                          >
                            ({sq.row_index}, {sq.col_index})
                          </span>
                        ))}
                        {boardSquareList.length > 5 && (
                          <span className="text-xs text-gray-500 px-2 py-1">
                            +{boardSquareList.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(board?.status || '')}>
                      {board?.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven&apos;t joined any boards yet.</p>
              <p className="text-sm text-gray-400">
                Ask a friend for a board link or browse public boards to get started.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
          <CardDescription>Your winnings from completed boards</CardDescription>
        </CardHeader>
        <CardContent>
          {payouts && payouts.length > 0 ? (
            <div className="space-y-4">
              {payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex justify-between items-center p-4 rounded-lg border"
                >
                  <div>
                    <h4 className="font-medium">{payout.board?.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">
                      {payout.period === 'q1' ? 'Quarter 1' :
                       payout.period === 'q2' ? 'Halftime' :
                       payout.period === 'q3' ? 'Quarter 3' : 'Final'} Winner
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">
                      ${(payout.amount / 100).toFixed(2)}
                    </p>
                    <Badge className={getPayoutStatusColor(payout.status)}>
                      {payout.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No payouts yet</p>
              <p className="text-sm text-gray-400 mt-2">
                When you win on a board, your payouts will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
