-- Migration: Add Bing Webmaster Tools and Microsoft Clarity integration support
-- Created: 2025-01-11
-- Description: Adds columns for storing Bing and Clarity API credentials and connection status

-- Add Bing Webmaster Tools columns to clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS bing_api_key TEXT,
  ADD COLUMN IF NOT EXISTS bing_connected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS bing_site_url TEXT;

-- Add Microsoft Clarity columns to clients table
ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS clarity_api_token TEXT,
  ADD COLUMN IF NOT EXISTS clarity_project_id TEXT,
  ADD COLUMN IF NOT EXISTS clarity_connected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS clarity_daily_requests INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clarity_last_request_date DATE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_bing_connected
  ON clients(bing_connected_at)
  WHERE bing_connected_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_clarity_connected
  ON clients(clarity_connected_at)
  WHERE clarity_connected_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN clients.bing_api_key IS 'Encrypted Bing Webmaster Tools API key';
COMMENT ON COLUMN clients.bing_connected_at IS 'Timestamp when Bing was connected';
COMMENT ON COLUMN clients.bing_site_url IS 'Primary site URL verified in Bing Webmaster Tools';
COMMENT ON COLUMN clients.clarity_api_token IS 'Encrypted Microsoft Clarity API token (JWT)';
COMMENT ON COLUMN clients.clarity_project_id IS 'Clarity project ID';
COMMENT ON COLUMN clients.clarity_connected_at IS 'Timestamp when Clarity was connected';
COMMENT ON COLUMN clients.clarity_daily_requests IS 'Number of API requests made today (10/day limit)';
COMMENT ON COLUMN clients.clarity_last_request_date IS 'Date of last API request (for daily limit reset)';
