import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { PublicBoardView } from '@/components/board/public-board-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicBoardPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: board } = await supabase
    .from('boards')
    .select('*, host:profiles!boards_host_id_fkey(full_name)')
    .eq('id', id)
    .single();

  if (!board || board.status === 'draft') {
    notFound();
  }

  const { data: squares } = await supabase
    .from('squares')
    .select('*')
    .eq('board_id', id);

  const paidSquares = squares?.filter((s) => s.payment_status === 'paid').length || 0;

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Board Header */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{board.name}</h1>
                <Badge className={getStatusColor(board.status)}>{board.status}</Badge>
              </div>
              <p className="text-gray-600">{board.sport_event}</p>
              <p className="text-sm text-gray-500 mt-1">
                Hosted by {(board.host as { full_name: string | null })?.full_name || 'Anonymous'}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Square Price</p>
                <p className="text-2xl font-bold">${(board.square_price / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Squares Available</p>
                <p className="text-2xl font-bold">{100 - paidSquares} / 100</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Current Pot</p>
                <p className="text-2xl font-bold">${((paidSquares * board.square_price) / 100).toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-gray-500">Payout Type</p>
                <p className="text-2xl font-bold capitalize">{board.payout_type}</p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Board */}
          <Card>
            <CardHeader>
              <CardTitle>
                {board.status === 'open' ? 'Select Your Squares' : 'Board Grid'}
              </CardTitle>
              <CardDescription>
                {board.status === 'open' && 'Click on any available (white) square to claim it'}
                {board.status === 'locked' && 'Numbers have been assigned. Waiting for game results.'}
                {board.status === 'completed' && 'This board is completed. Check payouts below.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PublicBoardView
                board={board}
                squares={squares || []}
                currentUserId={user?.id}
              />
            </CardContent>
          </Card>

          {/* Payout Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Payout Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(board.payout_rules as Record<string, number>).map(([period, percentage]) => (
                  <div key={period} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="capitalize">
                      {period === 'q1' ? 'Quarter 1' : period === 'q2' ? 'Halftime' : period === 'q3' ? 'Quarter 3' : 'Final'}
                    </span>
                    <span className="font-medium">{percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* How it works for new players */}
          {board.status === 'open' && (
            <Card>
              <CardHeader>
                <CardTitle>How It Works</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                  <li>Click on any white (available) square to select it</li>
                  <li>Complete payment to lock in your square</li>
                  <li>Once the board is full or locked, numbers 0-9 will be randomly assigned to rows and columns</li>
                  <li>Your winning digit is determined by the last digit of each team&apos;s score</li>
                  <li>If your square matches the score, you win that period&apos;s prize!</li>
                </ol>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
