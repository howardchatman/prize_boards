'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Board } from '@/types/database';
import { toast } from 'sonner';

interface BoardActionsProps {
  board: Board;
}

export function BoardActions({ board }: BoardActionsProps) {
  const router = useRouter();
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showLockDialog, setShowLockDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase
      .from('boards')
      .update({ status: 'open' })
      .eq('id', board.id);

    if (error) {
      toast.error('Failed to publish board: ' + error.message);
    } else {
      toast.success('Board published! Share the link with players.');
      router.refresh();
    }

    setShowPublishDialog(false);
    setLoading(false);
  };

  const handleLock = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/board/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boardId: board.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lock board');
      }

      toast.success('Board locked! Numbers have been assigned and players have been notified.');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to lock board');
    }

    setShowLockDialog(false);
    setLoading(false);
  };

  const handleUnpublish = async () => {
    setLoading(true);
    const supabase = createClient();

    // Check if any squares have been claimed
    const { data: claimedSquares } = await supabase
      .from('squares')
      .select('id')
      .eq('board_id', board.id)
      .eq('status', 'claimed')
      .limit(1);

    if (claimedSquares && claimedSquares.length > 0) {
      toast.error('Cannot unpublish a board with claimed squares');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('boards')
      .update({ status: 'draft' })
      .eq('id', board.id);

    if (error) {
      toast.error('Failed to unpublish board: ' + error.message);
    } else {
      toast.success('Board moved back to draft');
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <>
      {board.status === 'draft' && (
        <Button onClick={() => setShowPublishDialog(true)} disabled={loading}>
          Publish Board
        </Button>
      )}

      {board.status === 'open' && (
        <>
          <Button variant="outline" onClick={handleUnpublish} disabled={loading}>
            Unpublish
          </Button>
          <Button onClick={() => setShowLockDialog(true)} disabled={loading}>
            Lock Board
          </Button>
        </>
      )}

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Board</DialogTitle>
            <DialogDescription>
              Publishing will make this board available for players to join. You can still edit
              basic settings, but some options will be locked.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h4 className="font-medium mb-2">Board Summary:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Title: {board.title}</li>
              <li>• Event: {board.event_name}</li>
              <li>• Square Price: ${(board.square_price_cents / 100).toFixed(2)}</li>
              <li>• Payout Type: {board.payout_type}</li>
              <li>• Invite Code: {board.invite_code}</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePublish} disabled={loading}>
              {loading ? 'Publishing...' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lock Dialog */}
      <Dialog open={showLockDialog} onOpenChange={setShowLockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lock Board</DialogTitle>
            <DialogDescription>
              Locking the board will randomly assign numbers (0-9) to rows and columns.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
              <strong>Warning:</strong> Once locked, no new squares can be claimed and numbers
              will be permanently assigned.
            </div>
            <p className="text-sm text-gray-600">
              Make sure all expected players have claimed their squares before locking.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLock} disabled={loading}>
              {loading ? 'Locking...' : 'Lock Board & Assign Numbers'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
