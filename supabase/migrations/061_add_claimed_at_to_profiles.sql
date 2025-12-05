-- Migration: Add claimed_at field to profiles table
-- Tracks when a lawyer profile was claimed via self-service

-- Add claimed_at column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_claimed_at ON profiles(claimed_at) WHERE claimed_at IS NOT NULL;

-- Create index for lawyer_id with claimed_at for efficient lookups
CREATE INDEX IF NOT EXISTS idx_profiles_lawyer_id_claimed_at ON profiles(lawyer_id, claimed_at) WHERE lawyer_id IS NOT NULL;

