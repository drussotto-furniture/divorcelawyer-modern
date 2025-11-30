/**
 * Quick script to add drussotto@hotmail.com as a test lawyer
 * Run with: node scripts/add-drussotto-lawyer.js
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

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addTestLawyer() {
  console.log('🚀 Adding test lawyer...\n')

  // Get or create test law firm
  let { data: lawFirms } = await supabaseAdmin
    .from('law_firms')
    .select('id')
    .eq('slug', 'test-law-firm')
    .limit(1)

  let testLawFirmId = lawFirms?.[0]?.id

  if (!testLawFirmId) {
    // Get first city
    const { data: cities } = await supabaseAdmin
      .from('cities')
      .select('id')
      .limit(1)

    if (!cities || cities.length === 0) {
      console.error('❌ No cities found. Please seed cities first.')
      process.exit(1)
    }

    console.log('📝 Creating test law firm...')
    const { data: newFirm, error: firmError } = await supabaseAdmin
      .from('law_firms')
      .insert({
        name: 'Test Law Firm',
        slug: 'test-law-firm',
        description: 'Test law firm for admin testing',
        city_id: cities[0].id,
        phone: '(555) 123-4567',
        email: 'test@testlawfirm.com',
        verified: true
      })
      .select('id')
      .single()

    if (firmError) {
      console.error('❌ Error creating law firm:', firmError)
      process.exit(1)
    }
    testLawFirmId = newFirm.id
    console.log('✅ Test law firm created:', testLawFirmId)
  } else {
    console.log('✅ Using existing test law firm:', testLawFirmId)
  }

  // Check if lawyer already exists
  const { data: existingLawyer } = await supabaseAdmin
    .from('lawyers')
    .select('id, first_name, last_name, email')
    .eq('email', 'drussotto@hotmail.com')
    .single()

  let lawyerId

  if (existingLawyer) {
    console.log('📝 Updating existing lawyer...')
    const { error: updateError } = await supabaseAdmin
      .from('lawyers')
      .update({
        law_firm_id: testLawFirmId,
        first_name: 'Dan',
        last_name: 'Russotto',
        slug: 'dan-russotto',
        title: 'Test Attorney',
        bio: 'Test lawyer profile for testing the claim profile functionality.',
        phone: '(555) 987-6543',
        verified: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingLawyer.id)

    if (updateError) {
      console.error('❌ Error updating lawyer:', updateError)
      process.exit(1)
    }
    lawyerId = existingLawyer.id
    console.log('✅ Lawyer updated:', lawyerId)
  } else {
    console.log('📝 Creating new lawyer...')
    const { data: newLawyer, error: lawyerError } = await supabaseAdmin
      .from('lawyers')
      .insert({
        first_name: 'Dan',
        last_name: 'Russotto',
        slug: 'dan-russotto',
        law_firm_id: testLawFirmId,
        title: 'Test Attorney',
        bio: 'Test lawyer profile for testing the claim profile functionality. This profile can be claimed using the email drussotto@hotmail.com.',
        email: 'drussotto@hotmail.com',
        phone: '(555) 987-6543',
        bar_number: 'TEST-12345',
        years_experience: 10,
        specializations: ['Divorce', 'Family Law', 'Child Custody'],
        education: ['Juris Doctor, Test Law School'],
        bar_admissions: ['Georgia'],
        awards: ['Test Award 2024'],
        rating: 4.5,
        review_count: 25,
        verified: true,
        featured: false
      })
      .select('id')
      .single()

    if (lawyerError) {
      console.error('❌ Error creating lawyer:', lawyerError)
      process.exit(1)
    }
    lawyerId = newLawyer.id
    console.log('✅ Lawyer created:', lawyerId)
  }

  // Add service area if cities exist
  const { data: cities } = await supabaseAdmin
    .from('cities')
    .select('id')
    .limit(1)

  if (cities && cities.length > 0) {
    const { error: serviceAreaError } = await supabaseAdmin
      .from('lawyer_service_areas')
      .insert({
        lawyer_id: lawyerId,
        city_id: cities[0].id
      })
      .select()

    if (serviceAreaError && serviceAreaError.code !== '23505') { // Ignore duplicate key errors
      console.log('⚠️  Could not add service area:', serviceAreaError.message)
    } else {
      console.log('✅ Added service area')
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('✅ TEST LAWYER READY')
  console.log('='.repeat(50))
  console.log('\nEmail: drussotto@hotmail.com')
  console.log('Name: Dan Russotto')
  console.log('Law Firm: Test Law Firm')
  console.log('Lawyer ID:', lawyerId)
  console.log('\nYou can now test the claim profile flow at:')
  console.log('http://localhost:3001/claim-profile')
  console.log('\n')
}

addTestLawyer().catch(console.error)

