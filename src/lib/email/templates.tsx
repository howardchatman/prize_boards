import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://prize-boards.com';

// Shared styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
};

const heading = {
  fontSize: '24px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 16px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#4a4a4a',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  marginTop: '20px',
};

const logoUrl = `${baseUrl}/prize_boards_logo/full_logo_black_words.png`;

const logo = {
  margin: '0 auto 24px',
  display: 'block',
};

// ============== WELCOME EMAIL ==============
interface WelcomeEmailProps {
  userName: string;
}

export function WelcomeEmail({ userName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Prize Boards - Start hosting or join a game!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ padding: '0 48px' }}>
            <Img src={logoUrl} width="160" height="40" alt="Prize Boards" style={logo} />
            <Heading style={heading}>Welcome to Prize Boards! 🎉</Heading>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              Thanks for signing up for Prize Boards! We&apos;re excited to have you.
            </Text>
            <Text style={paragraph}>
              With Prize Boards, you can easily host sport squares pools for any game.
              Collect payments, randomize numbers, and pay out winners automatically.
            </Text>
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button style={button} href={`${baseUrl}/dashboard`}>
                Go to Dashboard
              </Button>
            </Section>
            <Text style={paragraph}>
              <strong>Quick tips to get started:</strong>
            </Text>
            <Text style={{ ...paragraph, marginLeft: '16px' }}>
              • Create your first board in minutes<br />
              • Share your board link with friends<br />
              • Numbers are randomized when you lock the board<br />
              • Winners get paid automatically!
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              Prize Boards - The easiest way to run sport squares pools.
              <br />
              <Link href={baseUrl} style={{ color: '#8898aa' }}>
                prize-boards.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============== BOARD INVITATION EMAIL ==============
interface BoardInviteEmailProps {
  inviterName: string;
  boardName: string;
  eventName: string;
  squarePrice: number;
  boardUrl: string;
}

export function BoardInviteEmail({
  inviterName,
  boardName,
  eventName,
  squarePrice,
  boardUrl,
}: BoardInviteEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} invited you to join {boardName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ padding: '0 48px' }}>
            <Img src={logoUrl} width="160" height="40" alt="Prize Boards" style={logo} />
            <Heading style={heading}>You&apos;re Invited! 🏈</Heading>
            <Text style={paragraph}>
              <strong>{inviterName}</strong> invited you to join their sport squares board!
            </Text>
            <Section
              style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                margin: '24px 0',
              }}
            >
              <Text style={{ ...paragraph, margin: '0 0 8px' }}>
                <strong>Board:</strong> {boardName}
              </Text>
              <Text style={{ ...paragraph, margin: '0 0 8px' }}>
                <strong>Event:</strong> {eventName}
              </Text>
              <Text style={{ ...paragraph, margin: '0' }}>
                <strong>Square Price:</strong> ${(squarePrice / 100).toFixed(2)}
              </Text>
            </Section>
            <Text style={paragraph}>
              Claim your squares before they&apos;re gone! Each square gives you a chance
              to win based on the final score of the game.
            </Text>
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button style={button} href={boardUrl}>
                Join This Board
              </Button>
            </Section>
            <Hr style={hr} />
            <Text style={footer}>
              You received this email because {inviterName} invited you to Prize Boards.
              <br />
              <Link href={baseUrl} style={{ color: '#8898aa' }}>
                prize-boards.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============== PAYOUT NOTIFICATION EMAIL ==============
interface PayoutEmailProps {
  userName: string;
  boardName: string;
  eventName: string;
  period: string;
  amount: number;
  squarePosition: string;
}

export function PayoutEmail({
  userName,
  boardName,
  eventName,
  period,
  amount,
  squarePosition,
}: PayoutEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>You won ${(amount / 100).toFixed(2)} on {boardName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ padding: '0 48px' }}>
            <Img src={logoUrl} width="160" height="40" alt="Prize Boards" style={logo} />
            <Heading style={heading}>Congratulations, You Won! 🏆</Heading>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              Great news! Your square hit on <strong>{boardName}</strong>!
            </Text>
            <Section
              style={{
                backgroundColor: '#dcfce7',
                padding: '24px',
                borderRadius: '8px',
                margin: '24px 0',
                textAlign: 'center',
              }}
            >
              <Text
                style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: '#166534',
                  margin: '0',
                }}
              >
                ${(amount / 100).toFixed(2)}
              </Text>
              <Text style={{ color: '#166534', margin: '8px 0 0' }}>
                Payout Amount
              </Text>
            </Section>
            <Text style={paragraph}>
              <strong>Event:</strong> {eventName}<br />
              <strong>Period:</strong> {period}<br />
              <strong>Your Square:</strong> {squarePosition}
            </Text>
            <Text style={paragraph}>
              Your winnings are being processed and will be deposited to your account shortly.
            </Text>
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button style={button} href={`${baseUrl}/dashboard/player`}>
                View My Winnings
              </Button>
            </Section>
            <Hr style={hr} />
            <Text style={footer}>
              Prize Boards - The easiest way to run sport squares pools.
              <br />
              <Link href={baseUrl} style={{ color: '#8898aa' }}>
                prize-boards.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============== SQUARE CLAIMED NOTIFICATION (FOR HOSTS) ==============
interface SquareClaimedEmailProps {
  hostName: string;
  boardName: string;
  playerName: string;
  squarePosition: string;
  amount: number;
  totalClaimed: number;
  totalSquares: number;
}

export function SquareClaimedEmail({
  hostName,
  boardName,
  playerName,
  squarePosition,
  amount,
  totalClaimed,
  totalSquares,
}: SquareClaimedEmailProps) {
  const percentFilled = Math.round((totalClaimed / totalSquares) * 100);

  return (
    <Html>
      <Head />
      <Preview>{playerName} claimed a square on {boardName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ padding: '0 48px' }}>
            <Img src={logoUrl} width="160" height="40" alt="Prize Boards" style={logo} />
            <Heading style={heading}>New Square Claimed! 💰</Heading>
            <Text style={paragraph}>Hi {hostName},</Text>
            <Text style={paragraph}>
              <strong>{playerName}</strong> just claimed square <strong>{squarePosition}</strong> on
              your board <strong>{boardName}</strong>!
            </Text>
            <Section
              style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                margin: '24px 0',
              }}
            >
              <Text style={{ ...paragraph, margin: '0 0 8px' }}>
                <strong>Amount:</strong> ${(amount / 100).toFixed(2)}
              </Text>
              <Text style={{ ...paragraph, margin: '0 0 8px' }}>
                <strong>Progress:</strong> {totalClaimed} of {totalSquares} squares ({percentFilled}%)
              </Text>
              {/* Progress bar */}
              <div
                style={{
                  backgroundColor: '#e5e7eb',
                  borderRadius: '4px',
                  height: '8px',
                  overflow: 'hidden',
                  marginTop: '8px',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#22c55e',
                    height: '100%',
                    width: `${percentFilled}%`,
                  }}
                />
              </div>
            </Section>
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button style={button} href={`${baseUrl}/dashboard/host`}>
                View Board
              </Button>
            </Section>
            <Hr style={hr} />
            <Text style={footer}>
              You&apos;re receiving this because you&apos;re hosting a board on Prize Boards.
              <br />
              <Link href={`${baseUrl}/dashboard/profile`} style={{ color: '#8898aa' }}>
                Manage notification preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ============== BOARD LOCKED NOTIFICATION ==============
interface BoardLockedEmailProps {
  userName: string;
  boardName: string;
  eventName: string;
  boardUrl: string;
}

export function BoardLockedEmail({
  userName,
  boardName,
  eventName,
  boardUrl,
}: BoardLockedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Numbers revealed for {boardName}!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ padding: '0 48px' }}>
            <Img src={logoUrl} width="160" height="40" alt="Prize Boards" style={logo} />
            <Heading style={heading}>Numbers Are In! 🎲</Heading>
            <Text style={paragraph}>Hi {userName},</Text>
            <Text style={paragraph}>
              The numbers have been randomly assigned for <strong>{boardName}</strong>!
              Check your squares to see your row and column numbers.
            </Text>
            <Section
              style={{
                backgroundColor: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                margin: '24px 0',
              }}
            >
              <Text style={{ ...paragraph, margin: '0 0 8px' }}>
                <strong>Board:</strong> {boardName}
              </Text>
              <Text style={{ ...paragraph, margin: '0' }}>
                <strong>Event:</strong> {eventName}
              </Text>
            </Section>
            <Text style={paragraph}>
              Good luck! Winners will be determined by the last digit of each team&apos;s
              score at the end of each quarter or period.
            </Text>
            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Button style={button} href={boardUrl}>
                View My Squares
              </Button>
            </Section>
            <Hr style={hr} />
            <Text style={footer}>
              Prize Boards - The easiest way to run sport squares pools.
              <br />
              <Link href={baseUrl} style={{ color: '#8898aa' }}>
                prize-boards.com
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
