import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's hosted boards
  const { data: hostedBoards } = await supabase
    .from('boards')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get boards where user has squares
  const { data: playerSquares } = await supabase
    .from('squares')
    .select('board_id, boards(*)')
    .eq('player_id', user.id)
    .eq('payment_status', 'paid')
    .limit(10);

  const joinedBoards = playerSquares
    ?.map((s) => s.boards as unknown as { id: string; name: string; sport_event: string; status: string } | null)
    .filter((b): b is { id: string; name: string; sport_event: string; status: string } => b !== null)
    .filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i)
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Manage your boards and see your activity.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/board/create">Create New Board</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Hosted Boards */}
        <Card>
          <CardHeader>
            <CardTitle>Your Boards</CardTitle>
            <CardDescription>Boards you are hosting</CardDescription>
          </CardHeader>
          <CardContent>
            {hostedBoards && hostedBoards.length > 0 ? (
              <div className="space-y-4">
                {hostedBoards.map((board) => (
                  <Link
                    key={board.id}
                    href={`/dashboard/board/${board.id}`}
                    className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{board.name}</h3>
                        <p className="text-sm text-gray-500">{board.sport_event}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        board.status === 'open' ? 'bg-green-100 text-green-700' :
                        board.status === 'locked' ? 'bg-yellow-100 text-yellow-700' :
                        board.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {board.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      ${(board.square_price / 100).toFixed(2)} per square
                    </p>
                  </Link>
                ))}
                <Link
                  href="/dashboard/host"
                  className="block text-center text-sm text-primary hover:underline pt-2"
                >
                  View all boards →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You haven&apos;t created any boards yet.</p>
                <Button asChild>
                  <Link href="/dashboard/board/create">Create Your First Board</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Joined Boards */}
        <Card>
          <CardHeader>
            <CardTitle>Boards You&apos;ve Joined</CardTitle>
            <CardDescription>Boards where you own squares</CardDescription>
          </CardHeader>
          <CardContent>
            {joinedBoards && joinedBoards.length > 0 ? (
              <div className="space-y-4">
                {joinedBoards.map((board: any) => (
                  <Link
                    key={board.id}
                    href={`/board/${board.id}`}
                    className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{board.name}</h3>
                        <p className="text-sm text-gray-500">{board.sport_event}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        board.status === 'open' ? 'bg-green-100 text-green-700' :
                        board.status === 'locked' ? 'bg-yellow-100 text-yellow-700' :
                        board.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {board.status}
                      </span>
                    </div>
                  </Link>
                ))}
                <Link
                  href="/dashboard/player"
                  className="block text-center text-sm text-primary hover:underline pt-2"
                >
                  View all your squares →
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">You haven&apos;t joined any boards yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
