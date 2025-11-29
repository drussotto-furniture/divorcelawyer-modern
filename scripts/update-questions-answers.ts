/**
 * Script to update questions with answer data from excerpt field
 * The original migration used item.content which was empty,
 * but the actual answer is in item.excerpt
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load environment variables - try .env.local first (Next.js convention), then .env
config({ path: '.env.local' })
config() // .env will override .env.local values if both exist

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface QuestionItem {
  title: string
  post_name: string
  excerpt: string
  content: string
}

async function updateQuestionsAnswers() {
  console.log('📝 Updating questions with answer data from excerpts...\n')

  // Load questions JSON
  const questionsPath = path.join(process.cwd(), 'output', 'questions.json')
  const questionsData: QuestionItem[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'))

  console.log(`Found ${questionsData.length} questions in JSON file\n`)

  let updated = 0
  let skipped = 0
  let errors = 0

  for (const item of questionsData) {
    try {
      // Use excerpt if content is empty, otherwise use content
      const answer = item.excerpt || item.content

      if (!answer || answer.trim() === '') {
        console.log(`⚠️  Skipping "${item.title}" - no answer data`)
        skipped++
        continue
      }

      // Find the question by slug
      const { data: existingQuestion, error: findError } = await supabase
        .from('questions')
        .select('id, question, answer')
        .eq('slug', item.post_name)
        .single()

      if (findError || !existingQuestion) {
        console.log(`⚠️  Question not found: ${item.post_name}`)
        skipped++
        continue
      }

      // Check if answer is already populated
      if (existingQuestion.answer && existingQuestion.answer.trim() !== '') {
        console.log(`✓ Already has answer: "${item.title}"`)
        skipped++
        continue
      }

      // Update the question with the answer
      const { error: updateError } = await supabase
        .from('questions')
        .update({ answer: answer.trim() })
        .eq('id', existingQuestion.id)

      if (updateError) {
        console.error(`❌ Error updating "${item.title}":`, updateError.message)
        errors++
      } else {
        console.log(`✓ Updated: "${item.title}"`)
        updated++
      }
    } catch (error) {
      console.error(`❌ Error processing "${item.title}":`, error)
      errors++
    }
  }

  console.log(`\n✅ Complete!`)
  console.log(`   Updated: ${updated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)
}

updateQuestionsAnswers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })

