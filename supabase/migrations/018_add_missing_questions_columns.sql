-- Migration: Add Missing Columns to Questions Table
-- Adds status and other columns that may be missing from the questions table

-- Add status column if it doesn't exist
ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published' 
  CHECK (status IN ('draft', 'published', 'archived'));

-- Add other potentially missing columns
ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS tags TEXT[];

ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE questions 
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index on status if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

-- Update any existing rows that might have NULL status to 'published'
UPDATE questions 
SET status = 'published' 
WHERE status IS NULL;

