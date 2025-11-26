-- Business Intelligence System
-- Migration: 009_business_intelligence
-- Created: 2025-01-XX
-- Description: AI-powered business knowledge extraction from website content

-- Table: business_knowledge
-- Stores extracted knowledge about the client's business for AI context
CREATE TABLE IF NOT EXISTS business_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Knowledge classification
  knowledge_type TEXT NOT NULL CHECK (knowledge_type IN (
    'brand_voice',
    'products_services',
    'case_studies',
    'target_audience',
    'terminology',
    'pain_points',
    'competitors',
    'unique_value'
  )),

  -- Extracted knowledge (structured JSON)
  knowledge_data JSONB NOT NULL DEFAULT '{}',
  /* Example structures:
  brand_voice: {
    "formality": "casual",
    "personality": ["friendly", "helpful", "confident"],
    "reading_level": "8th grade",
    "sentence_style": "short and punchy",
    "example_sentences": ["We help businesses grow.", "No fluff, just results."]
  }

  products_services: {
    "products": [
      {
        "name": "SEO Audit Tool",
        "description": "Scans your site for 200+ issues",
        "benefits": ["Automated fixes", "AI recommendations"],
        "pricing": "Starting at $99/mo"
      }
    ]
  }

  case_studies: {
    "studies": [
      {
        "client": "Local Coffee Shop",
        "challenge": "Not showing up on Google Maps",
        "solution": "Optimized GBP listing",
        "result": "300% increase in foot traffic",
        "timeframe": "90 days"
      }
    ]
  }

  target_audience: {
    "segments": [
      {
        "type": "Small business owners",
        "pain_points": ["Limited marketing budget", "No technical expertise"],
        "goals": ["More local customers", "Better online visibility"]
      }
    ]
  }
  */

  -- Source information
  source_url TEXT, -- Where this knowledge came from
  source_type TEXT DEFAULT 'website_scan', -- 'website_scan', 'manual_input', 'user_upload'

  -- Quality metrics
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1), -- 0.0 to 1.0
  word_count INTEGER, -- Amount of source content analyzed

  -- Status
  is_active BOOLEAN DEFAULT true,
  manually_verified BOOLEAN DEFAULT false,

  -- Timestamps
  extracted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for business_knowledge
CREATE INDEX idx_business_knowledge_client ON business_knowledge(client_id, is_active);
CREATE INDEX idx_business_knowledge_type ON business_knowledge(knowledge_type);
CREATE INDEX idx_business_knowledge_active ON business_knowledge(is_active);

-- Table: website_scan_logs
-- Tracks website scanning sessions for debugging and history
CREATE TABLE IF NOT EXISTS website_scan_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Scan details
  website_url TEXT NOT NULL,
  scan_status TEXT NOT NULL DEFAULT 'in_progress' CHECK (scan_status IN (
    'in_progress',
    'completed',
    'failed',
    'partial'
  )),

  -- Progress tracking
  pages_found INTEGER DEFAULT 0,
  pages_crawled INTEGER DEFAULT 0,
  knowledge_items_extracted INTEGER DEFAULT 0,

  -- Results
  scan_results JSONB DEFAULT '{}',
  /* Example:
  {
    "pages_analyzed": ["/about", "/services", "/blog/post-1"],
    "knowledge_extracted": {
      "brand_voice": true,
      "case_studies": 3,
      "products": 5
    },
    "errors": []
  }
  */

  error_message TEXT,

  -- Performance metrics
  duration_seconds INTEGER,

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for website_scan_logs
CREATE INDEX idx_scan_logs_client ON website_scan_logs(client_id, created_at DESC);
CREATE INDEX idx_scan_logs_status ON website_scan_logs(scan_status);

-- Function: Update business_knowledge updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_knowledge_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update timestamp on business_knowledge changes
CREATE TRIGGER trigger_update_business_knowledge_timestamp
  BEFORE UPDATE ON business_knowledge
  FOR EACH ROW
  EXECUTE FUNCTION update_business_knowledge_timestamp();

-- Comments
COMMENT ON TABLE business_knowledge IS 'AI-extracted knowledge about client businesses for context injection';
COMMENT ON TABLE website_scan_logs IS 'History of website scanning sessions';
COMMENT ON COLUMN business_knowledge.knowledge_data IS 'Structured JSON containing extracted business information';
COMMENT ON COLUMN business_knowledge.confidence_score IS 'AI confidence in the extracted knowledge (0-1)';
COMMENT ON COLUMN website_scan_logs.scan_results IS 'Detailed results of the scanning session';
