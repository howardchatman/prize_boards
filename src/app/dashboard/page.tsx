import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SubscriptionGateServer } from '@/components/subscription/subscription-gate-server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, is_active')
    .eq('user_id', user.id)
    .single();

  // If no subscription, show plan selection
  if (!subscription?.is_active) {
    return <SubscriptionGateServer />;
  }

  // Get user's hosted boards
  const { data: hostedBoards } = await supabase
    .from('boards')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get boards where user has claimed squares
  const { data: playerSquares } = await supabase
    .from('squares')
    .select('board_id, boards(*)')
    .eq('claimed_by', user.id)
    .eq('status', 'claimed')
    .limit(10);

  const joinedBoards = playerSquares
    ?.map((s) => s.boards as unknown as { id: string; title: string; event_name: string; status: string } | null)
    .filter((b): b is { id: string; title: string; event_name: string; status: string } => b !== null)
    .filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i)
    .slice(0, 5);

  // Get plan details
  const planName = subscription?.plan === 'pro_host' ? 'Pro Host' :
                   subscription?.plan === 'host_plus' ? 'Host+' : 'Pay-As-You-Go';

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Manage your boards and see your activity.</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm py-1 px-3">
            {planName}
          </Badge>
          <Button asChild>
            <Link href="/dashboard/board/create">Create New Board</Link>
          </Button>
        </div>
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
                        <h3 className="font-medium">{board.title}</h3>
                        <p className="text-sm text-gray-500">{board.event_name}</p>
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
                      ${(board.square_price_cents / 100).toFixed(2)} per square
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
                {joinedBoards.map((board: { id: string; title: string; event_name: string; status: string }) => (
                  <Link
                    key={board.id}
                    href={`/board/${board.id}`}
                    className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{board.title}</h3>
                        <p className="text-sm text-gray-500">{board.event_name}</p>
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{hostedBoards?.length || 0}</div>
            <p className="text-sm text-gray-500">Boards Created</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{joinedBoards?.length || 0}</div>
            <p className="text-sm text-gray-500">Boards Joined</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {hostedBoards?.filter(b => b.status === 'open').length || 0}
            </div>
            <p className="text-sm text-gray-500">Active Boards</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {hostedBoards?.filter(b => b.status === 'completed').length || 0}
            </div>
            <p className="text-sm text-gray-500">Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Account Links */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account and subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline" asChild>
              <Link href="/dashboard/profile">Edit Profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/subscription">Manage Subscription</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
