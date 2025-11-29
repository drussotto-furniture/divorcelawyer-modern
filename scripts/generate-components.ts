#!/usr/bin/env tsx
/**
 * Component Structure Generator
 * 
 * This script analyzes Blade templates and generates React component skeletons
 * with the correct class names and structure
 */

import * as fs from 'fs'
import * as path from 'path'

const WP_VIEWS_PATH = '/Users/drussotto/code-projects/site-archive-divorcelaw2stg-live-1763759542-d2QosSxv7qDLu0wpGk92rY6wsRNttpLJMFXX/wp-content/themes/wp-divorcelawyers/resources/views/blocks'
const TARGET_COMPONENTS = '/Users/drussotto/code-projects/divorcelawyer-modern/components'

function extractClassNames(content: string): string[] {
  const classMatches = content.match(/class=["']([^"']+)["']/g) || []
  return classMatches.map(match => match.replace(/class=["']|["']/g, ''))
}

function bladeToReact(content: string): string {
  // Convert Blade syntax to React
  let react = content
  
  // Remove Blade directives
  react = react.replace(/@[a-zA-Z]+\([^)]*\)/g, '')
  react = react.replace(/@[a-zA-Z]+/g, '')
  react = react.replace(/\{\{[^}]+\}\}/g, '')
  react = react.replace(/\{!![^!]+!!\}/g, '')
  
  // Convert class to className
  react = react.replace(/class=/g, 'className=')
  
  // Convert href to Link components (basic)
  react = react.replace(/<a\s+href="([^"]+)">/g, '<Link href="$1">')
  react = react.replace(/<\/a>/g, '</Link>')
  
  return react
}

function generateComponent(blockName: string, bladeContent: string) {
  const componentName = blockName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
  
  const classNames = extractClassNames(bladeContent)
  const reactContent = bladeToReact(bladeContent)
  
  const componentCode = `'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function ${componentName}() {
  return (
    ${reactContent}
  )
}
`
  
  const targetPath = path.join(TARGET_COMPONENTS, `${componentName}.tsx`)
  
  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, componentCode)
    console.log(`✓ Generated: ${componentName}.tsx`)
  } else {
    console.log(`⚠ Skipped (exists): ${componentName}.tsx`)
  }
}

// Process all block templates
if (fs.existsSync(WP_VIEWS_PATH)) {
  const blocks = fs.readdirSync(WP_VIEWS_PATH)
  
  for (const block of blocks) {
    if (block.endsWith('.blade.php')) {
      const blockName = block.replace('.blade.php', '')
      const content = fs.readFileSync(path.join(WP_VIEWS_PATH, block), 'utf-8')
      generateComponent(blockName, content)
    }
  }
}

console.log('\n✅ Component generation complete!')

