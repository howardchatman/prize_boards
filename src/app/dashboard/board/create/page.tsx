'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_PAYOUT_RULES, MAX_HOST_FEE_PERCENT, PayoutType, generateInviteCode, PLATFORM_FEES } from '@/types/database';

export default function CreateBoardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    eventName: '',
    sport: '',
    squarePrice: '',
    payoutType: 'standard' as PayoutType,
    hostFeeType: 'none' as 'none' | 'percentage' | 'flat',
    hostFeeValue: '',
    isPublic: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to create a board');
      setLoading(false);
      return;
    }

    const squarePriceCents = Math.round(parseFloat(formData.squarePrice) * 100);

    if (isNaN(squarePriceCents) || squarePriceCents <= 0) {
      setError('Please enter a valid square price');
      setLoading(false);
      return;
    }

    // Validate host fee
    let hostFeePercent: number | null = null;
    let hostFeeFlatCents: number | null = null;

    if (formData.hostFeeType === 'percentage') {
      const pct = parseFloat(formData.hostFeeValue);
      if (isNaN(pct) || pct < 0 || pct > MAX_HOST_FEE_PERCENT) {
        setError(`Host fee must be between 0 and ${MAX_HOST_FEE_PERCENT}%`);
        setLoading(false);
        return;
      }
      hostFeePercent = pct;
    } else if (formData.hostFeeType === 'flat') {
      const flat = Math.round(parseFloat(formData.hostFeeValue) * 100);
      if (isNaN(flat) || flat < 0) {
        setError('Please enter a valid flat fee amount');
        setLoading(false);
        return;
      }
      hostFeeFlatCents = flat;
    }

    const payoutRules = DEFAULT_PAYOUT_RULES[formData.payoutType];
    const inviteCode = generateInviteCode();

    // Get user's subscription to determine platform fee
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, is_active')
      .eq('user_id', user.id)
      .single();

    const plan = subscription?.is_active ? subscription.plan : 'payg';
    const platformFeePercent = PLATFORM_FEES[plan as keyof typeof PLATFORM_FEES] * 100;

    const { data: board, error: insertError } = await supabase
      .from('boards')
      .insert({
        host_id: user.id,
        title: formData.title,
        event_name: formData.eventName,
        sport: formData.sport || null,
        square_price_cents: squarePriceCents,
        payout_type: formData.payoutType,
        payout_rules: payoutRules,
        host_fee_percent: hostFeePercent,
        host_fee_flat_cents: hostFeeFlatCents,
        platform_fee_percent: platformFeePercent,
        invite_code: inviteCode,
        is_public: formData.isPublic,
        status: 'draft',
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/dashboard/board/${board.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create a New Board</CardTitle>
          <CardDescription>
            Set up your 10×10 sport board. You can edit settings before publishing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Board Title</Label>
              <Input
                id="title"
                placeholder="e.g., Super Bowl LVIII Board"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                placeholder="e.g., Super Bowl LVIII - Chiefs vs 49ers"
                value={formData.eventName}
                onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Sport (Optional)</Label>
              <Select
                value={formData.sport}
                onValueChange={(value) => setFormData({ ...formData, sport: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NFL">NFL</SelectItem>
                  <SelectItem value="NBA">NBA</SelectItem>
                  <SelectItem value="MLB">MLB</SelectItem>
                  <SelectItem value="NHL">NHL</SelectItem>
                  <SelectItem value="CFB">College Football</SelectItem>
                  <SelectItem value="CBB">College Basketball</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="squarePrice">Square Price ($)</Label>
              <Input
                id="squarePrice"
                type="number"
                step="0.01"
                min="0.50"
                placeholder="10.00"
                value={formData.squarePrice}
                onChange={(e) => setFormData({ ...formData, squarePrice: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">
                Total pot will be {formData.squarePrice ? `$${(parseFloat(formData.squarePrice) * 100).toFixed(2)}` : '$0.00'} (100 squares)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payoutType">Payout Type</Label>
              <Select
                value={formData.payoutType}
                onValueChange={(value: PayoutType) => setFormData({ ...formData, payoutType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard (100% Final Score)</SelectItem>
                  <SelectItem value="quarter">Quarter Payouts (20/20/20/40)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {formData.payoutType === 'standard'
                  ? 'Winner takes all based on final score'
                  : 'Payouts at Q1 (20%), Halftime (20%), Q3 (20%), Final (40%)'}
              </p>
            </div>

            <div className="space-y-4">
              <Label>Host Fee (Optional)</Label>
              <Select
                value={formData.hostFeeType}
                onValueChange={(value: 'none' | 'percentage' | 'flat') =>
                  setFormData({ ...formData, hostFeeType: value, hostFeeValue: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Fee</SelectItem>
                  <SelectItem value="percentage">Percentage (max {MAX_HOST_FEE_PERCENT}%)</SelectItem>
                  <SelectItem value="flat">Flat Fee</SelectItem>
                </SelectContent>
              </Select>

              {formData.hostFeeType !== 'none' && (
                <Input
                  type="number"
                  step={formData.hostFeeType === 'percentage' ? '0.5' : '0.01'}
                  min="0"
                  max={formData.hostFeeType === 'percentage' ? MAX_HOST_FEE_PERCENT : undefined}
                  placeholder={formData.hostFeeType === 'percentage' ? 'e.g., 10' : 'e.g., 50.00'}
                  value={formData.hostFeeValue}
                  onChange={(e) => setFormData({ ...formData, hostFeeValue: e.target.value })}
                />
              )}
              <p className="text-xs text-gray-500">
                Host fee is deducted from the total pot before prize distribution.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Fee Summary</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Platform fee: 7.5% of total pot (or less with subscription)</li>
                <li>• Stripe processing: ~2.9% + $0.30 per payment</li>
                {formData.hostFeeType !== 'none' && formData.hostFeeValue && (
                  <li>
                    • Your fee: {formData.hostFeeType === 'percentage'
                      ? `${formData.hostFeeValue}%`
                      : `$${parseFloat(formData.hostFeeValue).toFixed(2)}`}
                  </li>
                )}
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Board'}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
