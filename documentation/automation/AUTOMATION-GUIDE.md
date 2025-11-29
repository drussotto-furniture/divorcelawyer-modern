# Migration Automation Guide

## The Problem
Manually porting WordPress theme files one-by-one is slow and error-prone.

## The Solution
Automated scripts that do bulk operations in seconds instead of hours.

## Available Scripts

### 1. `npm run copy:assets`
**What it does:**
- Copies all images from WordPress theme (`resources/images/`)
- Copies logo files from media export
- Copies all fonts
- **Time:** ~2 seconds for 50+ files

**Usage:**
```bash
npm run copy:assets
```

### 2. `npm run port:scss`
**What it does:**
- Finds all SCSS files in WordPress theme
- Converts `@use` to `@import`
- Replaces problematic `@apply` directives with plain CSS
- Updates image paths
- Copies to `styles/components/`
- **Time:** ~5 seconds for all blocks

**Usage:**
```bash
npm run port:scss
```

### 3. `npm run generate:components`
**What it does:**
- Analyzes Blade templates
- Extracts class names
- Generates React component skeletons
- **Time:** ~3 seconds for all components

**Usage:**
```bash
npm run generate:components
```

### 4. `npm run setup:all`
**What it does:**
- Runs `copy:assets` + `port:scss` in sequence
- One command to set up all assets and styles
- **Time:** ~7 seconds total

**Usage:**
```bash
npm run setup:all
```

## Workflow

### For a New Block/Component:

1. **Run automation:**
   ```bash
   npm run setup:all
   ```

2. **Check generated files:**
   - SCSS: `styles/components/_block-name.scss`
   - Component skeleton: `components/BlockName.tsx` (if generated)

3. **Manual steps (still needed):**
   - Review and adjust SCSS if needed
   - Fill in component logic (data fetching, interactivity)
   - Test and refine

### Time Comparison

**Old Way (Manual):**
- Find SCSS file: 2 min
- Copy and convert: 5 min
- Find and copy assets: 3 min
- Update paths: 2 min
- **Total: ~12 minutes per block**

**New Way (Automated):**
- Run `npm run setup:all`: 7 seconds
- Review generated files: 2 min
- Manual adjustments: 3 min
- **Total: ~5 minutes per block**

**Savings: ~60% faster!**

## What Still Needs Manual Work

1. **Component Logic** - Data fetching, state management, interactivity
2. **Data Mapping** - Connecting Supabase queries to components
3. **Refinement** - Pixel-perfect adjustments, edge cases
4. **Testing** - Browser testing, responsive checks

## Future Improvements

- [ ] Auto-generate Supabase queries from component needs
- [ ] Auto-map WordPress functions to Next.js equivalents
- [ ] Auto-detect and fix common issues
- [ ] Generate TypeScript types from Blade templates

