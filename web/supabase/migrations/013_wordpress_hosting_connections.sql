-- Migration 013: WordPress and Hosting Connections
-- Enables CAIT to deploy files (robots.txt, sitemap, etc.) directly to client sites

-- WordPress connections table
CREATE TABLE wordpress_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- WordPress Site Info
  site_url TEXT NOT NULL,
  site_name TEXT,

  -- Authentication (WordPress Application Passwords)
  wp_username TEXT NOT NULL,
  wp_app_password TEXT NOT NULL, -- Stored encrypted

  -- Connection Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
  last_error TEXT,

  -- Capabilities (what can we do with this connection)
  can_upload_files BOOLEAN DEFAULT FALSE,
  can_edit_posts BOOLEAN DEFAULT FALSE,
  can_manage_plugins BOOLEAN DEFAULT FALSE,
  wordpress_version TEXT,

  -- Sync tracking
  last_verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, site_url)
);

-- Hosting/FTP connections table
CREATE TABLE hosting_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Connection Type
  connection_type TEXT NOT NULL CHECK (connection_type IN ('ftp', 'sftp', 'cpanel', 'ssh')),

  -- Host Info
  host TEXT NOT NULL,
  port INTEGER DEFAULT 21,
  root_path TEXT DEFAULT '/', -- Path to website root (e.g., /public_html)

  -- Authentication
  username TEXT NOT NULL,
  password TEXT, -- Stored encrypted (nullable for key-based auth)
  private_key TEXT, -- For SSH/SFTP key auth (stored encrypted)

  -- Connection Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'error', 'disconnected')),
  last_error TEXT,

  -- Capabilities
  can_write_root BOOLEAN DEFAULT FALSE, -- Can write to website root

  -- Sync tracking
  last_verified_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(client_id, host, connection_type)
);

-- Deployment history table (track all file deployments)
CREATE TABLE deployment_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,

  -- Deployment Info
  deployment_type TEXT NOT NULL CHECK (deployment_type IN ('robots_txt', 'sitemap', 'htaccess', 'meta_tags', 'schema', 'other')),
  file_path TEXT NOT NULL,
  file_content TEXT,

  -- Connection used
  connection_type TEXT NOT NULL CHECK (connection_type IN ('wordpress', 'hosting', 'manual')),
  connection_id UUID, -- References wordpress_connections or hosting_connections

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'deployed', 'failed', 'rolled_back')),
  error_message TEXT,

  -- Rollback support
  previous_content TEXT, -- Backup of what was there before
  can_rollback BOOLEAN DEFAULT TRUE,
  rolled_back_at TIMESTAMPTZ,

  -- Tracking
  deployed_at TIMESTAMPTZ,
  deployed_by UUID REFERENCES auth.users(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_wordpress_connections_client ON wordpress_connections(client_id);
CREATE INDEX idx_hosting_connections_client ON hosting_connections(client_id);
CREATE INDEX idx_deployment_history_client ON deployment_history(client_id);
CREATE INDEX idx_deployment_history_type ON deployment_history(deployment_type);

-- Updated_at triggers
CREATE TRIGGER update_wordpress_connections_updated_at
  BEFORE UPDATE ON wordpress_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hosting_connections_updated_at
  BEFORE UPDATE ON hosting_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deployment_history_updated_at
  BEFORE UPDATE ON deployment_history
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE wordpress_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON wordpress_connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON wordpress_connections FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON hosting_connections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON hosting_connections FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON deployment_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write" ON deployment_history FOR ALL TO authenticated USING (true);
