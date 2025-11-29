# Figma vs Current Implementation - Comparison Report

## ✅ Colors Already in Config

Most colors from Figma are already in the Tailwind config:
- ✅ `#FC9445` - primary
- ✅ `#B6572E` - secondary
- ✅ `#604B30` - secondarydark
- ✅ `#D4CDBB` - beigemuted
- ✅ `#6191A3` - tealhaze
- ✅ `#F8F1EA` - peachcream
- ✅ `#08555c` - greenShadesLight
- ✅ `#F4F2EC` - subtlesand
- ✅ `#163B46` - bluish
- ✅ `#235561` - bluishlight
- ✅ All other major colors

## ❌ Missing Colors

### 1. Dark Section Background
- **Figma**: `#01171D`
- **Usage**: Dark sections (e.g., emotions section background)
- **Action**: Add to Tailwind config as `darkSection` or similar

### 2. Teal Blur Accent
- **Figma**: `#0C7077`
- **Usage**: Blur effects behind sections
- **Action**: Add to Tailwind config as `tealblur` or similar

### 3. Hero Background Variant
- **Figma**: `#154652` (used in some hero sections)
- **Current**: `#163B46` (bluish)
- **Note**: Very close, may be acceptable, but verify which is correct

## Typography Comparison

### Hero Title
- **Figma**: Libre Bodoni, 90px, 400, line-height 84px (93%), letter-spacing -0.03em
- **Current**: Need to verify in `_hero-component-secondary.scss`
- **Action**: Check if current implementation matches

### Section Titles (H2)
- **Figma**: Libre Bodoni, 64px, 400, line-height 68px (106%), letter-spacing -0.03em
- **Current**: Need to verify
- **Action**: Check component styles

### Button Text
- **Figma**: Proxima Nova or Helvetica, 15px (Proxima) or 14px (Helvetica), 700, line-height 32px, letter-spacing 0.1em, uppercase
- **Current**: Need to verify button component
- **Action**: Check `_component-button.scss`

### Body Text
- **Figma**: Proxima Nova, 20px, 300 or 400, line-height 26px (130%)
- **Current**: Need to verify
- **Action**: Check base typography styles

## Spacing Comparison

### Button Padding
- **Figma**: `12px 18px`
- **Current**: Need to verify
- **Action**: Check button component styles

### Card Padding
- **Figma**: `24px 20px` or `24px 32px`
- **Current**: Need to verify
- **Action**: Check card component styles

### Border Radius
- **Figma Buttons**: `100px` (fully rounded)
- **Figma Cards**: `10px`, `12px`, `15px`, `20px`
- **Figma Inputs**: `1000px` (fully rounded)
- **Current**: Need to verify
- **Action**: Check if using `rounded-full` for buttons (should be equivalent to 100px)

## Component-Specific Issues

### 1. Hero Section
**Figma Specs:**
- Background: `#154652` or `#163B46`
- Title: Libre Bodoni, 90px, white
- Subtitle: Proxima Nova, 15px, 600, uppercase, `#D4CDBB`
- Body: Proxima Nova, 20px, 400, white

**Action Items:**
- [ ] Verify hero background color matches
- [ ] Verify title font size (90px)
- [ ] Verify subtitle uses `beigemuted` color
- [ ] Verify letter spacing (-0.03em for title, 0.16em for subtitle)

### 2. Buttons
**Figma Specs:**
- Primary: Background `#FC9445`, padding `12px 18px`, border-radius `100px`
- Text: Proxima Nova or Helvetica, 15px/14px, 700, uppercase, letter-spacing 0.1em
- Color: `#000000` (black text on orange)

**Action Items:**
- [ ] Verify button padding matches
- [ ] Verify border radius (should be fully rounded)
- [ ] Verify font weight and letter spacing
- [ ] Check if some buttons should use Helvetica instead of Proxima Nova

### 3. Cards (Article Cards)
**Figma Specs:**
- Background: `#F8F1EA` (peachcream)
- Border Radius: `10px`
- Padding: `24px 20px` or `24px 32px`

**Action Items:**
- [ ] Verify card background uses `bg-peachcream`
- [ ] Verify border radius
- [ ] Verify padding values

### 4. Category Cards
**Figma Specs:**
- Background: `#F4F2EC` (subtlesand)
- Border Radius: `12px`
- Font: Libre Bodoni, 26px, underline

**Action Items:**
- [ ] Verify background color
- [ ] Verify font and size
- [ ] Verify underline styling

### 5. Navigation
**Figma Specs:**
- Background: `#235561` (bluishlight)
- Height: `101px`
- Links: Proxima Nova, 14px, 700, white
- Search Bar: Background `#F6F6F6`, border-radius `1000px`

**Action Items:**
- [ ] Verify nav background
- [ ] Verify nav height
- [ ] Verify search bar styling

### 6. Footer
**Figma Specs:**
- Top Section: `#EFE8DF` (warmbeige)
- Main Section: `#163B46` (bluish)
- Bottom Section: `#235561` (bluishlight)
- Links: Proxima Nova, 16px, 400, white
- Headings: Proxima Nova, 28px, 400, `#ECE6DE` (palesand)

**Action Items:**
- [ ] Verify footer color sections
- [ ] Verify typography

### 7. Accordion (FAQ)
**Figma Specs:**
- Divider: `#6191A3` (tealhaze), 1px
- Question: Proxima Nova, 20px, 700, line-height 30px
- Padding: `20px 0px`
- Gap: `12px`

**Action Items:**
- [ ] Verify divider color
- [ ] Verify typography
- [ ] Verify spacing

### 8. Emotion Buttons
**Figma Specs:**
- Background: `#6191A3` (tealhaze)
- Border: `0px 1px 1px 0px solid #2F778C` (darkcyan)
- Border Radius: `100px`
- Padding: `12px 24px`
- Font: Proxima Nova, 28px, 700, white
- Box Shadow: `0px 2px 10px rgba(0, 0, 0, 0.12)`

**Action Items:**
- [ ] Verify all styling matches
- [ ] Verify box shadow

### 9. Stages Section
**Figma Specs:**
- Background: `#F4F2EC` (subtlesand)
- Title: Libre Bodoni, 64px, italic, `#B6572E` (secondary)
- Stage Icons: 48px × 48px
- Stage Text: Proxima Nova, 16px, 400
- Stage Headings: Proxima Nova, 28px, 600, italic, `#604B30` (secondarydark), underline

**Action Items:**
- [ ] Verify background
- [ ] Verify title styling (italic, secondary color)
- [ ] Verify stage icon sizes
- [ ] Verify stage text styling

## Priority Actions

### High Priority
1. Add missing colors to Tailwind config (`#01171D`, `#0C7077`)
2. Verify hero section typography (90px title)
3. Verify button styling (padding, border-radius, letter-spacing)
4. Verify card backgrounds (peachcream for articles, subtlesand for categories)

### Medium Priority
5. Verify all section title typography (64px Libre Bodoni)
6. Verify spacing values (gaps, padding)
7. Verify footer color sections
8. Verify accordion/FAQ styling

### Low Priority
9. Verify letter spacing values throughout
10. Verify font weight variations (300, 400, 600, 700, 800)
11. Verify line height percentages match

## Next Steps

1. **Review this document** - Confirm which items need attention
2. **Update Tailwind config** - Add missing colors
3. **Check component styles** - Verify typography and spacing match Figma
4. **Test visually** - Compare rendered page with Figma design
5. **Update SCSS files** - Make any necessary adjustments

