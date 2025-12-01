-- ========================================
-- MIGRATION 043: Create DMAs Tables
-- ========================================
-- Creates tables for Designated Marketing Areas (DMAs) and their relationships with zip codes

-- DMAs table
CREATE TABLE IF NOT EXISTS dmas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code INTEGER NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dmas_code ON dmas(code);
CREATE INDEX IF NOT EXISTS idx_dmas_slug ON dmas(slug);
CREATE INDEX IF NOT EXISTS idx_dmas_name ON dmas(name);

-- Zip code to DMA mapping table
-- Each zip code maps to exactly one DMA
CREATE TABLE IF NOT EXISTS zip_code_dmas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zip_code_id UUID REFERENCES zip_codes(id) ON DELETE CASCADE NOT NULL,
  dma_id UUID REFERENCES dmas(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(zip_code_id) -- Each zip code can only belong to one DMA
);

CREATE INDEX IF NOT EXISTS idx_zip_code_dmas_zip_code_id ON zip_code_dmas(zip_code_id);
CREATE INDEX IF NOT EXISTS idx_zip_code_dmas_dma_id ON zip_code_dmas(dma_id);

-- Trigger for updated_at on dmas
DROP TRIGGER IF EXISTS update_dmas_updated_at ON dmas;
CREATE TRIGGER update_dmas_updated_at BEFORE UPDATE ON dmas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE dmas IS 'Designated Marketing Areas (DMAs) - geographic market areas used for television and advertising';
COMMENT ON COLUMN dmas.code IS 'Numeric DMA code (e.g., 523, 506, 534)';
COMMENT ON COLUMN dmas.name IS 'DMA name (e.g., BURLINGTON-PLATTSBURGH, BOSTON)';
COMMENT ON TABLE zip_code_dmas IS 'Junction table mapping zip codes to DMAs. Each zip code belongs to exactly one DMA.';



