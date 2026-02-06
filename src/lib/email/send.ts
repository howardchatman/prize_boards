import { getResend, FROM_EMAIL } from '@/lib/resend';
import {
  WelcomeEmail,
  BoardInviteEmail,
  PayoutEmail,
  SquareClaimedEmail,
  BoardLockedEmail,
} from './templates';

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

// ============== WELCOME EMAIL ==============
export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<SendEmailResult> {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Welcome to Prize Boards! 🎉',
      react: WelcomeEmail({ userName }),
    });

    if (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Error sending welcome email:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============== BOARD INVITATION EMAIL ==============
export async function sendBoardInviteEmail(
  to: string,
  inviterName: string,
  boardName: string,
  eventName: string,
  squarePrice: number,
  boardUrl: string
): Promise<SendEmailResult> {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${inviterName} invited you to join ${boardName}`,
      react: BoardInviteEmail({
        inviterName,
        boardName,
        eventName,
        squarePrice,
        boardUrl,
      }),
    });

    if (error) {
      console.error('Failed to send board invite email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Error sending board invite email:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============== PAYOUT NOTIFICATION EMAIL ==============
export async function sendPayoutEmail(
  to: string,
  userName: string,
  boardName: string,
  eventName: string,
  period: string,
  amount: number,
  squarePosition: string
): Promise<SendEmailResult> {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `You won $${(amount / 100).toFixed(2)} on ${boardName}! 🏆`,
      react: PayoutEmail({
        userName,
        boardName,
        eventName,
        period,
        amount,
        squarePosition,
      }),
    });

    if (error) {
      console.error('Failed to send payout email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Error sending payout email:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============== SQUARE CLAIMED NOTIFICATION (FOR HOSTS) ==============
export async function sendSquareClaimedEmail(
  to: string,
  hostName: string,
  boardName: string,
  playerName: string,
  squarePosition: string,
  amount: number,
  totalClaimed: number,
  totalSquares: number
): Promise<SendEmailResult> {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${playerName} claimed a square on ${boardName}`,
      react: SquareClaimedEmail({
        hostName,
        boardName,
        playerName,
        squarePosition,
        amount,
        totalClaimed,
        totalSquares,
      }),
    });

    if (error) {
      console.error('Failed to send square claimed email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Error sending square claimed email:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============== BOARD LOCKED NOTIFICATION ==============
export async function sendBoardLockedEmail(
  to: string,
  userName: string,
  boardName: string,
  eventName: string,
  boardUrl: string
): Promise<SendEmailResult> {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Numbers revealed for ${boardName}! 🎲`,
      react: BoardLockedEmail({
        userName,
        boardName,
        eventName,
        boardUrl,
      }),
    });

    if (error) {
      console.error('Failed to send board locked email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Error sending board locked email:', err);
    return { success: false, error: 'Failed to send email' };
  }
}

// ============== BATCH SEND (for board locked to all players) ==============
export async function sendBoardLockedEmailBatch(
  recipients: Array<{ email: string; userName: string }>,
  boardName: string,
  eventName: string,
  boardUrl: string
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;

  // Send emails in parallel with a concurrency limit
  const batchSize = 10;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map((r) =>
        sendBoardLockedEmail(r.email, r.userName, boardName, eventName, boardUrl)
      )
    );

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        success++;
      } else {
        failed++;
      }
    });
  }

  return { success, failed };
}
