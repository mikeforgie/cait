-- Create GA4 Reports Table
-- Stores Google Analytics 4 data snapshots

CREATE TABLE IF NOT EXISTS ga4_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  property_name TEXT,

  -- Date range
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,

  -- Main metrics
  total_users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  sessions INTEGER DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  avg_session_duration DECIMAL(10,2) DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,

  -- Detailed data (stored as JSONB)
  top_pages JSONB,
  top_sources JSONB,
  daily_metrics JSONB,

  -- Metadata
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicate reports for same period
  UNIQUE(client_id, property_id, start_date, end_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ga4_reports_client_id ON ga4_reports(client_id);
CREATE INDEX IF NOT EXISTS idx_ga4_reports_property_id ON ga4_reports(property_id);
CREATE INDEX IF NOT EXISTS idx_ga4_reports_fetched_at ON ga4_reports(fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_ga4_reports_date_range ON ga4_reports(start_date, end_date);

-- Add RLS policies
ALTER TABLE ga4_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view GA4 reports for their own clients
CREATE POLICY "Users can view GA4 reports for their clients"
  ON ga4_reports
  FOR SELECT
  USING (true); -- Adjust based on your auth requirements

-- Policy: Service role can insert/update GA4 reports
CREATE POLICY "Service role can manage GA4 reports"
  ON ga4_reports
  FOR ALL
  USING (true); -- Service role bypasses RLS anyway

COMMENT ON TABLE ga4_reports IS 'Stores Google Analytics 4 data snapshots for clients';
COMMENT ON COLUMN ga4_reports.top_pages IS 'Array of top pages with metrics (pagePath, pageTitle, screenPageViews, bounceRate)';
COMMENT ON COLUMN ga4_reports.top_sources IS 'Array of top traffic sources with metrics (source, medium, users, sessions)';
COMMENT ON COLUMN ga4_reports.daily_metrics IS 'Array of daily metrics for trend charts (date, users, sessions, pageviews)';
