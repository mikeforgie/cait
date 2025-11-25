-- AI Content Generation Tables
-- Migration: 006_ai_content_system
-- Created: 2025-01-XX
-- Description: Add tables for AI-powered content generation, conversations, and usage tracking

-- Table: ai_generated_content
-- Stores all AI-generated content (blog posts, emails, meta descriptions)
CREATE TABLE IF NOT EXISTS ai_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Content details
  content_type TEXT NOT NULL CHECK (content_type IN ('blog_post', 'outreach_email', 'meta_description', 'social_post')),
  title TEXT,
  content TEXT NOT NULL,

  -- Generation context
  prompt TEXT NOT NULL,
  model_used TEXT NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',

  -- Metadata
  metadata JSONB DEFAULT '{}',
  /* Example metadata:
  {
    "keyword": "best coffee austin",
    "word_count": 2500,
    "tone": "professional",
    "approach": "guest_post",
    "recipient_website": "example.com"
  }
  */

  -- Usage tracking
  used BOOLEAN DEFAULT false,
  used_at TIMESTAMP,
  usage_location TEXT, -- e.g., 'wordpress', 'manual_copy', 'email_sent'

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for ai_generated_content
CREATE INDEX idx_ai_content_client ON ai_generated_content(client_id, created_at DESC);
CREATE INDEX idx_ai_content_type ON ai_generated_content(content_type);
CREATE INDEX idx_ai_content_used ON ai_generated_content(used, client_id);

-- Table: ai_conversations
-- Stores AI chat conversations for context and history
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  user_id UUID, -- Future: link to users table

  -- Conversation context
  context_type TEXT, -- 'general', 'guide', 'content_generation', 'troubleshooting'
  context_data JSONB DEFAULT '{}',

  -- Messages
  messages JSONB[] DEFAULT '{}',
  /* Example message:
  {
    "role": "user" | "assistant",
    "content": "message text",
    "timestamp": "2024-01-01T00:00:00Z"
  }
  */

  -- Metadata
  model_used TEXT DEFAULT 'claude-3-5-haiku-20241022',
  total_tokens INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for ai_conversations
CREATE INDEX idx_ai_conversations_client ON ai_conversations(client_id, created_at DESC);
CREATE INDEX idx_ai_conversations_context ON ai_conversations(context_type);

-- Table: ai_usage_tracking
-- Track AI usage for billing and limits
CREATE TABLE IF NOT EXISTS ai_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Usage details
  action_type TEXT NOT NULL, -- 'blog_generation', 'email_generation', 'chat_message', 'guide_help'
  model_used TEXT NOT NULL,

  -- Token tracking
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Cost tracking (in cents)
  estimated_cost_cents DECIMAL(10,2) DEFAULT 0,

  -- Context
  context JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  date DATE DEFAULT CURRENT_DATE
);

-- Indexes for ai_usage_tracking
CREATE INDEX idx_ai_usage_client_date ON ai_usage_tracking(client_id, date DESC);
CREATE INDEX idx_ai_usage_date ON ai_usage_tracking(date);
CREATE INDEX idx_ai_usage_action ON ai_usage_tracking(action_type);

-- Table: client_ai_settings
-- Per-client AI configuration and API keys (encrypted)
CREATE TABLE IF NOT EXISTS client_ai_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID UNIQUE REFERENCES clients(id) ON DELETE CASCADE,

  -- BYOK (Bring Your Own Key)
  has_own_api_key BOOLEAN DEFAULT false,
  encrypted_api_key TEXT, -- Encrypted Anthropic API key
  api_key_provider TEXT DEFAULT 'anthropic',

  -- Usage limits
  plan_tier TEXT DEFAULT 'professional' CHECK (plan_tier IN ('free', 'starter', 'professional', 'enterprise')),
  monthly_limit INTEGER DEFAULT 500, -- AI actions per month
  current_month_usage INTEGER DEFAULT 0,

  -- Preferences
  default_tone TEXT DEFAULT 'professional',
  default_word_count INTEGER DEFAULT 1500,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for client_ai_settings
CREATE INDEX idx_client_ai_settings_client ON client_ai_settings(client_id);

-- Function: Update ai_generated_content updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on ai_generated_content changes
CREATE TRIGGER trigger_update_ai_content_timestamp
  BEFORE UPDATE ON ai_generated_content
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_content_updated_at();

-- Function: Update ai_conversations updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on ai_conversations changes
CREATE TRIGGER trigger_update_ai_conversation_timestamp
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversation_updated_at();

-- Function: Reset monthly usage counter (run via cron job)
CREATE OR REPLACE FUNCTION reset_monthly_ai_usage()
RETURNS void AS $$
BEGIN
  UPDATE client_ai_settings
  SET current_month_usage = 0;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your RLS policies)
-- ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_usage_tracking ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE client_ai_settings ENABLE ROW LEVEL SECURITY;

-- Comment: These tables support the AI content generation system
COMMENT ON TABLE ai_generated_content IS 'Stores AI-generated content (blogs, emails, meta descriptions)';
COMMENT ON TABLE ai_conversations IS 'Stores AI chat conversations for history and context';
COMMENT ON TABLE ai_usage_tracking IS 'Tracks AI usage for billing and rate limiting';
COMMENT ON TABLE client_ai_settings IS 'Per-client AI configuration including BYOK settings';
