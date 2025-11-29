#!/usr/bin/env tsx
/**
 * Automated Asset Copying Script
 * 
 * This script:
 * 1. Scans WordPress theme for all referenced assets
 * 2. Copies images, SVGs, fonts to public directory
 * 3. Updates paths if needed
 */

import * as fs from 'fs'
import * as path from 'path'

const WP_THEME_PATH = '/Users/drussotto/code-projects/site-archive-divorcelaw2stg-live-1763759542-d2QosSxv7qDLu0wpGk92rY6wsRNttpLJMFXX/wp-content/themes/wp-divorcelawyers/resources'
const WP_MEDIA_PATH = '/Users/drussotto/code-projects/divorcelawyer-modern/wordpress-export/media/files'
const TARGET_IMAGES = '/Users/drussotto/code-projects/divorcelawyer-modern/public/images'
const TARGET_FONTS = '/Users/drussotto/code-projects/divorcelawyer-modern/public/fonts'

// Ensure target directories exist
const targetDirs = [TARGET_IMAGES, TARGET_FONTS]
targetDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// Copy all images from theme
const themeImagesDir = path.join(WP_THEME_PATH, 'images')
if (fs.existsSync(themeImagesDir)) {
  const images = fs.readdirSync(themeImagesDir)
  let copied = 0
  
  for (const image of images) {
    if (image.endsWith('.svg') || image.endsWith('.png') || image.endsWith('.jpg') || image.endsWith('.webp')) {
      const source = path.join(themeImagesDir, image)
      const target = path.join(TARGET_IMAGES, image)
      
      if (!fs.existsSync(target)) {
        fs.copyFileSync(source, target)
        copied++
      }
    }
  }
  
  console.log(`✓ Copied ${copied} images from theme`)
}

// Copy logo files from media
const logoFiles = [
  'HeaderWhte-logo.svg',
  'DLS-logo-Black.svg',
  'Footrlogo.png',
  'divorcelawyer-logo-white.png',
  'divorcelawyer-logo-black.png',
]

let logosCopied = 0
for (const logo of logoFiles) {
  const source = path.join(WP_MEDIA_PATH, logo)
  if (fs.existsSync(source)) {
    const target = path.join(TARGET_IMAGES, logo)
    if (!fs.existsSync(target)) {
      fs.copyFileSync(source, target)
      logosCopied++
    }
  }
}
console.log(`✓ Copied ${logosCopied} logo files`)

// Copy fonts
const themeFontsDir = path.join(WP_THEME_PATH, 'fonts')
if (fs.existsSync(themeFontsDir)) {
  const fonts = fs.readdirSync(themeFontsDir)
  let fontsCopied = 0
  
  for (const font of fonts) {
    if (font.endsWith('.woff') || font.endsWith('.woff2')) {
      const source = path.join(themeFontsDir, font)
      const target = path.join(TARGET_FONTS, font)
      
      if (!fs.existsSync(target)) {
        fs.copyFileSync(source, target)
        fontsCopied++
      }
    }
  }
  
  console.log(`✓ Copied ${fontsCopied} font files`)
}

console.log('\n✅ Asset copying complete!')

