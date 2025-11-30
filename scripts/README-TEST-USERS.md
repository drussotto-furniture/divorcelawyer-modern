# Creating Test Users

This guide explains how to create the 3 test users for the admin panel.

## Test Users

1. **Super Admin**
   - Email: `admin@divorcelawyer.com`
   - Password: `Admin123!`
   - Role: `super_admin`
   - Access: Full admin panel access

2. **Lawyer**
   - Email: `lawyer@divorcelawyer.com`
   - Password: `Lawyer123!`
   - Role: `lawyer`
   - Access: Own profile only (linked to a test lawyer record)

3. **Law Firm Admin**
   - Email: `lawfirm@divorcelawyer.com`
   - Password: `LawFirm123!`
   - Role: `law_firm`
   - Access: Law firm admin page (can see all lawyers in their firm)

## Method 1: Using the Node.js Script (Recommended)

### Prerequisites
- Node.js installed
- `.env.local` file with Supabase credentials

### Steps

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Ensure your `.env.local` has**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

3. **Run the script**:
   ```bash
   node scripts/create-test-users.js
   ```

4. **The script will**:
   - Create or use existing test law firm
   - Create or use existing test lawyer
   - Create all 3 test users with proper roles and links
   - Display credentials for each user

## Method 2: Manual Creation via Supabase Dashboard

### Steps

1. **Go to Supabase Dashboard** → Authentication → Users

2. **Create each user**:
   - Click "Add User" → "Create new user"
   - Enter email and password
   - Check "Auto Confirm User"
   - Click "Create User"

3. **Update profiles in SQL Editor**:

   ```sql
   -- Get user IDs (replace emails if different)
   -- Then run these updates:

   -- 1. Super Admin
   UPDATE profiles
   SET role = 'super_admin', name = 'Super Admin'
   WHERE email = 'admin@divorcelawyer.com';

   -- 2. Lawyer (requires a lawyer_id - get one from lawyers table)
   UPDATE profiles
   SET role = 'lawyer', name = 'Test Lawyer', 
       lawyer_id = (SELECT id FROM lawyers LIMIT 1)
   WHERE email = 'lawyer@divorcelawyer.com';

   -- 3. Law Firm Admin (requires a law_firm_id - get one from law_firms table)
   UPDATE profiles
   SET role = 'law_firm', name = 'Law Firm Admin',
       law_firm_id = (SELECT id FROM law_firms LIMIT 1)
   WHERE email = 'lawfirm@divorcelawyer.com';
   ```

## Verification

After creating users, test login:

1. Go to `/admin/login`
2. Try logging in with each user
3. Verify they're redirected to the correct admin page:
   - Super Admin → `/admin` (full admin panel)
   - Lawyer → `/admin/directory/lawyers/{lawyer_id}` (own profile)
   - Law Firm Admin → `/admin/directory/law-firms/{law_firm_id}` (firm admin)

## Troubleshooting

### "User not found" error
- Make sure users are created in Supabase Auth
- Check that profiles table has entries for each user

### "No admin access" error
- Verify the `role` field in profiles table is set correctly
- Check that `lawyer_id` or `law_firm_id` are set for lawyer/law_firm roles

### "Profile not found" error
- The trigger should auto-create profiles, but if not:
  - Run the create-profile API endpoint, or
  - Manually insert into profiles table



