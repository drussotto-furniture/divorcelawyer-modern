#!/usr/bin/env tsx
/**
 * Automated SCSS Porting Script
 * 
 * This script:
 * 1. Finds all SCSS files in WordPress theme
 * 2. Converts @use to @import
 * 3. Replaces problematic @apply directives
 * 4. Copies to our styles directory
 */

import * as fs from 'fs'
import * as path from 'path'

const WP_THEME_PATH = '/Users/drussotto/code-projects/site-archive-divorcelaw2stg-live-1763759542-d2QosSxv7qDLu0wpGk92rY6wsRNttpLJMFXX/wp-content/themes/wp-divorcelawyers/resources'
const TARGET_PATH = '/Users/drussotto/code-projects/divorcelawyer-modern/styles'

// Problematic @apply patterns to replace
const APPLY_REPLACEMENTS = [
  { pattern: /@apply\s+italic/g, replacement: 'font-style: italic;' },
  { pattern: /@apply\s+not-italic/g, replacement: 'font-style: normal;' },
  { pattern: /@apply\s+text-secondary/g, replacement: 'color: #B6572E;' },
  { pattern: /@apply\s+text-primary/g, replacement: 'color: #FC9445;' },
  { pattern: /@apply\s+text-dark/g, replacement: 'color: #1D1D1D;' },
  { pattern: /@apply\s+text-white/g, replacement: 'color: #fff;' },
  { pattern: /@apply\s+text-black/g, replacement: 'color: #000;' },
  { pattern: /@apply\s+text-light/g, replacement: 'color: #F5F0E8;' },
  { pattern: /@apply\s+text-birch/g, replacement: 'color: #6B6B4E;' },
  { pattern: /@apply\s+text-coolblue/g, replacement: 'color: #1C4A52;' },
  { pattern: /@apply\s+text-oceanblue/g, replacement: 'color: #16596D;' },
  { pattern: /@apply\s+text-slateblue/g, replacement: 'color: #1C4A52;' },
  { pattern: /@apply\s+text-palesand/g, replacement: 'color: #F5F0E8;' },
  { pattern: /@apply\s+text-orange/g, replacement: 'color: #FC9445;' },
]

// Map Tailwind utilities to CSS
// This handles common utilities that cause circular dependencies or need conversion
const UTILITY_MAP: { [key: string]: string } = {
  // Text styles
  'italic': 'font-style: italic;',
  'not-italic': 'font-style: normal;',
  'uppercase': 'text-transform: uppercase;',
  'capitalize': 'text-transform: capitalize;',
  'lowercase': 'text-transform: lowercase;',
  
  // Colors
  'text-secondary': 'color: #B6572E;',
  'text-primary': 'color: #FC9445;',
  'text-dark': 'color: #1D1D1D;',
  'text-white': 'color: #fff;',
  'text-black': 'color: #000;',
  'text-light': 'color: #F5F0E8;',
  'text-birch': 'color: #6B6B4E;',
  'text-coolblue': 'color: #1C4A52;',
  'text-oceanblue': 'color: #16596D;',
  'text-slateblue': 'color: #1C4A52;',
  'text-palesand': 'color: #F5F0E8;',
  'text-orange': 'color: #FC9445;',
  
  // Font weights
  'font-normal': 'font-weight: 400;',
  'font-bold': 'font-weight: 700;',
  'font-semibold': 'font-weight: 600;',
  'font-medium': 'font-weight: 500;',
  
  // Font families
  'font-proxima': "font-family: 'Proxima', sans-serif;",
  'font-libre': "font-family: 'Libre', serif;",
  'font-helvetica': "font-family: 'Helvetica', sans-serif;",
  'font-roboto': "font-family: 'Roboto', sans-serif;",
  
  // Padding (common values)
  'p-0': 'padding: 0;',
  'px-0': 'padding-left: 0; padding-right: 0;',
  'py-0': 'padding-top: 0; padding-bottom: 0;',
  'pt-0': 'padding-top: 0;',
  'pb-0': 'padding-bottom: 0;',
  'pl-0': 'padding-left: 0;',
  'pr-0': 'padding-right: 0;',
  'p-1': 'padding: 0.25rem;',
  'px-1': 'padding-left: 0.25rem; padding-right: 0.25rem;',
  'py-1': 'padding-top: 0.25rem; padding-bottom: 0.25rem;',
  'pt-1': 'padding-top: 0.25rem;',
  'pb-1': 'padding-bottom: 0.25rem;',
  'pl-1': 'padding-left: 0.25rem;',
  'pr-1': 'padding-right: 0.25rem;',
  'p-2': 'padding: 0.5rem;',
  'px-2': 'padding-left: 0.5rem; padding-right: 0.5rem;',
  'py-2': 'padding-top: 0.5rem; padding-bottom: 0.5rem;',
  'pt-2': 'padding-top: 0.5rem;',
  'pb-2': 'padding-bottom: 0.5rem;',
  'pl-2': 'padding-left: 0.5rem;',
  'pr-2': 'padding-right: 0.5rem;',
  'p-2.5': 'padding: 0.625rem;',
  'px-2.5': 'padding-left: 0.625rem; padding-right: 0.625rem;',
  'py-2.5': 'padding-top: 0.625rem; padding-bottom: 0.625rem;',
  'pt-2.5': 'padding-top: 0.625rem;',
  'pb-2.5': 'padding-bottom: 0.625rem;',
  'pl-2.5': 'padding-left: 0.625rem;',
  'pr-2.5': 'padding-right: 0.625rem;',
  'p-3': 'padding: 0.75rem;',
  'px-3': 'padding-left: 0.75rem; padding-right: 0.75rem;',
  'py-3': 'padding-top: 0.75rem; padding-bottom: 0.75rem;',
  'pt-3': 'padding-top: 0.75rem;',
  'pb-3': 'padding-bottom: 0.75rem;',
  'pl-3': 'padding-left: 0.75rem;',
  'pr-3': 'padding-right: 0.75rem;',
  'p-4': 'padding: 1rem;',
  'px-4': 'padding-left: 1rem; padding-right: 1rem;',
  'py-4': 'padding-top: 1rem; padding-bottom: 1rem;',
  'pt-4': 'padding-top: 1rem;',
  'pb-4': 'padding-bottom: 1rem;',
  'pl-4': 'padding-left: 1rem;',
  'pr-4': 'padding-right: 1rem;',
  'px-5': 'padding-left: 1.25rem; padding-right: 1.25rem;',
  'py-5': 'padding-top: 1.25rem; padding-bottom: 1.25rem;',
  'pt-5': 'padding-top: 1.25rem;',
  'pb-5': 'padding-bottom: 1.25rem;',
  'px-6': 'padding-left: 1.5rem; padding-right: 1.5rem;',
  'py-6': 'padding-top: 1.5rem; padding-bottom: 1.5rem;',
  'pt-6': 'padding-top: 1.5rem;',
  'pb-6': 'padding-bottom: 1.5rem;',
  'px-8': 'padding-left: 2rem; padding-right: 2rem;',
  'py-8': 'padding-top: 2rem; padding-bottom: 2rem;',
  'pt-8': 'padding-top: 2rem;',
  'pb-8': 'padding-bottom: 2rem;',
  'px-10': 'padding-left: 2.5rem; padding-right: 2.5rem;',
  'py-10': 'padding-top: 2.5rem; padding-bottom: 2.5rem;',
  'pt-10': 'padding-top: 2.5rem;',
  'pb-10': 'padding-bottom: 2.5rem;',
  
  // Margin (common values)
  'm-0': 'margin: 0;',
  'mx-0': 'margin-left: 0; margin-right: 0;',
  'my-0': 'margin-top: 0; margin-bottom: 0;',
  'mt-0': 'margin-top: 0;',
  'mb-0': 'margin-bottom: 0;',
  'ml-0': 'margin-left: 0;',
  'mr-0': 'margin-right: 0;',
  'm-auto': 'margin: auto;',
  'mx-auto': 'margin-left: auto; margin-right: auto;',
  'my-auto': 'margin-top: auto; margin-bottom: auto;',
  'mt-1': 'margin-top: 0.25rem;',
  'mb-1': 'margin-bottom: 0.25rem;',
  'ml-1': 'margin-left: 0.25rem;',
  'mr-1': 'margin-right: 0.25rem;',
  'mt-2': 'margin-top: 0.5rem;',
  'mb-2': 'margin-bottom: 0.5rem;',
  'ml-2': 'margin-left: 0.5rem;',
  'mr-2': 'margin-right: 0.5rem;',
  'mt-2.5': 'margin-top: 0.625rem;',
  'mb-2.5': 'margin-bottom: 0.625rem;',
  'ml-2.5': 'margin-left: 0.625rem;',
  'mr-2.5': 'margin-right: 0.625rem;',
  'mt-3': 'margin-top: 0.75rem;',
  'mb-3': 'margin-bottom: 0.75rem;',
  'ml-3': 'margin-left: 0.75rem;',
  'mr-3': 'margin-right: 0.75rem;',
  'mt-4': 'margin-top: 1rem;',
  'mb-4': 'margin-bottom: 1rem;',
  'ml-4': 'margin-left: 1rem;',
  'mr-4': 'margin-right: 1rem;',
  'mt-5': 'margin-top: 1.25rem;',
  'mb-5': 'margin-bottom: 1.25rem;',
  'ml-5': 'margin-left: 1.25rem;',
  'mr-5': 'margin-right: 1.25rem;',
  'mt-6': 'margin-top: 1.5rem;',
  'mb-6': 'margin-bottom: 1.5rem;',
  'ml-6': 'margin-left: 1.5rem;',
  'mr-6': 'margin-right: 1.5rem;',
  'mt-8': 'margin-top: 2rem;',
  'mb-8': 'margin-bottom: 2rem;',
  'ml-8': 'margin-left: 2rem;',
  'mr-8': 'margin-right: 2rem;',
  'mt-10': 'margin-top: 2.5rem;',
  'mb-10': 'margin-bottom: 2.5rem;',
  'ml-10': 'margin-left: 2.5rem;',
  'mr-10': 'margin-right: 2.5rem;',
  'mt-12': 'margin-top: 3rem;',
  'mb-12': 'margin-bottom: 3rem;',
  'ml-12': 'margin-left: 3rem;',
  'mr-12': 'margin-right: 3rem;',
  '-ml-5': 'margin-left: -1.25rem;',
  '-mr-5': 'margin-right: -1.25rem;',
  '-mt-5': 'margin-top: -1.25rem;',
  '-mb-5': 'margin-bottom: -1.25rem;',
  
  // Display
  'block': 'display: block;',
  'inline-block': 'display: inline-block;',
  'flex': 'display: flex;',
  'inline-flex': 'display: inline-flex;',
  'hidden': 'display: none;',
  
  // Flexbox
  'items-center': 'align-items: center;',
  'items-end': 'align-items: flex-end;',
  'justify-center': 'justify-content: center;',
  'justify-between': 'justify-content: space-between;',
  'justify-end': 'justify-content: flex-end;',
  'justify-start': 'justify-content: flex-start;',
  'flex-col': 'flex-direction: column;',
  'flex-row': 'flex-direction: row;',
  'flex-wrap': 'flex-wrap: wrap;',
  'flex-1': 'flex: 1 1 0%;',
  
  // Positioning
  'relative': 'position: relative;',
  'absolute': 'position: absolute;',
  'fixed': 'position: fixed;',
  'top-0': 'top: 0;',
  'right-0': 'right: 0;',
  'bottom-0': 'bottom: 0;',
  'left-0': 'left: 0;',
  
  // Text alignment
  'text-center': 'text-align: center;',
  'text-left': 'text-align: left;',
  'text-right': 'text-align: right;',
  
  // Width/Height
  'w-full': 'width: 100%;',
  'w-auto': 'width: auto;',
  'h-full': 'height: 100%;',
  'h-auto': 'height: auto;',
  'max-w-full': 'max-width: 100%;',
  'max-w-fit': 'max-width: fit-content;',
  'min-w-44': 'min-width: 11rem;',
  'min-w-80': 'min-width: 20rem;',
  'min-h-20': 'min-height: 5rem;',
  
  // Background
  'bg-white': 'background-color: #fff;',
  'bg-black': 'background-color: #000;',
  'bg-primary': 'background-color: #FC9445;',
  'bg-dark': 'background-color: #1D1D1D;',
  'bg-light': 'background-color: #F5F0E8;',
  'bg-bluish': 'background-color: #163B46;',
  'bg-bluishlight': 'background-color: #235561;',
  
  // Border
  'border': 'border-width: 1px;',
  'border-2': 'border-width: 2px;',
  'border-[3px]': 'border-width: 3px;',
  'border-transparent': 'border-color: transparent;',
  'border-white': 'border-color: #fff;',
  'border-primary': 'border-color: #FC9445;',
  'border-dark': 'border-color: #1D1D1D;',
  'border-solid': 'border-style: solid;',
  'rounded-full': 'border-radius: 9999px;',
  'rounded-xl': 'border-radius: 0.75rem;',
  'rounded-2xl': 'border-radius: 1rem;',
  'rounded-3xl': 'border-radius: 1.5rem;',
  'rounded-none': 'border-radius: 0;',
  'rounded-lg': 'border-radius: 0.5rem;',
  
  // Z-index
  'z-0': 'z-index: 0;',
  'z-10': 'z-index: 10;',
  'z-20': 'z-index: 20;',
  'z-30': 'z-index: 30;',
  'z-40': 'z-index: 40;',
  'z-50': 'z-index: 50;',
  'z-90': 'z-index: 90;',
  'z-99': 'z-index: 99;',
  'z-999': 'z-index: 999;',
  'z-[300]': 'z-index: 300;',
  
  // Positioning
  'top-auto': 'top: auto;',
  'bottom-auto': 'bottom: auto;',
  'left-auto': 'left: auto;',
  'right-auto': 'right: auto;',
  '-top-2': 'top: -0.5rem;',
  '-bottom-2': 'bottom: -0.5rem;',
  '-left-2': 'left: -0.5rem;',
  '-right-2': 'right: -0.5rem;',
  'top-5': 'top: 1.25rem;',
  'bottom-5': 'bottom: 1.25rem;',
  'left-5': 'left: 1.25rem;',
  'right-5': 'right: 1.25rem;',
  'left-3': 'left: 0.75rem;',
  'right-3': 'right: 0.75rem;',
  'top-2/4': 'top: 50%;',
  '-top-10': 'top: -2.5rem;',
  '-mb-20': 'margin-bottom: -5rem;',
  '-top-14': 'top: -3.5rem;',
  '-mb-14': 'margin-bottom: -3.5rem;',
  '-top-36': 'top: -9rem;',
  '-mb-40': 'margin-bottom: -10rem;',
  'rounded-t-[20px]': 'border-top-left-radius: 20px; border-top-right-radius: 20px;',
  
  // Align items/content
  'content-start': 'align-content: flex-start;',
  'items-start': 'align-items: flex-start;',
  
  // Transitions
  'transition-colors': 'transition-property: color, background-color, border-color, text-decoration-color, fill, stroke; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms;',
  
  // Gap (for flexbox/grid)
  'gap-0': 'gap: 0;',
  'gap-1': 'gap: 0.25rem;',
  'gap-2': 'gap: 0.5rem;',
  'gap-3': 'gap: 0.75rem;',
  'gap-4': 'gap: 1rem;',
  'gap-5': 'gap: 1.25rem;',
  'gap-6': 'gap: 1.5rem;',
  'gap-7': 'gap: 1.75rem;',
  'gap-8': 'gap: 2rem;',
  'gap-10': 'gap: 2.5rem;',
  'gap-12': 'gap: 3rem;',
  'gap-16': 'gap: 4rem;',
  'gap-20': 'gap: 5rem;',
  'gap-24': 'gap: 6rem;',
  'gap-36': 'gap: 9rem;',
  'gap-x-0': 'column-gap: 0;',
  'gap-x-1': 'column-gap: 0.25rem;',
  'gap-x-2': 'column-gap: 0.5rem;',
  'gap-x-3': 'column-gap: 0.75rem;',
  'gap-x-4': 'column-gap: 1rem;',
  'gap-x-5': 'column-gap: 1.25rem;',
  'gap-x-6': 'column-gap: 1.5rem;',
  'gap-x-7': 'column-gap: 1.75rem;',
  'gap-x-8': 'column-gap: 2rem;',
  'gap-x-10': 'column-gap: 2.5rem;',
  'gap-x-12': 'column-gap: 3rem;',
  'gap-x-16': 'column-gap: 4rem;',
  'gap-x-20': 'column-gap: 5rem;',
  'gap-x-24': 'column-gap: 6rem;',
  'gap-x-36': 'column-gap: 9rem;',
  'gap-y-0': 'row-gap: 0;',
  'gap-y-1': 'row-gap: 0.25rem;',
  'gap-y-2': 'row-gap: 0.5rem;',
  'gap-y-3': 'row-gap: 0.75rem;',
  'gap-y-4': 'row-gap: 1rem;',
  'gap-y-5': 'row-gap: 1.25rem;',
  'gap-y-6': 'row-gap: 1.5rem;',
  'gap-y-7': 'row-gap: 1.75rem;',
  'gap-y-8': 'row-gap: 2rem;',
  'gap-y-10': 'row-gap: 2.5rem;',
  'gap-y-12': 'row-gap: 3rem;',
  'gap-y-16': 'row-gap: 4rem;',
  'gap-y-20': 'row-gap: 5rem;',
  'gap-y-24': 'row-gap: 6rem;',
  
  // Additional padding values
  'p-5': 'padding: 1.25rem;',
  'p-6': 'padding: 1.5rem;',
  'p-7': 'padding: 1.75rem;',
  'p-8': 'padding: 2rem;',
  'p-10': 'padding: 2.5rem;',
  'p-12': 'padding: 3rem;',
  'p-16': 'padding: 4rem;',
  'p-20': 'padding: 5rem;',
  'p-24': 'padding: 6rem;',
  'pb-7': 'padding-bottom: 1.75rem;',
  'pt-1.5': 'padding-top: 0.375rem;',
  'px-12': 'padding-left: 3rem; padding-right: 3rem;',
  'px-16': 'padding-left: 4rem; padding-right: 4rem;',
  'px-20': 'padding-left: 5rem; padding-right: 5rem;',
  'px-24': 'padding-left: 6rem; padding-right: 6rem;',
  'py-12': 'padding-top: 3rem; padding-bottom: 3rem;',
  'py-16': 'padding-top: 4rem; padding-bottom: 4rem;',
  'py-20': 'padding-top: 5rem; padding-bottom: 5rem;',
  'py-24': 'padding-top: 6rem; padding-bottom: 6rem;',
  'pt-12': 'padding-top: 3rem;',
  'pt-16': 'padding-top: 4rem;',
  'pt-20': 'padding-top: 5rem;',
  'pt-24': 'padding-top: 6rem;',
  'pb-12': 'padding-bottom: 3rem;',
  'pb-16': 'padding-bottom: 4rem;',
  'pb-20': 'padding-bottom: 5rem;',
  'pb-24': 'padding-bottom: 6rem;',
  'pl-12': 'padding-left: 3rem;',
  'pl-16': 'padding-left: 4rem;',
  'pl-20': 'padding-left: 5rem;',
  'pl-24': 'padding-left: 6rem;',
  'pr-12': 'padding-right: 3rem;',
  'pr-16': 'padding-right: 4rem;',
  'pr-20': 'padding-right: 5rem;',
  'pr-24': 'padding-right: 6rem;',
  
  // Additional margin values
  'm-5': 'margin: 1.25rem;',
  'm-6': 'margin: 1.5rem;',
  'm-8': 'margin: 2rem;',
  'm-10': 'margin: 2.5rem;',
  'm-12': 'margin: 3rem;',
  'm-16': 'margin: 4rem;',
  'm-20': 'margin: 5rem;',
  'm-24': 'margin: 6rem;',
  'mx-12': 'margin-left: 3rem; margin-right: 3rem;',
  'mx-16': 'margin-left: 4rem; margin-right: 4rem;',
  'mx-20': 'margin-left: 5rem; margin-right: 5rem;',
  'mx-24': 'margin-left: 6rem; margin-right: 6rem;',
  'my-12': 'margin-top: 3rem; margin-bottom: 3rem;',
  'my-16': 'margin-top: 4rem; margin-bottom: 4rem;',
  'my-20': 'margin-top: 5rem; margin-bottom: 5rem;',
  'my-24': 'margin-top: 6rem; margin-bottom: 6rem;',
  'mt-16': 'margin-top: 4rem;',
  'mt-20': 'margin-top: 5rem;',
  'mt-24': 'margin-top: 6rem;',
  'mb-16': 'margin-bottom: 4rem;',
  'mb-20': 'margin-bottom: 5rem;',
  'mb-24': 'margin-bottom: 6rem;',
  'ml-16': 'margin-left: 4rem;',
  'ml-20': 'margin-left: 5rem;',
  'ml-24': 'margin-left: 6rem;',
  'mr-16': 'margin-right: 4rem;',
  'mr-20': 'margin-right: 5rem;',
  'mr-24': 'margin-right: 6rem;',
  
  // Font sizes
  'text-xs': 'font-size: 0.75rem;',
  'text-sm': 'font-size: 0.875rem;',
  'text-base': 'font-size: 1rem;',
  'text-lg': 'font-size: 1.125rem;',
  'text-xl': 'font-size: 1.25rem;',
  'text-2xl': 'font-size: 1.5rem;',
  'text-3xl': 'font-size: 1.875rem;',
  'text-4xl': 'font-size: 2.25rem;',
  'text-[13px]': 'font-size: 13px;',
  
  // Line height
  'leading-none': 'line-height: 1;',
  'leading-tight': 'line-height: 1.25;',
  'leading-snug': 'line-height: 1.375;',
  'leading-normal': 'line-height: 1.5;',
  'leading-relaxed': 'line-height: 1.625;',
  'leading-loose': 'line-height: 2;',
  'leading-4': 'line-height: 1rem;',
  'leading-[16px]': 'line-height: 16px;',
  
  // Other
  'whitespace-nowrap': 'white-space: nowrap;',
  'no-underline': 'text-decoration: none;',
  'underline': 'text-decoration: underline;',
  'overflow-hidden': 'overflow: hidden;',
  'cursor-pointer': 'cursor: pointer;',
  'outline-none': 'outline: none;',
  'shadow-md': 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);',
  'space-x-4': 'gap: 1rem;', // For flex children spacing
}

function convertScss(content: string): string {
  let converted = content

  // Convert @use to @import and fix paths
  // Handle @use ... as * first
  converted = converted.replace(/@use\s+['"]([^'"]+)['"]\s+as\s+\*;?/g, (match, importPath) => {
    // Convert relative paths to our structure
    if (importPath.includes('../../styles/utils.scss') || importPath.includes('../styles/utils.scss') || importPath.includes('styles/utils.scss')) {
      return "@import '../utils.scss';"
    }
    return `@import '${importPath}';`
  })
  
  // Handle regular @use
  converted = converted.replace(/@use\s+['"]([^'"]+)['"];?/g, (match, importPath) => {
    // Convert relative paths to our structure
    if (importPath.includes('../../styles/utils.scss') || importPath.includes('../styles/utils.scss') || importPath.includes('styles/utils.scss')) {
      return "@import '../utils.scss';"
    }
    return `@import '${importPath}';`
  })
  
  // Remove double semicolons and fix any leftover "as *"
  converted = converted.replace(/;;/g, ';')
  converted = converted.replace(/;\s*as\s+\*;?/g, ';')

  // Replace entire @apply directives with CSS
  // Handle responsive utilities (lg:, md:, xl:, etc.), hover states, and regular utilities
  converted = converted.replace(/@apply\s+([^;]+);/g, (match, utilities) => {
    const utilityList = utilities.trim().split(/\s+/)
    const cssRules: string[] = []
    const responsiveRules: { [breakpoint: string]: string[] } = {}
    const hoverRules: string[] = []
    
    for (const utility of utilityList) {
      // Check for hover utilities (hover:bg-dark, hover:text-white, etc.)
      const hoverMatch = utility.match(/^hover:(.+)$/)
      if (hoverMatch) {
        const baseUtility = hoverMatch[1]
        if (UTILITY_MAP[baseUtility]) {
          hoverRules.push(UTILITY_MAP[baseUtility])
        } else if (baseUtility === 'text-dark/90') {
          hoverRules.push('color: rgba(29, 29, 29, 0.9);')
        } else {
          hoverRules.push(`/* @apply ${utility} - needs manual conversion */`)
        }
        continue
      }
      
      // Check for responsive utilities (lg:px-8, md:py-3, etc.)
      const responsiveMatch = utility.match(/^(sm|md|lg|xl|2xl|3xl):(.+)$/)
      
      if (responsiveMatch) {
        const [, breakpoint, baseUtility] = responsiveMatch
        // Check if it's a hover utility within responsive
        const hoverInResponsive = baseUtility.match(/^hover:(.+)$/)
        if (hoverInResponsive) {
          const hoverBase = hoverInResponsive[1]
          if (UTILITY_MAP[hoverBase]) {
            if (!responsiveRules[breakpoint]) {
              responsiveRules[breakpoint] = []
            }
            responsiveRules[breakpoint].push(`&:hover { ${UTILITY_MAP[hoverBase]} }`)
          }
        } else if (UTILITY_MAP[baseUtility]) {
          if (!responsiveRules[breakpoint]) {
            responsiveRules[breakpoint] = []
          }
          responsiveRules[breakpoint].push(UTILITY_MAP[baseUtility])
        } else {
          // Unknown responsive utility - comment it out
          if (!responsiveRules[breakpoint]) {
            responsiveRules[breakpoint] = []
          }
          responsiveRules[breakpoint].push(`/* @apply ${utility} - needs manual conversion */`)
        }
      } else if (UTILITY_MAP[utility]) {
        // Regular utility - add directly
        cssRules.push(UTILITY_MAP[utility])
      } else {
        // Unknown utility - comment it out
        cssRules.push(`/* @apply ${utility} - needs manual conversion */`)
      }
    }
    
    // Build the final CSS output
    let output = cssRules.join('\n          ')
    
    // Add hover rules
    if (hoverRules.length > 0) {
      output += `\n\n          &:hover {\n            ${hoverRules.join('\n            ')}\n          }`
    }
    
    // Add responsive rules wrapped in media queries
    for (const [breakpoint, rules] of Object.entries(responsiveRules)) {
      const mediaQuery = breakpoint === 'sm' ? '>=sm' : 
                        breakpoint === 'md' ? '>=md' : 
                        breakpoint === 'lg' ? '>=lg' : 
                        breakpoint === 'xl' ? '>=xl' : 
                        breakpoint === '2xl' ? '>=2xl' : '>=3xl'
      
      output += `\n\n          @include media("${mediaQuery}") {\n            ${rules.join('\n            ')}\n          }`
    }
    
    return output
  })

  // Update image paths - preserve quote style
  converted = converted.replace(/url\((['"]?)\.\.\/\.\.\/images\//g, (match, quote) => `url(${quote || "'"}/images/`)
  converted = converted.replace(/url\((['"]?)\.\.\/images\//g, (match, quote) => `url(${quote || "'"}/images/`)
  converted = converted.replace(/url\((['"]?)images\//g, (match, quote) => `url(${quote || "'"}/images/`)
  
  // Fix any mismatched quotes in url()
  converted = converted.replace(/url\((['"])([^'"]+)["']\)/g, (match, quote, path) => `url(${quote}${path}${quote})`)

  return converted
}

function portScssFile(sourcePath: string, targetPath: string) {
  const content = fs.readFileSync(sourcePath, 'utf-8')
  const converted = convertScss(content)
  
  // Ensure target directory exists
  const targetDir = path.dirname(targetPath)
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true })
  }
  
  fs.writeFileSync(targetPath, converted)
  console.log(`✓ Ported: ${path.basename(sourcePath)}`)
}

// Port component SCSS files
const componentsDir = path.join(WP_THEME_PATH, 'Blocks')
if (fs.existsSync(componentsDir)) {
  const blocks = fs.readdirSync(componentsDir)
  
  for (const block of blocks) {
    const scssPath = path.join(componentsDir, block, 'index.scss')
    if (fs.existsSync(scssPath)) {
      const targetPath = path.join(TARGET_PATH, 'components', `_${block.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, '')}.scss`)
      portScssFile(scssPath, targetPath)
    }
  }
}

// Port shared component SCSS
const viewComponentsDir = path.join(WP_THEME_PATH, 'View/Components')
if (fs.existsSync(viewComponentsDir)) {
  const components = fs.readdirSync(viewComponentsDir)
  
  for (const component of components) {
    const scssPath = path.join(viewComponentsDir, component, 'index.scss')
    if (fs.existsSync(scssPath)) {
      const targetPath = path.join(TARGET_PATH, 'components', `_component-${component.toLowerCase()}.scss`)
      portScssFile(scssPath, targetPath)
    }
  }
}

console.log('\n✅ SCSS porting complete!')

