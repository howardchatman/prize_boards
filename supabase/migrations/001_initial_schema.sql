-- Prize Boards Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  stripe_customer_id TEXT,
  stripe_account_id TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'host_plus', 'pro')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('inactive', 'active', 'canceled', 'past_due')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profile automatically when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- BOARDS TABLE
-- =============================================
CREATE TABLE public.boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sport_event TEXT NOT NULL,
  square_price INTEGER NOT NULL CHECK (square_price > 0),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'locked', 'completed')),
  payout_type TEXT DEFAULT 'standard' CHECK (payout_type IN ('standard', 'quarters', 'custom')),
  payout_rules JSONB NOT NULL DEFAULT '{"final": 100}',
  host_commission_type TEXT CHECK (host_commission_type IN ('percentage', 'flat')),
  host_commission_value INTEGER CHECK (
    (host_commission_type = 'percentage' AND host_commission_value >= 0 AND host_commission_value <= 20) OR
    (host_commission_type = 'flat' AND host_commission_value >= 0) OR
    host_commission_type IS NULL
  ),
  row_numbers INTEGER[],
  col_numbers INTEGER[],
  lock_at TIMESTAMPTZ,
  total_pot INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_boards_host_id ON public.boards(host_id);
CREATE INDEX idx_boards_status ON public.boards(status);

-- =============================================
-- SQUARES TABLE (100 per board)
-- =============================================
CREATE TABLE public.squares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL CHECK (row_index >= 0 AND row_index <= 9),
  col_index INTEGER NOT NULL CHECK (col_index >= 0 AND col_index <= 9),
  player_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'paid')),
  payment_intent_id TEXT,
  claimed_at TIMESTAMPTZ,
  UNIQUE(board_id, row_index, col_index)
);

CREATE INDEX idx_squares_board_id ON public.squares(board_id);
CREATE INDEX idx_squares_player_id ON public.squares(player_id);

-- Function to create 100 squares when a board is created
CREATE OR REPLACE FUNCTION public.create_board_squares()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.squares (board_id, row_index, col_index)
  SELECT NEW.id, r, c
  FROM generate_series(0, 9) AS r
  CROSS JOIN generate_series(0, 9) AS c;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_board_created
  AFTER INSERT ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.create_board_squares();

-- =============================================
-- SCORES TABLE
-- =============================================
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('q1', 'q2', 'q3', 'final')),
  team_a_score INTEGER NOT NULL CHECK (team_a_score >= 0),
  team_b_score INTEGER NOT NULL CHECK (team_b_score >= 0),
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  entered_by UUID REFERENCES public.profiles(id),
  UNIQUE(board_id, period)
);

CREATE INDEX idx_scores_board_id ON public.scores(board_id);

-- =============================================
-- PAYOUTS TABLE
-- =============================================
CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  square_id UUID NOT NULL REFERENCES public.squares(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period TEXT NOT NULL CHECK (period IN ('q1', 'q2', 'q3', 'final')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  stripe_transfer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_payouts_board_id ON public.payouts(board_id);
CREATE INDEX idx_payouts_player_id ON public.payouts(player_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);

-- =============================================
-- SUBSCRIPTIONS TABLE
-- =============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('host_plus', 'pro')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view profiles for board participants"
  ON public.profiles FOR SELECT
  USING (true);

-- BOARDS POLICIES
CREATE POLICY "Anyone can view open/locked/completed boards"
  ON public.boards FOR SELECT
  USING (status IN ('open', 'locked', 'completed') OR host_id = auth.uid());

CREATE POLICY "Authenticated users can create boards"
  ON public.boards FOR INSERT
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Hosts can update their own boards"
  ON public.boards FOR UPDATE
  USING (auth.uid() = host_id);

CREATE POLICY "Hosts can delete their draft boards"
  ON public.boards FOR DELETE
  USING (auth.uid() = host_id AND status = 'draft');

-- SQUARES POLICIES
CREATE POLICY "Anyone can view squares of visible boards"
  ON public.squares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = squares.board_id
      AND (boards.status IN ('open', 'locked', 'completed') OR boards.host_id = auth.uid())
    )
  );

CREATE POLICY "Players can claim unclaimed squares"
  ON public.squares FOR UPDATE
  USING (
    player_id IS NULL OR player_id = auth.uid()
  )
  WITH CHECK (
    player_id = auth.uid()
  );

-- SCORES POLICIES
CREATE POLICY "Anyone can view scores"
  ON public.scores FOR SELECT
  USING (true);

CREATE POLICY "Hosts can insert scores for their boards"
  ON public.scores FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = scores.board_id
      AND boards.host_id = auth.uid()
    )
  );

CREATE POLICY "Hosts can update scores for their boards"
  ON public.scores FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = scores.board_id
      AND boards.host_id = auth.uid()
    )
  );

-- PAYOUTS POLICIES
CREATE POLICY "Users can view their own payouts"
  ON public.payouts FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Hosts can view payouts for their boards"
  ON public.payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.boards
      WHERE boards.id = payouts.board_id
      AND boards.host_id = auth.uid()
    )
  );

-- SUBSCRIPTIONS POLICIES
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid());

-- =============================================
-- UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
