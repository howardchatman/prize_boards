'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ShareBoardProps {
  boardId: string;
  boardTitle: string;
  inviteCode: string;
}

export function ShareBoard({ boardId, boardTitle, inviteCode }: ShareBoardProps) {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const boardUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/board/${boardId}`
    : `/board/${boardId}`;

  const shareText = `Join my prize board "${boardTitle}" and win prizes!`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(boardUrl);

  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(type === 'link' ? 'Link copied!' : 'Invite code copied!');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    email: `mailto:?subject=${encodeURIComponent(`Join my prize board: ${boardTitle}`)}&body=${encodedText}%0A%0A${encodedUrl}`,
    sms: `sms:?body=${encodedText}%20${encodedUrl}`,
  };

  const openShareWindow = (url: string, name: string) => {
    if (name === 'email' || name === 'sms') {
      window.location.href = url;
    } else {
      window.open(url, `share-${name}`, 'width=600,height=400');
    }
  };

  return (
    <div className="space-y-4">
      {/* Copy Link */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Share Link</label>
        <div className="flex gap-2">
          <Input
            value={boardUrl}
            readOnly
            className="bg-gray-50 text-sm"
          />
          <Button
            variant="outline"
            onClick={() => copyToClipboard(boardUrl, 'link')}
            className="shrink-0"
          >
            {copied === 'link' ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Invite Code */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Invite Code</label>
        <div className="flex gap-2">
          <Input
            value={inviteCode}
            readOnly
            className="bg-gray-50 text-sm font-mono"
          />
          <Button
            variant="outline"
            onClick={() => copyToClipboard(inviteCode, 'code')}
            className="shrink-0"
          >
            {copied === 'code' ? 'Copied!' : 'Copy'}
          </Button>
        </div>
      </div>

      {/* Social Share Buttons */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Share on</label>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openShareWindow(shareLinks.twitter, 'twitter')}
            className="bg-black text-white hover:bg-gray-800"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openShareWindow(shareLinks.facebook, 'facebook')}
            className="bg-[#1877F2] text-white hover:bg-[#166FE5]"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openShareWindow(shareLinks.whatsapp, 'whatsapp')}
            className="bg-[#25D366] text-white hover:bg-[#20BD5A]"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openShareWindow(shareLinks.sms, 'sms')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Text
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openShareWindow(shareLinks.email, 'email')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Email
          </Button>
        </div>
      </div>
    </div>
  );
}
