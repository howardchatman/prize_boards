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
import { DEFAULT_PAYOUT_RULES, MAX_HOST_COMMISSION_PERCENT, PayoutType } from '@/types/database';

export default function CreateBoardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    sportEvent: '',
    squarePrice: '',
    payoutType: 'standard' as PayoutType,
    commissionType: 'none' as 'none' | 'percentage' | 'flat',
    commissionValue: '',
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

    const squarePriceInCents = Math.round(parseFloat(formData.squarePrice) * 100);

    if (isNaN(squarePriceInCents) || squarePriceInCents <= 0) {
      setError('Please enter a valid square price');
      setLoading(false);
      return;
    }

    // Validate commission
    let hostCommissionType: string | null = null;
    let hostCommissionValue: number | null = null;

    if (formData.commissionType === 'percentage') {
      const pct = parseInt(formData.commissionValue);
      if (isNaN(pct) || pct < 0 || pct > MAX_HOST_COMMISSION_PERCENT) {
        setError(`Commission must be between 0 and ${MAX_HOST_COMMISSION_PERCENT}%`);
        setLoading(false);
        return;
      }
      hostCommissionType = 'percentage';
      hostCommissionValue = pct;
    } else if (formData.commissionType === 'flat') {
      const flat = Math.round(parseFloat(formData.commissionValue) * 100);
      if (isNaN(flat) || flat < 0) {
        setError('Please enter a valid flat commission amount');
        setLoading(false);
        return;
      }
      hostCommissionType = 'flat';
      hostCommissionValue = flat;
    }

    const payoutRules = DEFAULT_PAYOUT_RULES[formData.payoutType];

    const { data: board, error: insertError } = await supabase
      .from('boards')
      .insert({
        host_id: user.id,
        name: formData.name,
        sport_event: formData.sportEvent,
        square_price: squarePriceInCents,
        payout_type: formData.payoutType,
        payout_rules: payoutRules,
        host_commission_type: hostCommissionType,
        host_commission_value: hostCommissionValue,
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
              <Label htmlFor="name">Board Name</Label>
              <Input
                id="name"
                placeholder="e.g., Super Bowl LVIII Board"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sportEvent">Sport / Event</Label>
              <Input
                id="sportEvent"
                placeholder="e.g., Super Bowl LVIII - Chiefs vs 49ers"
                value={formData.sportEvent}
                onChange={(e) => setFormData({ ...formData, sportEvent: e.target.value })}
                required
              />
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
                  <SelectItem value="quarters">Quarter Payouts (20/20/20/40)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {formData.payoutType === 'standard'
                  ? 'Winner takes all based on final score'
                  : 'Payouts at Q1 (20%), Halftime (20%), Q3 (20%), Final (40%)'}
              </p>
            </div>

            <div className="space-y-4">
              <Label>Host Commission (Optional)</Label>
              <Select
                value={formData.commissionType}
                onValueChange={(value: 'none' | 'percentage' | 'flat') =>
                  setFormData({ ...formData, commissionType: value, commissionValue: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Commission</SelectItem>
                  <SelectItem value="percentage">Percentage (max {MAX_HOST_COMMISSION_PERCENT}%)</SelectItem>
                  <SelectItem value="flat">Flat Fee</SelectItem>
                </SelectContent>
              </Select>

              {formData.commissionType !== 'none' && (
                <Input
                  type="number"
                  step={formData.commissionType === 'percentage' ? '1' : '0.01'}
                  min="0"
                  max={formData.commissionType === 'percentage' ? MAX_HOST_COMMISSION_PERCENT : undefined}
                  placeholder={formData.commissionType === 'percentage' ? 'e.g., 10' : 'e.g., 50.00'}
                  value={formData.commissionValue}
                  onChange={(e) => setFormData({ ...formData, commissionValue: e.target.value })}
                />
              )}
              <p className="text-xs text-gray-500">
                Commission is deducted from the total pot before prize distribution.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Fee Summary</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Platform fee: 7.5% of total pot (or less with subscription)</li>
                <li>• Stripe processing: ~2.9% + $0.30 per payment</li>
                {formData.commissionType !== 'none' && formData.commissionValue && (
                  <li>
                    • Your commission: {formData.commissionType === 'percentage'
                      ? `${formData.commissionValue}%`
                      : `$${parseFloat(formData.commissionValue).toFixed(2)}`}
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
