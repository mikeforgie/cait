-- Conversions & AI Attribution Enhancement
-- Migration: 012_conversions_and_attribution
-- Description: Add conversion tracking and enhance AI attribution engine

-- Table: conversions
-- Track form fills, calls, purchases from GA4 Goals
CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Conversion details
  conversion_type TEXT NOT NULL CHECK (conversion_type IN (
    'form_submission',
    'phone_call',
    'purchase',
    'lead',
    'signup',
    'download',
    'contact',
    'booking',
    'quote_request',
    'chat_start',
    'custom'
  )),

  conversion_name TEXT NOT NULL, -- GA4 event name or custom name
  conversion_value DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',

  -- Source tracking
  source TEXT,
  medium TEXT,
  campaign TEXT,
  landing_page TEXT,

  -- AI traffic detection
  is_ai_traffic BOOLEAN DEFAULT false,
  ai_source TEXT, -- 'chatgpt', 'perplexity', 'claude', etc.

  -- Attribution
  attributed_action_id UUID REFERENCES seo_actions(id),
  attribution_confidence DECIMAL(3,2),

  -- Timestamps
  converted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  synced_from_ga4_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_conversions_client;
DROP INDEX IF EXISTS idx_conversions_type;
DROP INDEX IF EXISTS idx_conversions_source;
DROP INDEX IF EXISTS idx_conversions_ai;
DROP INDEX IF EXISTS idx_conversions_time;

CREATE INDEX idx_conversions_client ON conversions(client_id, converted_at DESC);
CREATE INDEX idx_conversions_type ON conversions(conversion_type);
CREATE INDEX idx_conversions_source ON conversions(source, medium);
CREATE INDEX idx_conversions_ai ON conversions(is_ai_traffic, ai_source);
CREATE INDEX idx_conversions_time ON conversions(converted_at DESC);

-- Table: ga4_goals
-- Track configured GA4 goals/events to monitor
CREATE TABLE IF NOT EXISTS ga4_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Goal details
  event_name TEXT NOT NULL, -- GA4 event name
  goal_name TEXT NOT NULL, -- Display name
  goal_type TEXT NOT NULL CHECK (goal_type IN (
    'form_submission',
    'phone_call',
    'purchase',
    'lead',
    'signup',
    'download',
    'contact',
    'booking',
    'quote_request',
    'chat_start',
    'custom'
  )),

  -- Value tracking
  has_value BOOLEAN DEFAULT false,
  default_value DECIMAL(10,2) DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, event_name)
);

DROP INDEX IF EXISTS idx_ga4_goals_client;

CREATE INDEX idx_ga4_goals_client ON ga4_goals(client_id, is_active);

-- Table: attribution_runs
-- Track when AI attribution engine runs
CREATE TABLE IF NOT EXISTS attribution_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Run details
  run_type TEXT NOT NULL CHECK (run_type IN ('manual', 'scheduled', 'triggered')),

  -- Stats
  actions_analyzed INTEGER DEFAULT 0,
  results_analyzed INTEGER DEFAULT 0,
  attributions_created INTEGER DEFAULT 0,
  attributions_updated INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_seconds INTEGER,

  -- Status
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error_message TEXT,

  created_at TIMESTAMP DEFAULT NOW()
);

DROP INDEX IF EXISTS idx_attribution_runs_client;
DROP INDEX IF EXISTS idx_attribution_runs_status;

CREATE INDEX idx_attribution_runs_client ON attribution_runs(client_id, started_at DESC);
CREATE INDEX idx_attribution_runs_status ON attribution_runs(status);

-- Add status field to action_result_attributions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_result_attributions'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE action_result_attributions
    ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invalidated', 'confirmed'));
  END IF;
END $$;

-- Add run_id to track which attribution run created each record
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'action_result_attributions'
    AND column_name = 'run_id'
  ) THEN
    ALTER TABLE action_result_attributions
    ADD COLUMN run_id UUID REFERENCES attribution_runs(id);
  END IF;
END $$;

-- Table: sync_schedules
-- Configure automated sync schedules
CREATE TABLE IF NOT EXISTS sync_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Sync type
  sync_type TEXT NOT NULL CHECK (sync_type IN ('ga4', 'rankings', 'conversions', 'attribution')),

  -- Schedule
  frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('hourly', 'daily', 'weekly')),
  hour_of_day INTEGER DEFAULT 6 CHECK (hour_of_day >= 0 AND hour_of_day <= 23),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- For weekly

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP,
  next_run_at TIMESTAMP,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'skipped')),
  last_error TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(client_id, sync_type)
);

DROP INDEX IF EXISTS idx_sync_schedules_next_run;
DROP INDEX IF EXISTS idx_sync_schedules_client;

CREATE INDEX idx_sync_schedules_next_run ON sync_schedules(next_run_at) WHERE is_active = true;
CREATE INDEX idx_sync_schedules_client ON sync_schedules(client_id);

-- Function: Calculate next run time
CREATE OR REPLACE FUNCTION calculate_next_run_time(
  frequency TEXT,
  hour_of_day INTEGER,
  day_of_week INTEGER DEFAULT NULL
) RETURNS TIMESTAMP AS $$
DECLARE
  next_run TIMESTAMP;
  current_time TIMESTAMP := NOW();
BEGIN
  CASE frequency
    WHEN 'hourly' THEN
      next_run := date_trunc('hour', current_time) + INTERVAL '1 hour';
    WHEN 'daily' THEN
      next_run := date_trunc('day', current_time) + (hour_of_day || ' hours')::INTERVAL;
      IF next_run <= current_time THEN
        next_run := next_run + INTERVAL '1 day';
      END IF;
    WHEN 'weekly' THEN
      next_run := date_trunc('week', current_time) + (day_of_week || ' days')::INTERVAL + (hour_of_day || ' hours')::INTERVAL;
      IF next_run <= current_time THEN
        next_run := next_run + INTERVAL '1 week';
      END IF;
    ELSE
      next_run := current_time + INTERVAL '1 day';
  END CASE;

  RETURN next_run;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update next_run_at when schedule changes
CREATE OR REPLACE FUNCTION update_sync_schedule_next_run()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_run_at := calculate_next_run_time(NEW.frequency, NEW.hour_of_day, NEW.day_of_week);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sync_schedule ON sync_schedules;
CREATE TRIGGER trigger_update_sync_schedule
  BEFORE INSERT OR UPDATE ON sync_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_sync_schedule_next_run();

-- Comments
COMMENT ON TABLE conversions IS 'Tracks form fills, calls, purchases and other conversions';
COMMENT ON TABLE ga4_goals IS 'GA4 goals/events configured for conversion tracking';
COMMENT ON TABLE attribution_runs IS 'Logs when AI attribution engine runs';
COMMENT ON TABLE sync_schedules IS 'Configures automated sync schedules for each client';
