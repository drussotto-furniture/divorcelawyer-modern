# 🎨 Exact Styling Match - Action Plan

## What's Missing

The homepage structure is correct, but the styling doesn't match because:

1. **Fonts are missing** - Need to copy Proxima, Libre, etc. from WordPress theme
2. **SCSS utilities not ported** - fluid(), rem(), media queries, etc.
3. **Component-specific styles** - Each block has detailed SCSS that needs to be converted
4. **Tailwind config incomplete** - Missing many custom utilities from WordPress

## What I Need to Port

### 1. Fonts (21 font files)
Location: `site-archive-.../wp-content/themes/wp-divorcelawyers/public/fonts/`

Files to copy:
- ProximaNova (Light, Regular, SemiBold, Bold)
- Libre Bodoni (Regular, Italic, 500, 600, 700 + italics)
- Helvetica Bold
- Arial
- DMSans, DMSerifText
- Roboto (Light, Regular, Medium)
- Shippori

### 2. SCSS Utility Functions
Need to convert or replicate:
- `fluid($min, $max)` - Responsive font/spacing sizing
- `rem($px)` - Pixel to rem conversion
- `@include media('>=lg')` - Breakpoint mixins
- `@include block()` - BEM naming helper

### 3. Component Styles
Each homepage section has detailed SCSS:
- SearchHero (already read)
- Header/Nav (already read)
- Footer
- Card components
- Button styles
- Spacing/typography utilities

### 4. Global Styles
- Typography scales
- Color system (already in Tailwind config)
- Spacing system
- Animation/transitions

## Options for You

### Option A: Full SCSS Port (Most Accurate)
- Copy all fonts to Next.js
- Set up SCSS in Next.js
- Port all SCSS files with utilities
- Convert each component's styles
- **Time**: 2-3 hours of work
- **Result**: 99% exact match

### Option B: Tailwind + CSS Variables (Faster)
- Copy fonts
- Create CSS custom properties for fluid sizing
- Use Tailwind with custom utilities
- Port critical styles only
- **Time**: 30-60 minutes
- **Result**: 90-95% match, some minor differences

### Option C: Copy Compiled CSS (Quickest)
- Copy the final compiled CSS from WordPress
- Load it in Next.js
- Adjust class names to match
- **Time**: 15-30 minutes
- **Result**: 85-90% match, may have conflicts

## My Recommendation

**Option B** - It's the best balance of accuracy and speed. I can:
1. Copy and set up the fonts properly
2. Create CSS variables for fluid typography
3. Port the critical component styles
4. Use Tailwind for layout/spacing

## What Do You Want Me to Do?

Please choose:
- **A** - Full SCSS port for 99% accuracy (takes longer)
- **B** - Tailwind hybrid for 90-95% accuracy (recommended)
- **C** - Quick CSS copy for 85-90% accuracy (fastest)

Or if you have another preference, let me know!

## Alternative: Give Me Access

If you can give me:
- FTP/SSH access to the WordPress site, OR
- The compiled CSS file from the live site

I can get the exact styles faster.

