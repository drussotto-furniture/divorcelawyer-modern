/**
 * Diagnostic script to check for issues preventing server startup
 */

import * as fs from 'fs'
import * as path from 'path'

console.log('\n🔍 CHECKING FOR SERVER STARTUP ISSUES\n')
console.log('='.repeat(80))

// Check 1: Environment variables
console.log('\n1. Checking environment variables...')
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const hasSupabaseUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL')
  const hasSupabaseKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  const hasServiceKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY')
  
  console.log(`   ✅ .env.local exists`)
  console.log(`   ${hasSupabaseUrl ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_URL`)
  console.log(`   ${hasSupabaseKey ? '✅' : '❌'} NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  console.log(`   ${hasServiceKey ? '✅' : '❌'} SUPABASE_SERVICE_ROLE_KEY`)
} else {
  console.log('   ❌ .env.local not found')
}

// Check 2: Critical files
console.log('\n2. Checking critical files...')
const criticalFiles = [
  'package.json',
  'next.config.ts',
  'tsconfig.json',
  'app/layout.tsx',
  'app/page.tsx',
]

for (const file of criticalFiles) {
  const filePath = path.join(process.cwd(), file)
  const exists = fs.existsSync(filePath)
  console.log(`   ${exists ? '✅' : '❌'} ${file}`)
}

// Check 3: .next directory
console.log('\n3. Checking .next directory...')
const nextDir = path.join(process.cwd(), '.next')
if (fs.existsSync(nextDir)) {
  const lockFile = path.join(nextDir, 'dev', 'lock')
  if (fs.existsSync(lockFile)) {
    console.log('   ⚠️  Lock file exists - this may prevent startup')
    console.log('   💡 Run: rm -f .next/dev/lock')
  } else {
    console.log('   ✅ No lock file')
  }
} else {
  console.log('   ✅ .next directory doesn\'t exist (will be created)')
}

// Check 4: Node modules
console.log('\n4. Checking dependencies...')
const nodeModules = path.join(process.cwd(), 'node_modules')
const packageJson = path.join(process.cwd(), 'package.json')
if (fs.existsSync(nodeModules)) {
  console.log('   ✅ node_modules exists')
} else {
  console.log('   ❌ node_modules not found - run: npm install')
}

if (fs.existsSync(packageJson)) {
  const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf-8'))
  console.log(`   ✅ Next.js version: ${pkg.dependencies?.next || 'not found'}`)
}

console.log('\n' + '='.repeat(80))
console.log('\n💡 If all checks pass, the issue may be:')
console.log('   - A background process holding the port')
console.log('   - A compilation error (check terminal output)')
console.log('   - A syntax error in a recently modified file')
console.log('\n')

