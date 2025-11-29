# 🎯 Comprehensive Homepage Matching Plan
## Based on Side-by-Side Screenshot Analysis

---

## 📊 CRITICAL DISCOVERIES from Screenshots

### ❌ What I Did WRONG:
1. **Assumed I understood WordPress styling** - I didn't verify pixel-perfect accuracy
2. **Only ported 2/10 blocks** - Thought that was enough
3. **Didn't test against real screenshots** - Should have compared immediately
4. **Missed complex layouts** - ThreePackComponent has lawyer cards I completely missed

---

## 🔍 SECTION-BY-SECTION ANALYSIS

### 1. **HERO SECTION** (Screenshot comparison: localhost vs divorcelawyer.com)
**Status:** ✅ MOSTLY CORRECT but needs refinement

#### Differences Found:
- ✅ Text layout correct (left side)
- ✅ Image positioning correct (right side)
- ✅ Colors look good
- ⚠️ Typography might need fine-tuning (letter-spacing, line-height)
- ⚠️ Button styling looks close but verify exact padding/radius

#### Action Items:
- [ ] Verify exact font sizes match at all breakpoints
- [ ] Check button border-radius (looks slightly different)
- [ ] Verify image aspect ratio and positioning

---

### 2. **DISCOVER SLIDER** (Screenshot comparison)
**Status:** ✅ STRUCTURE CORRECT but layout completely wrong

#### Differences Found:
- ❌ **MINE:** Horizontal row of 4 indicator tabs at top
- ✅ **WP:** Horizontal row of 4 indicator tabs at top - MATCHES!
- ✅ Swiper working
- ⚠️ Need to verify indicator styling details

#### Action Items:
- [ ] Fine-tune indicator button styling
- [ ] Verify slide transition animations
- [ ] Check image shadow layers visibility

---

### 3. **THREE PACK COMPONENT** (Top Lawyers Section)
**Status:** ❌ COMPLETELY WRONG - MOST CRITICAL FIX NEEDED

#### WP Version Has:
- **Full section background:** Teal/dark blue
- **Actual lawyer cards** with photos (3 cards side-by-side)
- Each card has:
  - Law firm name
  - Lawyer photo
  - Lawyer name
  - "VIEW PROFILE" button (orange)
  - "VIEW FIRM" link (red text)
- **"EXPLORE ALL IN [CITY]" button** at bottom
- Proper spacing and card styling

#### My Version Has:
- ❌ Just text boxes
- ❌ No lawyer photos
- ❌ Generic Tailwind layout
- ❌ Wrong structure entirely

#### Action Items:
- [ ] Port `Blocks/ThreePackComponent/index.scss`
- [ ] Read `three-pack-component.blade.php` for exact structure
- [ ] Create `ThreePackComponent.tsx` React component
- [ ] Copy lawyer card images
- [ ] Implement card hover states

---

### 4. **MOST POPULAR READS**
**Status:** ❌ COMPLETELY WRONG

#### WP Version Has:
- **Unique layout:** 1 large featured article (left) + 2-column grid (right)
- Large featured article with big image
- Smaller articles in grid
- Proper article cards with images (not placeholder icons)
- "Read Article →" links in orange
- **Article images are REAL**, not placeholders

#### My Version Has:
- ❌ Simple 3-column grid
- ❌ Placeholder document icons
- ❌ No featured article layout
- ❌ No real images

#### Action Items:
- [ ] Port `Blocks/MostPopularReads/index.scss`
- [ ] Read `most-popular-reads.blade.php`
- [ ] Implement asymmetric grid layout (1 large + 6 small)
- [ ] Fetch actual article images from database
- [ ] Create proper article card component

---

### 5. **STAGES OF DIVORCE**
**Status:** ❌ WRONG LAYOUT

#### WP Version Has:
- **Horizontal cards with icons**
- Each stage has an icon (illustrated)
- Cards have quotes underneath
- Connected with arrows
- Specific styling for each card
- Proper hover effects

#### My Version Has:
- ❌ Simple text boxes
- ❌ No icons
- ❌ No connecting arrows
- ❌ Generic grid layout

#### Action Items:
- [ ] Port `Blocks/Stages/index.scss`
- [ ] Copy stage icon SVGs
- [ ] Implement horizontal scrolling layout
- [ ] Add connecting arrows between stages
- [ ] Add hover effects

---

### 6. **EMOTIONS SECTION**
**Status:** ❌ WRONG STYLE

#### WP Version Has:
- **Dark teal background** for entire section
- **Pill-shaped buttons** (rounded, filled)
- Emotions displayed horizontally
- Specific color scheme (teal pills on dark background)
- Proper spacing

#### My Version Has:
- ❌ White background
- ❌ Simple rectangular boxes
- ❌ Wrong layout
- ❌ Wrong colors

#### Action Items:
- [ ] Port `Blocks/Emotions/index.scss`
- [ ] Fix background color (dark teal)
- [ ] Change to pill-shaped buttons
- [ ] Adjust spacing and typography

---

### 7. **REAL VOICES (Coffee Talk)**
**Status:** ❌ WRONG - NOT A SWIPER CAROUSEL

#### WP Version Has:
- **Swiper carousel** with testimonials
- Large centered testimonial card
- Navigation dots at bottom
- Quote in italic font
- Author name below
- Smooth slide transitions
- Left/right arrow navigation

#### My Version Has:
- ❌ Static 3-column grid
- ❌ No carousel functionality
- ❌ All testimonials visible at once
- ❌ No navigation

#### Action Items:
- [ ] Port `Blocks/RealVoices/index.scss`
- [ ] Read `real-voices.blade.php`
- [ ] Implement Swiper.js carousel
- [ ] Create testimonial card component
- [ ] Add navigation arrows and dots

---

### 8. **GET INFORMED / CATEGORIES**
**Status:** ⚠️ MOSTLY CORRECT but styling off

#### WP Version Has:
- Clean category cards
- Underlined text
- Specific hover states
- Proper spacing

#### My Version Has:
- ✅ Grid layout correct
- ⚠️ Styling details slightly off

#### Action Items:
- [ ] Port `Blocks/Categories/index.scss`
- [ ] Fix underline styling
- [ ] Adjust hover effects
- [ ] Verify spacing

---

### 9. **CONNECT WITH LAWYER (CTA)**
**Status:** ⚠️ STRUCTURE CORRECT but needs styling

#### WP Version Has:
- Split section (text left, image right)
- Handshake image on right side
- Specific typography
- Input field + button

#### My Version Has:
- ✅ Basic structure there
- ❌ Missing image on right
- ⚠️ Styling needs refinement

#### Action Items:
- [ ] Port `Blocks/ConnectWithLawyer/index.scss`
- [ ] Add handshake image
- [ ] Implement split layout
- [ ] Add location search input

---

### 10. **COMMON QUESTIONS (FAQ)**
**Status:** ✅ MOSTLY CORRECT

#### WP Version Has:
- Clean accordion style
- Proper expand/collapse
- Nice hover states

#### My Version Has:
- ✅ Using HTML `<details>` - good approach
- ⚠️ Styling needs refinement

#### Action Items:
- [ ] Port `Blocks/CommonQuestions/index.scss`
- [ ] Fine-tune accordion styling
- [ ] Add proper expand/collapse icons
- [ ] Verify spacing

---

### 11. **NEWSLETTER SECTION**
**Status:** ✅ GOOD

#### Action Items:
- [ ] Minor styling tweaks only

---

## 🎯 COMPREHENSIVE, SCALABLE PLAN

### PHASE 1: Fix Critical Sections (Most Visible Issues)

#### Priority 1: ThreePackComponent ⚠️ CRITICAL
```bash
1. Read Blocks/ThreePackComponent/index.scss
2. Read views/blocks/three-pack-component.blade.php  
3. Copy any required images/icons
4. Create styles/components/_three-pack-component.scss
5. Create components/ThreePackComponent.tsx (if needed)
6. Update app.scss to import
7. Update app/page.tsx with exact HTML structure
8. Test against screenshot
```

#### Priority 2: MostPopularReads ⚠️ CRITICAL
```bash
1. Read Blocks/MostPopularReads/index.scss
2. Read views/blocks/most-popular-reads.blade.php
3. Understand asymmetric layout (1 large featured + grid)
4. Create styles/components/_most-popular-reads.scss
5. Fetch real article images from database
6. Create MostPopularReadsComponent.tsx
7. Update app.scss
8. Update app/page.tsx
9. Test against screenshot
```

#### Priority 3: RealVoices (Swiper Carousel) ⚠️ HIGH
```bash
1. Read Blocks/RealVoices/index.scss
2. Read views/blocks/real-voices.blade.php
3. Create styles/components/_real-voices.scss
4. Create RealVoicesComponent.tsx with Swiper.js
5. Update app.scss
6. Update app/page.tsx
7. Test carousel functionality
```

#### Priority 4: Stages (with Icons) ⚠️ HIGH
```bash
1. Find and copy all stage icon SVGs
2. Read Blocks/Stages/index.scss
3. Read views/blocks/stages.blade.php
4. Create styles/components/_stages.scss
5. Update app/page.tsx with icons and arrows
6. Test against screenshot
```

#### Priority 5: Emotions (Dark Background) ⚠️ MEDIUM
```bash
1. Read Blocks/Emotions/index.scss
2. Read views/blocks/emotions.blade.php
3. Create styles/components/_emotions.scss
4. Fix background color and button styling
5. Update app/page.tsx
6. Test against screenshot
```

#### Priority 6: ConnectWithLawyer ⚠️ MEDIUM
```bash
1. Copy handshake image
2. Read Blocks/ConnectWithLawyer/index.scss
3. Read views/blocks/connect-with-lawyer.blade.php
4. Create styles/components/_connect-with-lawyer.scss
5. Implement split layout with image
6. Update app/page.tsx
7. Test against screenshot
```

#### Priority 7-10: Categories, CommonQuestions, Newsletter ⚠️ LOW
```bash
Minor refinements only
```

---

### PHASE 2: Asset Audit & Collection

#### Images Needed:
```bash
# Find all images referenced in homepage blocks
cd site-archive-divorcelaw2stg-live-1763759542-d2QosSxv7qDLu0wpGk92rY6wsRNttpLJMFXX/wp-content/themes/wp-divorcelawyers/resources

# Stage icons
find images -name "*stage*" -o -name "*disillusion*" -o -name "*decision*" etc.

# Emotion icons (if any)
find images -name "*emotion*" -o -name "*anger*" etc.

# Connect with lawyer image
find images -name "*handshake*" -o -name "*lawyer*" -o -name "*connect*"

# Copy ALL to Next.js public/images/
```

#### Article Images:
```sql
-- Get featured images for popular articles
SELECT 
  p.ID,
  p.post_title,
  pm.meta_value as featured_image_id,
  wm.guid as image_url
FROM wp_posts p
JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key = '_thumbnail_id'
JOIN wp_posts wm ON pm.meta_value = wm.ID
WHERE p.ID IN (921429, 921418, 921458, 921426, 921443, 921453, 921465, 921449, 921024)
```

---

### PHASE 3: Verification Process

For EACH section:
1. Take screenshot of WP version
2. Take screenshot of Next.js version
3. Overlay in Photoshop/Figma to find pixel differences
4. Measure exact spacing/sizing
5. Adjust until pixel-perfect match
6. Document any intentional differences

---

## 📋 SCALABLE PROCESS FOR OTHER PAGES

### Template for ANY Page:

#### Step 1: Identify Blocks
```bash
# From WordPress database post_content:
cat page-content.txt | grep -o 'acf/[^"]*' | sort -u

# Example output:
# acf/hero-component
# acf/text-and-image
# acf/article-categories-component
```

#### Step 2: For EACH Block:
```bash
# A. Read WordPress files
- Read: Blocks/[BlockName]/index.scss
- Read: views/blocks/[block-name].blade.php
- Read: Blocks/[BlockName]/[BlockName].php (if exists for ACF field definitions)

# B. Copy assets
- Find all images/icons/SVGs referenced
- Copy to public/images/ or public/icons/

# C. Port SCSS
- Create: styles/components/_[block-name].scss
- Convert @use to @import
- Fix image paths (../../images/ → /images/)
- Add to styles/app.scss

# D. Create React Component (if needed)
- If block has JS interactions (Swiper, animations, etc.)
- Create: components/[BlockName].tsx
- Implement interactions

# E. Update Page
- Add exact HTML structure from Blade template
- Use exact class names from WordPress
- Import and use React component if created

# F. Test
- Screenshot comparison
- Responsive testing
- Interaction testing
```

#### Step 3: Asset Checklist
```markdown
### [Page Name] - Asset Inventory

**Images:**
- [ ] Hero background image
- [ ] Section background images
- [ ] Icon set 1 (stages/emotions/etc.)
- [ ] Article/content images

**Fonts:**
- [ ] All fonts loaded in app
- [ ] Font weights verified

**Colors:**
- [ ] Background colors match
- [ ] Text colors match
- [ ] Button colors match
```

#### Step 4: Block Checklist
```markdown
### [Page Name] - Block Inventory

1. [ ] Block 1 Name
   - [ ] SCSS ported
   - [ ] Assets copied
   - [ ] Component created (if needed)
   - [ ] Structure implemented
   - [ ] Screenshot verified

2. [ ] Block 2 Name
   - [ ] SCSS ported
   ...
```

---

## 🔧 TOOLS & TECHNIQUES

### Screenshot Comparison:
```bash
# Browser DevTools
1. Set exact viewport size (e.g., 1920x1080)
2. Take full-page screenshot
3. Use Photoshop/Figma overlay at 50% opacity
4. Identify pixel differences
```

### Measuring Tool:
```javascript
// Browser console - measure elements
document.querySelector('.selector').getBoundingClientRect()
// Returns exact width, height, position
```

### Color Picker:
```bash
# Browser DevTools
1. Inspect element
2. Note exact hex colors
3. Compare with Tailwind config
```

---

## 📈 SUCCESS METRICS

### Homepage is DONE when:
- ✅ All 10 ACF blocks have dedicated SCSS files
- ✅ All block HTML structures match Blade templates exactly
- ✅ All images/assets are in place and displaying
- ✅ All interactive elements work (sliders, accordions, hovers)
- ✅ Typography uses fluid() function correctly at all breakpoints
- ✅ Side-by-side screenshots overlay with 95%+ accuracy
- ✅ Responsive behavior matches at mobile/tablet/desktop
- ✅ All animations/transitions match

---

## 🚨 LESSONS LEARNED

### What NOT to Do:
1. ❌ Don't assume 2 blocks is enough - port ALL blocks
2. ❌ Don't use generic Tailwind - port exact WordPress SCSS
3. ❌ Don't guess layouts - study Blade templates carefully
4. ❌ Don't use placeholder icons - get real images
5. ❌ Don't skip screenshot comparison - do it immediately

### What TO Do:
1. ✅ Port EVERY ACF block individually with its SCSS
2. ✅ Copy ALL assets before building
3. ✅ Use exact WordPress class names
4. ✅ Test with side-by-side screenshots constantly
5. ✅ Measure exact spacing/sizing when in doubt
6. ✅ Implement interactive elements (Swiper, etc.)

---

## ⏱️ TIME ESTIMATES

### Per Block:
- Simple block (text/buttons): 15-20 min
- Medium block (grid/cards): 30-45 min
- Complex block (carousel/interactions): 45-60 min

### Homepage Total:
- 10 blocks × 30 min average = **5 hours**
- Asset gathering = **30 min**
- Testing & refinement = **1 hour**
- **TOTAL: 6-7 hours for pixel-perfect homepage**

### Other Pages:
- Average page = 5-8 blocks
- **Estimate: 3-5 hours per page** (faster after homepage learnings)

---

## 🎯 IMMEDIATE NEXT STEPS

1. **Port ThreePackComponent** (lawyer cards) - MOST CRITICAL
2. **Port MostPopularReads** (asymmetric layout) - VERY VISIBLE
3. **Port RealVoices** (Swiper carousel) - HIGH IMPACT
4. **Port Stages** (with icons) - UNIQUE LAYOUT
5. **Port Emotions** (dark background) - OBVIOUS DIFFERENCE
6. Continue with remaining blocks

Should I start with **Priority 1: ThreePackComponent** now? This is the most visible difference!

