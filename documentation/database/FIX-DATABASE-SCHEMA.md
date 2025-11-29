# Fix Missing Database Schema

## Issue
The migration revealed that some tables/columns are missing from your Supabase database:
- `team_members` table doesn't exist
- `videos` table is missing `published_at` column

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Fix Script
Copy and paste this SQL and click "Run":

```sql
-- Add published_at column to videos table if it doesn't exist
ALTER TABLE videos ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Create team_members table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wordpress_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  title TEXT,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  order_index INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_slug ON team_members(slug);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON team_members(active);
```

### Step 3: Verify
After running, you should see:
- ✅ `published_at` column added to `videos`
- ✅ `team_members` table created

### Step 4: Re-run Migration
Once the schema is fixed, run:
```bash
npm run migrate:data
```

This will successfully import:
- 36 videos ✅
- 29 team members ✅

---

**Note**: The script uses `IF NOT EXISTS` so it's safe to run multiple times.

