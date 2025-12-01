-- Migration: Add subscription_type to lawyers table
-- Each lawyer will have a subscription type: free, basic, enhanced, or premium

-- Add subscription_type column to lawyers table
ALTER TABLE lawyers 
ADD COLUMN IF NOT EXISTS subscription_type subscription_type DEFAULT 'free';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_lawyers_subscription_type ON lawyers(subscription_type);

-- Update existing lawyers to have 'free' as default (if not already set)
UPDATE lawyers 
SET subscription_type = 'free' 
WHERE subscription_type IS NULL;


