-- Add Google OAuth integration to clients table
-- Stores OAuth tokens and connected properties per client

-- Add OAuth columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_oauth_tokens JSONB;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS google_connected_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ga4_properties JSONB;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS gsc_sites JSONB;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS gbp_locations JSONB;

-- Create index for faster OAuth lookups
CREATE INDEX IF NOT EXISTS idx_clients_google_connected ON clients(google_connected_at) WHERE google_connected_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN clients.google_oauth_tokens IS 'Encrypted OAuth tokens for Google APIs (GA4, GSC, GBP)';
COMMENT ON COLUMN clients.google_connected_at IS 'Timestamp when Google account was connected';
COMMENT ON COLUMN clients.ga4_properties IS 'Array of GA4 properties user has access to';
COMMENT ON COLUMN clients.gsc_sites IS 'Array of Search Console sites user has access to';
COMMENT ON COLUMN clients.gbp_locations IS 'Array of Google Business Profile locations user has access to';

-- Example structure for google_oauth_tokens:
-- {
--   "access_token": "ya29...",
--   "refresh_token": "1//...",
--   "scope": "https://www.googleapis.com/auth/analytics.readonly ...",
--   "token_type": "Bearer",
--   "expiry_date": 1234567890
-- }

-- Example structure for ga4_properties:
-- [
--   {
--     "property_id": "123456789",
--     "display_name": "My Website",
--     "account_id": "987654321"
--   }
-- ]

-- Example structure for gsc_sites:
-- [
--   {
--     "site_url": "https://example.com/",
--     "permission_level": "siteOwner"
--   }
-- ]

-- Example structure for gbp_locations:
-- [
--   {
--     "location_id": "12345678901234567890",
--     "title": "My Business Name",
--     "address": "123 Main St, City, State",
--     "phone": "+1234567890",
--     "website": "https://example.com",
--     "account_name": "accounts/1234567890"
--   }
-- ]
