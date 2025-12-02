import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: NextRequest) {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if states already exist (force check, don't skip)
    const { data: existingStates, error: checkError } = await supabase
      .from('states')
      .select('id, name, abbreviation')
      .limit(5)

    if (checkError) {
      console.error('Error checking states:', checkError)
      return NextResponse.json(
        { error: 'Failed to check states table', details: checkError.message },
        { status: 500 }
      )
    }

    console.log('Existing states count:', existingStates?.length || 0)
    
    // Always upsert (insert or update) to ensure correct data
    // This will update existing states and insert missing ones

    // Insert all US states
    const states = [
      { name: 'Alabama', slug: 'alabama', abbreviation: 'AL' },
      { name: 'Alaska', slug: 'alaska', abbreviation: 'AK' },
      { name: 'Arizona', slug: 'arizona', abbreviation: 'AZ' },
      { name: 'Arkansas', slug: 'arkansas', abbreviation: 'AR' },
      { name: 'California', slug: 'california', abbreviation: 'CA' },
      { name: 'Colorado', slug: 'colorado', abbreviation: 'CO' },
      { name: 'Connecticut', slug: 'connecticut', abbreviation: 'CT' },
      { name: 'Delaware', slug: 'delaware', abbreviation: 'DE' },
      { name: 'Florida', slug: 'florida', abbreviation: 'FL' },
      { name: 'Georgia', slug: 'georgia', abbreviation: 'GA' },
      { name: 'Hawaii', slug: 'hawaii', abbreviation: 'HI' },
      { name: 'Idaho', slug: 'idaho', abbreviation: 'ID' },
      { name: 'Illinois', slug: 'illinois', abbreviation: 'IL' },
      { name: 'Indiana', slug: 'indiana', abbreviation: 'IN' },
      { name: 'Iowa', slug: 'iowa', abbreviation: 'IA' },
      { name: 'Kansas', slug: 'kansas', abbreviation: 'KS' },
      { name: 'Kentucky', slug: 'kentucky', abbreviation: 'KY' },
      { name: 'Louisiana', slug: 'louisiana', abbreviation: 'LA' },
      { name: 'Maine', slug: 'maine', abbreviation: 'ME' },
      { name: 'Maryland', slug: 'maryland', abbreviation: 'MD' },
      { name: 'Massachusetts', slug: 'massachusetts', abbreviation: 'MA' },
      { name: 'Michigan', slug: 'michigan', abbreviation: 'MI' },
      { name: 'Minnesota', slug: 'minnesota', abbreviation: 'MN' },
      { name: 'Mississippi', slug: 'mississippi', abbreviation: 'MS' },
      { name: 'Missouri', slug: 'missouri', abbreviation: 'MO' },
      { name: 'Montana', slug: 'montana', abbreviation: 'MT' },
      { name: 'Nebraska', slug: 'nebraska', abbreviation: 'NE' },
      { name: 'Nevada', slug: 'nevada', abbreviation: 'NV' },
      { name: 'New Hampshire', slug: 'new-hampshire', abbreviation: 'NH' },
      { name: 'New Jersey', slug: 'new-jersey', abbreviation: 'NJ' },
      { name: 'New Mexico', slug: 'new-mexico', abbreviation: 'NM' },
      { name: 'New York', slug: 'new-york', abbreviation: 'NY' },
      { name: 'North Carolina', slug: 'north-carolina', abbreviation: 'NC' },
      { name: 'North Dakota', slug: 'north-dakota', abbreviation: 'ND' },
      { name: 'Ohio', slug: 'ohio', abbreviation: 'OH' },
      { name: 'Oklahoma', slug: 'oklahoma', abbreviation: 'OK' },
      { name: 'Oregon', slug: 'oregon', abbreviation: 'OR' },
      { name: 'Pennsylvania', slug: 'pennsylvania', abbreviation: 'PA' },
      { name: 'Rhode Island', slug: 'rhode-island', abbreviation: 'RI' },
      { name: 'South Carolina', slug: 'south-carolina', abbreviation: 'SC' },
      { name: 'South Dakota', slug: 'south-dakota', abbreviation: 'SD' },
      { name: 'Tennessee', slug: 'tennessee', abbreviation: 'TN' },
      { name: 'Texas', slug: 'texas', abbreviation: 'TX' },
      { name: 'Utah', slug: 'utah', abbreviation: 'UT' },
      { name: 'Vermont', slug: 'vermont', abbreviation: 'VT' },
      { name: 'Virginia', slug: 'virginia', abbreviation: 'VA' },
      { name: 'Washington', slug: 'washington', abbreviation: 'WA' },
      { name: 'West Virginia', slug: 'west-virginia', abbreviation: 'WV' },
      { name: 'Wisconsin', slug: 'wisconsin', abbreviation: 'WI' },
      { name: 'Wyoming', slug: 'wyoming', abbreviation: 'WY' },
      { name: 'District of Columbia', slug: 'district-of-columbia', abbreviation: 'DC' }
    ]

    // Use upsert to update existing states and insert new ones
    // Match on slug (which should be unique)
    const { data, error } = await (supabase as any)
      .from('states')
      .upsert(states.map(state => ({
        ...state,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })), {
        onConflict: 'slug',
        ignoreDuplicates: false
      })
      .select()

    if (error) {
      console.error('Error inserting states:', error)
      return NextResponse.json(
        { error: 'Failed to insert states', details: error.message },
        { status: 500 }
      )
    }

    // Also add public read policy if it doesn't exist
    // Note: This requires running the migration 056_add_public_read_states.sql
    // The policy creation is done via migration, not here, to avoid permission issues

    return NextResponse.json({
      message: `Successfully inserted ${data?.length || states.length} states`,
      count: data?.length || states.length,
      action: 'inserted'
    })
  } catch (error: any) {
    console.error('Error in populate-states API:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to populate states' },
      { status: 500 }
    )
  }
}

