/**
 * Script to create test users for admin panel
 * 
 * This script creates 3 test users:
 * 1. Super Admin (admin@divorcelawyer.com) - Full admin access
 * 2. Lawyer (lawyer@divorcelawyer.com) - Own profile only
 * 3. Law Firm Admin (lawfirm@divorcelawyer.com) - Law firm admin page
 * 
 * Run with: node scripts/create-test-users.js
 * 
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌')
  console.error('\nPlease add these to your .env.local file')
  process.exit(1)
}

// Create admin client (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUsers() {
  console.log('🚀 Creating test users...\n')

  // Get or create a test law firm
  let { data: lawFirms } = await supabaseAdmin
    .from('law_firms')
    .select('id')
    .limit(1)

  let testLawFirmId = lawFirms?.[0]?.id

  if (!testLawFirmId) {
    console.log('📝 Creating test law firm...')
    const { data: newFirm, error: firmError } = await supabaseAdmin
      .from('law_firms')
      .insert({
        name: 'Test Law Firm',
        slug: 'test-law-firm',
        description: 'Test law firm for admin testing'
      })
      .select('id')
      .single()

    if (firmError) {
      console.error('❌ Error creating law firm:', firmError)
      return
    }
    testLawFirmId = newFirm.id
    console.log('✅ Test law firm created:', testLawFirmId)
  } else {
    console.log('✅ Using existing law firm:', testLawFirmId)
  }

  // Get or create a test lawyer
  let { data: lawyers } = await supabaseAdmin
    .from('lawyers')
    .select('id')
    .eq('law_firm_id', testLawFirmId)
    .limit(1)

  let testLawyerId = lawyers?.[0]?.id

  if (!testLawyerId) {
    console.log('📝 Creating test lawyer...')
    const { data: newLawyer, error: lawyerError } = await supabaseAdmin
      .from('lawyers')
      .insert({
        first_name: 'Test',
        last_name: 'Lawyer',
        slug: 'test-lawyer',
        law_firm_id: testLawFirmId,
        title: 'Test Attorney',
        bio: 'Test lawyer profile for admin testing',
        email: 'test.lawyer@example.com',
        phone: '555-0100'
      })
      .select('id')
      .single()

    if (lawyerError) {
      console.error('❌ Error creating lawyer:', lawyerError)
      return
    }
    testLawyerId = newLawyer.id
    console.log('✅ Test lawyer created:', testLawyerId)
  } else {
    console.log('✅ Using existing lawyer:', testLawyerId)
  }

  const users = [
    {
      email: 'admin@divorcelawyer.com',
      password: 'Admin123!',
      role: 'super_admin',
      name: 'Super Admin',
      description: 'Full admin panel access'
    },
    {
      email: 'lawyer@divorcelawyer.com',
      password: 'Lawyer123!',
      role: 'lawyer',
      name: 'Test Lawyer',
      lawyer_id: testLawyerId,
      description: 'Own profile only'
    },
    {
      email: 'lawfirm@divorcelawyer.com',
      password: 'LawFirm123!',
      role: 'law_firm',
      name: 'Law Firm Admin',
      law_firm_id: testLawFirmId,
      description: 'Law firm admin page'
    }
  ]

  for (const user of users) {
    console.log(`\n📝 Creating user: ${user.email}...`)

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(user.email)

    let userId

    if (existingUser?.user) {
      console.log(`   ⚠️  User already exists, updating...`)
      userId = existingUser.user.id

      // Update password
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: user.password
      })
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true
      })

      if (createError) {
        console.error(`   ❌ Error creating user:`, createError.message)
        continue
      }

      userId = newUser.user.id
      console.log(`   ✅ User created: ${userId}`)
    }

    // Create or update profile
    const profileData = {
      id: userId,
      email: user.email,
      role: user.role,
      name: user.name
    }

    if (user.lawyer_id) {
      profileData.lawyer_id = user.lawyer_id
    }
    if (user.law_firm_id) {
      profileData.law_firm_id = user.law_firm_id
    }

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(profileData, { onConflict: 'id' })

    if (profileError) {
      console.error(`   ❌ Error creating profile:`, profileError.message)
      continue
    }

    console.log(`   ✅ Profile created/updated`)
    console.log(`   📧 Email: ${user.email}`)
    console.log(`   🔑 Password: ${user.password}`)
    console.log(`   👤 Role: ${user.role}`)
    console.log(`   📋 Access: ${user.description}`)
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ TEST USERS CREATED SUCCESSFULLY')
  console.log('='.repeat(50))
  console.log('\n1. Super Admin:')
  console.log('   Email: admin@divorcelawyer.com')
  console.log('   Password: Admin123!')
  console.log('   Access: Full admin panel')
  console.log('\n2. Lawyer:')
  console.log('   Email: lawyer@divorcelawyer.com')
  console.log('   Password: Lawyer123!')
  console.log('   Access: Own profile only')
  console.log('\n3. Law Firm Admin:')
  console.log('   Email: lawfirm@divorcelawyer.com')
  console.log('   Password: LawFirm123!')
  console.log('   Access: Law firm admin page')
  console.log('\n')
}

createTestUsers().catch(console.error)



