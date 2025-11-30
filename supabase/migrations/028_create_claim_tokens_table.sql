-- Migration: Create claim_tokens table for lawyer profile claiming
-- This table stores temporary tokens for email verification during profile claiming

CREATE TABLE IF NOT EXISTS claim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  lawyer_id UUID NOT NULL REFERENCES lawyers(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ
);

CREATE INDEX idx_claim_tokens_token ON claim_tokens(token);
CREATE INDEX idx_claim_tokens_email ON claim_tokens(email);
CREATE INDEX idx_claim_tokens_lawyer_id ON claim_tokens(lawyer_id);
CREATE INDEX idx_claim_tokens_expires_at ON claim_tokens(expires_at);

-- RLS Policies
ALTER TABLE claim_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can access (via API routes with service key)
-- Regular users cannot read/write claim tokens
CREATE POLICY "Service role only" ON claim_tokens
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Function to clean up expired tokens (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_claim_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM claim_tokens
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

