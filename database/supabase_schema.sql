-- DANGER: Drop all existing tables, triggers, and recreate schema from scratch
-- Only use this for full reset/migration!

-- Drop existing triggers, functions, and tables
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS call_transcript CASCADE;
DROP TABLE IF EXISTS call_history CASCADE;
DROP TABLE IF EXISTS chat_history CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS app_versions CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;

-- ========================
-- User Preferences Table
-- ========================
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dark_mode BOOLEAN DEFAULT true,
  is_admin BOOLEAN DEFAULT false,
  is_unlimited BOOLEAN DEFAULT false,
  calls_left INTEGER DEFAULT 5,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS Policies for User Preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
CREATE POLICY "Users can view their own preferences" 
  ON user_preferences 
  FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
CREATE POLICY "Users can update their own preferences" 
  ON user_preferences 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- ========================
-- Function & Trigger for New Users
-- ========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (user_id, dark_mode, is_admin, calls_left)
  VALUES (new.id, true, false, 5);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END$$;

-- ========================
-- App Versions Table
-- ========================
CREATE TABLE IF NOT EXISTS app_versions (
  id SERIAL PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  deployed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ========================
-- Call History Table
-- ========================
CREATE TABLE IF NOT EXISTS call_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  call_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  call_id TEXT,
  topic TEXT,
  summary TEXT,
  status TEXT DEFAULT 'pending',
  recording_url TEXT,
  call_duration INTEGER,
  to_number TEXT,
  from_number TEXT
);

-- RLS Policies for Call History
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view only their own call history" ON call_history;
CREATE POLICY "Users can view only their own call history" 
  ON call_history 
  FOR ALL
  USING (auth.uid() = user_id);

-- ========================
-- Call Transcript Table
-- ========================
CREATE TABLE IF NOT EXISTS call_transcript (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  transcript TEXT,
  aligned_transcript JSONB,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(call_id)
);

-- RLS Policies for Call Transcript
ALTER TABLE call_transcript ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view only their own call transcripts" ON call_transcript;
CREATE POLICY "Users can view only their own call transcripts" 
  ON call_transcript 
  FOR ALL
  USING (auth.uid() = user_id);

-- ========================
-- Chat History Table
-- ========================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies for Chat History
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view only their own chat history" ON chat_history;
CREATE POLICY "Users can view only their own chat history" 
  ON chat_history 
  FOR ALL
  USING (auth.uid() = user_id);

-- ========================
-- Feedback Table
-- ========================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'unread'
);

-- RLS Policies for Feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Corrected INSERT policy using WITH CHECK
DROP POLICY IF EXISTS "Users can submit feedback" ON feedback;
CREATE POLICY "Users can submit feedback" 
  ON feedback 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all feedback
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedback;
CREATE POLICY "Admins can view all feedback" 
  ON feedback 
  FOR SELECT 
  USING (
    (SELECT is_admin FROM user_preferences WHERE user_id = auth.uid()) = true
  );
