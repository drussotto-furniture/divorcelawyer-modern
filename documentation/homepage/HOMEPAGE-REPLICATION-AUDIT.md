# 📋 Homepage Replication Audit & Learning Document

## Executive Summary

**Problem:** I was only porting 2 of 10 ACF blocks from WordPress, using generic Tailwind styling for the rest.

**What I'm Missing:**
1. ❌ **SCSS files for 8 remaining ACF blocks** - Only ported Hero + Discover Slider
2. ❌ **Exact Blade template HTML structure** - Not using proper class names
3. ❌ **All images/assets** from theme - Only copied 6 hero images
4. ❌ **JavaScript interactions** (Swiper config, animations, etc.)
5. ❌ **Proper spacing/layout classes** from WordPress

---

## Complete Homepage Block Inventory

### ✅ DONE (2/10 blocks)
1. **HeroComponentSecondary** - ✅ SCSS ported, React component created
2. **DiscoverSlider** - ✅ SCSS ported, React component with Swiper.js

### ❌ TODO (8/10 blocks - Using Generic Tailwind!)

3. **ThreePackComponent** (Top Lawyers Section)
   - Location: `Blocks/ThreePackComponent/`
   - Files needed:
     - `index.scss` 
     - `three-pack-component.blade.php`
   - Current status: Using generic Tailwind grid

4. **MostPopularReads** 
   - Location: `Blocks/MostPopularReads/`
   - Files needed:
     - `index.scss`
     - `most-popular-reads.blade.php`
   - Current status: Using generic Tailwind cards

5. **Stages**
   - Location: `Blocks/Stages/`
   - Files needed:
     - `index.scss`
     - `stages.blade.php`
   - Current status: Using generic Tailwind grid

6. **Emotions**
   - Location: `Blocks/Emotions/`
   - Files needed:
     - `index.scss`
     - `emotions.blade.php`
   - Current status: Using generic Tailwind grid

7. **RealVoices** (Coffee Talk)
   - Location: `Blocks/RealVoices/`
   - Files needed:
     - `index.scss`
     - `real-voices.blade.php`
   - Current status: Using generic testimonial cards

8. **Categories**
   - Location: `Blocks/Categories/`
   - Files needed:
     - `index.scss`
     - `categories.blade.php`
   - Current status: Using generic Tailwind grid

9. **ConnectWithLawyer** (CTA Section)
   - Location: `Blocks/ConnectWithLawyer/`
   - Files needed:
     - `index.scss`
     - `connect-with-lawyer.blade.php`
   - Current status: Using generic Tailwind section

10. **CommonQuestions** (FAQ)
    - Location: `Blocks/CommonQuestions/`
    - Files needed:
      - `index.scss`
      - `common-questions.blade.php`
    - Current status: Using HTML `<details>` tag

---

## What I Need to Do for EACH Block

### 1. Read WordPress Files
```bash
# For each block (e.g., ThreePackComponent):
- Read: Blocks/ThreePackComponent/index.scss
- Read: views/blocks/three-pack-component.blade.php
```

### 2. Port SCSS to Next.js
```bash
# Create: styles/components/_three-pack-component.scss
# Convert paths:
- @use '../../styles/utils.scss' as *; → @import '../utils.scss';
- url("../../images/...") → url("/images/...")
```

### 3. Create React Component (if complex)
```bash
# If block has JavaScript interactions:
- Create: components/ThreePackComponent.tsx
- Implement: Swiper, animations, etc.
```

### 4. Update app.scss
```scss
@import './components/three-pack-component';
```

### 5. Update Homepage with Exact HTML Structure
```tsx
// Replace generic Tailwind with WordPress class names:
<section className="block-three-pack-component bg-bluish">
  <div className="block-container container-size-small">
    {/* Exact structure from Blade template */}
  </div>
</section>
```

---

## Additional Missing Items

### Images/Assets Not Yet Copied
- Need to audit ALL images referenced in homepage blocks
- Categories icons?
- Stage icons?
- Emotion icons?
- Background images?
- SVG graphics?

### Typography Issues
- Verify `fluid()` function is working for ALL text
- Check all font families are loaded
- Verify font-weight classes

### Spacing/Layout Classes
- WordPress uses custom container sizes: `container-size-small`, `container-size-medium`
- Spacing classes: `spacing-top`, `spacing-bottom`
- Background colors: `bg-bluish`, `bg-subtlesand`, `bg-seashell`, etc.

### JavaScript/Interactions
- Swiper.js configurations (speed, effects, etc.)
- Animations (appear-fade-in, etc.)
- Mobile menu interactions
- Form validations

---

## Process for Other Pages

### Step 1: Identify ACF Blocks Used
```bash
# From WordPress post_content:
grep -o "acf/[^\"]*" content.txt | sort -u
```

### Step 2: For Each Block, Port in Order
1. Read Blade template → understand HTML structure
2. Read SCSS → understand styling
3. Copy images/assets
4. Create SCSS file in Next.js
5. Create React component (if needed)
6. Update app.scss
7. Update page with exact structure

### Step 3: Test & Compare
1. Screenshot WordPress page
2. Screenshot Next.js page
3. Compare side-by-side
4. Fix discrepancies

---

## Key Learnings

### ❌ What NOT to Do:
1. **Don't use generic Tailwind classes** - Port the actual WordPress SCSS
2. **Don't guess the HTML structure** - Copy from Blade templates exactly
3. **Don't assume images are in place** - Copy ALL referenced assets
4. **Don't skip component-specific JavaScript** - Port Swiper configs, animations, etc.

### ✅ What TO Do:
1. **Port EVERY ACF block individually** - All 10+ blocks need their own SCSS
2. **Use exact WordPress class names** - `block-stages`, `container-size-medium`, etc.
3. **Copy ALL images upfront** - Audit and copy before building
4. **Match HTML structure exactly** - Use Blade templates as blueprints
5. **Test each block as you go** - Don't wait until the end

---

## Next Steps for Homepage

### Immediate Priority:
1. Port ThreePackComponent (Top Lawyers) - Most visible issue
2. Port MostPopularReads - Large content section
3. Port Stages - Unique layout
4. Port Emotions - Unique layout
5. Port RealVoices - Testimonial slider
6. Port Categories - Grid layout
7. Port ConnectWithLawyer - CTA section
8. Port CommonQuestions - FAQ accordion

### Estimated Time:
- Each block: 15-30 minutes
- Total: 2-4 hours for complete homepage accuracy

---

## Success Criteria

Homepage is **DONE** when:
- ✅ All 10 ACF blocks have dedicated SCSS files
- ✅ All block HTML structures match Blade templates
- ✅ All images/assets are in place
- ✅ All interactive elements work (sliders, accordions, etc.)
- ✅ Typography uses fluid() function correctly
- ✅ Responsive breakpoints match WordPress
- ✅ Side-by-side screenshots are identical

---

## File Checklist Template (for each page)

```markdown
### [Page Name] - ACF Blocks Audit

**WordPress Blocks Used:**
1. [ ] Block 1 Name - SCSS ported? Component created?
2. [ ] Block 2 Name - SCSS ported? Component created?
...

**Images/Assets:**
- [ ] Hero image
- [ ] Icons
- [ ] Background images
...

**Status:** ❌ Not Started / 🔄 In Progress / ✅ Complete
```

---

## Why This Matters

Each page on divorcelawyer.com uses 5-15 ACF blocks. If we don't port the SCSS and structure for EACH block, every page will look "off" just like the homepage currently does.

**We need to be systematic:**
- Identify blocks → Port SCSS → Copy assets → Match structure → Test

This is the ONLY way to achieve pixel-perfect accuracy.

