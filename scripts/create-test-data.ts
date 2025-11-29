/**
 * Create test data for Law Firm and Lawyer with all fields populated
 * This helps verify that all form fields are working correctly
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config({ path: '.env.local' })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

async function createTestData() {
  console.log('\n🧪 Creating Test Data...\n')
  console.log('='.repeat(80))
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...')
  console.log('Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
  console.log('='.repeat(80))

  try {
    // First, get a city to use for the law firm
    const { data: cities } = await supabase
      .from('cities')
      .select('id, name')
      .limit(1)

    if (!cities || cities.length === 0) {
      console.error('❌ No cities found. Please ensure cities are seeded first.')
      process.exit(1)
    }

    const cityId = cities[0].id
    console.log(`✓ Using city: ${cities[0].name} (${cityId})`)

    // Create TEST Law Firm with ALL fields populated
    console.log('\n📋 Creating TEST Law Firm...')
    const { data: testFirm, error: firmError } = await supabase
      .from('law_firms')
      .insert({
        name: 'TEST Law Firm',
        slug: 'test-law-firm',
        description: 'This is a comprehensive test law firm description. It includes multiple sentences to test the description field. The firm specializes in family law and divorce cases, with extensive experience in high-net-worth divorces, child custody disputes, and complex property division matters.',
        content: '<p>This is the HTML content for TEST Law Firm. It can contain rich formatting and multiple paragraphs.</p><p>This content is typically managed by super admins and may include detailed firm information, history, and other important details.</p>',
        address: '123 Test Street, Suite 100',
        city_id: cityId,
        phone: '(555) 123-4567',
        email: 'test@testlawfirm.com',
        website: 'https://www.testlawfirm.com',
        logo_url: 'https://via.placeholder.com/200x100?text=TEST+Law+Firm',
        linkedin_url: 'https://www.linkedin.com/company/test-law-firm',
        facebook_url: 'https://www.facebook.com/testlawfirm',
        twitter_url: 'https://www.twitter.com/testlawfirm',
        founded_year: 2010,
        firm_size: 'Medium (10-50 attorneys)',
        practice_areas: [
          'Divorce',
          'Family Law',
          'Child Custody',
          'Child Support',
          'Alimony/Spousal Support',
          'Property Division',
          'High Asset Divorce',
          'Mediation',
          'Collaborative Divorce'
        ],
        rating: 4.8,
        review_count: 127,
        verified: true,
        featured: true,
        meta_title: 'TEST Law Firm - Expert Family Law Attorneys | Divorce Lawyers',
        meta_description: 'TEST Law Firm provides expert family law and divorce representation. Our experienced attorneys handle complex cases including high-net-worth divorces, child custody, and property division.',
      })
      .select()
      .single()

    if (firmError) {
      console.error('❌ Error creating law firm:', firmError)
      throw firmError
    }

    console.log(`✓ Created TEST Law Firm: ${testFirm.id}`)
    console.log(`  Name: ${testFirm.name}`)
    console.log(`  Slug: ${testFirm.slug}`)

    // Create TEST Lawyer with ALL fields populated
    console.log('\n👨‍⚖️ Creating TEST Lawyer...')
    const { data: testLawyer, error: lawyerError } = await supabase
      .from('lawyers')
      .insert({
        first_name: 'TEST',
        last_name: 'Lawyer',
        slug: 'test-lawyer',
        law_firm_id: testFirm.id,
        title: 'Senior Partner & Divorce Attorney',
        bio: 'TEST Lawyer is a highly experienced family law attorney with over 15 years of practice. Specializing in complex divorce cases, high-net-worth divorces, and child custody disputes. TEST Lawyer has successfully represented hundreds of clients and is known for a collaborative yet assertive approach to family law matters. With a strong track record of favorable outcomes, TEST Lawyer combines legal expertise with compassionate client service.',
        photo_url: 'https://via.placeholder.com/300x400?text=TEST+Lawyer',
        email: 'test.lawyer@testlawfirm.com',
        phone: '(555) 987-6543',
        bar_number: 'GA-12345',
        years_experience: 15,
        specializations: [
          'Divorce',
          'Family Law',
          'Child Custody',
          'Child Support',
          'Alimony/Spousal Support',
          'Property Division',
          'High Asset Divorce',
          'Prenuptial Agreements',
          'Postnuptial Agreements',
          'Mediation',
          'Collaborative Divorce'
        ],
        education: [
          'Juris Doctor (J.D.), Harvard Law School, 2008',
          'Bachelor of Arts (B.A.) in Political Science, Yale University, 2005',
          'Magna Cum Laude, Dean\'s List'
        ],
        awards: [
          'Top 10 Attorney - Georgia, Super Lawyers (2020-2024)',
          'Georgia Super Lawyers Top 100 since 2018',
          'Martindale-Hubbell AV Peer Review Rated for Ethical Standards and Legal Ability',
          'Best Lawyers in America - Family Law (2019-2024)',
          'Atlanta Magazine Top Lawyers (2021-2024)'
        ],
        bar_admissions: [
          'State Bar of Georgia',
          'Supreme Court of the United States',
          'Supreme Court of Georgia',
          'U.S. District Court for the Northern District of Georgia',
          'U.S. Court of Appeals for the Eleventh Circuit'
        ],
        publications: [
          '"Arbitration and Family Law" - Atlanta Family Law Section Breakfast, 2023',
          '"Jury Charges Are Not Just for Jury Trials" - Annual State Bar of Georgia Family Law Institute, 2022',
          '"Managing Mental Chatter: How to Tame Worry and Rumination for You and Your Client During Litigation" - Georgia Chapter of American Academy of Matrimonial Lawyers, 2021',
          '"Complex Asset Division in High-Net-Worth Divorces" - Family Law Quarterly, 2020'
        ],
        professional_memberships: [
          'Fellow, American Academy of Matrimonial Lawyers',
          'Fellow, International Academy of Family Lawyers',
          'Former Chair, State Bar of Georgia Family Law Section',
          'Member, Atlanta Bar Association',
          'Member, Georgia Trial Lawyers Association'
        ],
        certifications: [
          'Board Certified Family Law Specialist - State Bar of Georgia',
          'Certified Divorce Financial Analyst (CDFA)',
          'Certified Mediator - Georgia Office of Dispute Resolution'
        ],
        languages: [
          'English',
          'Spanish',
          'French'
        ],
        linkedin_url: 'https://www.linkedin.com/in/testlawyer',
        twitter_url: 'https://www.twitter.com/testlawyer',
        practice_focus: 'TEST Lawyer exclusively practices family law with a focus on high-net-worth divorces, complex custody disputes, and collaborative divorce solutions. Known for strategic thinking and compassionate client representation.',
        approach: 'TEST Lawyer takes a collaborative yet assertive approach to family law cases. Emphasizing long-term thinking and helping clients make informed decisions based on where they see themselves three to five years from now. TEST Lawyer believes in educating clients throughout the process while maintaining a strong courtroom presence when necessary.',
        consultation_fee: '$300 for initial 1-hour consultation',
        accepts_new_clients: true,
        consultation_available: true,
        office_address: '123 Test Street, Suite 100, Atlanta, Georgia 30303',
        office_hours: 'Monday-Friday: 9:00 AM - 6:00 PM\nSaturday: By appointment only\nSunday: Closed',
        credentials_summary: 'TEST Lawyer is a Board Certified Family Law Specialist with over 15 years of experience. Recognized as a Top 10 Attorney in Georgia by Super Lawyers and rated AV Preeminent by Martindale-Hubbell. Fellow of the American Academy of Matrimonial Lawyers and former Chair of the State Bar of Georgia Family Law Section.',
        media_mentions: [
          'Featured in The New York Times - "Navigating High-Net-Worth Divorces", 2023',
          'Interview on CNN - "Family Law Trends in 2022", 2022',
          'Quoted in Forbes - "Protecting Assets in Divorce", 2021',
          'Featured in Atlanta Magazine - "Top Divorce Attorneys", 2020'
        ],
        speaking_engagements: [
          'Keynote Speaker, Family Law Conference, Atlanta, 2023',
          'Panelist, ABA Annual Meeting - "Complex Asset Division", 2022',
          'Presenter, State Bar of Georgia Family Law Institute, 2021',
          'Speaker, American Academy of Matrimonial Lawyers Annual Conference, 2020'
        ],
        rating: 4.9,
        review_count: 89,
        verified: true,
        featured: true,
        meta_title: 'TEST Lawyer - Expert Divorce & Family Law Attorney | TEST Law Firm',
        meta_description: 'TEST Lawyer is an experienced family law attorney specializing in high-net-worth divorces, child custody, and complex property division. Board certified and recognized as a Top 10 Attorney in Georgia.',
      })
      .select()
      .single()

    if (lawyerError) {
      console.error('❌ Error creating lawyer:', lawyerError)
      throw lawyerError
    }

    console.log(`✓ Created TEST Lawyer: ${testLawyer.id}`)
    console.log(`  Name: ${testLawyer.first_name} ${testLawyer.last_name}`)
    console.log(`  Slug: ${testLawyer.slug}`)
    console.log(`  Firm: ${testFirm.name}`)

    // Create service areas for the lawyer (link to cities)
    console.log('\n📍 Creating service areas for TEST Lawyer...')
    const { data: moreCities } = await supabase
      .from('cities')
      .select('id, name')
      .limit(5)

    if (moreCities && moreCities.length > 0) {
      const serviceAreaInserts = moreCities.map(city => ({
        lawyer_id: testLawyer.id,
        city_id: city.id,
      }))

      const { error: serviceAreaError } = await supabase
        .from('lawyer_service_areas')
        .insert(serviceAreaInserts)

      if (serviceAreaError) {
        console.warn('⚠️  Warning: Could not create service areas:', serviceAreaError.message)
      } else {
        console.log(`✓ Created ${serviceAreaInserts.length} service areas`)
        moreCities.forEach(city => {
          console.log(`  - ${city.name}`)
        })
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('✅ TEST DATA CREATED SUCCESSFULLY!')
    console.log('='.repeat(80))
    console.log('\n📝 Next Steps:')
    console.log(`   1. Go to: http://localhost:3001/admin/directory/law-firms/${testFirm.id}`)
    console.log(`   2. Go to: http://localhost:3001/admin/directory/lawyers/${testLawyer.id}`)
    console.log('   3. Verify all fields are populated and editable')
    console.log('\n')

  } catch (error: any) {
    console.error('\n❌ Error creating test data:', error)
    process.exit(1)
  }
}

createTestData()

