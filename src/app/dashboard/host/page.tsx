import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function HostDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user profile with subscription info
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  // Get all boards hosted by user
  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  // Calculate stats
  const activeBoards = boards?.filter((b) => ['open', 'locked'].includes(b.status)) || [];
  const completedBoards = boards?.filter((b) => b.status === 'completed') || [];
  const totalPotCollected = boards?.reduce((sum, b) => sum + b.total_pot, 0) || 0;

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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Host Dashboard</h1>
          <p className="text-gray-600">Manage your boards and view earnings</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/board/create">Create New Board</Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Active Boards</p>
            <p className="text-2xl font-bold">{activeBoards.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Completed Boards</p>
            <p className="text-2xl font-bold">{completedBoards.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Collected</p>
            <p className="text-2xl font-bold">${(totalPotCollected / 100).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Your Plan</p>
            <p className="text-2xl font-bold capitalize">{profile?.subscription_tier || 'Free'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Boards Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Your Boards</CardTitle>
          <CardDescription>View and manage all your hosted boards</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All ({boards?.length || 0})</TabsTrigger>
              <TabsTrigger value="active">Active ({activeBoards.length})</TabsTrigger>
              <TabsTrigger value="draft">Draft ({boards?.filter((b) => b.status === 'draft').length || 0})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({completedBoards.length})</TabsTrigger>
            </TabsList>

            {['all', 'active', 'draft', 'completed'].map((tab) => {
              let filteredBoards = boards || [];
              if (tab === 'active') {
                filteredBoards = activeBoards;
              } else if (tab === 'draft') {
                filteredBoards = boards?.filter((b) => b.status === 'draft') || [];
              } else if (tab === 'completed') {
                filteredBoards = completedBoards;
              }

              return (
                <TabsContent key={tab} value={tab}>
                  {filteredBoards.length > 0 ? (
                    <div className="space-y-4">
                      {filteredBoards.map((board) => (
                        <Link
                          key={board.id}
                          href={`/dashboard/board/${board.id}`}
                          className="block p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{board.name}</h3>
                              <p className="text-sm text-gray-500">{board.sport_event}</p>
                              <p className="text-sm text-gray-500 mt-1">
                                ${(board.square_price / 100).toFixed(2)} per square •
                                Pot: ${(board.total_pot / 100).toFixed(2)}
                              </p>
                            </div>
                            <Badge className={getStatusColor(board.status)}>{board.status}</Badge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No boards found</p>
                      <Button className="mt-4" asChild>
                        <Link href="/dashboard/board/create">Create Your First Board</Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Stripe Connect Status */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Setup</CardTitle>
          <CardDescription>Connect your Stripe account to receive payouts</CardDescription>
        </CardHeader>
        <CardContent>
          {profile?.stripe_account_id ? (
            <div className="flex items-center gap-4">
              <Badge className="bg-green-100 text-green-700">Connected</Badge>
              <p className="text-sm text-gray-600">
                Your Stripe account is connected. You can receive payouts.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Connect your Stripe account to receive host commissions and manage payouts.
              </p>
              <Button asChild>
                <Link href="/api/stripe/connect">Connect Stripe Account</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
