# Lawyer Profile Claiming Flow

This document explains how lawyers can claim their profiles on DivorceLawyer.com.

## Overview

Lawyers can claim their existing profiles by verifying their email address and creating an account. Once claimed, they can edit their own profile.

## Flow Steps

1. **Lawyer visits claim profile page** (`/claim-profile`)
2. **Enters email address** - Must match email in lawyers table
3. **Receives verification email** - Contains secure link
4. **Clicks email link** - Verifies ownership
5. **Creates password** - Sets up account
6. **Profile claimed** - Redirected to their profile edit page

## User Roles

After claiming, the lawyer gets:
- **Role**: `lawyer`
- **Access**: Can edit only their own profile (`/admin/directory/lawyers/{id}`)
- **Profile Link**: `lawyer_id` in profiles table links to their lawyer record

## Files Created

### Pages
- `app/claim-profile/page.tsx` - Main claim profile page (email input + password creation)

### API Routes
- `app/api/claim-profile/initiate/route.ts` - Checks email, creates token, sends email
- `app/api/claim-profile/verify/route.ts` - Verifies token from email link
- `app/api/claim-profile/complete/route.ts` - Creates account, links profile, sets password

### Database
- `supabase/migrations/028_create_claim_tokens_table.sql` - Stores verification tokens

### Utilities
- `lib/email.ts` - Email sending utility (placeholder for email service integration)

## Database Schema

### `claim_tokens` Table
```sql
- id: UUID (primary key)
- token: TEXT (unique verification token)
- email: TEXT (lawyer's email)
- lawyer_id: UUID (references lawyers.id)
- expires_at: TIMESTAMPTZ (24 hour expiration)
- created_at: TIMESTAMPTZ
- used_at: TIMESTAMPTZ (set when token is used)
```

### Profile Linking
After claiming, the `profiles` table is updated:
- `role` = `'lawyer'`
- `lawyer_id` = lawyer's ID
- `email` = lawyer's email

## Email Integration

The email utility (`lib/email.ts`) currently logs emails in development mode. To send actual emails in production:

### Option 1: Resend (Recommended)
```typescript
import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
```

### Option 2: SendGrid
```typescript
import sgMail from '@sendgrid/mail'
sgMail.setApiKey(process.env.SENDGRID_API_KEY)
```

### Option 3: AWS SES
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
```

## Security Features

1. **Token Expiration**: Tokens expire after 24 hours
2. **One-time Use**: Tokens are deleted after successful claim
3. **Email Verification**: Must verify email before claiming
4. **RLS Protection**: Claim tokens table protected by RLS
5. **Password Requirements**: Minimum 6 characters

## Testing

### Development Mode
In development, the verification link is logged to console:
```
=== CLAIM PROFILE VERIFICATION LINK ===
Email: lawyer@example.com
Link: http://localhost:3001/claim-profile?token=...
Token: ...
========================================
```

### Test Flow
1. Ensure a lawyer exists in database with email `test@example.com`
2. Visit `/claim-profile`
3. Enter email
4. Check console for verification link (dev mode)
5. Click link or visit with token
6. Create password
7. Should redirect to `/admin/directory/lawyers/{id}`

## Error Handling

- **Email not found**: "No lawyer profile found with this email address"
- **Already claimed**: "This profile has already been claimed. Please log in instead."
- **Invalid token**: "Invalid or expired verification link"
- **Expired token**: "Verification link has expired. Please request a new one."

## Future Enhancements

- [ ] Rate limiting on email requests
- [ ] Resend verification email option
- [ ] Email template customization
- [ ] Admin notification when profile is claimed
- [ ] Claim history/audit log

## Access Points

- Footer link: "Claim Your Profile" in About section
- Direct URL: `/claim-profile`
- For Lawyers page: Can link from `/for-lawyers`



