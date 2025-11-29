-- Migration: Check and add missing columns to lawyers table
-- This safely adds columns that should exist according to the schema

-- ============================================================================
-- PART 1: Check what columns exist and add missing ones
-- ============================================================================

-- Add education column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'education'
  ) THEN
    ALTER TABLE lawyers ADD COLUMN education TEXT[];
    RAISE NOTICE 'Added education column';
  ELSE
    RAISE NOTICE 'education column already exists';
  END IF;
END $$;

-- Add awards column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'awards'
  ) THEN
    ALTER TABLE lawyers ADD COLUMN awards TEXT[];
    RAISE NOTICE 'Added awards column';
  ELSE
    RAISE NOTICE 'awards column already exists';
  END IF;
END $$;

-- Add specializations column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lawyers' AND column_name = 'specializations'
  ) THEN
    ALTER TABLE lawyers ADD COLUMN specializations TEXT[];
    RAISE NOTICE 'Added specializations column';
  ELSE
    RAISE NOTICE 'specializations column already exists';
  END IF;
END $$;

-- ============================================================================
-- PART 2: Show current schema for debugging
-- ============================================================================

-- This query will show all columns in the lawyers table
-- Run this separately to see what exists:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'lawyers' 
-- ORDER BY ordinal_position;

