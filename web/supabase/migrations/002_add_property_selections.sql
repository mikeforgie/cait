-- Add Property Selection Columns
-- Stores the user's selected GA4 property, GSC site, and GBP location for each client

ALTER TABLE clients
ADD COLUMN IF NOT EXISTS selected_ga4_property_id TEXT,
ADD COLUMN IF NOT EXISTS selected_gsc_site_url TEXT,
ADD COLUMN IF NOT EXISTS selected_gbp_location_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_selected_ga4_property ON clients(selected_ga4_property_id);
CREATE INDEX IF NOT EXISTS idx_clients_selected_gsc_site ON clients(selected_gsc_site_url);
CREATE INDEX IF NOT EXISTS idx_clients_selected_gbp_location ON clients(selected_gbp_location_id);

COMMENT ON COLUMN clients.selected_ga4_property_id IS 'The GA4 property ID selected by the user for this client';
COMMENT ON COLUMN clients.selected_gsc_site_url IS 'The Search Console site URL selected by the user for this client';
COMMENT ON COLUMN clients.selected_gbp_location_id IS 'The Google Business Profile location ID selected by the user for this client';
