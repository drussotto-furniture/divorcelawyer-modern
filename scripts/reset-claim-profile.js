/**
 * Reset Claim Profile - Remove user account and profile to allow re-claiming
 * 
 * This script removes the user account and profile for a given email,
 * allowing the lawyer to claim their profile again for testing purposes.
 * 
 * Usage: node scripts/reset-claim-profile.js <email>
 * Example: node scripts/reset-claim-profile.js drussotto@hotmail.com
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: { 'x-client-info': 'reset-claim-profile-script' },
  },
})

async function resetClaimProfile(email) {
  console.log(`\n🔄 Resetting claim profile for: ${email}\n`)

  try {
    // Step 1: Find the user in auth.users
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message)
      return false
    }

    const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

    if (!user) {
      console.log('ℹ️  No user account found with this email. Nothing to reset.')
      return true
    }

    console.log(`✅ Found user account: ${user.id}`)

    // Step 2: Delete the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileError) {
      console.error('⚠️  Error deleting profile:', profileError.message)
    } else {
      console.log('✅ Profile deleted')
    }

    // Step 3: Delete any claim tokens for this email
    const { error: tokenError } = await supabaseAdmin
      .from('claim_tokens')
      .delete()
      .eq('email', email.toLowerCase())

    if (tokenError) {
      console.error('⚠️  Error deleting claim tokens:', tokenError.message)
    } else {
      console.log('✅ Claim tokens deleted')
    }

    // Step 4: Delete the user account
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError.message)
      return false
    }

    console.log('✅ User account deleted')
    console.log('\n' + '='.repeat(50))
    console.log('✅ CLAIM PROFILE RESET SUCCESSFULLY')
    console.log('='.repeat(50))
    console.log(`\n📧 Email: ${email}`)
    console.log('🔄 You can now claim this profile again!')
    console.log('\nNext steps:')
    console.log('1. Go to http://localhost:3001/claim-profile')
    console.log(`2. Enter email: ${email}`)
    console.log('3. Click "Send Verification Email"')
    console.log('4. Complete the claim process\n')

    return true
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    return false
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.error('❌ Please provide an email address')
  console.error('Usage: node scripts/reset-claim-profile.js <email>')
  console.error('Example: node scripts/reset-claim-profile.js drussotto@hotmail.com')
  process.exit(1)
}

// Run the reset
resetClaimProfile(email)
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

