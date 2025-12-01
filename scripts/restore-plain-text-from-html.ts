/**
 * Script to restore plain text data from _html fields
 * This extracts plain text from HTML and populates the main fields
 * Only updates fields that are empty or null
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Strip HTML tags and decode entities to get plain text
 */
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  
  let text = html
  
  // Remove HTML comments
  text = text.replace(/<!--[\s\S]*?-->/g, '')
  
  // Remove script and style tags and their content
  text = text.replace(/<script[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, '')
  
  // Remove HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  
  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&') // Must be last
  
  // Normalize whitespace
  text = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
  
  return text
}

async function restoreLawyersBio() {
  console.log('📝 Restoring lawyer bio data from bio_html...\n')
  
  try {
    // Get all lawyers with bio_html but empty/null bio
    const { data: lawyers, error: fetchError } = await supabase
      .from('lawyers')
      .select('id, first_name, last_name, bio, bio_html')
      .not('bio_html', 'is', null)
    
    if (fetchError) throw fetchError
    
    if (!lawyers || lawyers.length === 0) {
      console.log('  ℹ️  No lawyers with bio_html found.')
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${lawyers.length} lawyers with bio_html`)
    
    let updated = 0
    let skipped = 0
    
    for (const lawyer of lawyers) {
      // Update if bio is empty/null, very short, has HTML tags, or if HTML version has more content
      const bioLength = lawyer.bio?.trim().length || 0
      const htmlLength = stripHtml(lawyer.bio_html || '').trim().length
      const hasHtmlTags = lawyer.bio && /<[^>]+>/.test(lawyer.bio)
      
      // Always update if HTML has substantial content (50+ chars) and is longer than current bio
      // Or if current bio is very short (< 50 chars) and HTML has more content
      const shouldUpdate = !lawyer.bio || bioLength < 50 || hasHtmlTags || (htmlLength > bioLength && htmlLength >= 50)
      
      if (shouldUpdate && lawyer.bio_html) {
        const plainText = stripHtml(lawyer.bio_html).trim()
        
        if (plainText.length > 0) {
          const { error: updateError } = await supabase
            .from('lawyers')
            .update({ bio: plainText })
            .eq('id', lawyer.id)
          
          if (updateError) {
            console.error(`  ❌ Error updating ${lawyer.first_name} ${lawyer.last_name}:`, updateError.message)
          } else {
            console.log(`  ✅ Updated ${lawyer.first_name} ${lawyer.last_name} (${bioLength} → ${plainText.length} chars)`)
            updated++
          }
        } else {
          console.log(`  ⏭️  Skipped ${lawyer.first_name} ${lawyer.last_name}: HTML stripped to empty`)
          skipped++
        }
      } else {
        console.log(`  ⏭️  Skipped ${lawyer.first_name} ${lawyer.last_name}: bio=${bioLength} chars, html=${htmlLength} chars`)
        skipped++
      }
    }
    
    console.log(`\n  ✓ Lawyers: ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error('❌ Error restoring lawyer bios:', error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreLawFirmsDescription() {
  console.log('🏢 Restoring law firm description data from description_html...\n')
  
  try {
    const { data: firms, error: fetchError } = await supabase
      .from('law_firms')
      .select('id, name, description, description_html')
      .not('description_html', 'is', null)
    
    if (fetchError) throw fetchError
    
    if (!firms || firms.length === 0) {
      console.log('  ℹ️  No law firms with description_html found.')
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${firms.length} law firms with description_html`)
    
    let updated = 0
    let skipped = 0
    
    for (const firm of firms) {
      const descLength = firm.description?.trim().length || 0
      const htmlLength = stripHtml(firm.description_html || '').trim().length
      const hasHtmlTags = firm.description && /<[^>]+>/.test(firm.description)
      
      // Always update if HTML has substantial content (50+ chars) and is longer than current description
      // Or if current description is very short (< 50 chars) and HTML has more content
      const shouldUpdate = !firm.description || descLength < 50 || hasHtmlTags || (htmlLength > descLength && htmlLength >= 50)
      
      if (shouldUpdate && firm.description_html) {
        const plainText = stripHtml(firm.description_html).trim()
        
        if (plainText.length > 0) {
          const { error: updateError } = await supabase
            .from('law_firms')
            .update({ description: plainText })
            .eq('id', firm.id)
          
          if (updateError) {
            console.error(`  ❌ Error updating ${firm.name}:`, updateError.message)
          } else {
            console.log(`  ✅ Updated ${firm.name} (${descLength} → ${plainText.length} chars)`)
            updated++
          }
        } else {
          console.log(`  ⏭️  Skipped ${firm.name}: HTML stripped to empty`)
          skipped++
        }
      } else {
        console.log(`  ⏭️  Skipped ${firm.name}: description=${descLength} chars, html=${htmlLength} chars`)
        skipped++
      }
    }
    
    console.log(`\n  ✓ Law Firms (description): ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error('❌ Error restoring law firm descriptions:', error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreLawFirmsContent() {
  console.log('🏢 Restoring law firm content data from content_html...\n')
  
  try {
    const { data: firms, error: fetchError } = await supabase
      .from('law_firms')
      .select('id, name, content, content_html')
      .not('content_html', 'is', null)
    
    if (fetchError) throw fetchError
    
    if (!firms || firms.length === 0) {
      console.log('  ℹ️  No law firms with content_html found.')
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${firms.length} law firms with content_html`)
    
    let updated = 0
    let skipped = 0
    
    for (const firm of firms) {
      const contentLength = firm.content?.trim().length || 0
      const htmlLength = stripHtml(firm.content_html || '').trim().length
      const hasHtmlTags = firm.content && /<[^>]+>/.test(firm.content)
      
      // Always update if HTML has substantial content (50+ chars) and is longer than current content
      // Or if current content is very short (< 50 chars) and HTML has more content
      const shouldUpdate = !firm.content || contentLength < 50 || hasHtmlTags || (htmlLength > contentLength && htmlLength >= 50)
      
      if (shouldUpdate && firm.content_html) {
        const plainText = stripHtml(firm.content_html).trim()
        
        if (plainText.length > 0) {
          const { error: updateError } = await supabase
            .from('law_firms')
            .update({ content: plainText })
            .eq('id', firm.id)
          
          if (updateError) {
            console.error(`  ❌ Error updating ${firm.name}:`, updateError.message)
          } else {
            console.log(`  ✅ Updated ${firm.name} (${contentLength} → ${plainText.length} chars)`)
            updated++
          }
        } else {
          console.log(`  ⏭️  Skipped ${firm.name}: HTML stripped to empty`)
          skipped++
        }
      } else {
        console.log(`  ⏭️  Skipped ${firm.name}: content=${contentLength} chars, html=${htmlLength} chars`)
        skipped++
      }
    }
    
    console.log(`\n  ✓ Law Firms (content): ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error('❌ Error restoring law firm content:', error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreArticlesContent() {
  console.log('📄 Restoring article content from content_html...\n')
  
  try {
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, content, content_html')
      .not('content_html', 'is', null)
    
    if (fetchError) throw fetchError
    
    if (!articles || articles.length === 0) {
      console.log('  ℹ️  No articles with content_html found.')
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${articles.length} articles with content_html`)
    
    let updated = 0
    let skipped = 0
    
    for (const article of articles) {
      const contentLength = article.content?.trim().length || 0
      const htmlLength = stripHtml(article.content_html || '').length
      const hasHtmlTags = article.content && /<[^>]+>/.test(article.content)
      
      const shouldUpdate = !article.content || contentLength < 10 || hasHtmlTags || (htmlLength > contentLength * 1.5)
      
      if (shouldUpdate && article.content_html) {
        const plainText = stripHtml(article.content_html)
        
        if (plainText.length > 0) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ content: plainText })
            .eq('id', article.id)
          
          if (updateError) {
            console.error(`  ❌ Error updating ${article.title}:`, updateError.message)
          } else {
            console.log(`  ✅ Updated ${article.title} (${plainText.length} chars)`)
            updated++
          }
        } else {
          skipped++
        }
      } else {
        skipped++
      }
    }
    
    console.log(`\n  ✓ Articles (content): ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error('❌ Error restoring article content:', error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreArticlesExcerpt() {
  console.log('📄 Restoring article excerpt from excerpt_html...\n')
  
  try {
    const { data: articles, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, excerpt, excerpt_html')
      .not('excerpt_html', 'is', null)
    
    if (fetchError) throw fetchError
    
    if (!articles || articles.length === 0) {
      console.log('  ℹ️  No articles with excerpt_html found.')
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${articles.length} articles with excerpt_html`)
    
    let updated = 0
    let skipped = 0
    
    for (const article of articles) {
      const excerptLength = article.excerpt?.trim().length || 0
      const htmlLength = stripHtml(article.excerpt_html || '').length
      const hasHtmlTags = article.excerpt && /<[^>]+>/.test(article.excerpt)
      
      const shouldUpdate = !article.excerpt || excerptLength < 10 || hasHtmlTags || (htmlLength > excerptLength * 1.5)
      
      if (shouldUpdate && article.excerpt_html) {
        const plainText = stripHtml(article.excerpt_html)
        
        if (plainText.length > 0) {
          const { error: updateError } = await supabase
            .from('articles')
            .update({ excerpt: plainText })
            .eq('id', article.id)
          
          if (updateError) {
            console.error(`  ❌ Error updating ${article.title}:`, updateError.message)
          } else {
            console.log(`  ✅ Updated ${article.title} (${plainText.length} chars)`)
            updated++
          }
        } else {
          skipped++
        }
      } else {
        skipped++
      }
    }
    
    console.log(`\n  ✓ Articles (excerpt): ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error('❌ Error restoring article excerpts:', error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreLocationsContent(tableName: string, displayName: string) {
  console.log(`📍 Restoring ${displayName} content from content_html...\n`)
  
  try {
    const { data: locations, error: fetchError } = await supabase
      .from(tableName)
      .select('id, name, content, content_html')
      .not('content_html', 'is', null)
    
    if (fetchError) throw fetchError
    
    if (!locations || locations.length === 0) {
      console.log(`  ℹ️  No ${displayName} with content_html found.`)
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${locations.length} ${displayName} with content_html`)
    
    let updated = 0
    let skipped = 0
    
    for (const location of locations) {
      const contentLength = location.content?.trim().length || 0
      const htmlLength = stripHtml(location.content_html || '').length
      const hasHtmlTags = location.content && /<[^>]+>/.test(location.content)
      
      const shouldUpdate = !location.content || contentLength < 10 || hasHtmlTags || (htmlLength > contentLength * 1.5)
      
      if (shouldUpdate && location.content_html) {
        const plainText = stripHtml(location.content_html)
        
        if (plainText.length > 0) {
          const { error: updateError } = await supabase
            .from(tableName)
            .update({ content: plainText })
            .eq('id', location.id)
          
          if (updateError) {
            console.error(`  ❌ Error updating ${location.name}:`, updateError.message)
          } else {
            console.log(`  ✅ Updated ${location.name} (${plainText.length} chars)`)
            updated++
          }
        } else {
          skipped++
        }
      } else {
        skipped++
      }
    }
    
    console.log(`\n  ✓ ${displayName}: ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error(`❌ Error restoring ${displayName} content:`, error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreStagesData() {
  console.log('📋 Restoring stage description and content...\n')
  
  try {
    const { data: stages, error: fetchError } = await supabase
      .from('stages')
      .select('id, name, description, description_html, content, content_html')
      .or('description_html.not.is.null,content_html.not.is.null')
    
    if (fetchError) throw fetchError
    
    if (!stages || stages.length === 0) {
      console.log('  ℹ️  No stages with HTML fields found.')
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${stages.length} stages with HTML fields`)
    
    let updated = 0
    let skipped = 0
    
    for (const stage of stages) {
      const updates: any = {}
      let hasUpdates = false
      
      if (stage.description_html) {
        const descLength = stage.description?.trim().length || 0
        const htmlLength = stripHtml(stage.description_html).length
        const hasHtmlTags = stage.description && /<[^>]+>/.test(stage.description)
        const shouldUpdate = !stage.description || descLength < 10 || hasHtmlTags || (htmlLength > descLength * 1.5)
        
        if (shouldUpdate) {
          const plainText = stripHtml(stage.description_html)
          if (plainText.length > 0) {
            updates.description = plainText
            hasUpdates = true
          }
        }
      }
      
      if (stage.content_html) {
        const contentLength = stage.content?.trim().length || 0
        const htmlLength = stripHtml(stage.content_html).length
        const hasHtmlTags = stage.content && /<[^>]+>/.test(stage.content)
        const shouldUpdate = !stage.content || contentLength < 10 || hasHtmlTags || (htmlLength > contentLength * 1.5)
        
        if (shouldUpdate) {
          const plainText = stripHtml(stage.content_html)
          if (plainText.length > 0) {
            updates.content = plainText
            hasUpdates = true
          }
        }
      }
      
      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('stages')
          .update(updates)
          .eq('id', stage.id)
        
        if (updateError) {
          console.error(`  ❌ Error updating ${stage.name}:`, updateError.message)
        } else {
          console.log(`  ✅ Updated ${stage.name}`)
          updated++
        }
      } else {
        skipped++
      }
    }
    
    console.log(`\n  ✓ Stages: ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error('❌ Error restoring stages:', error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreTeamMembersBio() {
  console.log('👥 Restoring team member bio from bio_html...\n')
  
  try {
    const { data: members, error: fetchError } = await supabase
      .from('team_members')
      .select('id, name, bio, bio_html')
      .not('bio_html', 'is', null)
    
    if (fetchError) throw fetchError
    
    if (!members || members.length === 0) {
      console.log('  ℹ️  No team members with bio_html found.')
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${members.length} team members with bio_html`)
    
    let updated = 0
    let skipped = 0
    
    for (const member of members) {
      const bioLength = member.bio?.trim().length || 0
      const htmlLength = stripHtml(member.bio_html || '').length
      const hasHtmlTags = member.bio && /<[^>]+>/.test(member.bio)
      
      const shouldUpdate = !member.bio || bioLength < 10 || hasHtmlTags || (htmlLength > bioLength * 1.5)
      
      if (shouldUpdate && member.bio_html) {
        const plainText = stripHtml(member.bio_html)
        
        if (plainText.length > 0) {
          const { error: updateError } = await supabase
            .from('team_members')
            .update({ bio: plainText })
            .eq('id', member.id)
          
          if (updateError) {
            console.error(`  ❌ Error updating ${member.name}:`, updateError.message)
          } else {
            console.log(`  ✅ Updated ${member.name} (${plainText.length} chars)`)
            updated++
          }
        } else {
          skipped++
        }
      } else {
        skipped++
      }
    }
    
    console.log(`\n  ✓ Team Members: ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error('❌ Error restoring team member bios:', error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreQuestionsData() {
  console.log('❓ Restoring question and answer data...\n')
  
  try {
    const { data: questions, error: fetchError } = await supabase
      .from('questions')
      .select('id, question, question_html, answer, answer_html')
      .or('question_html.not.is.null,answer_html.not.is.null')
    
    if (fetchError) throw fetchError
    
    if (!questions || questions.length === 0) {
      console.log('  ℹ️  No questions with HTML fields found.')
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${questions.length} questions with HTML fields`)
    
    let updated = 0
    let skipped = 0
    
    for (const question of questions) {
      const updates: any = {}
      let hasUpdates = false
      
      if (question.question_html) {
        const questionLength = question.question?.trim().length || 0
        const htmlLength = stripHtml(question.question_html).length
        const hasHtmlTags = question.question && /<[^>]+>/.test(question.question)
        const shouldUpdate = !question.question || questionLength < 10 || hasHtmlTags || (htmlLength > questionLength * 1.5)
        
        if (shouldUpdate) {
          const plainText = stripHtml(question.question_html)
          if (plainText.length > 0) {
            updates.question = plainText
            hasUpdates = true
          }
        }
      }
      
      if (question.answer_html) {
        const answerLength = question.answer?.trim().length || 0
        const htmlLength = stripHtml(question.answer_html).length
        const hasHtmlTags = question.answer && /<[^>]+>/.test(question.answer)
        const shouldUpdate = !question.answer || answerLength < 10 || hasHtmlTags || (htmlLength > answerLength * 1.5)
        
        if (shouldUpdate) {
          const plainText = stripHtml(question.answer_html)
          if (plainText.length > 0) {
            updates.answer = plainText
            hasUpdates = true
          }
        }
      }
      
      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('questions')
          .update(updates)
          .eq('id', question.id)
        
        if (updateError) {
          console.error(`  ❌ Error updating question ${question.id}:`, updateError.message)
        } else {
          console.log(`  ✅ Updated question ${question.id}`)
          updated++
        }
      } else {
        skipped++
      }
    }
    
    console.log(`\n  ✓ Questions: ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error('❌ Error restoring questions:', error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreEmotionsData() {
  console.log('😊 Restoring emotion description and content...\n')
  
  try {
    const { data: emotions, error: fetchError } = await supabase
      .from('emotions')
      .select('id, name, description, description_html, content, content_html')
      .or('description_html.not.is.null,content_html.not.is.null')
    
    if (fetchError) throw fetchError
    
    if (!emotions || emotions.length === 0) {
      console.log('  ℹ️  No emotions with HTML fields found.')
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${emotions.length} emotions with HTML fields`)
    
    let updated = 0
    let skipped = 0
    
    for (const emotion of emotions) {
      const updates: any = {}
      let hasUpdates = false
      
      if (emotion.description_html) {
        const descLength = emotion.description?.trim().length || 0
        const htmlLength = stripHtml(emotion.description_html).length
        const hasHtmlTags = emotion.description && /<[^>]+>/.test(emotion.description)
        const shouldUpdate = !emotion.description || descLength < 10 || hasHtmlTags || (htmlLength > descLength * 1.5)
        
        if (shouldUpdate) {
          const plainText = stripHtml(emotion.description_html)
          if (plainText.length > 0) {
            updates.description = plainText
            hasUpdates = true
          }
        }
      }
      
      if (emotion.content_html) {
        const contentLength = emotion.content?.trim().length || 0
        const htmlLength = stripHtml(emotion.content_html).length
        const hasHtmlTags = emotion.content && /<[^>]+>/.test(emotion.content)
        const shouldUpdate = !emotion.content || contentLength < 10 || hasHtmlTags || (htmlLength > contentLength * 1.5)
        
        if (shouldUpdate) {
          const plainText = stripHtml(emotion.content_html)
          if (plainText.length > 0) {
            updates.content = plainText
            hasUpdates = true
          }
        }
      }
      
      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('emotions')
          .update(updates)
          .eq('id', emotion.id)
        
        if (updateError) {
          console.error(`  ❌ Error updating ${emotion.name}:`, updateError.message)
        } else {
          console.log(`  ✅ Updated ${emotion.name}`)
          updated++
        }
      } else {
        skipped++
      }
    }
    
    console.log(`\n  ✓ Emotions: ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error('❌ Error restoring emotions:', error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreVideosData() {
  console.log('🎥 Restoring video description and transcript...\n')
  
  try {
    const { data: videos, error: fetchError } = await supabase
      .from('videos')
      .select('id, title, description, description_html, transcript, transcript_html')
      .or('description_html.not.is.null,transcript_html.not.is.null')
    
    if (fetchError) throw fetchError
    
    if (!videos || videos.length === 0) {
      console.log('  ℹ️  No videos with HTML fields found.')
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${videos.length} videos with HTML fields`)
    
    let updated = 0
    let skipped = 0
    
    for (const video of videos) {
      const updates: any = {}
      let hasUpdates = false
      
      if (video.description_html) {
        const descLength = video.description?.trim().length || 0
        const htmlLength = stripHtml(video.description_html).length
        const hasHtmlTags = video.description && /<[^>]+>/.test(video.description)
        const shouldUpdate = !video.description || descLength < 10 || hasHtmlTags || (htmlLength > descLength * 1.5)
        
        if (shouldUpdate) {
          const plainText = stripHtml(video.description_html)
          if (plainText.length > 0) {
            updates.description = plainText
            hasUpdates = true
          }
        }
      }
      
      if (video.transcript_html) {
        const transcriptLength = video.transcript?.trim().length || 0
        const htmlLength = stripHtml(video.transcript_html).length
        const hasHtmlTags = video.transcript && /<[^>]+>/.test(video.transcript)
        const shouldUpdate = !video.transcript || transcriptLength < 10 || hasHtmlTags || (htmlLength > transcriptLength * 1.5)
        
        if (shouldUpdate) {
          const plainText = stripHtml(video.transcript_html)
          if (plainText.length > 0) {
            updates.transcript = plainText
            hasUpdates = true
          }
        }
      }
      
      if (hasUpdates) {
        const { error: updateError } = await supabase
          .from('videos')
          .update(updates)
          .eq('id', video.id)
        
        if (updateError) {
          console.error(`  ❌ Error updating ${video.title}:`, updateError.message)
        } else {
          console.log(`  ✅ Updated ${video.title}`)
          updated++
        }
      } else {
        skipped++
      }
    }
    
    console.log(`\n  ✓ Videos: ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error('❌ Error restoring videos:', error)
    return { updated: 0, skipped: 0 }
  }
}

async function restoreDescriptionFields(tableName: string, displayName: string) {
  console.log(`📝 Restoring ${displayName} description from description_html...\n`)
  
  try {
    const { data: items, error: fetchError } = await supabase
      .from(tableName)
      .select('id, name, description, description_html')
      .not('description_html', 'is', null)
    
    if (fetchError) throw fetchError
    
    if (!items || items.length === 0) {
      console.log(`  ℹ️  No ${displayName} with description_html found.`)
      return { updated: 0, skipped: 0 }
    }
    
    console.log(`  Found ${items.length} ${displayName} with description_html`)
    
    let updated = 0
    let skipped = 0
    
    for (const item of items) {
      const descLength = item.description?.trim().length || 0
      const htmlLength = stripHtml(item.description_html || '').length
      const hasHtmlTags = item.description && /<[^>]+>/.test(item.description)
      
      const shouldUpdate = !item.description || descLength < 10 || hasHtmlTags || (htmlLength > descLength * 1.5)
      
      if (shouldUpdate && item.description_html) {
        const plainText = stripHtml(item.description_html)
        
        if (plainText.length > 0) {
          const { error: updateError } = await supabase
            .from(tableName)
            .update({ description: plainText })
            .eq('id', item.id)
          
          if (updateError) {
            console.error(`  ❌ Error updating ${item.name || item.id}:`, updateError.message)
          } else {
            console.log(`  ✅ Updated ${item.name || item.id} (${plainText.length} chars)`)
            updated++
          }
        } else {
          skipped++
        }
      } else {
        skipped++
      }
    }
    
    console.log(`\n  ✓ ${displayName}: ${updated} updated, ${skipped} skipped\n`)
    return { updated, skipped }
  } catch (error) {
    console.error(`❌ Error restoring ${displayName}:`, error)
    return { updated: 0, skipped: 0 }
  }
}

async function main() {
  console.log('🔄 Starting plain text restoration from HTML fields...\n')
  console.log('=' .repeat(60))
  
  // Lawyers and Law Firms
  const lawyerStats = await restoreLawyersBio()
  const firmDescStats = await restoreLawFirmsDescription()
  const firmContentStats = await restoreLawFirmsContent()
  
  // Articles
  const articleContentStats = await restoreArticlesContent()
  const articleExcerptStats = await restoreArticlesExcerpt()
  
  // Locations
  const citiesStats = await restoreLocationsContent('cities', 'Cities')
  const countiesStats = await restoreLocationsContent('counties', 'Counties')
  const statesStats = await restoreLocationsContent('states', 'States')
  
  // Stages
  const stagesStats = await restoreStagesData()
  
  // Team Members
  const teamStats = await restoreTeamMembersBio()
  
  // Questions
  const questionsStats = await restoreQuestionsData()
  
  // Emotions
  const emotionsStats = await restoreEmotionsData()
  
  // Videos
  const videosStats = await restoreVideosData()
  
  // Categories, Content Blocks, Markets
  const categoriesStats = await restoreDescriptionFields('article_categories', 'Article Categories')
  const contentBlocksStats = await restoreDescriptionFields('content_blocks', 'Content Blocks')
  const marketsStats = await restoreDescriptionFields('markets', 'Markets')
  
  console.log('=' .repeat(60))
  console.log('\n📊 Summary:')
  console.log(`  Lawyers (bio): ${lawyerStats.updated} updated, ${lawyerStats.skipped} skipped`)
  console.log(`  Law Firms (description): ${firmDescStats.updated} updated, ${firmDescStats.skipped} skipped`)
  console.log(`  Law Firms (content): ${firmContentStats.updated} updated, ${firmContentStats.skipped} skipped`)
  console.log(`  Articles (content): ${articleContentStats.updated} updated, ${articleContentStats.skipped} skipped`)
  console.log(`  Articles (excerpt): ${articleExcerptStats.updated} updated, ${articleExcerptStats.skipped} skipped`)
  console.log(`  Cities: ${citiesStats.updated} updated, ${citiesStats.skipped} skipped`)
  console.log(`  Counties: ${countiesStats.updated} updated, ${countiesStats.skipped} skipped`)
  console.log(`  States: ${statesStats.updated} updated, ${statesStats.skipped} skipped`)
  console.log(`  Stages: ${stagesStats.updated} updated, ${stagesStats.skipped} skipped`)
  console.log(`  Team Members: ${teamStats.updated} updated, ${teamStats.skipped} skipped`)
  console.log(`  Questions: ${questionsStats.updated} updated, ${questionsStats.skipped} skipped`)
  console.log(`  Emotions: ${emotionsStats.updated} updated, ${emotionsStats.skipped} skipped`)
  console.log(`  Videos: ${videosStats.updated} updated, ${videosStats.skipped} skipped`)
  console.log(`  Article Categories: ${categoriesStats.updated} updated, ${categoriesStats.skipped} skipped`)
  console.log(`  Content Blocks: ${contentBlocksStats.updated} updated, ${contentBlocksStats.skipped} skipped`)
  console.log(`  Markets: ${marketsStats.updated} updated, ${marketsStats.skipped} skipped`)
  
  const totalUpdated = 
    lawyerStats.updated + 
    firmDescStats.updated + 
    firmContentStats.updated +
    articleContentStats.updated +
    articleExcerptStats.updated +
    citiesStats.updated +
    countiesStats.updated +
    statesStats.updated +
    stagesStats.updated +
    teamStats.updated +
    questionsStats.updated +
    emotionsStats.updated +
    videosStats.updated +
    categoriesStats.updated +
    contentBlocksStats.updated +
    marketsStats.updated
  
  console.log(`\n  Total: ${totalUpdated} records updated`)
  console.log('\n✅ Restoration complete!\n')
}

main().catch(console.error)

